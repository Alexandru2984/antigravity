-- ============================================================
-- PolyMarket — TimescaleDB Init (Stream Processor)
-- Time-series metrics, KPIs, and service health data
-- ============================================================

CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Service metrics (RED: Rate, Errors, Duration)
CREATE TABLE IF NOT EXISTS service_metrics (
    time        TIMESTAMPTZ     NOT NULL,
    service     TEXT            NOT NULL,
    metric      TEXT            NOT NULL,
    value       DOUBLE PRECISION NOT NULL,
    labels      JSONB
);
SELECT create_hypertable('service_metrics', 'time', if_not_exists => TRUE);
CREATE INDEX idx_service_metrics_service ON service_metrics(service, time DESC);

-- Business KPIs time-series
CREATE TABLE IF NOT EXISTS business_kpis (
    time            TIMESTAMPTZ     NOT NULL,
    kpi             TEXT            NOT NULL,   -- 'listings_created', 'revenue', 'signups'
    value           DOUBLE PRECISION NOT NULL,
    category        TEXT,
    region          TEXT
);
SELECT create_hypertable('business_kpis', 'time', if_not_exists => TRUE);
CREATE INDEX idx_kpis ON business_kpis(kpi, time DESC);

-- Kafka consumer lag tracking
CREATE TABLE IF NOT EXISTS kafka_lag (
    time            TIMESTAMPTZ     NOT NULL,
    consumer_group  TEXT            NOT NULL,
    topic           TEXT            NOT NULL,
    partition       INT             NOT NULL,
    lag             BIGINT          NOT NULL
);
SELECT create_hypertable('kafka_lag', 'time', if_not_exists => TRUE);

-- Retention policies: auto-drop data older than 90 days
SELECT add_retention_policy('service_metrics', INTERVAL '90 days');
SELECT add_retention_policy('business_kpis',   INTERVAL '1 year');
SELECT add_retention_policy('kafka_lag',       INTERVAL '7 days');

-- Continuous aggregates: hourly KPI rollups
CREATE MATERIALIZED VIEW IF NOT EXISTS kpis_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket,
    kpi,
    category,
    SUM(value)  AS total,
    AVG(value)  AS avg,
    MAX(value)  AS max
FROM business_kpis
GROUP BY bucket, kpi, category;

SELECT add_continuous_aggregate_policy('kpis_hourly',
    start_offset => INTERVAL '2 hours',
    end_offset   => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');
