module github.com/polymarket/feed-service

go 1.22

require (
    github.com/go-chi/chi/v5 v5.1.0
    github.com/redis/go-redis/v9 v9.7.1
    github.com/surrealdb/surrealdb.go v0.3.2
    github.com/IBM/sarama v1.43.3
    github.com/google/uuid v1.6.0
    go.opentelemetry.io/otel v1.32.0
    go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc v1.32.0
    go.opentelemetry.io/otel/sdk v1.32.0
    go.uber.org/zap v1.27.0
)
