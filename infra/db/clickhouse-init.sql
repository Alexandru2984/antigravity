-- ClickHouse analytics schema initialization
CREATE DATABASE IF NOT EXISTS analytics;

CREATE TABLE IF NOT EXISTS analytics.events
(
    event_type  LowCardinality(String),
    entity_id   String,
    user_id     String,
    metadata    String,  -- JSON blob
    occurred_at DateTime DEFAULT now()
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(occurred_at)
ORDER BY (event_type, occurred_at, entity_id)
TTL occurred_at + INTERVAL 2 YEAR;

-- Materialized view: daily listing counts
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.daily_listings
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(day)
ORDER BY (day, category)
POPULATE AS
SELECT
    toDate(occurred_at)                              AS day,
    JSONExtractString(metadata, 'category')          AS category,
    count()                                          AS total
FROM analytics.events
WHERE event_type = 'listing_created'
GROUP BY day, category;

-- Materialized view: daily revenue
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.daily_revenue
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(day)
ORDER BY day
POPULATE AS
SELECT
    toDate(occurred_at)                              AS day,
    countIf(event_type = 'payment_processed')        AS transactions,
    sumIf(toFloat64OrZero(JSONExtractString(metadata, 'amount')),
          event_type = 'payment_processed')          AS total_amount
FROM analytics.events
GROUP BY day;
