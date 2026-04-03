"""
routes/match.py — Matching endpoints

  POST /ai/match   — new FOUND item → find matching LOST items
  POST /ai/rematch — new LOST item  → find matching FOUND items

Cross-modal scoring added:
  For each candidate pair, we now compute THREE similarity signals:
  1. text_sim        = cosine(lost.text_embedding,       found.text_embedding)       SBERT 768-dim
  2. image_sim       = cosine(lost.image_embedding,      found.image_embedding)      CLIP  512-dim
  3. cross_modal_sim = cosine(lost.clip_text_embedding,  found.image_embedding)      CLIP  512-dim cross-modal

  final_score = 0.50×text + 0.30×cross_modal + 0.20×image
  (normalized if any signal is missing)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from models.embedder import compute_cosine_similarity, compute_combined_score
from db import get_connection
from config import (
    COMBINED_THRESHOLD,
    TEXT_WEIGHT,
    IMAGE_WEIGHT,
    CROSS_MODAL_WEIGHT,
    TOP_K
)
import traceback

router = APIRouter()


class MatchRequest(BaseModel):
    found_item_id: int


# ─────────────────────────────────────────────────────────────────────────────
# POST /ai/match
# Triggered when a new FOUND item is submitted.
# Finds the best matching LOST items.
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/match")
async def find_matches(request: MatchRequest):
    conn   = get_connection()
    cursor = conn.cursor()

    try:
        # Step 1 — Load the found item with all three embedding columns
        cursor.execute(
            """
            SELECT item_id, title, description, category_id,
                   text_embedding, image_embedding, clip_text_embedding, user_id
            FROM items
            WHERE item_id = %s
              AND type     = 'Found'::item_type_enum
              AND is_active = TRUE
            """,
            (request.found_item_id,)
        )
        found = cursor.fetchone()

        if not found:
            raise HTTPException(
                status_code=404,
                detail=f"Found item {request.found_item_id} not found"
            )

        found_text_emb        = found['text_embedding']
        found_image_emb       = found['image_embedding']
        found_clip_text_emb   = found['clip_text_embedding']  # may be None if item has no text

        if found_text_emb is None and found_image_emb is None:
            raise HTTPException(
                status_code=400,
                detail="Found item has no embeddings yet"
            )

        # Step 2 — Load candidate LOST items (same category, different user)
        cursor.execute(
            """
            SELECT item_id, title, description, user_id,
                   text_embedding, image_embedding, clip_text_embedding
            FROM items
            WHERE type        = 'Lost'::item_type_enum
              AND is_active   = TRUE
              AND status      = 'active'
              AND category_id = %s
              AND user_id    != %s
              AND text_embedding IS NOT NULL
            """,
            (found['category_id'], found['user_id'])
        )
        lost_items = cursor.fetchall()

        if not lost_items:
            return {
                "found_item_id": request.found_item_id,
                "matches": [],
                "message": "No candidate lost items in this category"
            }

        # Step 3 — Score each candidate with all three signals
        scored = []

        for lost in lost_items:
            lost_text_emb       = lost['text_embedding']
            lost_image_emb      = lost['image_embedding']
            lost_clip_text_emb  = lost['clip_text_embedding']

            # Signal 1: SBERT text ↔ SBERT text  (768-dim)
            text_sim = compute_cosine_similarity(found_text_emb, lost_text_emb)

            # Signal 2: CLIP image ↔ CLIP image  (512-dim)
            image_sim = None
            if found_image_emb is not None and lost_image_emb is not None:
                image_sim = compute_cosine_similarity(found_image_emb, lost_image_emb)

            # Signal 3: CLIP text (lost) ↔ CLIP image (found)  — cross-modal
            # The lost item owner described what they lost in text.
            # We compare that text description directly against the found item's photo.
            cross_modal_sim = None
            if lost_clip_text_emb is not None and found_image_emb is not None:
                cross_modal_sim = compute_cosine_similarity(lost_clip_text_emb, found_image_emb)

            final_score = compute_combined_score(
                text_sim        = text_sim,
                image_sim       = image_sim,
                cross_modal_sim = cross_modal_sim,
                text_weight         = TEXT_WEIGHT,
                image_weight        = IMAGE_WEIGHT,
                cross_modal_weight  = CROSS_MODAL_WEIGHT
            )

            if final_score >= COMBINED_THRESHOLD:
                scored.append({
                    "lost_item_id":       lost['item_id'],
                    "lost_item_title":    lost['title'],
                    "lost_item_user_id":  lost['user_id'],
                    "text_similarity":    round(text_sim,       4),
                    "image_similarity":   round(image_sim,      4) if image_sim       is not None else None,
                    "cross_modal_sim":    round(cross_modal_sim,4) if cross_modal_sim  is not None else None,
                    "confidence_score":   round(final_score * 100, 2)
                })

        scored.sort(key=lambda x: x['confidence_score'], reverse=True)

        return {
            "found_item_id":           request.found_item_id,
            "matches":                 scored[:TOP_K],
            "total_candidates":        len(lost_items),
            "matches_above_threshold": len(scored)
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


# ─────────────────────────────────────────────────────────────────────────────
# POST /ai/rematch
# Triggered when a new LOST item is submitted.
# Finds the best matching FOUND items.
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/rematch")
async def rematch_lost_items(request: MatchRequest):
    conn   = get_connection()
    cursor = conn.cursor()

    try:
        # Step 1 — Load the lost item
        cursor.execute(
            """
            SELECT item_id, title, description, category_id,
                   text_embedding, image_embedding, clip_text_embedding, user_id
            FROM items
            WHERE item_id = %s
              AND type     = 'Lost'::item_type_enum
              AND is_active = TRUE
            """,
            (request.found_item_id,)   # field reused as trigger item id
        )
        lost = cursor.fetchone()

        if not lost:
            raise HTTPException(status_code=404, detail="Lost item not found")

        lost_text_emb       = lost['text_embedding']
        lost_image_emb      = lost['image_embedding']
        lost_clip_text_emb  = lost['clip_text_embedding']

        if lost_text_emb is None and lost_image_emb is None:
            raise HTTPException(status_code=400, detail="Lost item has no embeddings yet")

        # Step 2 — Load candidate FOUND items
        cursor.execute(
            """
            SELECT item_id, title, description, user_id,
                   text_embedding, image_embedding, clip_text_embedding
            FROM items
            WHERE type        = 'Found'::item_type_enum
              AND is_active   = TRUE
              AND category_id = %s
              AND user_id    != %s
              AND text_embedding IS NOT NULL
            """,
            (lost['category_id'], lost['user_id'])
        )
        found_items = cursor.fetchall()

        if not found_items:
            return {
                "lost_item_id": lost['item_id'],
                "matches": [],
                "message": "No candidate found items in this category"
            }

        # Step 3 — Score each candidate
        scored = []

        for found in found_items:
            found_text_emb      = found['text_embedding']
            found_image_emb     = found['image_embedding']
            found_clip_text_emb = found['clip_text_embedding']

            # Signal 1: SBERT text ↔ SBERT text
            text_sim = compute_cosine_similarity(lost_text_emb, found_text_emb)

            # Signal 2: CLIP image ↔ CLIP image
            image_sim = None
            if lost_image_emb is not None and found_image_emb is not None:
                image_sim = compute_cosine_similarity(lost_image_emb, found_image_emb)

            # Signal 3: CLIP text (lost) ↔ CLIP image (found)  — cross-modal
            # The lost item's text description compared directly against
            # the found item's photo. Core cross-modal signal.
            cross_modal_sim = None
            if lost_clip_text_emb is not None and found_image_emb is not None:
                cross_modal_sim = compute_cosine_similarity(lost_clip_text_emb, found_image_emb)

            final_score = compute_combined_score(
                text_sim        = text_sim,
                image_sim       = image_sim,
                cross_modal_sim = cross_modal_sim,
                text_weight         = TEXT_WEIGHT,
                image_weight        = IMAGE_WEIGHT,
                cross_modal_weight  = CROSS_MODAL_WEIGHT
            )

            if final_score >= COMBINED_THRESHOLD:
                scored.append({
                    "found_item_id":      found['item_id'],
                    "found_item_title":   found['title'],
                    "found_item_user_id": found['user_id'],
                    "text_similarity":    round(text_sim,       4),
                    "image_similarity":   round(image_sim,      4) if image_sim       is not None else None,
                    "cross_modal_sim":    round(cross_modal_sim,4) if cross_modal_sim  is not None else None,
                    "confidence_score":   round(final_score * 100, 2)
                })

        scored.sort(key=lambda x: x['confidence_score'], reverse=True)

        return {
            "lost_item_id": lost['item_id'],
            "matches":      scored[:TOP_K]
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()
