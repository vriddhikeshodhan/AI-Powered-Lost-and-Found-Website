"""
embedder.py — Three embedding signals for matching

  1. SBERT  : all-mpnet-base-v2   → 768-dim text embeddings
              Upgraded from all-MiniLM-L6-v2 (384-dim).
              Significantly more accurate, same inference speed.

  2. CLIP image : clip-ViT-B-32   → 512-dim image embeddings

  3. CLIP text  : clip-ViT-B-32   → 512-dim text embeddings  ← NEW (cross-modal)
              Same 512-dim space as CLIP image embeddings.
              cosine(clip_text_lost, clip_image_found) = cross-modal score.
              This is what CLIP was originally designed for.

Scoring weights:
  0.50 × SBERT text  +  0.30 × cross-modal  +  0.20 × CLIP image
"""

from typing import Optional
from PIL import Image
import numpy as np
import io
import base64

_sbert_model = None
_clip_model  = None


def _load_models():
    global _sbert_model, _clip_model
    from sentence_transformers import SentenceTransformer

    print("[Embedder] Loading SBERT (all-mpnet-base-v2) ...")
    try:
        _sbert_model = SentenceTransformer('sentence-transformers/all-mpnet-base-v2')
        print("[Embedder] SBERT loaded — 768-dim")
    except Exception as e:
        raise RuntimeError(f"SBERT failed to load: {e}")

    print("[Embedder] Loading CLIP (clip-ViT-B-32) ...")
    try:
        _clip_model = SentenceTransformer('clip-ViT-B-32', trust_remote_code=True)
        print("[Embedder] CLIP loaded — 512-dim (image + text, shared space)")
    except Exception as e:
        _clip_model = None
        print(f"[Embedder] WARNING: CLIP failed — {e}. Running text-only mode.")


_load_models()


def get_model_status() -> dict:
    return {
        "sbert": "loaded (all-mpnet-base-v2, 768-dim)" if _sbert_model else "failed",
        "clip":  "loaded (clip-ViT-B-32, 512-dim)"     if _clip_model  else "failed"
    }


# ── SIGNAL 1 — SBERT TEXT (768-dim) ──────────────────────────────────────────

def get_text_embedding(text: str) -> list:
    """SBERT encoding. Returns 768-dim normalized vector."""
    if _sbert_model is None:
        raise RuntimeError("SBERT not loaded")
    text = text.strip() if text else ""
    if not text:
        return [0.0] * 768
    try:
        emb = _sbert_model.encode(text, convert_to_numpy=True, normalize_embeddings=True)
        return emb.tolist()
    except Exception as e:
        print(f"[Embedder] SBERT encode error: {e}")
        return [0.0] * 768


# ── SIGNAL 2 — CLIP IMAGE (512-dim) ──────────────────────────────────────────

def get_image_embedding_from_bytes(image_bytes: bytes) -> Optional[list]:
    """CLIP image encoding. Returns 512-dim normalized vector."""
    if _clip_model is None or not image_bytes:
        return None
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        emb = _clip_model.encode(image, convert_to_numpy=True, normalize_embeddings=True)
        if isinstance(emb, np.ndarray) and emb.ndim == 2:
            emb = emb[0]
        return emb.tolist()
    except Exception as e:
        print(f"[Embedder] CLIP image encode error: {e}")
        return None


def get_image_embedding_from_path(image_path: str) -> Optional[list]:
    if not image_path:
        return None
    try:
        with open(image_path, "rb") as f:
            return get_image_embedding_from_bytes(f.read())
    except Exception as e:
        print(f"[Embedder] Image path error: {e}")
        return None


def get_image_embedding_from_base64(b64: str) -> Optional[list]:
    if not b64:
        return None
    try:
        if "," in b64:
            b64 = b64.split(",", 1)[1]
        return get_image_embedding_from_bytes(base64.b64decode(b64))
    except Exception as e:
        print(f"[Embedder] Base64 error: {e}")
        return None


# ── SIGNAL 3 — CLIP TEXT (512-dim, cross-modal) ───────────────────────────────
#
# CLIP has TWO encoders in one model:
#   clip_model.encode(PIL_Image) → 512-dim image vector
#   clip_model.encode("string")  → 512-dim text  vector  ← SAME space
#
# Because both vectors live in the same space:
#   cosine( clip_text("silver puma bottle") , clip_image(photo) )
# ...is a valid and meaningful similarity score.
#
# This is cross-modal retrieval — comparing a text description
# directly against an image, with no intermediate step.
# ─────────────────────────────────────────────────────────────────────────────

