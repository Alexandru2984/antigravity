#!/usr/bin/env bash
# Import locally-built infra-* Docker images into the K3s containerd image store
# (K3s uses containerd, not dockerd). Pass service names, or none for all infra-*.
#   sudo deploy/k8s/import-images.sh contract-validator zig-service
set -euo pipefail
if [ "$#" -gt 0 ]; then
  imgs=()
  for s in "$@"; do imgs+=("infra-${s}:latest"); done
else
  mapfile -t imgs < <(docker images --format '{{.Repository}}:{{.Tag}}' | grep -E '^infra-.*:latest$')
fi
for img in "${imgs[@]}"; do
  echo ">> importing $img"
  docker save "$img" | k3s ctr images import - >/dev/null
done
echo "✅ imported ${#imgs[@]} image(s) into K3s containerd"
k3s ctr images ls -q | grep -c '^docker.io/library/infra-' | xargs echo "infra-* images in containerd:"
