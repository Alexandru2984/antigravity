from ml_service.main import app
from ml_service.main import ListingSignal, recommendations_for


def test_health_route_registered() -> None:
    assert any(getattr(route, "path", None) == "/" for route in app.routes)


def test_recommendation_route_is_deterministic() -> None:
    payload = ListingSignal(
        title="MacBook Pro M3",
        category="electronics",
        price=1200,
        location="Bucuresti",
    )

    first = recommendations_for(payload)
    second = recommendations_for(payload)

    assert first == second
    assert first["category"] == "electronics"
    assert first["price_band"] == "mid_market"
    assert first["recommendations"][0]["item"] == "USB-C docking station"
