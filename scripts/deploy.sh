#!/usr/bin/env bash
# PolyMarket production deployment script
# Usage: ./scripts/deploy.sh [--rebuild]
set -euo pipefail

REBUILD=${1:-""}
COMPOSE="docker compose -f docker-compose.yml"

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
REQUIRED=(STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET POSTGRES_PASSWORD)
for var in "${REQUIRED[@]}"; do
    if [[ -z "${!var:-}" ]]; then
        echo "❌ ERROR: $var is not set. Add it to .env"
        exit 1
    fi
done

# ── Pull/build images ─────────────────────────────────────────
if [[ "$REBUILD" == "--rebuild" ]]; then
    echo "🔨 Rebuilding all images..."
    $COMPOSE build --no-cache --parallel
else
    echo "🔨 Building changed images..."
    $COMPOSE build --parallel
fi

# ── Bring up infrastructure first ─────────────────────────────
echo "🏗️  Starting infrastructure..."
$COMPOSE up -d postgres mongo redis zookeeper kafka minio clickhouse neo4j

echo "⏳ Waiting for infrastructure to be healthy..."
sleep 10

# ── Start services ─────────────────────────────────────────────
echo "▶️  Starting microservices..."
$COMPOSE up -d \
    auth-service listing-service search-service image-service \
    profile-service payment-service notification-service \
    feed-service review-service analytics-service chat-service \
    ml-service stream-processor config-service contract-validator

# ── Start frontend + gateway ───────────────────────────────────
echo "🌐 Starting API gateway and frontend..."
$COMPOSE up -d api-gateway frontend admin-panel

# ── Start Nginx ────────────────────────────────────────────────
echo "🔒 Starting Nginx..."
$COMPOSE up -d nginx

echo ""
echo "✅ Deploy complete!"
echo "   → API Gateway: http://localhost:4001"
echo "   → Frontend:    http://localhost:3000"
echo "   → Admin:       http://localhost:4016/admin"
echo ""
echo "Run './scripts/health-check.sh' to verify all services."
