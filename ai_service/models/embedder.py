from typing import Optional
from PIL import Image
import numpy as np
import io
import base64

_sbert_model = None
_clip_model = None


def _load_models():
    """
    Load SBERT and CLIP models into module-level variables.
    Called once at startup. Separated into a function so errors
    are caught and reported clearly instead of crashing silently.
    """
    global _sbert_model, _clip_model

    from sentence_transformers import SentenceTransformer

    print("[Embedder] Loading SBERT model (all-MiniLM-L6-v2)...")
    try:
        _sbert_model = SentenceTransformer('all-MiniLM-L6-v2')
        print("[Embedder] SBERT loaded successfully.")
    except Exception as e:
        print(f"[Embedder] ERROR: Failed to load SBERT — {e}")
        raise RuntimeError(f"SBERT model failed to load: {e}")

    print("[Embedder] Loading CLIP model (clip-ViT-B-32)...")
    try:
        # trust_remote_code=True is required in sentence-transformers >= 3.x
        _clip_model = SentenceTransformer('clip-ViT-B-32', trust_remote_code=True)
        print("[Embedder] CLIP loaded successfully.")
    except Exception as e:
        print(f"[Embedder] ERROR: Failed to load CLIP — {e}")
        # CLIP failure is non-fatal — system can still do text-only matching
        # Image matching will be disabled but text matching works fine
        _clip_model = None
        print("[Embedder] WARNING: Running in text-only mode. Image matching disabled.")


# Load immediately on import
_load_models()


# ─────────────────────────────────────────────
# STATUS CHECK
# Used by /health endpoint in main.py
# ─────────────────────────────────────────────

def get_model_status() -> dict:
    return {
        "sbert": "loaded" if _sbert_model is not None else "failed",
        "clip":  "loaded" if _clip_model  is not None else "failed (text-only mode)"
    }


# ─────────────────────────────────────────────
# TEXT EMBEDDING
# ─────────────────────────────────────────────

def get_text_embedding(text: str) -> list:
    
    if _sbert_model is None:
        raise RuntimeError("SBERT model is not loaded")

    # Clean the text
    text = text.strip() if text else ""

    if not text:
        # Return zero vector — will score 0.0 against everything
        return [0.0] * 384

    try:
        embedding = _sbert_model.encode(
            text,
            convert_to_numpy=True,
            normalize_embeddings=True   # L2 normalize → dot product = cosine sim
        )
        return embedding.tolist()

    except Exception as e:
        print(f"[Embedder] Text embedding failed: {e}")
        return [0.0] * 384


# ─────────────────────────────────────────────
# IMAGE EMBEDDING — from raw bytes
# ─────────────────────────────────────────────

def get_image_embedding_from_bytes(image_bytes: bytes) -> Optional[list]:
    
    if _clip_model is None:
        print("[Embedder] CLIP not available — skipping image embedding")
        return None

    if not image_bytes:
        return None

    try:
        # Open and normalize the image format
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # Encode using CLIP
        # In sentence-transformers >= 3.x, PIL images are passed directly
        embedding = _clip_model.encode(
            image,
            convert_to_numpy=True,
            normalize_embeddings=True
        )

        # encode() may return a 2D array if input was a list — flatten if needed
        if isinstance(embedding, np.ndarray) and embedding.ndim == 2:
            embedding = embedding[0]

        return embedding.tolist()

    except Exception as e:
        print(f"[Embedder] Image embedding failed: {e}")
        return None


# ─────────────────────────────────────────────
# IMAGE EMBEDDING — from base64 string
# ─────────────────────────────────────────────

def get_image_embedding_from_base64(base64_string: str) -> Optional[list]:
    
    if not base64_string:
        return None

    try:
        # Strip data URI prefix if present
        if "," in base64_string:
            base64_string = base64_string.split(",", 1)[1]

        image_bytes = base64.b64decode(base64_string)
        return get_image_embedding_from_bytes(image_bytes)

    except Exception as e:
        print(f"[Embedder] Base64 decode failed: {e}")
        return None


# ─────────────────────────────────────────────
# IMAGE EMBEDDING — from file path
# ─────────────────────────────────────────────

def get_image_embedding_from_path(image_path: str) -> Optional[list]:
    
    if not image_path:
        return None

    try:
        with open(image_path, "rb") as f:
            image_bytes = f.read()
        return get_image_embedding_from_bytes(image_bytes)

    except FileNotFoundError:
        print(f"[Embedder] Image file not found: {image_path}")
        return None
    except Exception as e:
        print(f"[Embedder] Failed to read image from path {image_path}: {e}")
        return None


# ─────────────────────────────────────────────
# SIMILARITY COMPUTATION
# ─────────────────────────────────────────────

def compute_cosine_similarity(vec1, vec2) -> float:
    
    if vec1 is None or vec2 is None:
        return 0.0

    a = np.array(vec1, dtype=np.float32)
    b = np.array(vec2, dtype=np.float32)

    # Guard against zero vectors (empty/failed embeddings)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)

    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0

    similarity = float(np.dot(a, b) / (norm_a * norm_b))

    # Clamp to [0, 1] — floating point arithmetic can produce tiny negatives
    # for near-orthogonal vectors, and tiny values > 1.0 for near-identical ones
    return max(0.0, min(1.0, similarity))


# ─────────────────────────────────────────────
# COMBINED SCORE
# ─────────────────────────────────────────────

def compute_combined_score(
    text_sim: Optional[float],
    image_sim: Optional[float],
    text_weight: float = 0.6,
    image_weight: float = 0.4
) -> float:
    
    has_text  = text_sim  is not None and text_sim  >= 0.0
    has_image = image_sim is not None and image_sim >= 0.0

    if has_text and has_image:
        # Renormalize weights in case caller passes non-standard values
        total_weight = text_weight + image_weight
        return (text_weight * text_sim + image_weight * image_sim) / total_weight

    elif has_text:
        return text_sim

    elif has_image:
        return image_sim

    else:
        return 0.0