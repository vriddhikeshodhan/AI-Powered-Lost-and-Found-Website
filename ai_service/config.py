"""
config.py — AI service configuration

Threshold tuning rationale:
  Old threshold: 0.50 — too permissive, caused false matches (two silver bottles)
  New threshold: 0.65 — requires stronger semantic agreement before a match is saved

  Cosine similarity scale for SBERT:
    > 0.85  = very high — near-identical descriptions
    > 0.70  = high      — clearly the same type of item
    > 0.65  = moderate  — plausible match, worth notifying
    < 0.65  = likely unrelated or too vague to be useful
"""

import os
from dotenv import load_dotenv

load_dotenv()

# ── Database ───────────────────────────────────────────────────────────────────
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", 5433))
DB_NAME = os.getenv("DB_NAME", "lost_and_found")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

# ── Thresholds ─────────────────────────────────────────────────────────────────
# Combined score must exceed this to be saved as a match
COMBINED_THRESHOLD = float(os.getenv("COMBINED_THRESHOLD", 0.55))   # raised from 0.50

# Individual thresholds (used for signal quality checks)
TEXT_THRESHOLD         = float(os.getenv("TEXT_THRESHOLD",         0.55))
IMAGE_THRESHOLD        = float(os.getenv("IMAGE_THRESHOLD",        0.45))  # images noisier
CROSS_MODAL_THRESHOLD  = float(os.getenv("CROSS_MODAL_THRESHOLD",  0.55))  # cross-modal noisier

# ── Scoring weights ────────────────────────────────────────────────────────────
# Must sum to 1.0. compute_combined_score() normalizes automatically
# if a signal is missing, so these are the weights when all three are present.
TEXT_WEIGHT         = float(os.getenv("TEXT_WEIGHT",         0.50))  # SBERT
IMAGE_WEIGHT        = float(os.getenv("IMAGE_WEIGHT",        0.20))  # CLIP image↔image
CROSS_MODAL_WEIGHT  = float(os.getenv("CROSS_MODAL_WEIGHT",  0.30))  # CLIP text↔image

# ── Matching ───────────────────────────────────────────────────────────────────
TOP_K = int(os.getenv("TOP_K", 5))  # max matches returned per item (raised from 3)

# ── Service ────────────────────────────────────────────────────────────────────
AI_SERVICE_PORT = int(os.getenv("AI_SERVICE_PORT", 8000))
RUN_INTERVAL_MINUTES=30