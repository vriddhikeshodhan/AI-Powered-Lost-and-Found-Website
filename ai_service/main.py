
#from fastapi import FastAPI
#from routes.embed import router as embed_router
#from routes.match import router as match_router
#from models.embedder import get_model_status

#app = FastAPI(
#    title="Lost & Found AI Service",
#    description="Handles embedding generation and item matching",
#    version="1.0.0"
#)

#app.include_router(embed_router, prefix="/ai")
#app.include_router(match_router, prefix="/ai")


#@app.get("/health")
#async def health_check():
#    status = get_model_status()
#    return {
#        "status": "ok",
#        "sbert": "loaded",
#        "clip": "loaded"
#    }


#if __name__ == "__main__":
#    import uvicorn
#    from config import AI_SERVICE_PORT
#    uvicorn.run("main:app", host="0.0.0.0", port=AI_SERVICE_PORT, reload=True)

# ai_service/main.py

import logging
import asyncio
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Request

from models.embedder import _load_models, get_model_status
from routes.embed import router as embed_router
from routes.match import router as match_router
from scheduler import create_scheduler, run_rematch_job
from config import AI_SERVICE_PORT

# ─────────────────────────────────────────────────────────────────────────────
# Logging Setup
# ─────────────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Lifespan — replaces @app.on_event("startup") / ("shutdown")
# ─────────────────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ───────────────────────────────────────────────────────────────
    logger.info("Loading AI models (SBERT + CLIP)...")
    _load_models()
    logger.info("AI models loaded.")

    scheduler = create_scheduler()
    scheduler.start()
    
    # Safely get interval for logging (handles if job isn't scheduled yet)
    job = scheduler.get_job('rematch_job')
    interval_msg = job.trigger.interval if job else "its configured"
    
    logger.info(f"Scheduler started. Re-match job will run every {interval_msg} interval.")

    # Store scheduler on app.state so the manual-trigger endpoint can access it
    app.state.scheduler = scheduler

    yield  # ← app runs here

    # ── Shutdown ──────────────────────────────────────────────────────────────
    scheduler.shutdown(wait=False)
    logger.info("Scheduler stopped.")

# ─────────────────────────────────────────────────────────────────────────────
# App Initialization
# ─────────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Lost & Found AI Service",
    description="Handles embedding generation and item matching",
    version="1.0.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],     # Allows requests from any origin (like localhost:3000)
    allow_credentials=True,
    allow_methods=["*"],     # Allows all methods (POST, GET, OPTIONS, etc.)
    allow_headers=["*"],     # Allows all headers
)

# ─────────────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────────────
app.include_router(embed_router, prefix="/ai")
app.include_router(match_router, prefix="/ai")

# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    """Combined health check using the detailed status from the original file."""
    status = get_model_status()
    return {
        "status": "ok",
        "sbert": "loaded",
        "clip": "loaded",
        "details": status # Added this so the fetched status is actually utilized
    }

@app.post("/ai/scheduler/run")
async def trigger_rematch():
    """
    Immediately runs the re-matching job once in the background.
    Returns instantly — job runs asynchronously.
    """
    asyncio.create_task(run_rematch_job())
    return {
        "success": True,
        "message": "Re-match job triggered. Check server logs for progress."
    }

@app.get("/ai/scheduler/status")
async def scheduler_status(request: Request):
    """Returns the next scheduled run time."""
    job = request.app.state.scheduler.get_job("rematch_job")
    if not job:
        return {"running": False}
    return {
        "running":   True,
        "next_run":  str(job.next_run_time),
        "interval":  str(job.trigger.interval),
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=AI_SERVICE_PORT, reload=True)