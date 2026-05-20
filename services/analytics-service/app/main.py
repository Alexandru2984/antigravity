from fastapi import FastAPI, Depends
from contextlib import asynccontextmanager
import asyncio
import logging
import os

from app.consumer import start_kafka_consumer
from app.routers import analytics

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start Kafka consumer in background on startup."""
    task = asyncio.create_task(start_kafka_consumer())
    logger.info("Kafka consumer started")
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="Analytics Service",
    version="0.1.0",
    description="PolyMarket analytics — Kafka consumer + ClickHouse writer + REST API",
    lifespan=lifespan,
)

app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "analytics-service"}


@app.get("/ready")
async def ready():
    return {"status": "ready"}
