"""
embed.py
--------
Routes for generating and storing embeddings for items.

Endpoints:
  POST /ai/embed/text        — generate + store SBERT text embedding
  POST /ai/embed/image       — generate + store CLIP image embedding (file upload)
  POST /ai/embed/image-path  — generate + store CLIP image embedding (server file path)
  POST /ai/embed/item/:id    — generate both embeddings for an item already in DB

Called by Node.js backend after saving a new item.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
from models.embedder import (
    get_text_embedding,
    get_image_embedding_from_bytes,
    get_image_embedding_from_path,
    get_model_status
)
from db import get_connection

router = APIRouter()

# Allowed image MIME types
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}

# Max image size: 10MB
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024


# ─────────────────────────────────────────────
# HELPER: Store a vector embedding in the DB
# Centralises the UPDATE logic so both text and
# image routes use identical DB handling
# ─────────────────────────────────────────────

def _store_embedding(item_id: int, column: str, embedding: list) -> int:
    """
    Update the given embedding column for an item.

    Returns the number of rows updated (0 means item_id not found).
    Raises RuntimeError on DB failure.

    Uses a context-managed connection pattern:
    - Always commits or rolls back
    - Always closes the connection, even on error
    """
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # pgvector expects the embedding as a Python list.
        # psycopg2 with register_vector() handles the conversion automatically.
        # We use a parameterized query — never interpolate vectors as strings.
        cursor.execute(
            f"UPDATE items SET {column} = %s WHERE item_id = %s",
            (embedding, item_id)
        )

        rows_updated = cursor.rowcount
        conn.commit()
        cursor.close()
        return rows_updated

    except Exception as e:
        if conn:
            conn.rollback()
        raise RuntimeError(f"DB update failed for {column} on item {item_id}: {e}")

    finally:
        if conn:
            conn.close()


# ─────────────────────────────────────────────
# HELPER: Fetch item text from DB
# Used by /embed/item/:id to get title + description
# ─────────────────────────────────────────────

def _fetch_item_text(item_id: int) -> Optional[dict]:
    """
    Fetch title and description for an item.
    Returns None if item does not exist.
    """
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT item_id, title, description FROM items WHERE item_id = %s AND is_active = TRUE",
            (item_id,)
        )
        row = cursor.fetchone()
        cursor.close()
        return dict(row) if row else None
    finally:
        if conn:
            conn.close()


# ─────────────────────────────────────────────
# REQUEST MODELS
# ─────────────────────────────────────────────

class EmbedTextRequest(BaseModel):
    item_id: int
    text: str   # Should be: f"{title}. {description}"


class EmbedImagePathRequest(BaseModel):
    item_id: int
    image_path: str  # Absolute path on the server filesystem


# ─────────────────────────────────────────────
# POST /ai/embed/text
# Generate SBERT text embedding and store it
# ─────────────────────────────────────────────

@router.post("/embed/text")
async def embed_text(request: EmbedTextRequest):
    """
    Generate a 384-dim SBERT embedding from item text and store it.

    Node.js calls this right after saving a new item to the DB.
    The text should be title + description combined:
      e.g. "Black Wallet. Leather wallet found near library stairs."
    """

    # Validate input
    if not request.text or not request.text.strip():
        raise HTTPException(
            status_code=400,
            detail="text cannot be empty"
        )

    if request.item_id <= 0:
        raise HTTPException(
            status_code=400,
            detail="item_id must be a positive integer"
        )

    try:
        # Step 1: Generate embedding
        embedding = get_text_embedding(request.text)

        # Sanity check — SBERT should always return 384 dims
        if len(embedding) != 384:
            raise HTTPException(
                status_code=500,
                detail=f"Unexpected embedding dimension: {len(embedding)} (expected 384)"
            )

        # Step 2: Store in DB
        rows_updated = _store_embedding(request.item_id, "text_embedding", embedding)

        # If 0 rows updated, the item_id doesn't exist
        if rows_updated == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Item {request.item_id} not found in database"
            )

        return {
            "success": True,
            "item_id": request.item_id,
            "embedding_dim": len(embedding),
            "message": "Text embedding generated and stored"
        }

    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is

    except RuntimeError as e:
        # DB error from _store_embedding
        raise HTTPException(status_code=500, detail=str(e))

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Text embedding failed: {str(e)}"
        )


# ─────────────────────────────────────────────
# POST /ai/embed/image
# Generate CLIP image embedding from uploaded file
# ─────────────────────────────────────────────

@router.post("/embed/image")
async def embed_image(
    item_id: int = Form(...),
    image: UploadFile = File(...)
):
    """
    Generate a 512-dim CLIP embedding from an uploaded image and store it.

    Node.js calls this after multer has received and saved the image.
    The image is sent as multipart/form-data.

    Validates:
      - File type must be JPEG, PNG, or WebP
      - File size must be under 10MB
      - CLIP model must be available
    """

    # Validate item_id
    if item_id <= 0:
        raise HTTPException(
            status_code=400,
            detail="item_id must be a positive integer"
        )

    # Validate file type
    if image.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{image.content_type}'. Allowed: JPEG, PNG, WebP"
        )

    # Check if CLIP is available before reading the file
    status = get_model_status()
    if status["clip"] != "loaded":
        raise HTTPException(
            status_code=503,
            detail="CLIP model is not available. Image embedding disabled."
        )

    try:
        # Read image bytes
        image_bytes = await image.read()

        # Validate file size
        if len(image_bytes) > MAX_IMAGE_SIZE_BYTES:
            raise HTTPException(
                status_code=400,
                detail=f"Image too large ({len(image_bytes) // 1024}KB). Max allowed: 10MB"
            )

        if len(image_bytes) == 0:
            raise HTTPException(
                status_code=400,
                detail="Uploaded image file is empty"
            )

        # Generate embedding
        embedding = get_image_embedding_from_bytes(image_bytes)

        if embedding is None:
            raise HTTPException(
                status_code=422,
                detail="Image could not be processed. It may be corrupt or in an unsupported format."
            )

        # Sanity check — CLIP ViT-B/32 should always return 512 dims
        if len(embedding) != 512:
            raise HTTPException(
                status_code=500,
                detail=f"Unexpected embedding dimension: {len(embedding)} (expected 512)"
            )

        # Store in DB
        rows_updated = _store_embedding(item_id, "image_embedding", embedding)

        if rows_updated == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Item {item_id} not found in database"
            )

        return {
            "success": True,
            "item_id": item_id,
            "embedding_dim": len(embedding),
            "filename": image.filename,
            "message": "Image embedding generated and stored"
        }

    except HTTPException:
        raise

    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Image embedding failed: {str(e)}"
        )


# ─────────────────────────────────────────────
# POST /ai/embed/image-path
# Generate CLIP embedding from a server-side file path
# Used when Node.js sends the path of a multer-saved file
# instead of re-uploading the file
# ─────────────────────────────────────────────

@router.post("/embed/image-path")
async def embed_image_from_path(request: EmbedImagePathRequest):
    """
    Generate a CLIP embedding from a file already saved on the server.

    This is used when Node.js (multer) has already saved the image
    to disk and only sends the path, avoiding a second file upload.

    The path must be accessible to the Python service.
    On the same machine, this is always the case.
    """

    if not request.image_path or not request.image_path.strip():
        raise HTTPException(
            status_code=400,
            detail="image_path cannot be empty"
        )

    # Check CLIP availability
    status = get_model_status()
    if status["clip"] != "loaded":
        raise HTTPException(
            status_code=503,
            detail="CLIP model is not available. Image embedding disabled."
        )

    try:
        embedding = get_image_embedding_from_path(request.image_path)

        if embedding is None:
            raise HTTPException(
                status_code=422,
                detail=f"Could not process image at path: {request.image_path}"
            )

        rows_updated = _store_embedding(request.item_id, "image_embedding", embedding)

        if rows_updated == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Item {request.item_id} not found in database"
            )

        return {
            "success": True,
            "item_id": request.item_id,
            "embedding_dim": len(embedding),
            "message": "Image embedding generated from path and stored"
        }

    except HTTPException:
        raise

    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Image embedding from path failed: {str(e)}"
        )


# ─────────────────────────────────────────────
# POST /ai/embed/item/{item_id}
# Re-generate BOTH embeddings for an item using its
# title + description already stored in the DB.
# Useful for backfilling existing items or retrying
# failed embedding jobs.
# ─────────────────────────────────────────────

@router.post("/embed/item/{item_id}")
async def embed_item_from_db(item_id: int):
    """
    Re-generate text embedding for an item using data already in the DB.

    Useful for:
      - Backfilling embeddings for items that existed before AI was added
      - Retrying after an embedding failure
      - Admin-triggered re-embedding

    Only generates text embedding (image path not available from DB alone).
    """
    if item_id <= 0:
        raise HTTPException(
            status_code=400,
            detail="item_id must be a positive integer"
        )

    try:
        # Fetch item from DB
        item = _fetch_item_text(item_id)

        if item is None:
            raise HTTPException(
                status_code=404,
                detail=f"Item {item_id} not found or is inactive"
            )

        # Combine title and description the same way Node.js does
        title = item.get("title", "")
        description = item.get("description", "")
        combined_text = f"{title}. {description}".strip()

        if not combined_text or combined_text == ".":
            raise HTTPException(
                status_code=400,
                detail=f"Item {item_id} has no title or description to embed"
            )

        # Generate and store
        embedding = get_text_embedding(combined_text)
        rows_updated = _store_embedding(item_id, "text_embedding", embedding)

        if rows_updated == 0:
            raise HTTPException(
                status_code=500,
                detail="Embedding generated but DB update failed unexpectedly"
            )

        return {
            "success": True,
            "item_id": item_id,
            "title": title,
            "embedding_dim": len(embedding),
            "message": "Text embedding re-generated from DB data and stored"
        }

    except HTTPException:
        raise

    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Re-embedding failed: {str(e)}"
        )