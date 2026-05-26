#!/usr/bin/env bash
# ============================================================
# PolyMarket — Kafka Topics Setup
# Creates all topics with appropriate partition counts
# Run: bash infra/kafka/topics.sh
# ============================================================
set -e

KAFKA_BOOTSTRAP="${KAFKA_BOOTSTRAP:-localhost:9092}"
CLI="docker exec polymarket-kafka kafka-topics --bootstrap-server kafka:29092"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Creating PolyMarket Kafka Topics"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Helper function
create_topic() {
  local topic=$1
  local partitions=${2:-3}
  local retention_ms=${3:-604800000}   # 7 days default

  echo -n "  Creating '$topic' ($partitions partitions)... "
  $CLI --create \
    --topic "$topic" \
    --partitions "$partitions" \
    --replication-factor 1 \
    --config "retention.ms=$retention_ms" \
    --if-not-exists 2>/dev/null && echo "✓" || echo "already exists"
}

# ── User Events ──────────────────────────────────────────────
create_topic "users.registered"      3  604800000   # 7 days
create_topic "users.updated"         3  604800000
create_topic "users.deleted"         1  2592000000  # 30 days (audit)

# ── Listing Events ───────────────────────────────────────────
create_topic "listings.created"      6  604800000   # high-traffic
create_topic "listings.updated"      6  604800000
create_topic "listings.deleted"      3  604800000
create_topic "listings.viewed"       12 86400000    # 1 day (clickstream)

# Listing-service and notification-service currently publish/consume these
# prefixed domain topics. Keep the unprefixed topics above for analytics
# pipelines that already consume them.
create_topic "polymarket.listings.created" 6 604800000
create_topic "polymarket.listings.updated" 6 604800000
create_topic "polymarket.listings.deleted" 3 604800000
create_topic "polymarket.listings.expired" 3 604800000
create_topic "polymarket.listings.sold"    3 604800000

# ── Payment Events ───────────────────────────────────────────
# Financial events: longer retention for audit
create_topic "payments.initiated"    3  2592000000  # 30 days
create_topic "payments.processed"    3  2592000000
create_topic "payments.failed"       3  2592000000
create_topic "payments.refunded"     3  2592000000

# ── Image Events ─────────────────────────────────────────────
create_topic "images.uploaded"       6  86400000    # 1 day
create_topic "images.processed"      6  86400000

# ── Notification Events ──────────────────────────────────────
create_topic "notifications.send"    6  86400000    # 1 day
create_topic "notifications.sent"    3  86400000

# ── Review Events ────────────────────────────────────────────
create_topic "reviews.created"       3  604800000
create_topic "reviews.updated"       3  604800000

# ── Chat Events ──────────────────────────────────────────────
create_topic "messages.sent"         6  604800000
create_topic "messages.read"         6  86400000

# ── Analytics Events (high-volume) ──────────────────────────
create_topic "analytics.events"      12 2592000000  # 30 days, high partitions
create_topic "analytics.pageviews"   12 86400000

# ── Feed Events ──────────────────────────────────────────────
create_topic "feed.invalidate"       6  3600000     # 1 hour (cache busting)

# ── ML Events ────────────────────────────────────────────────
create_topic "ml.retrain.trigger"    1  604800000
create_topic "ml.recommendations"    3  3600000

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  All topics created."
$CLI --list
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
