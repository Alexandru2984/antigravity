# PolyMarket

> **Architecture B — Max Polyglot** | 17 microservices + frontend | 16 languages | 9 databases

A full-featured marketplace platform (OLX-like) with realtime notifications, event streaming, payments, analytics, ML recommendations, and an admin panel — built as a polyglot microservices suite.

---

## 🗺️ Architecture Overview

```
                          ┌──────────────────────────┐
                          │    Nginx Reverse Proxy    │
                          │   :80 / :443 (SSL/TLS)   │
                          └────────────┬─────────────┘
                                       │
                  ┌────────────────────┼────────────────────┐
                  ▼                    ▼                    ▼
        Frontend (Next.js)    API Gateway (NestJS)   Admin Panel (Rails)
           :3000                  :4001                 :4016
                                   │
     ┌─────────────────────────────┼──────────────────────────────┐
     │                   APPLICATION SERVICES                     │
     ├────────────────────────────────────────────────────────────┤
     │ auth-service        Elixir / Phoenix      :4000  (JWT)     │
     │ listing-service     Rust / Axum           :4002  (MongoDB) │
     │ search-service      Java / Spring Boot    :4003  (OpenSrch)│
     │ image-service       C++ / Drogon          :4004  (MinIO)   │
     │ profile-service     Kotlin / Ktor         :4005  (Postgres)│
     │ payment-service     C# / ASP.NET Core     :4006  (Stripe)  │
     │ notification-svc    Elixir / Phoenix Ch.   :4007  (WS)     │
     │ feed-service        Go / chi              :4008  (Redis)   │
     │ review-service      PHP / Laravel         :4009  (Postgres)│
     │ analytics-service   Python / FastAPI      :4010  (ClickH.) │
     │ chat-service        Elixir / Phoenix      :4011  (WS)      │
     │ ml-service          Python / FastAPI      :4012  (Neo4j)   │
     │ stream-processor    Scala / Akka Streams  :4013  (ClickH.) │
     │ config-service      F# / Giraffe          :4014  (Postgres)│
     │ contract-validator  Haskell / Servant     :4015  (stateless)│
     │ admin-panel         Ruby / Rails          :4016  (Postgres)│
     └────────────────────────────────────────────────────────────┘
                                   │
              ★ KAFKA EVENT SPINE ★
              (listings · payments · users · analytics · notifs)

   SHARED PERF LIB: Zig + C → .so (FFI) + .wasm (browser)
```

---

## 🌐 Languages & Frameworks

| # | Language | Service | Framework |
|---|----------|---------|-----------|
| 1 | **TypeScript** | api-gateway | NestJS |
| 2 | **TypeScript** | frontend | Next.js |
| 3 | **Elixir** | auth-service | Phoenix |
| 4 | **Elixir** | notification-service | Phoenix Channels |
| 5 | **Elixir** | chat-service | Phoenix |
| 6 | **Rust** | listing-service | Axum |
| 7 | **Java** | search-service | Spring Boot |
| 8 | **C++** | image-service | Drogon + CMake |
| 9 | **C#** | payment-service | ASP.NET Core |
| 10 | **Kotlin** | profile-service | Ktor |
| 11 | **Go** | feed-service | chi |
| 12 | **PHP** | review-service | Laravel |
| 13 | **Python** | analytics-service | FastAPI |
| 14 | **Python** | ml-service | FastAPI |
| 15 | **Scala** | stream-processor | Akka Streams |
| 16 | **F#** | config-service | Giraffe |
| 17 | **Haskell** | contract-validator | Servant |
| 18 | **Ruby** | admin-panel | Rails |
| 19 | **Zig** | perf-lib (shared) | — |
| 20 | **C** | perf-lib (shared) | — |

---

## ⚡ Quick Start

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
# Edit .env — every required secret must be unique and production-safe
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
1. Start all 9 databases + Kafka + Zookeeper + MinIO
2. Start observability stack (Prometheus, Grafana, Loki, Jaeger, OTEL Collector)
3. Initialize DB schemas, Kafka topics, MinIO buckets
4. Seed demo data (users, listings, categories)

### 4. Start Services
```bash
make dev           # starts all 17 application containers + frontend
```

Deployment and local orchestration use the split Compose files under `infra/`.
Do not use a root-level monolithic `docker-compose.yml`; it is intentionally
not part of the project entrypoints.

