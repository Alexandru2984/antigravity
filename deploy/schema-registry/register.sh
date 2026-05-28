#!/usr/bin/env sh
# Register/Update the Avro schemas for every Kafka topic as artifact "<topic>-value"
# in Apicurio. Idempotent (ifExists=RETURN_OR_UPDATE); the global BACKWARD rule
# rejects incompatible evolutions. POSIX sh so it runs in a minimal curl image.
#
#   docker run --rm --network polymarket -v "$PWD/deploy/schema-registry:/s" \
#     --entrypoint sh curlimages/curl:8.7.1 /s/register.sh
set -eu
REGISTRY_URL="${REGISTRY_URL:-http://schema-registry:8080}"
DIR="$(dirname "$0")/avro"
API="$REGISTRY_URL/apis/registry/v2/groups/default/artifacts"

register() {  # $1=topic  $2=avsc file
  topic="$1"; file="$2"
  code=$(curl -s -o /dev/null -w '%{http_code}' \
    -X POST "$API?ifExists=RETURN_OR_UPDATE" \
    -H "Content-Type: application/json; artifactType=AVRO" \
    -H "X-Registry-ArtifactId: ${topic}-value" \
    -H "X-Registry-ArtifactType: AVRO" \
    --data-binary "@${DIR}/${file}")
  echo "  ${topic}-value -> HTTP ${code}"
}

echo "Registering schemas at ${REGISTRY_URL} ..."
for t in created updated deleted sold expired; do register "polymarket.listings.${t}" listing-event.avsc; done
for t in initiated processed failed refunded;   do register "payments.${t}"           payment-event.avsc; done
for t in registered updated deleted logged_in;  do register "users.${t}"              user-event.avsc;    done
for t in created updated;                        do register "reviews.${t}"            review-event.avsc;  done
echo "Done."
