# Kafka contracts — Apicurio Schema Registry

Central contract for the event spine. Every Kafka topic has an Avro **value**
schema registered as artifact `<topic>-value`, with a global **BACKWARD**
compatibility rule so incompatible changes are rejected.

## Layout
- `avro/*.avsc` — versioned source-of-truth schemas:
  - `listing-event.avsc` → `polymarket.listings.{created,updated,deleted,sold,expired}`
  - `payment-event.avsc` → `payments.{initiated,processed,failed,refunded}`
  - `user-event.avsc` → `users.{registered,updated,deleted,logged_in}`
  - `review-event.avsc` → `reviews.{created,updated}`
- `register.sh` — idempotent registration (POSIX sh; honors `REGISTRY_URL`).

## Run locally
```bash
docker compose -f infra/docker-compose.yml \
  -f infra/docker-compose.schema-registry.yml up -d schema-registry
docker run --rm --network polymarket -v "$PWD/deploy/schema-registry:/s" \
  --entrypoint sh curlimages/curl:8.7.1 /s/register.sh
```

## CI gate
`.github/workflows/ci-contracts.yml` validates OpenAPI (`contracts/openapi`),
Avro (`avro/`), Protobuf (`contracts/proto`), and registers all schemas against a
throwaway Apicurio under the BACKWARD rule on every PR touching contracts.

## Sync vs other contracts
- Sync HTTP APIs: `contracts/openapi/*.yml` (OpenAPI 3.1).
- gRPC/binary: `contracts/proto/*.proto`.

## Roadmap
Per-language producer serdes (Confluent-compatible, subject `<topic>-value`) so
payloads are validated at publish time — rolled out incrementally starting with
the mainstream services (Go/Java/C#/Rust/Elixir). The esoteric mesh nodes keep
free-form JSON and do not publish to contract-governed topics.
