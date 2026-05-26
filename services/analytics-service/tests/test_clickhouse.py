import pytest

from analytics_service.clickhouse import clickhouse_database


def test_clickhouse_database_defaults_to_compose_database(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("CLICKHOUSE_DB", raising=False)

    assert clickhouse_database() == "polymarket_analytics"


def test_clickhouse_database_rejects_invalid_identifier(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("CLICKHOUSE_DB", "analytics;DROP TABLE events")

    with pytest.raises(ValueError):
        clickhouse_database()
