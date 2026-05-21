# ── Stage 1: Chef (dependency caching) ─────────────────────────
FROM lukemathwalker/cargo-chef:latest-rust-alpine AS chef
WORKDIR /app

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

# ── Stage 2: Build ──────────────────────────────────────────────
FROM chef AS builder
RUN apk add --no-cache musl-dev cmake make gcc g++ pkgconfig librdkafka-dev curl-dev zlib-dev zlib-static zstd-dev zstd-static

COPY --from=planner /app/recipe.json recipe.json
# Build dependencies first (cached layer)
RUN cargo chef cook --release --recipe-path recipe.json

COPY . .
RUN cargo build --release --bin listing-service

# ── Stage 3: Runtime ────────────────────────────────────────────
FROM alpine:3.19 AS runner
RUN apk add --no-cache libstdc++ librdkafka ca-certificates

WORKDIR /app
RUN addgroup -S polymarket && adduser -S listing -G polymarket

COPY --from=builder --chown=listing:polymarket /app/target/release/listing-service ./listing-service

USER listing
EXPOSE 4022

HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:4022/health || exit 1

CMD ["./listing-service"]
