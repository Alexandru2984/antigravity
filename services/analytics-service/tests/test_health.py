from analytics_service.main import app


def test_health_route_registered() -> None:
    assert any(getattr(route, "path", None) == "/health" for route in app.routes)


def test_ready_route_registered() -> None:
    assert any(getattr(route, "path", None) == "/ready" for route in app.routes)


def test_analytics_routes_registered() -> None:
    paths = {getattr(route, "path", None) for route in app.routes}

    assert "/analytics/overview" in paths
    assert "/analytics/listings" in paths
    assert "/analytics/payments" in paths
