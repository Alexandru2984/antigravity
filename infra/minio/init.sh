#!/usr/bin/env bash
# ============================================================
# PolyMarket — MinIO Buckets Setup
# Run: bash infra/minio/init.sh
# ============================================================
set -e

MINIO_ALIAS="polymarket"
MINIO_URL="${MINIO_URL:-http://localhost:9001}"
MINIO_USER="${MINIO_ROOT_USER:-minio}"
MINIO_PASS="${MINIO_ROOT_PASSWORD:-miniominio}"

echo "🪣  Setting up MinIO buckets..."

# Configure mc alias inside the minio container
docker exec polymarket-minio sh -c "
  mc alias set $MINIO_ALIAS http://minio:9000 $MINIO_USER $MINIO_PASS

  # Listing images: public read, private write
  mc mb --ignore-existing $MINIO_ALIAS/listings-images
  mc anonymous set download $MINIO_ALIAS/listings-images

  # User avatars: public read
  mc mb --ignore-existing $MINIO_ALIAS/avatars
  mc anonymous set download $MINIO_ALIAS/avatars

  # Private documents (for future: receipts, contracts)
  mc mb --ignore-existing $MINIO_ALIAS/private-docs

  # Analytics exports (CSV, Parquet)
  mc mb --ignore-existing $MINIO_ALIAS/analytics-exports

  # WASM + static assets (served via CDN)
  mc mb --ignore-existing $MINIO_ALIAS/static-assets
  mc anonymous set download $MINIO_ALIAS/static-assets

  echo 'Buckets created:'
  mc ls $MINIO_ALIAS
"
echo "✅ MinIO buckets ready."
