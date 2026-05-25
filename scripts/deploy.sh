#!/usr/bin/env bash
# PolyMarket production deployment script
# Usage: ./scripts/deploy.sh [--rebuild]
set -euo pipefail

REBUILD=${1:-""}
INFRA_COMPOSE=(docker compose -f infra/docker-compose.yml)
SERVICES_COMPOSE=(docker compose -f infra/docker-compose.yml -f infra/docker-compose.services.yml)
KEY_DIR=infra/keys
JWT_PRIVATE_KEY_FILE="$KEY_DIR/jwt_private.pem"
JWT_PUBLIC_KEY_FILE="$KEY_DIR/jwt_public.pem"

echo "🚀 PolyMarket Deploy — $(date)"
echo "────────────────────────────────"

# ── Load .env if present ──────────────────────────────────────
if [[ -f .env ]]; then
    echo "📋 Loading .env..."
    set -a; source .env; set +a
fi

# ── RSA key generation / loading ──────────────────────────────
if [[ -z "${JWT_PRIVATE_KEY:-}" || -z "${JWT_PUBLIC_KEY:-}" ]]; then
    if [[ ! -f "$JWT_PRIVATE_KEY_FILE" || ! -f "$JWT_PUBLIC_KEY_FILE" ]]; then
        echo "📀 Generating RSA keypair for JWT..."
        mkdir -p "$KEY_DIR"
        chmod 700 "$KEY_DIR"
        openssl genrsa -out "$JWT_PRIVATE_KEY_FILE" 4096
        openssl rsa -in "$JWT_PRIVATE_KEY_FILE" -pubout -out "$JWT_PUBLIC_KEY_FILE"
        chmod 600 "$JWT_PRIVATE_KEY_FILE"
        chmod 644 "$JWT_PUBLIC_KEY_FILE"
        echo "✅ Keys generated in $KEY_DIR/"
    fi

    export JWT_PRIVATE_KEY
    JWT_PRIVATE_KEY=$(cat "$JWT_PRIVATE_KEY_FILE")
    export JWT_PUBLIC_KEY
    JWT_PUBLIC_KEY=$(cat "$JWT_PUBLIC_KEY_FILE")
fi

reject_placeholder() {
    local name=$1
    local value=${!name:-}
    case "$value" in
        ""|*replace_with*|*changeme*|*dummy*|*example*|*"...")
            echo "❌ ERROR: $name still looks like a placeholder. Set a real value in .env"
            exit 1
            ;;
    esac
}

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
    JWT_PRIVATE_KEY
    JWT_PUBLIC_KEY
)
for var in "${REQUIRED[@]}"; do
    if [[ -z "${!var:-}" ]]; then
        echo "❌ ERROR: $var is not set. Add it to .env"
        exit 1
    fi
done

SECRET_VARS=(
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
    JWT_PRIVATE_KEY
    JWT_PUBLIC_KEY
)
for var in "${SECRET_VARS[@]}"; do
    reject_placeholder "$var"
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
bash infra/db/wait-for-dbs.sh

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
