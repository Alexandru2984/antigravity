from ml_service.main import app
from ml_service.main import ListingSignal, recommendations_for


def test_health_route_registered() -> None:
    assert any(getattr(route, "path", None) == "/" for route in app.routes)


def test_health_and_ready_routes_registered() -> None:
    paths = {getattr(route, "path", None) for route in app.routes}

    assert "/health" in paths
    assert "/ready" in paths


def test_graph_recommendation_routes_registered() -> None:
    paths = {getattr(route, "path", None) for route in app.routes}

    assert "/ml/recommendations/{user_id}" in paths
    assert "/ml/events/view" in paths


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


def test_unknown_category_falls_back_to_general() -> None:
    payload = ListingSignal(category="unknown", price=100)

    result = recommendations_for(payload)

    assert result["category"] == "general"
    assert result["price_band"] == "entry"
