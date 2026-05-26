from fastapi import FastAPI

from analytics_service.routers.analytics import router as analytics_router

app = FastAPI(title="Analytics Service")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "analytics-service"}


@app.get("/ready")
async def ready():
    return {"status": "ready", "service": "analytics-service"}


app.include_router(analytics_router, prefix="/analytics")