For direct Compose usage, use the combined infra + services stack:
```bash
docker compose -f infra/docker-compose.yml -f infra/docker-compose.services.yml up -d
```

### 5. Or Start Frontend Separately
```bash
cd frontend && npm install && npm run dev
```

---

## 🌍 Service Endpoints (Local Dev)

The canonical Compose stack publishes only Nginx on the host. Application and
database ports are internal Docker-network ports and should be reached through
the API gateway or with `docker compose exec`/one-off debugging commands.

| Surface | URL | Notes |
|---|---|---|
| **Public HTTP** | http://localhost | Redirects to HTTPS except health |
| **Public HTTPS** | https://localhost | Main Nginx entry point |
| **Nginx Health** | http://localhost/health | Edge health check |
| **API Health** | http://localhost/api/health | Gateway health through Nginx |

### Infrastructure UIs

Infrastructure UIs are not published by the canonical application stack. Expose
them intentionally for local debugging only, or access them through a private
tunnel/VPN on production hosts.

---

## 🗄️ Database Map

| Database | Port | Used by | Why |
|---|---|---|---|
| **PostgreSQL** | 5432 | auth, payment, profile, chat, config, admin, review | ACID for financial/user data |
| **MongoDB** | 27017 | listing-service | Flexible schema per listing category |
| **Redis** | 6379 | gateway, auth, notification, feed | Cache, sessions, pub/sub |
| **ClickHouse** | 8123 / 9000 | analytics, stream-processor | OLAP, high-speed event ingestion |
| **OpenSearch** | 9200 | search-service | Full-text + geo + faceted search |
| **Neo4j** | 7687 | ml-service | Recommendation graph |
| **Kafka** | 9092 | Event spine (all producers/consumers) | Async event streaming |
| **Zookeeper** | 2181 | Kafka | Kafka coordination |
| **MinIO** | 9000 | image-service | S3-compatible object storage |

---

## 📦 Repo Structure

```
polymarket/
├── .github/workflows/          # CI/CD (15 language-specific + security scan)
│   ├── ci-auth.yml
│   ├── ci-feed.yml
│   ├── ci-frontend.yml
│   ├── ci-fsharp-haskell.yml
│   ├── ci-gateway.yml
│   ├── ci-image.yml
│   ├── ci-listing.yml
│   ├── ci-payment.yml
│   ├── ci-perf-lib.yml
│   ├── ci-profile.yml
│   ├── ci-python.yml            # analytics + ml
│   ├── ci-review.yml
│   ├── ci-ruby.yml
│   ├── ci-scala.yml
│   ├── ci-search.yml
│   └── security-scan.yml        # Trivy + Semgrep + Gitleaks
├── services/                    # 17 microservices
│   ├── api-gateway/             # TypeScript / NestJS
│   ├── auth-service/            # Elixir / Phoenix
│   ├── listing-service/         # Rust / Axum
│   ├── search-service/          # Java / Spring Boot
│   ├── image-service/           # C++ / Drogon (CMake)
│   ├── notification-service/    # Elixir / Phoenix Channels
│   ├── payment-service/         # C# / ASP.NET Core
│   ├── profile-service/         # Kotlin / Ktor (Gradle)
│   ├── feed-service/            # Go / chi
│   ├── review-service/          # PHP / Laravel
│   ├── analytics-service/       # Python / FastAPI
│   ├── ml-service/              # Python / FastAPI
│   ├── stream-processor/        # Scala / Akka Streams (SBT)
│   ├── config-service/          # F# / Giraffe
│   ├── contract-validator/      # Haskell / Servant
│   ├── admin-panel/             # Ruby / Rails
│   └── chat-service/            # Elixir / Phoenix
├── frontend/                    # Next.js + TypeScript
│   ├── src/
│   │   ├── app/                 # Pages (layout, home, search)
│   │   ├── lib/                 # API client, utils
│   │   └── store/               # State management (auth)
│   ├── packages/                # Shared frontend packages
│   ├── apps/                    # Multi-app workspace
│   ├── Dockerfile
│   └── package.json
├── libs/
│   └── perf-lib/                # Zig + C → .so (native) + .wasm (browser)
│       ├── build.zig
│       └── src/
│           ├── main.zig
│           ├── compress.c
│           └── wasm_exports.zig
├── infra/
│   ├── docker-compose.yml       # All DBs + Kafka + MinIO (infrastructure)
│   ├── docker-compose.obs.yml   # Prometheus + Grafana + Loki + Jaeger + OTEL
│   ├── docker-compose.services.yml  # App services + public edge + mesh workers
│   ├── nginx/
│   │   └── nginx.conf           # Reverse proxy + SSL + rate limiting
│   ├── db/
│   │   ├── postgres/init.sql
│   │   ├── mongo/init.js
│   │   ├── mysql/init.sql
│   │   ├── clickhouse/init.sql
│   │   ├── clickhouse-init.sql
│   │   ├── timescale/init.sql
│   │   ├── migrations/
│   │   └── wait-for-dbs.sh
│   ├── kafka/topics.sh
│   ├── minio/init.sh
│   ├── prometheus/prometheus.yml
│   ├── otel/otel-collector-config.yml
│   ├── loki/local-config.yaml
│   └── promtail/promtail-config.yml
├── contracts/
│   ├── openapi/                 # OpenAPI 3.1 specs
│   │   ├── auth-service.yml
│   │   └── listing-service.yml
│   └── proto/                   # Protobuf definitions
│       └── listing.proto
├── scripts/
│   ├── deploy.sh                # Production deployment
│   ├── health-check.sh          # Service health verification
│   └── seed.sh                  # Demo data seeding
├── docs/
│   ├── adr/                     # Architecture Decision Records
│   └── runbooks/                # Operational runbooks
├── .env.example                 # All env vars template
├── Makefile                     # Dev commands (make help)
└── .gitignore
```

