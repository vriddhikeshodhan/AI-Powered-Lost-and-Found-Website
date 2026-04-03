"""
routes/embed.py

Endpoints:
  POST /ai/embed/text       — SBERT text embedding (768-dim)
  POST /ai/embed/clip-text  — CLIP  text embedding (512-dim, cross-modal)
  POST /ai/embed/image      — CLIP  image embedding (512-dim)
  POST /ai/embed/image-path — CLIP  image embedding from server file path
  POST /ai/embed/item/{id}  — Re-embed an existing item from DB data
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
from models.embedder import (
    get_text_embedding,
    get_clip_text_embedding,
    get_image_embedding_from_bytes,
    get_image_embedding_from_path,
    build_enriched_text,
    get_model_status
)
from db import get_connection

router = APIRouter()

ALLOWED_IMAGE_TYPES  = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024   # 10 MB


# ─────────────────────────────────────────────────────────────────────────────
# Helper — store a vector in the DB
# ─────────────────────────────────────────────────────────────────────────────

def _store_embedding(item_id: int, column: str, embedding: list) -> int:
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            f"UPDATE items SET {column} = %s WHERE item_id = %s",
            (embedding, item_id)
        )
        rows = cursor.rowcount
        conn.commit()
        cursor.close()
        return rows
    except Exception as e:
        if conn: conn.rollback()
        raise RuntimeError(f"DB update failed for {column} on item {item_id}: {e}")
    finally:
        if conn: conn.close()


# ─────────────────────────────────────────────────────────────────────────────
# Request models
# ─────────────────────────────────────────────────────────────────────────────

class EmbedTextRequest(BaseModel):
    item_id:        int
    text:           str
    title:          str = ""
    brand:          str = ""
    colour:         str = ""
    distinguishing: str = ""
    item_type:      str = ""


class EmbedClipTextRequest(BaseModel):
    item_id:        int
    text:           str
    title:          str = ""
    brand:          str = ""
    colour:         str = ""
    distinguishing: str = ""
    item_type:      str = ""


class EmbedImagePathRequest(BaseModel):
    item_id:    int
    image_path: str


# ─────────────────────────────────────────────────────────────────────────────
# POST /ai/embed/text  — SBERT (768-dim)
# BUG FIX: dimension check was 384 — SBERT now returns 768-dim with
# all-mpnet-base-v2. Fixed to 768.
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/embed/text")
async def embed_text(request: EmbedTextRequest):
    """
    Generate a 768-dim SBERT embedding and store in text_embedding column.
    Builds enriched text from structured fields before encoding.
    """
    if not request.text and not request.title:
        raise HTTPException(status_code=400, detail="text or title is required")
    if request.item_id <= 0:
        raise HTTPException(status_code=400, detail="item_id must be a positive integer")

    enriched = build_enriched_text(
        title          = request.title or request.text,
        description    = request.text,
        brand          = request.brand,
        colour         = request.colour,
        distinguishing = request.distinguishing,
        item_type      = request.item_type
    )

    try:
        embedding = get_text_embedding(enriched)

        # SBERT all-mpnet-base-v2 outputs 768-dim (was 384 with MiniLM)
        if len(embedding) != 768:
            raise HTTPException(
                status_code=500,
                detail=f"Unexpected SBERT embedding dimension: {len(embedding)} (expected 768)"
            )

        rows = _store_embedding(request.item_id, "text_embedding", embedding)
        if rows == 0:
            raise HTTPException(status_code=404, detail=f"Item {request.item_id} not found")

        return {
            "success":       True,
            "item_id":       request.item_id,
            "embedding_dim": len(embedding),
            "model":         "all-mpnet-base-v2",
            "enriched_text": enriched
        }

    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text embedding failed: {e}")


# ─────────────────────────────────────────────────────────────────────────────
# POST /ai/embed/clip-text  — CLIP text encoder (512-dim, cross-modal)
#
# This is NEW. CLIP has a text encoder AND an image encoder, both producing
# 512-dim vectors in the same shared space. Comparing
# cosine(clip_text_embedding, image_embedding) is cross-modal matching.
# Stored in clip_text_embedding column.
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/embed/clip-text")
async def embed_clip_text(request: EmbedClipTextRequest):
    """
    Generate a 512-dim CLIP text embedding for cross-modal matching.
    Stored in clip_text_embedding column.
    NOT the same as /embed/text — this lives in CLIP's image-text shared space.
    """
    if not request.text and not request.title:
        raise HTTPException(status_code=400, detail="text or title is required")
    if request.item_id <= 0:
        raise HTTPException(status_code=400, detail="item_id must be a positive integer")

    enriched = build_enriched_text(
        title          = request.title or request.text,
        description    = request.text,
        brand          = request.brand,
        colour         = request.colour,
        distinguishing = request.distinguishing,
        item_type      = request.item_type
    )

    try:
        embedding = get_clip_text_embedding(enriched)
        if embedding is None:
            raise HTTPException(status_code=503, detail="CLIP model not available")

        if len(embedding) != 512:
            raise HTTPException(
                status_code=500,
                detail=f"Unexpected CLIP text embedding dimension: {len(embedding)} (expected 512)"
            )

        rows = _store_embedding(request.item_id, "clip_text_embedding", embedding)
        if rows == 0:
            raise HTTPException(status_code=404, detail=f"Item {request.item_id} not found")

        return {
            "success":       True,
            "item_id":       request.item_id,
            "embedding_dim": len(embedding),
            "model":         "clip-ViT-B-32 (text encoder)",
            "enriched_text": enriched
        }

    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CLIP text embedding failed: {e}")


# ─────────────────────────────────────────────────────────────────────────────
# POST /ai/embed/image  — CLIP image (512-dim), multipart upload
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/embed/image")
async def embed_image(
    item_id: int       = Form(...),
    image:   UploadFile = File(...)
):
    """Generate a 512-dim CLIP image embedding from an uploaded file."""
    if item_id <= 0:
        raise HTTPException(status_code=400, detail="item_id must be a positive integer")
    if image.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid file type: {image.content_type}")

    status = get_model_status()
    if "failed" in status.get("clip", ""):
        raise HTTPException(status_code=503, detail="CLIP model not available")

    try:
        image_bytes = await image.read()

        if len(image_bytes) > MAX_IMAGE_SIZE_BYTES:
            raise HTTPException(status_code=400, detail=f"Image too large. Max 10MB.")
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        embedding = get_image_embedding_from_bytes(image_bytes)
        if embedding is None:
            raise HTTPException(status_code=422, detail="Could not process image")

        if len(embedding) != 512:
            raise HTTPException(
                status_code=500,
                detail=f"Unexpected CLIP image embedding dimension: {len(embedding)} (expected 512)"
            )

        rows = _store_embedding(item_id, "image_embedding", embedding)
        if rows == 0:
            raise HTTPException(status_code=404, detail=f"Item {item_id} not found")

        return {
            "success":       True,
            "item_id":       item_id,
            "embedding_dim": len(embedding),
            "model":         "clip-ViT-B-32"
        }

    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image embedding failed: {e}")


# ─────────────────────────────────────────────────────────────────────────────
# POST /ai/embed/image-path  — CLIP image from server-side path
# Node.js sends the multer-saved file path instead of re-uploading
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/embed/image-path")
async def embed_image_from_path(request: EmbedImagePathRequest):
    if not request.image_path:
        raise HTTPException(status_code=400, detail="image_path is required")

    status = get_model_status()
    if "failed" in status.get("clip", ""):
        raise HTTPException(status_code=503, detail="CLIP model not available")

    try:
        embedding = get_image_embedding_from_path(request.image_path)
        if embedding is None:
            raise HTTPException(status_code=422, detail=f"Could not process: {request.image_path}")

        rows = _store_embedding(request.item_id, "image_embedding", embedding)
        if rows == 0:
            raise HTTPException(status_code=404, detail=f"Item {request.item_id} not found")

        return {
            "success":       True,
            "item_id":       request.item_id,
            "embedding_dim": len(embedding),
            "model":         "clip-ViT-B-32"
        }

    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image path embedding failed: {e}")


# ─────────────────────────────────────────────────────────────────────────────
# POST /ai/embed/item/{item_id}  — Re-embed from DB (admin/backfill)
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/embed/item/{item_id}")
async def embed_item_from_db(item_id: int):
    """Re-generate text embedding for an existing item using its DB data."""
    if item_id <= 0:
        raise HTTPException(status_code=400, detail="item_id must be a positive integer")

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
    finally:
        if conn: conn.close()

    if not row:
        raise HTTPException(status_code=404, detail=f"Item {item_id} not found or inactive")

    title       = row.get("title", "")
    description = row.get("description", "")
    combined    = f"{title}. {description}".strip()

    if not combined or combined == ".":
        raise HTTPException(status_code=400, detail=f"Item {item_id} has no text to embed")

    try:
        embedding = get_text_embedding(combined)
        rows = _store_embedding(item_id, "text_embedding", embedding)

        return {
            "success":       True,
            "item_id":       item_id,
            "embedding_dim": len(embedding),
            "message":       "Text embedding regenerated"
        }

    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Re-embedding failed: {e}")