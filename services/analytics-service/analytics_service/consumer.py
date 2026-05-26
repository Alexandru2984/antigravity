import asyncio
import json
import logging
import os

from aiokafka import AIOKafkaConsumer

from analytics_service.clickhouse import get_clickhouse_client

logger = logging.getLogger(__name__)

KAFKA_GROUP_ID = "analytics-service"

TOPICS = [
    "listings.created",
    "listings.updated",
    "payments.processed",
    "users.registered",
    "images.uploaded",
    "reviews.created",
]


async def start_kafka_consumer():
    consumer = AIOKafkaConsumer(
        *TOPICS,
        bootstrap_servers=kafka_brokers(),
        group_id=KAFKA_GROUP_ID,
        auto_offset_reset="earliest",
        value_deserializer=lambda v: json.loads(v.decode("utf-8")),
    )

    await consumer.start()
    logger.info("Kafka consumer started, topics=%s", TOPICS)

    try:
        async for msg in consumer:
            await handle_event(msg.topic, msg.value)
    except asyncio.CancelledError:
        logger.info("Kafka consumer shutting down")
    finally:
        await consumer.stop()


async def handle_event(topic: str, payload: dict):
    ch = get_clickhouse_client()
    try:
        if topic == "listings.created":
            ch.execute(
                """
                INSERT INTO events
                    (event_type, user_id, listing_id, category, amount_cents, properties, created_at)
                VALUES
                """,
                [(
                    "listing_created",
                    str(payload.get("seller_id", "")),
                    str(payload.get("id", "")),
                    payload.get("category"),
                    price_to_cents(payload.get("price")),
                    json.dumps({"price": payload.get("price")}),
                    payload.get("created_at", "now()"),
                )],
            )
        elif topic == "payments.processed":
            ch.execute(
                """
                INSERT INTO events
                    (event_type, user_id, listing_id, category, amount_cents, properties, created_at)
                VALUES
                """,
                [(
                    "payment_processed",
                    str(payload.get("user_id", "")),
                    str(payload.get("listing_id", "")),
                    None,
                    price_to_cents(payload.get("amount")),
                    json.dumps({
                        "transaction_id": payload.get("transaction_id"),
                        "currency": payload.get("currency"),
                    }),
                    payload.get("occurred_at", "now()"),
                )],
            )
        elif topic == "users.registered":
            ch.execute(
                """
                INSERT INTO events
                    (event_type, user_id, listing_id, category, amount_cents, properties, created_at)
                VALUES
                """,
                [(
                    "user_registered",
                    str(payload.get("user_id", "")),
                    None,
                    None,
                    None,
                    json.dumps({}),
                    "now()",
                )],
            )
        else:
            # Generic event storage
            ch.execute(
                """
                INSERT INTO events
                    (event_type, user_id, listing_id, category, amount_cents, properties, created_at)
                VALUES
                """,
                [(
                    topic,
                    str(payload.get("user_id", "")),
                    str(payload.get("listing_id", payload.get("id", ""))),
                    payload.get("category"),
                    price_to_cents(payload.get("amount")),
                    json.dumps(payload),
                    "now()",
                )],
            )
        logger.debug("Inserted event: topic=%s", topic)
    except Exception as e:
        logger.error("ClickHouse insert error for topic %s: %s", topic, e)


def price_to_cents(value: object) -> int | None:
    if value is None:
        return None
    if not isinstance(value, int | float | str):
        raise ValueError("amount must be numeric")
    return round(float(value) * 100)


def kafka_brokers(env: dict[str, str] | None = None) -> str:
    source = os.environ if env is None else env
    value = source.get("KAFKA_BROKERS")
    if value is None or value.strip() == "":
        raise RuntimeError("KAFKA_BROKERS is required")
    return value
