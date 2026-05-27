#!/usr/bin/env bash
# Regenerate .env from the SOPS-encrypted source of truth.
# Requires the age private key at ~/.config/sops/age/keys.txt (SOPS_AGE_KEY_FILE).
set -euo pipefail
cd "$(dirname "$0")/.."
export SOPS_AGE_KEY_FILE="${SOPS_AGE_KEY_FILE:-$HOME/.config/sops/age/keys.txt}"
sops -d --input-type dotenv --output-type dotenv deploy/secrets/secrets.env > .env
echo "✅ .env regenerated from deploy/secrets/secrets.env ($(grep -c '=' .env) keys)"
