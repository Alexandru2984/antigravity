from analytics_service.main import app


def test_health_route_registered() -> None:
    assert any(getattr(route, "path", None) == "/health" for route in app.routes)
