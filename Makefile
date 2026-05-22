# PolyMarket Makefile
# Architecture B — Max Polyglot | 18 services | 16 languages
.PHONY: help up up-obs up-all down down-all logs build dev frontend test lint \
        seed db-init kafka-init minio-init init quickstart test-e2e perf-lib \
        clean pull ps status

DOCKER_COMPOSE := docker compose
INFRA          := -f infra/docker-compose.yml
OBS            := -f infra/docker-compose.obs.yml
SERVICES       := -f infra/docker-compose.services.yml
STACK          := $(INFRA) $(SERVICES)

## ── Help ─────────────────────────────────────────────────────────────────────
help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "\n\033[1m  PolyMarket Dev Commands\033[0m\n\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

## ── Infrastructure ───────────────────────────────────────────────────────────
up: ## Start all infrastructure (DBs, Kafka, MinIO)
	$(DOCKER_COMPOSE) $(INFRA) up -d
	@echo "⏳ Waiting for services to be healthy..."
	@sleep 5
	@echo "✅ Infrastructure up. Run 'make db-init kafka-init seed' next."

up-obs: ## Start observability stack (Prometheus, Grafana, Loki, Jaeger)
	$(DOCKER_COMPOSE) $(OBS) up -d
	@echo "✅ Observability stack up."

up-all: up up-obs ## Start everything (infra + observability)
	@echo "🚀 All infrastructure running."

down: ## Stop all containers
	$(DOCKER_COMPOSE) $(INFRA) $(OBS) $(SERVICES) down

down-all: ## Stop and remove all containers + volumes (DESTRUCTIVE)
	$(DOCKER_COMPOSE) $(INFRA) $(OBS) $(SERVICES) down -v --remove-orphans
	@echo "⚠️  All data volumes removed."

ps: ## Show running containers
	$(DOCKER_COMPOSE) $(INFRA) ps

logs: ## Follow all logs
	$(DOCKER_COMPOSE) $(INFRA) logs -f

logs-%: ## Follow logs for a specific service (e.g. make logs-kafka)
	$(DOCKER_COMPOSE) $(INFRA) logs -f $*

pull: ## Pull latest images
	$(DOCKER_COMPOSE) $(INFRA) pull

## ── Initialization ───────────────────────────────────────────────────────────
db-init: ## Run all DB init scripts (schemas, indexes)
	@echo "🗄️  Initializing databases..."
	@bash infra/db/wait-for-dbs.sh
	@docker exec polymarket-postgres psql -v ON_ERROR_STOP=1 -U polymarket -f /docker-entrypoint-initdb.d/init.sql
	@docker exec polymarket-mongo mongosh polymarket /docker-entrypoint-initdb.d/init.js
	@echo "✅ Databases initialized."

kafka-init: ## Create all Kafka topics
	@echo "📨 Creating Kafka topics..."
	@bash infra/kafka/topics.sh
	@echo "✅ Kafka topics created."

minio-init: ## Create MinIO buckets
	@echo "🪣  Creating MinIO buckets..."
	@bash infra/minio/init.sh
	@echo "✅ MinIO buckets created."

init: db-init kafka-init minio-init ## Run all initialization steps

seed: ## Insert demo/test data
	@echo "🌱 Seeding data..."
	@bash scripts/seed.sh
	@echo "✅ Data seeded."

## ── Build ────────────────────────────────────────────────────────────────────
build: ## Build all service Docker images
	@echo "🔨 Building all images..."
	$(DOCKER_COMPOSE) $(STACK) build --parallel
	@echo "✅ All images built."

build-%: ## Build a specific service image (e.g. make build-listing-service)
	$(DOCKER_COMPOSE) $(STACK) build $*

perf-lib: ## Build Zig perf-lib (native .so + WASM)
	@echo "⚡ Building perf-lib..."
	@cd libs/perf-lib && zig build
	@cd libs/perf-lib && zig build -Dtarget=wasm32-freestanding -Doptimize=ReleaseSmall
	@cp libs/perf-lib/zig-out/lib/perf.wasm frontend/apps/web/public/
	@echo "✅ perf-lib built. WASM copied to frontend/public/."

## ── Development ──────────────────────────────────────────────────────────────
dev: ## Start services in dev mode (with hot reload where supported)
	$(DOCKER_COMPOSE) $(STACK) up

dev-%: ## Start a specific service (e.g. make dev-auth-service)
	$(DOCKER_COMPOSE) $(STACK) up $*

frontend: ## Start Next.js frontend dev server
	cd frontend/apps/web && npm run dev

## ── Testing ──────────────────────────────────────────────────────────────────
test: ## Run unit tests for all services
	@echo "🧪 Running unit tests..."
	@bash scripts/test-all.sh
	@echo "✅ Tests complete."

test-%: ## Run tests for a specific service (e.g. make test-auth-service)
	@bash scripts/test-service.sh $*

test-e2e: ## Run end-to-end tests (requires all services running)
	@echo "🔗 Running E2E tests..."
	@bash scripts/test-e2e.sh
	@echo "✅ E2E tests done."

## ── Linting ──────────────────────────────────────────────────────────────────
lint: ## Run linters for all services
	@echo "🔍 Linting all services..."
	@bash scripts/lint-all.sh
	@echo "✅ Linting done."

lint-%: ## Lint a specific service
	@bash scripts/lint-service.sh $*

## ── Utilities ────────────────────────────────────────────────────────────────
clean: ## Remove all build artifacts
	@find services -name "target" -type d -exec rm -rf {} + 2>/dev/null || true
	@find services -name "_build" -type d -exec rm -rf {} + 2>/dev/null || true
	@find services -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
	@find services -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
	@find libs -name "zig-out" -type d -exec rm -rf {} + 2>/dev/null || true
	@find libs -name "zig-cache" -type d -exec rm -rf {} + 2>/dev/null || true
	@echo "🧹 Cleaned."

status: ## Show health of all running services
	@echo "── Infrastructure ──────────────────────────────────────"
	@$(DOCKER_COMPOSE) $(INFRA) ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

## ── Quick Start ──────────────────────────────────────────────────────────────
quickstart: up-all init seed ## Full environment setup (up + init + seed)
	@echo ""
	@echo "🎉 PolyMarket is ready!"
	@echo ""
	@echo "  Public HTTP:   http://localhost"
	@echo "  Public HTTPS:  https://localhost"
	@echo "  Edge health:   http://localhost/health"
	@echo "  API health:    http://localhost/api/health"
	@echo ""
	@echo "  Internal services, databases, and observability UIs are not published"
	@echo "  on host ports in the canonical Compose stack."
	@echo ""
