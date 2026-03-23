from fastapi import FastAPI
from routes.embed import router as embed_router
from routes.match import router as match_router
from models.embedder import get_model_status

app = FastAPI(
    title="Lost & Found AI Service",
    description="Handles embedding generation and item matching",
    version="1.0.0"
)

app.include_router(embed_router, prefix="/ai")
app.include_router(match_router, prefix="/ai")


@app.get("/health")
async def health_check():
    status = get_model_status()
    return {
        "status": "ok",
        "sbert": "loaded",
        "clip": "loaded"
    }


if __name__ == "__main__":
    import uvicorn
    from config import AI_SERVICE_PORT
    uvicorn.run("main:app", host="0.0.0.0", port=AI_SERVICE_PORT, reload=True)