#!/usr/bin/env bash
# PolyMarket production deployment script
# Usage: ./scripts/deploy.sh [--rebuild]
set -euo pipefail

REBUILD=${1:-""}
INFRA_COMPOSE=(docker compose -f infra/docker-compose.yml)
SERVICES_COMPOSE=(docker compose -f infra/docker-compose.yml -f infra/docker-compose.services.yml)

echo "🚀 PolyMarket Deploy — $(date)"
echo "────────────────────────────────"

# ── RSA key generation (if missing) ───────────────────────────
if [[ ! -f infra/keys/jwt_private.pem ]]; then
    echo "📀 Generating RSA keypair for JWT..."
    mkdir -p infra/keys
    openssl genrsa -out infra/keys/jwt_private.pem 4096
    openssl rsa -in infra/keys/jwt_private.pem -pubout -out infra/keys/jwt_public.pem
    echo "✅ Keys generated in infra/keys/"
fi

# ── Load/export keys as env vars ──────────────────────────────
export JWT_PRIVATE_KEY=$(cat infra/keys/jwt_private.pem)
export JWT_PUBLIC_KEY=$(cat infra/keys/jwt_public.pem)

# ── Load .env if present ──────────────────────────────────────
if [[ -f .env ]]; then
    echo "📋 Loading .env..."
    set -a; source .env; set +a
fi

# ── Validate required secrets ──────────────────────────────────
REQUIRED=(
    STRIPE_SECRET_KEY
    STRIPE_WEBHOOK_SECRET
    POSTGRES_PASSWORD
    MONGO_PASSWORD
    MYSQL_ROOT_PASSWORD
    MYSQL_PASSWORD
    REDIS_PASSWORD
    CLICKHOUSE_PASSWORD
    TIMESCALE_PASSWORD
    SURREALDB_PASSWORD
    MINIO_ROOT_USER
    MINIO_ROOT_PASSWORD
    NEO4J_PASSWORD
    OPENSEARCH_INITIAL_ADMIN_PASSWORD
    SECRET_KEY_BASE
    NOTIFICATION_SECRET_KEY_BASE
    CHAT_SECRET_KEY_BASE
    ADMIN_SECRET_KEY_BASE
    REVIEW_APP_KEY
    INTERNAL_SERVICE_TOKEN
    GRAFANA_ADMIN_PASSWORD
    FRONTEND_URL
    CORS_ORIGINS
    POLYGLOT_MESH_ENABLED
)
for var in "${REQUIRED[@]}"; do
    if [[ -z "${!var:-}" ]]; then
        echo "❌ ERROR: $var is not set. Add it to .env"
        exit 1
    fi
done

# ── Pull/build images ─────────────────────────────────────────
if [[ "$REBUILD" == "--rebuild" ]]; then
    echo "🔨 Rebuilding all images..."
    "${SERVICES_COMPOSE[@]}" build --no-cache --parallel
else
    echo "🔨 Building changed images..."
    "${SERVICES_COMPOSE[@]}" build --parallel
fi

# ── Bring up infrastructure first ─────────────────────────────
echo "🏗️  Starting infrastructure..."
"${INFRA_COMPOSE[@]}" up -d

echo "⏳ Waiting for infrastructure to be healthy..."
sleep 10

# ── Start services ─────────────────────────────────────────────
echo "▶️  Starting microservices..."
"${SERVICES_COMPOSE[@]}" up -d \
    auth-service listing-service search-service image-service \
    profile-service payment-service notification-service \
    feed-service review-service analytics-service chat-service \
    ml-service stream-processor config-service contract-validator \
    brainfuck-service assembly-service cobol-service clojure-service \
    julia-service prolog-service elixir-service scala-service lua-service \
    r-service php-service zig-service nim-service swift-service haskell-service

# ── Start frontend + gateway ───────────────────────────────────
echo "🌐 Starting API gateway and frontend..."
"${SERVICES_COMPOSE[@]}" up -d api-gateway frontend admin-panel

# ── Start Nginx ────────────────────────────────────────────────
echo "🔒 Starting Nginx..."
"${SERVICES_COMPOSE[@]}" up -d nginx

echo ""
echo "✅ Deploy complete!"
echo "   → Public HTTP:  http://localhost:${NGINX_HTTP_PORT:-80}"
echo "   → Public HTTPS: https://localhost:${NGINX_HTTPS_PORT:-443}"
echo ""
echo "Run './scripts/health-check.sh' to verify all services."
