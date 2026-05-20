from fastapi import FastAPI
from app.routers import ml

app = FastAPI(
    title="ML Service",
    version="0.1.0",
    description="PolyMarket ML — collaborative filtering recommendations via Neo4j",
)

app.include_router(ml.router, prefix="", tags=["ml"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ml-service"}


@app.get("/ready")
async def ready():
    return {"status": "ready"}
