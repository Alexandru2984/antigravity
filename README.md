# PolyMarket

> **Architecture B — Max Polyglot** | 18 microservices | 16 languages | 9 databases

A full-featured marketplace platform (OLX-like) with realtime notifications, event streaming, payments, analytics, ML recommendations, and an admin panel — built as a polyglot microservices suite.

---

## 🗺️ Architecture Overview

```
Browser (Next.js + Svelte + WASM)
         │
         ▼
  API Gateway (NestJS) ──────────────────────────────────────────────
         │                                                            │
    ┌────┴──────────────────────────────────────────────────┐        │
    │                   APPLICATION SERVICES                │        │
    ├──────────────────────────────────────────────────────┤        │
    │ auth-service       Elixir / Phoenix (JWT)             │        │
    │ listing-service    Rust / Axum (MongoDB)              │        │
    │ search-service     Java / Spring Boot (OpenSearch)    │        │
    │ image-service      C++ / Drogon (MinIO)               │        │
    │ notification-svc   Elixir / Phoenix Channels WS       │        │
    │ payment-service    C# / ASP.NET Core (Stripe)         │        │
    │ profile-service    Kotlin / Ktor (PostgreSQL)         │        │
    │ feed-service       Go / chi (SurrealDB)               │        │
    │ review-service     PHP / Laravel (MySQL)              │        │
    │ analytics-service  Python / FastAPI (ClickHouse)      │        │
    │ chat-service       Elixir / Phoenix (PostgreSQL)      │        │
    │ ml-service         Python / FastAPI (Neo4j)           │        │
    │ stream-processor   Scala / Akka (TimescaleDB)         │        │
    │ config-service     F# / Giraffe (PostgreSQL)          │        │
    │ contract-validator Haskell / Servant (stateless)      │        │
    │ admin-panel        Ruby / Rails (PostgreSQL)          │        │
    └──────────────────────────────────────────────────────┘        │
                                                                      │
              ★ KAFKA EVENT SPINE ★ ◄────────────────────────────────┘
              (listings · payments · users · analytics · notifs)

  SHARED PERF LIB: Zig + C + ASM → .so (FFI) + .wasm (browser)
```

---

## ⚡ Quick Start (5 Minutes)

### Prerequisites
```bash
docker --version        # >= 24.x
docker compose version  # >= 2.x
make --version
```

### 1. Clone & Setup
```bash
git clone https://github.com/youruser/polymarket
cd polymarket
cp .env.example .env
# Edit .env — add Stripe keys at minimum
```

### 2. Generate JWT Keys (one-time)
```bash
mkdir -p infra/secrets
openssl genrsa -out infra/secrets/jwt_private.pem 4096
openssl rsa -in infra/secrets/jwt_private.pem -pubout -out infra/secrets/jwt_public.pem
```

### 3. Start Everything
```bash
make quickstart    # = make up-all + make init + make seed
```

This will:
1. Start all 9 databases + Kafka + MinIO + observability stack
2. Initialize DB schemas, Kafka topics, MinIO buckets
3. Seed demo data (users, listings, categories)

### 4. Start Services
```bash
make dev           # starts all 18 application containers
```

### 5. Start Frontend
```bash
cd frontend/apps/web && npm install && npm run dev
```

---

## 🌐 Service Endpoints (Local Dev)

| Service | URL | Notes |
|---|---|---|
| **Frontend** | http://localhost:3000 | Next.js |
| **API Gateway** | http://localhost:4000 | Main entry point |
| **Auth** | http://localhost:4001 | — |
| **Listings** | http://localhost:4002 | — |
| **Search** | http://localhost:4003 | — |
| **Images** | http://localhost:4004 | Upload endpoint |
| **Notifications** | http://localhost:4005 | WebSocket |
| **Payments** | http://localhost:4006 | Stripe sandbox |
| **Profile** | http://localhost:4007 | — |
| **Feed** | http://localhost:4008 | — |
| **Reviews** | http://localhost:4009 | — |
| **Analytics** | http://localhost:4010 | — |
| **Chat** | http://localhost:4011 | WebSocket |
| **ML** | http://localhost:4012 | Recommendations |
| **Kafka UI** | http://localhost:8080 | Topic browser |
| **Grafana** | http://localhost:3001 | admin / polymarket |
| **Jaeger** | http://localhost:16686 | Distributed tracing |
| **MinIO** | http://localhost:9001 | minio / miniominio |
| **OpenSearch** | http://localhost:5601 | Dashboards |

---

## 🗄️ Database Map

