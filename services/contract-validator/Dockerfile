# ── Build stage ──────────────────────────────────────────────
FROM haskell:9.6 AS builder
WORKDIR /app

# Cache dependencies
COPY package.yaml stack.yaml* ./
RUN stack setup && stack build --only-dependencies

COPY app/ ./app/
COPY src/  ./src/
RUN stack build --copy-bins --local-bin-path /usr/local/bin

# ── Runtime stage ─────────────────────────────────────────────
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y libgmp10 && rm -rf /var/lib/apt/lists/*
RUN useradd -r -s /bin/false app

COPY --from=builder /usr/local/bin/contract-validator /usr/local/bin/contract-validator

USER app
EXPOSE 4035

HEALTHCHECK --interval=30s --timeout=5s \
    CMD wget -qO- http://localhost:4035/health || exit 1

ENTRYPOINT ["contract-validator"]
