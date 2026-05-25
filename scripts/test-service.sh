#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE="${1:-}"

usage() {
    cat <<'EOF'
Usage: scripts/test-service.sh <service>

Supported services:
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
EOF
}

need() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "Missing required command: $1" >&2
        exit 127
    fi
}

run() {
    echo ""
    echo "==> $*"
    "$@"
}

if [[ -z "$SERVICE" || "$SERVICE" == "--help" || "$SERVICE" == "-h" ]]; then
    usage
    [[ -z "$SERVICE" ]] && exit 2 || exit 0
fi

case "$SERVICE" in
    api-gateway)
        need npm
        run npm --prefix "$ROOT_DIR/services/api-gateway" test -- --runInBand
        ;;

    auth-service)
        need mix
        (cd "$ROOT_DIR/services/auth-service" && run mix test)
        ;;

    chat-service)
        need mix
        (cd "$ROOT_DIR/services/chat-service" && run mix test)
        ;;

    notification-service)
        need mix
        (cd "$ROOT_DIR/services/notification-service" && run mix test)
        ;;

    elixir-service)
        need mix
        (cd "$ROOT_DIR/services/elixir-service" && run mix test)
        ;;

    search-service)
        need mvn
        (cd "$ROOT_DIR/services/search-service" && run mvn test -Dspring.profiles.active=test)
        ;;

    listing-service)
        need cargo
        (cd "$ROOT_DIR/services/listing-service" && run cargo test)
        ;;

    feed-service)
        need go
        (cd "$ROOT_DIR/services/feed-service" && run go test ./... -race -coverprofile=coverage.out)
        ;;

    profile-service)
        if command -v gradle >/dev/null 2>&1; then
            (cd "$ROOT_DIR/services/profile-service" && run gradle test)
        elif [[ -x "$ROOT_DIR/services/profile-service/gradlew" ]]; then
            (cd "$ROOT_DIR/services/profile-service" && run ./gradlew test)
        else
            echo "Missing required command: gradle" >&2
            exit 127
        fi
        ;;

    config-service)
        need dotnet
        need docker
        container_name="config-service-test-postgres"
        port="${CONFIG_SERVICE_TEST_POSTGRES_PORT:-15433}"
        cleanup() {
            docker stop "$container_name" >/dev/null 2>&1 || true
        }
        trap cleanup EXIT
        cleanup
        run docker run -d --rm \
            --name "$container_name" \
            -e POSTGRES_USER=polymarket \
            -e POSTGRES_PASSWORD=test \
            -e POSTGRES_DB=polymarket_config_test \
            -p "127.0.0.1:${port}:5432" \
            postgres:16-alpine
        for _ in $(seq 1 20); do
            if docker exec "$container_name" pg_isready -U polymarket -d polymarket_config_test >/dev/null 2>&1; then
                break
            fi
            sleep 1
        done
        (
            cd "$ROOT_DIR/services/config-service"
            run dotnet restore
            run dotnet restore tests/ConfigService.Tests/ConfigService.Tests.fsproj
            run dotnet build --no-restore -warnaserror
            run dotnet build tests/ConfigService.Tests/ConfigService.Tests.fsproj --no-restore -warnaserror
            ConnectionStrings__Postgres="Host=localhost;Port=${port};Database=polymarket_config_test;Username=polymarket;Password=test" \
                run dotnet test tests/ConfigService.Tests/ConfigService.Tests.fsproj --no-build
        )
        ;;

    contract-validator)
        need stack
        (cd "$ROOT_DIR/services/contract-validator" && run stack test)
        ;;

    *)
        echo "Unsupported service: $SERVICE" >&2
        usage >&2
        exit 2
        ;;
esac
