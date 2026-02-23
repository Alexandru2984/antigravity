-- ============================================================
-- PolyMarket — ClickHouse Init (Analytics Service)
-- ============================================================

CREATE DATABASE IF NOT EXISTS polymarket_analytics;
USE polymarket_analytics;

-- Raw events table (append-only, high ingestion)
CREATE TABLE IF NOT EXISTS events (
    event_id    UUID        DEFAULT generateUUIDv4(),
    event_type  LowCardinality(String),
    user_id     Nullable(String),
    session_id  Nullable(String),
    listing_id  Nullable(String),
    category    Nullable(String),
    amount_cents Nullable(Int64),
    properties  String      DEFAULT '{}',  -- JSON blob
    ip_address  Nullable(String),
    user_agent  Nullable(String),
    created_at  DateTime64(3)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (event_type, created_at, user_id)
TTL created_at + INTERVAL 90 DAY;

-- Daily aggregates materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_stats
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, event_type, category)
AS SELECT
    toDate(created_at) AS date,
    event_type,
    category,
    count()         AS count,
    uniqExact(user_id) AS unique_users,
    sum(amount_cents) AS total_amount_cents
FROM events
GROUP BY date, event_type, category;

-- Listing view counts
CREATE TABLE IF NOT EXISTS listing_views (
    listing_id  String,
    user_id     Nullable(String),
    viewed_at   DateTime64(3)
) ENGINE = MergeTree()
ORDER BY (listing_id, viewed_at)
TTL viewed_at + INTERVAL 30 DAY;

-- Payment events for revenue analytics
CREATE TABLE IF NOT EXISTS payment_events (
    payment_id  String,
    user_id     String,
    listing_id  String,
    amount_cents Int64,
    currency    LowCardinality(String),
    status      LowCardinality(String),
    created_at  DateTime64(3)
) ENGINE = MergeTree()
ORDER BY (status, created_at)
PARTITION BY toYYYYMM(created_at);
