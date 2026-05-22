#!/usr/bin/env bash
# ============================================================
# PolyMarket — MinIO Buckets Setup
# Run: bash infra/minio/init.sh
# ============================================================
set -e

if [[ -f .env ]]; then
  set -a; source .env; set +a
fi

: "${MINIO_ROOT_USER:?MINIO_ROOT_USER is required}"
: "${MINIO_ROOT_PASSWORD:?MINIO_ROOT_PASSWORD is required}"

MINIO_ALIAS="polymarket"

echo "🪣  Setting up MinIO buckets..."

# Configure mc alias inside the minio container
docker exec \
  -e MINIO_ALIAS="$MINIO_ALIAS" \
  -e MINIO_ROOT_USER="$MINIO_ROOT_USER" \
  -e MINIO_ROOT_PASSWORD="$MINIO_ROOT_PASSWORD" \
  polymarket-minio sh -c '
  mc alias set "$MINIO_ALIAS" http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"

  # Listing images: public read, private write
  mc mb --ignore-existing "$MINIO_ALIAS/listings-images"
  mc anonymous set download "$MINIO_ALIAS/listings-images"

  # User avatars: public read
  mc mb --ignore-existing "$MINIO_ALIAS/avatars"
  mc anonymous set download "$MINIO_ALIAS/avatars"

  # Private documents (for future: receipts, contracts)
  mc mb --ignore-existing "$MINIO_ALIAS/private-docs"

  # Analytics exports (CSV, Parquet)
  mc mb --ignore-existing "$MINIO_ALIAS/analytics-exports"

  # WASM + static assets (served via CDN)
  mc mb --ignore-existing "$MINIO_ALIAS/static-assets"
  mc anonymous set download "$MINIO_ALIAS/static-assets"

  echo 'Buckets created:'
  mc ls "$MINIO_ALIAS"
'
echo "✅ MinIO buckets ready."
