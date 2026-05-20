from fastapi import APIRouter
from pydantic import BaseModel
from app.neo4j_store import get_recommendations, record_view

router = APIRouter()


class RecommendationResponse(BaseModel):
    user_id: str
    recommendations: list[dict]


@router.get("/recommendations/{user_id}", response_model=RecommendationResponse)
async def recommendations(user_id: str, limit: int = 10):
    items = await get_recommendations(user_id, limit=limit)
    return RecommendationResponse(user_id=user_id, recommendations=items)


@router.post("/events/view")
async def record_listing_view(user_id: str, listing_id: str):
    await record_view(user_id, listing_id)
    return {"recorded": True}
