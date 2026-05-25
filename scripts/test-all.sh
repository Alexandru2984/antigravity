#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SERVICES=(
    api-gateway
    auth-service
    chat-service
    notification-service
    elixir-service
    search-service
    listing-service
    feed-service
    profile-service
    config-service
    contract-validator
)

for service in "${SERVICES[@]}"; do
    echo ""
    echo "============================================================"
    echo "Running tests for ${service}"
    echo "============================================================"
    "$ROOT_DIR/scripts/test-service.sh" "$service"
done

echo ""
echo "All supported service tests passed."
