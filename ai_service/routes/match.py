from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from models.embedder import compute_combined_score
from db import get_connection
from config import (
    TEXT_SIMILARITY_THRESHOLD,
    TEXT_WEIGHT,
    IMAGE_WEIGHT,
    TOP_K
)
import numpy as np
import traceback

router = APIRouter()


class MatchRequest(BaseModel):
    found_item_id: int


# ─────────────────────────────────────────────
# Shared helper — cosine similarity from DB vectors
# pgvector returns numpy arrays or list-like objects
# ─────────────────────────────────────────────
def compute_cosine_similarity_from_db(vec1, vec2) -> float:
    try:
        a = np.array(list(vec1), dtype=np.float32)
        b = np.array(list(vec2), dtype=np.float32)

        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)

        if norm_a == 0 or norm_b == 0:
            return 0.0

        return float(np.dot(a, b) / (norm_a * norm_b))
    except Exception as e:
        print(f"[Similarity] Computation failed: {e}")
        return 0.0


# ─────────────────────────────────────────────
# POST /ai/match
# Called when a new FOUND item is reported.
# Finds matching LOST items.
# ─────────────────────────────────────────────
@router.post("/match")
async def find_matches(request: MatchRequest):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        # Step 1: Load the found item
        cursor.execute(
            """
            SELECT item_id, title, description, category_id,
                   text_embedding, image_embedding, user_id
            FROM items
            WHERE item_id = %s
              AND type = 'Found'::item_type_enum
              AND is_active = TRUE
            """,
            (request.found_item_id,)
        )
        found_item = cursor.fetchone()

        if not found_item:
            raise HTTPException(
                status_code=404,
                detail=f"Found item {request.found_item_id} not found"
            )

        found_text_emb  = found_item['text_embedding']
        found_image_emb = found_item['image_embedding']

        if found_text_emb is None and found_image_emb is None:
            raise HTTPException(
                status_code=400,
                detail="Found item has no embeddings. Run /embed/text first."
            )

        # Step 2: Load candidate lost items
        # Same category, different user, must have text embedding
        cursor.execute(
            """
            SELECT item_id, title, description, user_id,
                   text_embedding, image_embedding
            FROM items
            WHERE type = 'Lost'::item_type_enum
              AND is_active = TRUE
              AND status = 'active'
              AND category_id = %s
              AND user_id != %s
              AND text_embedding IS NOT NULL
            """,
            (found_item['category_id'], found_item['user_id'])
        )
        lost_items = cursor.fetchall()

        if not lost_items:
            return {
                "found_item_id": request.found_item_id,
                "matches": [],
                "message": "No candidate lost items found in same category"
            }

        # Step 3: Score each candidate
        scored_matches = []

        for lost_item in lost_items:
            lost_text_emb  = lost_item['text_embedding']
            lost_image_emb = lost_item['image_embedding']

            text_sim = None
            if found_text_emb is not None and lost_text_emb is not None:
                text_sim = compute_cosine_similarity_from_db(
                    found_text_emb, lost_text_emb
                )

            image_sim = None
            if found_image_emb is not None and lost_image_emb is not None:
                image_sim = compute_cosine_similarity_from_db(
                    found_image_emb, lost_image_emb
                )

            final_score = compute_combined_score(
                text_sim, image_sim, TEXT_WEIGHT, IMAGE_WEIGHT
            )

            if final_score >= TEXT_SIMILARITY_THRESHOLD:
                scored_matches.append({
                    "lost_item_id":      lost_item['item_id'],
                    "lost_item_title":   lost_item['title'],
                    "lost_item_user_id": lost_item['user_id'],
                    "text_similarity":   round(text_sim, 4) if text_sim is not None else None,
                    "image_similarity":  round(image_sim, 4) if image_sim is not None else None,
                    "confidence_score":  round(final_score * 100, 2)
                })

        # Step 4: Return top K sorted by score
        scored_matches.sort(key=lambda x: x['confidence_score'], reverse=True)
        top_matches = scored_matches[:TOP_K]

        return {
            "found_item_id":           request.found_item_id,
            "matches":                 top_matches,
            "total_candidates":        len(lost_items),
            "matches_above_threshold": len(scored_matches)
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


# ─────────────────────────────────────────────
# POST /ai/rematch
# Called when a new LOST item is reported.
# Finds matching FOUND items.
# ─────────────────────────────────────────────
@router.post("/rematch")
async def rematch_lost_items(request: MatchRequest):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        # Step 1: Load the lost item
        cursor.execute(
            """
            SELECT item_id, title, description, category_id,
                   text_embedding, image_embedding, user_id
            FROM items
            WHERE item_id = %s
              AND type = 'Lost'::item_type_enum
              AND is_active = TRUE
            """,
            (request.found_item_id,)  # field reused as trigger item id
        )
        lost_item = cursor.fetchone()

        if not lost_item:
            raise HTTPException(status_code=404, detail="Lost item not found")

        lost_text_emb  = lost_item['text_embedding']
        lost_image_emb = lost_item['image_embedding']

        if lost_text_emb is None and lost_image_emb is None:
            raise HTTPException(
                status_code=400,
                detail="Lost item has no embeddings. Run /embed/text first."
            )

        # Step 2: Load candidate found items
        cursor.execute(
            """
            SELECT item_id, title, description, user_id,
                   text_embedding, image_embedding
            FROM items
            WHERE type = 'Found'::item_type_enum
              AND is_active = TRUE
              AND category_id = %s
              AND user_id != %s
              AND text_embedding IS NOT NULL
            """,
            (lost_item['category_id'], lost_item['user_id'])
        )
        found_items = cursor.fetchall()

        if not found_items:
            return {
                "lost_item_id": lost_item['item_id'],
                "matches": [],
                "message": "No candidate found items in same category"
            }

        # Step 3: Score each candidate
        scored_matches = []

        for found_item in found_items:
            found_text_emb  = found_item['text_embedding']
            found_image_emb = found_item['image_embedding']

            text_sim = None
            if lost_text_emb is not None and found_text_emb is not None:
                text_sim = compute_cosine_similarity_from_db(
                    lost_text_emb, found_text_emb
                )

            image_sim = None
            if lost_image_emb is not None and found_image_emb is not None:
                image_sim = compute_cosine_similarity_from_db(
                    lost_image_emb, found_image_emb
                )

            final_score = compute_combined_score(
                text_sim, image_sim, TEXT_WEIGHT, IMAGE_WEIGHT
            )

            if final_score >= TEXT_SIMILARITY_THRESHOLD:
                scored_matches.append({
                    "found_item_id":      found_item['item_id'],
                    "found_item_title":   found_item['title'],
                    "found_item_user_id": found_item['user_id'],
                    "text_similarity":    round(text_sim, 4) if text_sim is not None else None,
                    "image_similarity":   round(image_sim, 4) if image_sim is not None else None,
                    "confidence_score":   round(final_score * 100, 2)
                })

        # Step 4: Return top K sorted by score
        scored_matches.sort(key=lambda x: x['confidence_score'], reverse=True)

        return {
            "lost_item_id": lost_item['item_id'],
            "matches":      scored_matches[:TOP_K]
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()