| Database | Port | Used by | Why |
|---|---|---|---|
| **PostgreSQL** | 5432 | auth, payment, profile, chat, config, admin | ACID for financial/user data |
| **MongoDB** | 27017 | listing-service | Flexible schema per listing category |
| **MySQL** | 3306 | review-service | Tabular reviews + Laravel native |
| **Redis** | 6379 | gateway, auth, notification, feed | Cache, sessions, pub/sub |
| **ClickHouse** | 8123 | analytics, stream-processor | OLAP, high-speed event ingestion |
| **OpenSearch** | 9200 | search-service | Full-text + geo + faceted search |
| **TimescaleDB** | 5433 | stream-processor | Time-series KPIs, Kafka lag |
| **Neo4j** | 7687 | ml-service | Recommendation graph |
| **SurrealDB** | 8000 | feed-service | Social graph (follows, favorites) |

---

## 🧪 Testing

```bash
make test          # unit tests all services
make test-e2e      # end-to-end Playwright tests
make lint          # lint all services
```

---

## 📦 Repo Structure

```
polymarket/
├── .github/workflows/     # CI/CD (14 language-specific + security scan)
├── services/              # 18 microservices
│   ├── api-gateway/       # Node.js / NestJS
│   ├── auth-service/      # Elixir / Phoenix
│   ├── listing-service/   # Rust / Axum
│   ├── search-service/    # Java / Spring Boot
│   ├── image-service/     # C++ / Drogon
│   ├── notification-service/ # Elixir / Phoenix Channels
│   ├── payment-service/   # C# / ASP.NET Core
│   ├── profile-service/   # Kotlin / Ktor
│   ├── feed-service/      # Go / chi
│   ├── review-service/    # PHP / Laravel
│   ├── analytics-service/ # Python / FastAPI
│   ├── ml-service/        # Python / FastAPI
│   ├── stream-processor/  # Scala / Akka Streams
│   ├── config-service/    # F# / Giraffe
│   ├── contract-validator/ # Haskell / Servant
│   ├── admin-panel/       # Ruby / Rails
│   └── chat-service/      # Elixir / Phoenix
├── libs/
│   └── perf-lib/          # Zig + C + ASM → .so + .wasm
├── frontend/
│   └── apps/web/          # Next.js + TypeScript + Svelte
├── infra/
│   ├── docker-compose.yml         # All 9 DBs + Kafka + MinIO
│   ├── docker-compose.obs.yml     # Prometheus + Grafana + Loki + Jaeger
│   ├── docker-compose.services.yml # All 18 app services
│   ├── db/                        # Init SQL for all databases
│   ├── kafka/                     # Topics script
│   ├── minio/                     # Buckets script
│   ├── prometheus/                # Prometheus config
│   ├── otel/                      # OTEL Collector config
│   ├── loki/                      # Loki config
│   └── promtail/                  # Promtail config
├── contracts/
│   ├── openapi/                   # OpenAPI 3.1 specs per service
│   └── proto/                     # Protobuf definitions
├── docs/
│   ├── architecture.md
│   └── adr/                       # Architecture Decision Records
├── .env.example                   # All env vars
└── Makefile                       # Dev commands
```

---

## 🔐 Security

- JWT RS256 (asymmetric) — private key only in auth-service
- Refresh token rotation (one-time use, stored in Redis)
- All secrets via env vars — NEVER committed to git
- Trivy + Semgrep + Gitleaks in CI on every PR
- Internal service communication on private Docker network (not exposed)
- HTTPS via Nginx + Let's Encrypt on production VPS

---

## 🚀 Production Deploy (VPS / Docker Swarm)

See [`docs/runbooks/deploy.md`](docs/runbooks/deploy.md)

VPS requirements: **48GB RAM**, Docker with Swarm mode enabled.

---

## 📊 Phase Plan

| Phase | Focus | Status |
|---|---|---|
| **Phase 0** | Infrastructure skeleton ← YOU ARE HERE | 🔄 In Progress |
| **Phase 1** | MVP: auth + listings + search + images + notifications + payments + frontend | ⏳ |
| **Phase 2** | Feed (Go) + Reviews (PHP) + Analytics (Python) + Chat (Elixir) | ⏳ |
| **Phase 3** | ML (Python+Neo4j) + Stream Processor (Scala) + Config (F#) + Validator (Haskell) | ⏳ |
| **Phase 4** | Admin panel (Ruby) + Production hardening + Load testing | ⏳ |

---

## 📚 Documentation

- [`docs/architecture.md`](docs/architecture.md) — Full design rationale
- [`blueprint.md`](../brain/) — Complete architecture blueprint
- [`contracts/openapi/`](contracts/openapi/) — API specifications
- [`contracts/proto/`](contracts/proto/) — gRPC definitions
