import pytest

from analytics_service import consumer


class FakeClickHouse:
    def __init__(self) -> None:
        self.calls: list[tuple[str, list[tuple[object, ...]]]] = []

    def execute(self, query: str, rows: list[tuple[object, ...]]) -> None:
        self.calls.append((query, rows))


@pytest.mark.asyncio
async def test_handle_listing_created_maps_to_active_clickhouse_schema(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    fake = FakeClickHouse()
    monkeypatch.setattr(consumer, "get_clickhouse_client", lambda: fake)

    await consumer.handle_event(
        "listings.created",
        {
            "id": "listing-1",
            "seller_id": "seller-1",
            "category": "books",
            "price": 12.34,
            "created_at": "2026-05-26 12:00:00",
        },
    )

    query, rows = fake.calls[0]

    assert "INSERT INTO events" in query
    assert rows[0][0] == "listing_created"
    assert rows[0][1] == "seller-1"
    assert rows[0][2] == "listing-1"
    assert rows[0][3] == "books"
    assert rows[0][4] == 1234


def test_price_to_cents_handles_empty_values() -> None:
    assert consumer.price_to_cents(None) is None


def test_kafka_brokers_requires_explicit_runtime_config() -> None:
    with pytest.raises(RuntimeError, match="KAFKA_BROKERS is required"):
        consumer.kafka_brokers({})

    with pytest.raises(RuntimeError, match="KAFKA_BROKERS is required"):
        consumer.kafka_brokers({"KAFKA_BROKERS": " "})


def test_kafka_brokers_uses_compose_internal_listener() -> None:
    assert consumer.kafka_brokers({"KAFKA_BROKERS": "kafka:29092"}) == "kafka:29092"
