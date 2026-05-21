import asyncio
import json
import logging
import os
from aiokafka import AIOKafkaConsumer
from analytics_service.clickhouse import get_clickhouse_client

logger = logging.getLogger(__name__)

KAFKA_BROKERS  = os.getenv("KAFKA_BROKERS", "kafka:9092")
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
        bootstrap_servers=KAFKA_BROKERS,
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
                "INSERT INTO analytics.events (event_type, entity_id, user_id, metadata, occurred_at) VALUES",
                [("listing_created", payload.get("id", ""), payload.get("seller_id", ""),
                  json.dumps({"category": payload.get("category"), "price": payload.get("price")}),
                  payload.get("created_at", "now()"))],
            )
        elif topic == "payments.processed":
            ch.execute(
                "INSERT INTO analytics.events (event_type, entity_id, user_id, metadata, occurred_at) VALUES",
                [("payment_processed", str(payload.get("transaction_id", "")),
                  str(payload.get("user_id", "")),
                  json.dumps({"amount": payload.get("amount"), "currency": payload.get("currency")}),
                  payload.get("occurred_at", "now()"))],
            )
        elif topic == "users.registered":
            ch.execute(
                "INSERT INTO analytics.events (event_type, entity_id, user_id, metadata, occurred_at) VALUES",
                [("user_registered", str(payload.get("user_id", "")), str(payload.get("user_id", "")),
                  json.dumps({}), "now()")],
            )
        else:
            # Generic event storage
            ch.execute(
                "INSERT INTO analytics.events (event_type, entity_id, user_id, metadata, occurred_at) VALUES",
                [(topic, str(payload.get("id", "")), str(payload.get("user_id", "")),
                  json.dumps(payload), "now()")],
            )
        logger.debug("Inserted event: topic=%s", topic)
    except Exception as e:
        logger.error("ClickHouse insert error for topic %s: %s", topic, e)