---

## 🧪 Testing

```bash
make test          # unit tests — all services
make test-e2e      # end-to-end Playwright tests
make lint          # lint all services
make test-auth-service   # test a specific service
make lint-listing-service  # lint a specific service
```

---

## 🔧 Makefile Commands

```bash
make help          # show all available commands
make quickstart    # full setup: up + init + seed
make up            # start infrastructure (DBs, Kafka, MinIO)
make up-obs        # start observability stack
make up-all        # start everything (infra + observability)
make dev           # start all app services
make dev-auth-service  # start a single service
make build         # build all Docker images
make perf-lib      # build Zig perf-lib (.so + .wasm)
make frontend      # start Next.js dev server
make status        # show health of running services
make clean         # remove all build artifacts
make down          # stop all containers
make down-all      # stop + remove volumes (DESTRUCTIVE)
```

---

## 🔐 Security

- **JWT RS256** (asymmetric) — private key only in auth-service
- **Refresh token rotation** (one-time use, stored in Redis)
- **All secrets via env vars** — NEVER committed to git
- **CI security scanning**: Trivy + Semgrep + Gitleaks on every PR
- **Internal service communication** on private Docker network (not exposed)
- **Nginx reverse proxy** with SSL/TLS, rate limiting, security headers
- **Admin panel** restricted to private network IPs only
- **CORS** configured via `FRONTEND_URL` env var

---

## 🚀 Production Deploy

```bash
bash scripts/deploy.sh
```

VPS requirements: **48 GB RAM**, Docker with Compose V2+.

Features:
- Automatic JWT key generation if not present
- Health check verification after deployment
- SSL/TLS via Nginx (`infra/nginx/ssl/`)

---

## 📊 Phase Plan

| Phase | Focus | Status |
|---|---|---|
| **Phase 0** | Infrastructure skeleton (DBs, Kafka, Docker, CI, Nginx) | ✅ Done |
| **Phase 1** | MVP: auth + listings + search + images + gateway + payments + frontend | 🔄 In Progress |
| **Phase 2** | Feed (Go) + Reviews (PHP) + Analytics (Python) + Chat (Elixir) | ⏳ |
| **Phase 3** | ML (Python+Neo4j) + Stream Processor (Scala) + Config (F#) + Validator (Haskell) | ⏳ |
| **Phase 4** | Admin panel (Ruby) + Production hardening + Load testing | ⏳ |

---

## 📚 Documentation

- [`contracts/openapi/`](contracts/openapi/) — OpenAPI 3.1 specifications (auth, listing)
- [`contracts/proto/`](contracts/proto/) — Protobuf definitions (listing)
- [`docs/adr/`](docs/adr/) — Architecture Decision Records
- [`docs/runbooks/`](docs/runbooks/) — Operational runbooks

---

## 📄 License

This project is for educational purposes — demonstrating polyglot microservice architecture.
