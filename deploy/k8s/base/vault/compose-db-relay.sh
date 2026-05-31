#!/usr/bin/env bash
# Hybrid-phase relay: let K3s pods reach the Postgres that still lives on Docker
# Compose. Cilium routes pod egress to the node fine, and the node can reach the
# Compose container directly — but pods cannot reach the Docker bridge IP
# (172.27.0.x) because Cilium treats that directly-connected subnet as local and
# does not masquerade, so Postgres's replies to the pod IP have no return route.
#
# Fix without restarting the live Postgres: expose it at <NODE_IP>:15432 and
# DNAT/relay that to the container, with SNAT so replies come back via the host.
# This is removed in Faza 5 when Postgres moves into the cluster as a StatefulSet.
#
# Idempotent: safe to re-run (e.g. on boot, or after the container IP changes).
set -euo pipefail

NODE_IP="${NODE_IP:-57.129.112.224}"
RELAY_PORT="${RELAY_PORT:-15432}"
PG_PORT="${PG_PORT:-5432}"
# Resolve the Compose Postgres container IP fresh each run (it can change on recreate).
PG_IP="$(docker inspect polymarket-postgres \
  --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')"
echo "relaying ${NODE_IP}:${RELAY_PORT} -> ${PG_IP}:${PG_PORT}"

# Drop any prior copies of our rules (matched by comment) so re-runs don't stack
# and stale container-IP rules get cleared. Delete by line number — rule specs
# can't be round-tripped through the shell (the "->" in comments breaks parsing).
flush() { # table chain comment-substring
  local n
  while n=$(iptables -t "$1" -L "$2" --line-numbers -n 2>/dev/null \
              | awk -v p="$3" 'index($0,p){print $1; exit}'); [ -n "$n" ]; do
    iptables -t "$1" -D "$2" "$n"
  done
}
flush nat PREROUTING  'compose postgres relay'
flush nat POSTROUTING 'compose postgres SNAT'
flush filter DOCKER-USER 'compose postgres'

iptables -t nat -I PREROUTING -p tcp -d "$NODE_IP" --dport "$RELAY_PORT" \
  -j DNAT --to-destination "${PG_IP}:${PG_PORT}" \
  -m comment --comment "k8s -> compose postgres relay (Vault)"
iptables -t nat -I POSTROUTING -s 10.42.0.0/16 -d "${PG_IP}/32" -p tcp --dport "$PG_PORT" \
  -j MASQUERADE -m comment --comment "k8s pods -> compose postgres SNAT (Vault)"
iptables -I DOCKER-USER -p tcp -d "${PG_IP}/32" --dport "$PG_PORT" \
  -j ACCEPT -m comment --comment "k8s cluster -> compose postgres (Vault dyn creds)"
echo "done"
