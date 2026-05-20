#!/usr/bin/env bash
# ============================================================
# PolyMarket — Database Health Wait Script
# Polls docker container health states until all DBs are ready
# ============================================================

set -e

CONTAINERS=(
  "polymarket-postgres"
  "polymarket-mongo"
  "polymarket-mysql"
  "polymarket-redis"
  "polymarket-clickhouse"
  "polymarket-timescale"
  "polymarket-neo4j"
  "polymarket-surrealdb"
  "polymarket-kafka"
)

MAX_RETRIES=30
SLEEP_SECS=3

echo "⏳ Waiting for database and messaging infrastructure to become healthy..."

for CONTAINER in "${CONTAINERS[@]}"; do
  echo -n "🔍 Checking $CONTAINER... "
  
  # Ensure container exists and is running
  if ! docker ps -q -f name="^/${CONTAINER}$" > /dev/null; then
    echo "❌ NOT RUNNING! Please run 'make up' first."
    exit 1
  fi

  RETRIES=0
  while true; do
    # Fetch health status
    STATUS=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}' "$CONTAINER" 2>/dev/null || echo "error")
    
    if [ "$STATUS" = "healthy" ] || [ "$STATUS" = "no-healthcheck" ]; then
      echo "✅ READY ($STATUS)"
      break
    fi

    if [ "$RETRIES" -ge "$MAX_RETRIES" ]; then
      echo "❌ TIMEOUT! Container $CONTAINER failed to become healthy (Status: $STATUS)."
      exit 1
    fi

    echo -n "."
    sleep "$SLEEP_SECS"
    RETRIES=$((RETRIES + 1))
  done
done

echo "🎉 All databases are healthy and ready to accept connections!"
exit 0
