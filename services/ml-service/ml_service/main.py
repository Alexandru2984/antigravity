from fastapi import FastAPI, Query
from pydantic import BaseModel, Field

from ml_service.routers.ml import router as ml_router

app = FastAPI(title="ML Service")


class ListingSignal(BaseModel):
    title: str = Field(default="")
    category: str = Field(default="general")
    price: float = Field(default=0, ge=0)
    location: str = Field(default="")


CATALOG: dict[str, list[dict[str, float | str]]] = {
    "electronics": [
        {"item": "USB-C docking station", "score": 0.92},
        {"item": "Protective laptop sleeve", "score": 0.87},
        {"item": "Wireless ergonomic mouse", "score": 0.81},
    ],
    "vehicles": [
        {"item": "Extended warranty inspection", "score": 0.89},
        {"item": "Winter tire package", "score": 0.84},
        {"item": "Dash camera kit", "score": 0.78},
    ],
    "real_estate": [
        {"item": "Virtual tour package", "score": 0.9},
        {"item": "Energy certificate assistance", "score": 0.83},
        {"item": "Moving services quote", "score": 0.77},
    ],
    "general": [
        {"item": "Featured listing boost", "score": 0.82},
        {"item": "Buyer protection badge", "score": 0.79},
        {"item": "Local pickup reminder", "score": 0.74},
    ],
}


def normalize_category(category: str) -> str:
    key = category.strip().lower().replace("-", "_")
    return key if key in CATALOG else "general"


def price_band(price: float) -> str:
    if price >= 5000:
        return "premium"
    if price >= 500:
        return "mid_market"
    return "entry"


def recommendations_for(signal: ListingSignal) -> dict:
    category = normalize_category(signal.category)
    band = price_band(signal.price)
    base = CATALOG[category]
    price_multiplier = {"premium": 1.08, "mid_market": 1.0, "entry": 0.94}[band]

    recommendations = [
        {
            "item": item["item"],
            "score": round(float(item["score"]) * price_multiplier, 4),
            "reason": f"{category}:{band}",
        }
        for item in base
    ]

    return {
        "service": "python-ml",
        "provider": "Python-ML-Node",
        "model": "category-price-ranker-v1",
        "category": category,
        "price_band": band,
        "recommendations": recommendations,
    }


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "python-ml"}


@app.get("/ready")
def ready_check():
    return {"status": "ready", "service": "python-ml"}


@app.get("/")
def health():
    return {"status": "online", "role": "Algorithmic Recommendations"}


@app.get("/recommend")
def get_recommendation(
    category: str = Query(default="general"),
    price: float = Query(default=0, ge=0),
    title: str = Query(default=""),
    location: str = Query(default=""),
):
    return recommendations_for(
        ListingSignal(
            title=title,
            category=category,
            price=price,
            location=location,
        )
    )


@app.post("/recommend")
def recommend_for_listing(signal: ListingSignal):
    return recommendations_for(signal)


app.include_router(ml_router, prefix="/ml")
