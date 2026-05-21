#!/usr/bin/env bash
# PolyMarket health check — verify public edge and compose services
set -euo pipefail

COMPOSE="docker compose -f docker-compose.yml"

if [[ -f .env ]]; then
    set -a; source .env; set +a
fi

if [[ -z "${JWT_PRIVATE_KEY:-}" && -f infra/keys/jwt_private.pem ]]; then
    export JWT_PRIVATE_KEY
    JWT_PRIVATE_KEY=$(cat infra/keys/jwt_private.pem)
fi

if [[ -z "${JWT_PUBLIC_KEY:-}" && -f infra/keys/jwt_public.pem ]]; then
    export JWT_PUBLIC_KEY
    JWT_PUBLIC_KEY=$(cat infra/keys/jwt_public.pem)
fi

PUBLIC_HTTP="${PUBLIC_HTTP:-http://localhost:${NGINX_HTTP_PORT:-80}}"
PASS=0
FAIL=0

check_http() {
    local name=$1
    local url=$2
    local code
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null || echo "000")
    if [[ "$code" == "200" ]]; then
        echo "  OK   $name ($url) -> $code"
        (( PASS += 1 ))
    else
        echo "  FAIL $name ($url) -> $code"
        (( FAIL += 1 ))
    fi
}

check_service() {
    local name=$1
    if $COMPOSE ps --services --filter status=running | grep -qx "$name"; then
        echo "  OK   $name container running"
        (( PASS += 1 ))
    else
        echo "  FAIL $name container not running"
        (( FAIL += 1 ))
    fi
}

echo "PolyMarket Health Check — $(date)"
echo "────────────────────────────────────"

check_http "nginx" "$PUBLIC_HTTP/health"
check_http "api-gateway via nginx" "$PUBLIC_HTTP/api/health"

for service in \
    postgres mongo redis zookeeper kafka opensearch minio clickhouse neo4j \
    auth-service api-gateway listing-service search-service image-service \
    profile-service payment-service notification-service feed-service \
    review-service analytics-service chat-service ml-service stream-processor \
    config-service contract-validator admin-panel frontend nginx \
    brainfuck-service assembly-service cobol-service clojure-service \
    julia-service prolog-service elixir-service scala-service lua-service \
    r-service php-service zig-service nim-service swift-service haskell-service
do
    check_service "$service"
done

echo ""
echo "Results: $PASS passed, $FAIL failed"
[[ $FAIL -eq 0 ]] && echo "All checks passed." || echo "$FAIL check(s) failed."
exit "$FAIL"
