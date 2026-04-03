# ai_service/scheduler.py
#
# Periodic re-matching job.
# Runs every 30 minutes (configurable via RUN_INTERVAL_MINUTES in config.py).
#
# What it does:
#   1. Finds all active lost items that have no confirmed match yet
#   2. For each, queries active found items in the same category
#      (excluding same-user and already-existing match pairs)
#   3. Computes combined score: TEXT_WEIGHT * text_cosine + IMAGE_WEIGHT * image_cosine
#   4. Inserts new matches above threshold into the matches table
#   5. Inserts notifications for the lost item owners
#
# Skips items whose embeddings haven't been generated yet (NULL vectors).
# Safe to run concurrently — ON CONFLICT DO NOTHING prevents duplicate matches.

import logging
from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from config import (
    TEXT_THRESHOLD, IMAGE_THRESHOLD,
    TEXT_WEIGHT, IMAGE_WEIGHT,
    RUN_INTERVAL_MINUTES,
)
from db import get_connection

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Core job function
# ─────────────────────────────────────────────────────────────────────────────

async def run_rematch_job():
    """
    Full re-matching sweep. Runs on a schedule and also exposed so it can be
    triggered manually via POST /ai/scheduler/run.
    """
    start = datetime.utcnow()
    logger.info(f"[Scheduler] Re-match job started at {start.isoformat()}")

    conn = None
    new_matches_total = 0
    items_processed   = 0

    try:
        conn = get_connection()
        cur  = conn.cursor()

        # ── Step 1: Fetch all active lost items that have embeddings ─────────
        # Exclude items that already have a confirmed (owner_feedback='correct') match
        cur.execute("""
            SELECT
                i.item_id,
                i.user_id,
                i.title,
                i.category_id,
                i.text_embedding,
                i.image_embedding
            FROM items i
            WHERE i.type      = 'Lost'
              AND i.status    = 'active'
              AND i.is_active = TRUE
              AND i.text_embedding IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1 FROM matches m
                  WHERE m.lost_item_id = i.item_id
                    AND m.owner_feedback = 'correct'
              )
        """)
        lost_items = cur.fetchall()

        if not lost_items:
            logger.info("[Scheduler] No eligible lost items found. Job done.")
            return

        logger.info(f"[Scheduler] Processing {len(lost_items)} lost item(s)...")

        for lost in lost_items:
            lost_id       = lost["item_id"]
            lost_user_id  = lost["user_id"]
            lost_title    = lost["title"]
            category_id   = lost["category_id"]
            lost_text_emb = lost["text_embedding"]
            lost_img_emb  = lost["image_embedding"]

            # ── Step 2: Fetch candidate found items in the same category ─────
            # Exclude:
            #   - same user (self-match prevention)
            #   - pairs that already have a match row (any status)
            cur.execute("""
                SELECT
                    i.item_id,
                    i.text_embedding,
                    i.image_embedding
                FROM items i
                WHERE i.type        = 'Found'
                  AND i.status      = 'active'
                  AND i.is_active   = TRUE
                  AND i.category_id = %s
                  AND i.user_id    != %s
                  AND i.text_embedding IS NOT NULL
                  AND NOT EXISTS (
                      SELECT 1 FROM matches m
                      WHERE m.lost_item_id  = %s
                        AND m.found_item_id = i.item_id
                  )
            """, (category_id, lost_user_id, lost_id))
            candidates = cur.fetchall()

            if not candidates:
                continue

            items_processed += 1
            new_for_item = 0

            for found_item in candidates:
                found_id       = found_item["item_id"]
                found_text_emb = found_item["text_embedding"]
                found_img_emb  = found_item["image_embedding"]

                # ── Step 3: Compute scores ────────────────────────────────────
                text_score  = _cosine_similarity(lost_text_emb, found_text_emb)
                image_score = 0.0

                if lost_img_emb and found_img_emb:
                    image_score = _cosine_similarity(lost_img_emb, found_img_emb)

                # Use text score as gate — if text is below threshold, skip
                if text_score < TEXT_THRESHOLD:
                    continue

                # Combined weighted score
                if lost_img_emb and found_img_emb:
                    combined = TEXT_WEIGHT * text_score + IMAGE_WEIGHT * image_score
                else:
                    # No images on one side — use text score only
                    combined = text_score

                if combined < TEXT_THRESHOLD:
                    continue

                # Round to 2 decimal places for storage
                confidence = round(combined * 100, 2)

                # ── Step 4: Insert match ──────────────────────────────────────
                cur.execute("""
                    INSERT INTO matches
                        (lost_item_id, found_item_id, confidence_score, status_id)
                    VALUES (%s, %s, %s, 1)
                    ON CONFLICT (lost_item_id, found_item_id) DO NOTHING
                    RETURNING match_id
                """, (lost_id, found_id, confidence))

                row = cur.fetchone()

                if row is None:
                    # ON CONFLICT — match already existed, skip notification
                    continue

                match_id = row[0]
                new_for_item    += 1
                new_matches_total += 1

                # ── Step 5: Insert notification for lost item owner ───────────
                cur.execute("""
                    INSERT INTO notifications
                        (user_id, item_id, match_id, content, type, email_sent)
                    VALUES (%s, %s, %s, %s, 'match_found', FALSE)
                """, (
                    lost_user_id,
                    lost_id,
                    match_id,
                    f'A possible match has been found for your lost item: "{lost_title}". '
                    f'Confidence: {confidence}%'
                ))

            conn.commit()

            if new_for_item > 0:
                logger.info(
                    f"[Scheduler] Lost item {lost_id} ('{lost_title}'): "
                    f"{new_for_item} new match(es) saved."
                )

        elapsed = (datetime.utcnow() - start).total_seconds()
        logger.info(
            f"[Scheduler] Job complete in {elapsed:.1f}s — "
            f"{items_processed} item(s) processed, "
            f"{new_matches_total} new match(es) created."
        )

    except Exception as e:
        logger.error(f"[Scheduler] Job failed: {e}", exc_info=True)
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()


# ─────────────────────────────────────────────────────────────────────────────
# Cosine similarity helper (pure Python, no torch needed)
# Vectors come back from psycopg2 as lists of floats via pgvector
# ─────────────────────────────────────────────────────────────────────────────

def _cosine_similarity(vec_a, vec_b) -> float:
    """Compute cosine similarity between two equal-length float lists."""
    if not vec_a or not vec_b:
        return 0.0
    try:
        dot   = sum(a * b for a, b in zip(vec_a, vec_b))
        mag_a = sum(a * a for a in vec_a) ** 0.5
        mag_b = sum(b * b for b in vec_b) ** 0.5
        if mag_a == 0 or mag_b == 0:
            return 0.0
        return dot / (mag_a * mag_b)
    except Exception:
        return 0.0


# ─────────────────────────────────────────────────────────────────────────────
# Scheduler factory — called once from main.py lifespan
# ─────────────────────────────────────────────────────────────────────────────

def create_scheduler() -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        func=run_rematch_job,
        trigger=IntervalTrigger(minutes=RUN_INTERVAL_MINUTES),
        id="rematch_job",
        name="Periodic lost→found re-matching",
        replace_existing=True,
        max_instances=1,        # never overlap — if a run is slow, skip next tick
        coalesce=True,          # if multiple ticks were missed, fire only once
    )
    return scheduler
