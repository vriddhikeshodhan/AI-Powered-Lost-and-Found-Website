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

"""
routes/match.py — Matching endpoints

  POST /ai/match   — new FOUND item → find matching LOST items
  POST /ai/rematch — new LOST item  → find matching FOUND items

Changes from previous version:
  1. Location pre-filter using Haversine formula (pure SQL, no PostGIS extension needed)
     — Items within 5km radius are prioritised. Items with no GPS are always included.
  2. Colour exact-match bonus: +10% if colours match, -5% if they explicitly differ.
  3. Threshold lowered to 0.55 for better recall.

Three similarity signals:
  1. text_sim        = cosine(lost.text_embedding,      found.text_embedding)   SBERT 768-dim
  2. image_sim       = cosine(lost.image_embedding,     found.image_embedding)  CLIP  512-dim
  3. cross_modal_sim = cosine(lost.clip_text_embedding, found.image_embedding)  CLIP  512-dim

  raw_score  = 0.50×text + 0.30×cross_modal + 0.20×image
  final_score = raw_score ± colour adjustment
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

# ── Colour scoring constants ──────────────────────────────────────────────────
COLOUR_MATCH_BONUS   =  0.10   # +10% when both items have the same colour
COLOUR_MISMATCH_PEN  =  0.05   # -5%  when both items have different colours
LOCATION_RADIUS_M    = 5000    # 5km — items beyond this are still included but deprioritised


class MatchRequest(BaseModel):
    found_item_id: int


# ─────────────────────────────────────────────────────────────────────────────
# Haversine distance filter (pure SQL, no PostGIS needed)
#
# Returns a SQL fragment that keeps candidates within LOCATION_RADIUS_M metres
# of the trigger item. Items with NULL lat/lng are always kept (OR clause).
# ─────────────────────────────────────────────────────────────────────────────

def _location_filter_sql(lat_param_idx: int, lng_param_idx: int) -> str:
    """
    Returns a SQL WHERE fragment using the Haversine formula.
    lat_param_idx and lng_param_idx are the positional parameter numbers (%s).
    The fragment evaluates to TRUE when:
      - The candidate has no GPS coordinates (NULL lat/lng), OR
      - The candidate is within LOCATION_RADIUS_M metres of the trigger item
    """
    return f"""
        AND (
            latitude IS NULL
            OR longitude IS NULL
            OR (
                6371000 * 2 * ASIN(SQRT(
                    POWER(SIN(RADIANS(latitude  - %s) / 2), 2) +
                    COS(RADIANS(%s)) * COS(RADIANS(latitude)) *
                    POWER(SIN(RADIANS(longitude - %s) / 2), 2)
                ))
            ) <= {LOCATION_RADIUS_M}
        )
    """


# ─────────────────────────────────────────────────────────────────────────────
# Colour adjustment
#
# Applied AFTER the combined score is computed.
# Only fires when BOTH items have a colour value stored.
# ─────────────────────────────────────────────────────────────────────────────

def _apply_colour_adjustment(score: float, colour_a: str, colour_b: str) -> float:
    """
    Adjust the combined score based on colour comparison.
    Normalises both colours to lowercase and strips whitespace before comparing.
    """
    if not colour_a or not colour_b:
        return score   # one or both items have no colour — no adjustment

    a = colour_a.lower().strip()
    b = colour_b.lower().strip()

    if a == b:
        # Exact colour match — boost score
        adjusted = score + COLOUR_MATCH_BONUS
    elif a and b:
        # Both items have a colour but they differ — penalise
        adjusted = score - COLOUR_MISMATCH_PEN
    else:
        adjusted = score

    # Clamp to [0.0, 1.0]
    return max(0.0, min(1.0, adjusted))


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
        # Step 1 — Load the found item
        cursor.execute(
            """
            SELECT item_id, title, description, category_id, colour,
                   latitude, longitude,
                   text_embedding, image_embedding, clip_text_embedding, user_id
            FROM items
            WHERE item_id  = %s
              AND type      = 'Found'::item_type_enum
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

        found_text_emb      = found['text_embedding']
        found_image_emb     = found['image_embedding']
        found_clip_text_emb = found['clip_text_embedding']
        found_colour        = found['colour']
        found_lat           = found['latitude']
        found_lng           = found['longitude']

        if found_text_emb is None and found_image_emb is None:
            raise HTTPException(status_code=400, detail="Found item has no embeddings yet")

        # Step 2 — Load candidate LOST items
        # Base filters: same category, different user, has text embedding
        # Location filter: within 5km OR no GPS (pure SQL Haversine, no PostGIS needed)
        has_location = found_lat is not None and found_lng is not None

        if has_location:
            loc_sql = _location_filter_sql(0, 0, 0)  # placeholder — params built below
            query = f"""
                SELECT item_id, title, description, user_id, colour,
                       latitude, longitude,
                       text_embedding, image_embedding, clip_text_embedding
                FROM items
                WHERE type         = 'Lost'::item_type_enum
                  AND is_active    = TRUE
                  AND status       = 'active'
                  AND category_id  = %s
                  AND user_id     != %s
                  AND text_embedding IS NOT NULL
                  AND (
                      latitude IS NULL
                      OR longitude IS NULL
                      OR (
                          6371000 * 2 * ASIN(SQRT(
                              POWER(SIN(RADIANS(latitude  - %s) / 2), 2) +
                              COS(RADIANS(%s)) * COS(RADIANS(latitude)) *
                              POWER(SIN(RADIANS(longitude - %s) / 2), 2)
                          ))
                      ) <= {LOCATION_RADIUS_M}
                  )
            """
            params = (
                found['category_id'], found['user_id'],
                found_lat, found_lat, found_lng
            )
        else:
            # No GPS on the found item — skip location filter entirely
            query = """
                SELECT item_id, title, description, user_id, colour,
                       latitude, longitude,
                       text_embedding, image_embedding, clip_text_embedding
                FROM items
                WHERE type         = 'Lost'::item_type_enum
                  AND is_active    = TRUE
                  AND status       = 'active'
                  AND category_id  = %s
                  AND user_id     != %s
                  AND text_embedding IS NOT NULL
            """
            params = (found['category_id'], found['user_id'])

        cursor.execute(query, params)
        lost_items = cursor.fetchall()

        if not lost_items:
            return {
                "found_item_id": request.found_item_id,
                "matches": [],
                "message": "No candidate lost items in this category"
            }

        # Step 3 — Score each candidate
        scored = []

        for lost in lost_items:
            lost_text_emb      = lost['text_embedding']
            lost_image_emb     = lost['image_embedding']
            lost_clip_text_emb = lost['clip_text_embedding']
            lost_colour        = lost['colour']

            # Signal 1: SBERT text ↔ SBERT text
            text_sim = compute_cosine_similarity(found_text_emb, lost_text_emb)

            # Signal 2: CLIP image ↔ CLIP image
            image_sim = None
            if found_image_emb is not None and lost_image_emb is not None:
                image_sim = compute_cosine_similarity(found_image_emb, lost_image_emb)

            # Signal 3: CLIP text (lost) ↔ CLIP image (found) — cross-modal
            cross_modal_sim = None
            if lost_clip_text_emb is not None and found_image_emb is not None:
                cross_modal_sim = compute_cosine_similarity(lost_clip_text_emb, found_image_emb)

            raw_score = compute_combined_score(
                text_sim        = text_sim,
                image_sim       = image_sim,
                cross_modal_sim = cross_modal_sim,
                text_weight         = TEXT_WEIGHT,
                image_weight        = IMAGE_WEIGHT,
                cross_modal_weight  = CROSS_MODAL_WEIGHT
            )

            # Apply colour bonus/penalty AFTER combining signals
            final_score = _apply_colour_adjustment(raw_score, lost_colour, found_colour)

            if final_score >= COMBINED_THRESHOLD:
                scored.append({
                    "lost_item_id":       lost['item_id'],
                    "lost_item_title":    lost['title'],
                    "lost_item_user_id":  lost['user_id'],
                    "text_similarity":    round(text_sim,        4),
                    "image_similarity":   round(image_sim,       4) if image_sim       is not None else None,
                    "cross_modal_sim":    round(cross_modal_sim, 4) if cross_modal_sim is not None else None,
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
            SELECT item_id, title, description, category_id, colour,
                   latitude, longitude,
                   text_embedding, image_embedding, clip_text_embedding, user_id
            FROM items
            WHERE item_id  = %s
              AND type      = 'Lost'::item_type_enum
              AND is_active = TRUE
            """,
            (request.found_item_id,)   # field reused as trigger item id
        )
        lost = cursor.fetchone()

        if not lost:
            raise HTTPException(status_code=404, detail="Lost item not found")

        lost_text_emb      = lost['text_embedding']
        lost_image_emb     = lost['image_embedding']
        lost_clip_text_emb = lost['clip_text_embedding']
        lost_colour        = lost['colour']
        lost_lat           = lost['latitude']
        lost_lng           = lost['longitude']

        if lost_text_emb is None and lost_image_emb is None:
            raise HTTPException(status_code=400, detail="Lost item has no embeddings yet")

        # Step 2 — Load candidate FOUND items
        has_location = lost_lat is not None and lost_lng is not None

        if has_location:
            query = f"""
                SELECT item_id, title, description, user_id, colour,
                       latitude, longitude,
                       text_embedding, image_embedding, clip_text_embedding
                FROM items
                WHERE type         = 'Found'::item_type_enum
                  AND is_active    = TRUE
                  AND category_id  = %s
                  AND user_id     != %s
                  AND text_embedding IS NOT NULL
                  AND (
                      latitude IS NULL
                      OR longitude IS NULL
                      OR (
                          6371000 * 2 * ASIN(SQRT(
                              POWER(SIN(RADIANS(latitude  - %s) / 2), 2) +
                              COS(RADIANS(%s)) * COS(RADIANS(latitude)) *
                              POWER(SIN(RADIANS(longitude - %s) / 2), 2)
                          ))
                      ) <= {LOCATION_RADIUS_M}
                  )
            """
            params = (
                lost['category_id'], lost['user_id'],
                lost_lat, lost_lat, lost_lng
            )
        else:
            query = """
                SELECT item_id, title, description, user_id, colour,
                       latitude, longitude,
                       text_embedding, image_embedding, clip_text_embedding
                FROM items
                WHERE type         = 'Found'::item_type_enum
                  AND is_active    = TRUE
                  AND category_id  = %s
                  AND user_id     != %s
                  AND text_embedding IS NOT NULL
            """
            params = (lost['category_id'], lost['user_id'])

        cursor.execute(query, params)
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
            found_colour        = found['colour']

            # Signal 1: SBERT text ↔ SBERT text
            text_sim = compute_cosine_similarity(lost_text_emb, found_text_emb)

            # Signal 2: CLIP image ↔ CLIP image
            image_sim = None
            if lost_image_emb is not None and found_image_emb is not None:
                image_sim = compute_cosine_similarity(lost_image_emb, found_image_emb)

            # Signal 3: CLIP text (lost) ↔ CLIP image (found) — cross-modal
            cross_modal_sim = None
            if lost_clip_text_emb is not None and found_image_emb is not None:
                cross_modal_sim = compute_cosine_similarity(lost_clip_text_emb, found_image_emb)

            raw_score = compute_combined_score(
                text_sim        = text_sim,
                image_sim       = image_sim,
                cross_modal_sim = cross_modal_sim,
                text_weight         = TEXT_WEIGHT,
                image_weight        = IMAGE_WEIGHT,
                cross_modal_weight  = CROSS_MODAL_WEIGHT
            )

            # Apply colour bonus/penalty
            final_score = _apply_colour_adjustment(raw_score, lost_colour, found_colour)

            if final_score >= COMBINED_THRESHOLD:
                scored.append({
                    "found_item_id":      found['item_id'],
                    "found_item_title":   found['title'],
                    "found_item_user_id": found['user_id'],
                    "text_similarity":    round(text_sim,        4),
                    "image_similarity":   round(image_sim,       4) if image_sim       is not None else None,
                    "cross_modal_sim":    round(cross_modal_sim, 4) if cross_modal_sim is not None else None,
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