def get_clip_text_embedding(text: str) -> Optional[list]:
    """
    Encode text using CLIP's text encoder (not SBERT).
    Returns 512-dim vector in CLIP's shared image-text space.

    DIFFERENT from get_text_embedding():
      get_text_embedding()      → SBERT → 768-dim (text-only space)
      get_clip_text_embedding() → CLIP  → 512-dim (shared with images)

    The output can be directly cosine-compared with image_embedding
    from get_image_embedding_from_bytes(). That IS cross-modal matching.
    """
    if _clip_model is None:
        return None
    text = text.strip() if text else ""
    if not text:
        return None
    try:
        # SentenceTransformer CLIP uses text encoder when input is a string
        emb = _clip_model.encode(text, convert_to_numpy=True, normalize_embeddings=True)
        if isinstance(emb, np.ndarray) and emb.ndim == 2:
            emb = emb[0]
        return emb.tolist()
    except Exception as e:
        print(f"[Embedder] CLIP text encode error: {e}")
        return None


# ── TEXT ENRICHMENT ───────────────────────────────────────────────────────────
#
# Better input text = better embeddings.
# Concatenate all structured fields so the model sees brand,
# colour, and distinguishing features, not just a vague description.
#
# Example output:
#   "Lost item: puma silver bottle. brand: puma. colour: silver.
#    distinguishing feature: dent on lower left. 750ml steel water
#    bottle with black lid, slight dent on lower left side."
# ─────────────────────────────────────────────────────────────────────────────

def build_enriched_text(
    title:          str,
    description:    str,
    brand:          str = "",
    colour:         str = "",
    distinguishing: str = "",
    item_type:      str = ""
) -> str:
    """Build an enriched text string for embedding. More detail = better match."""
    parts = []
    prefix = f"{item_type} item: {title}" if item_type else title
    parts.append(prefix)

    if brand:          parts.append(f"brand: {brand}")
    if colour:         parts.append(f"colour: {colour}")
    if distinguishing: parts.append(f"distinguishing feature: {distinguishing}")
    if description and description.strip() != title.strip():
        parts.append(description)

    return ". ".join(filter(None, parts))


# ── COSINE SIMILARITY ─────────────────────────────────────────────────────────

def compute_cosine_similarity(vec1, vec2) -> float:
    if vec1 is None or vec2 is None:
        return 0.0
    a = np.array(vec1, dtype=np.float32)
    b = np.array(vec2, dtype=np.float32)
    na, nb = np.linalg.norm(a), np.linalg.norm(b)
    if na == 0.0 or nb == 0.0:
        return 0.0
    return float(max(0.0, min(1.0, np.dot(a, b) / (na * nb))))


# ── COMBINED SCORE (three signals) ───────────────────────────────────────────
#
# Default weights:  50% SBERT + 30% cross-modal + 20% CLIP image
#
# Graceful degradation when signals are missing:
#   Missing cross-modal  → renormalize: 70% text + 30% image
#   Missing image        → renormalize: 70% text + 30% cross-modal
#   Text only            → 100% text
# ─────────────────────────────────────────────────────────────────────────────

def compute_combined_score(
    text_sim:           Optional[float],
    image_sim:          Optional[float],
    cross_modal_sim:    Optional[float] = None,
    text_weight:        float = 0.50,
    image_weight:       float = 0.20,
    cross_modal_weight: float = 0.30
) -> float:
    """Combine three signals into one score in [0, 1]."""
    score  = 0.0
    weight = 0.0

    if text_sim is not None and text_sim >= 0.0:
        score  += text_weight * text_sim
        weight += text_weight

    if image_sim is not None and image_sim >= 0.0:
        score  += image_weight * image_sim
        weight += image_weight

    if cross_modal_sim is not None and cross_modal_sim >= 0.0:
        score  += cross_modal_weight * cross_modal_sim
        weight += cross_modal_weight

    if weight == 0.0:
        return 0.0

    return float(max(0.0, min(1.0, score / weight)))
