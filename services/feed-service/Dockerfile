# ── Test stage ───────────────────────────────────────────────
FROM golang:1.22-alpine AS test
WORKDIR /app

COPY go.mod go.sum* ./
RUN go mod download

COPY . .
RUN go test ./... && touch /tmp/tests-passed

# ── Build stage ──────────────────────────────────────────────
FROM golang:1.22-alpine AS builder
WORKDIR /app

COPY go.mod go.sum* ./
RUN go mod download

COPY . .
COPY --from=test /tmp/tests-passed /tmp/tests-passed
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o feed-service ./cmd/main.go

# ── Runtime stage ─────────────────────────────────────────────
FROM scratch
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /app/feed-service /feed-service

ENV PORT=4008
EXPOSE 4008
USER 65532:65532

HEALTHCHECK --interval=30s --timeout=5s \
    CMD ["/feed-service", "-health"]

ENTRYPOINT ["/feed-service"]
