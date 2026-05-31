# K3s cluster setup (reproducible)

Host-level steps performed to stand up the cluster the umbrella chart deploys
onto. These are host/cluster state (not applied by Helm), captured here so the
setup is reproducible.

## 1. Host prerequisites
```bash
# inotify limits — K3s/containerd fails to start with the distro default (128)
sudo tee /etc/sysctl.d/99-k3s-inotify.conf <<'EOF'
fs.inotify.max_user_instances = 8192
fs.inotify.max_user_watches = 1048576
EOF
sudo sysctl -p /etc/sysctl.d/99-k3s-inotify.conf

# ufw must allow the k8s pod + service CIDRs, otherwise pods cannot reach the
# API server ClusterIP (10.43.0.1) and CoreDNS never syncs → cluster DNS dead.
sudo ufw allow from 10.42.0.0/16 comment 'k8s pod CIDR'
sudo ufw allow from 10.43.0.0/16 comment 'k8s service CIDR'
sudo ufw route allow from 10.42.0.0/16
```

## 2. K3s (no built-in CNI / kube-proxy — Cilium replaces them)
```bash
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--flannel-backend=none \
  --disable-network-policy --disable=traefik --disable=servicelb \
  --write-kubeconfig-mode=644" sh -
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
```

## 3. Cilium CNI (eBPF, kube-proxy replacement, Hubble)
```bash
cilium install --version 1.16.5 --set ipam.mode=kubernetes \
  --set operator.replicas=1 --set hubble.relay.enabled=true --set hubble.ui.enabled=true
# Required for this single-node K3s host:
helm upgrade cilium cilium/cilium --version 1.16.5 -n kube-system --reuse-values \
  --set socketLB.hostNamespaceOnly=true   # let Linkerd's iptables redirect work
# k8sServiceHost/Port must point at the node API (KPR needs it to program 10.43.0.1)
kubectl -n kube-system patch cm cilium-config --type merge \
  -p '{"data":{"k8s-service-host":"<NODE_IP>","k8s-service-port":"6443"}}'
kubectl -n kube-system rollout restart ds/cilium deploy/cilium-operator
```

## 4. Linkerd (mTLS service mesh)
```bash
linkerd install --crds | kubectl apply -f -
linkerd install | kubectl apply -f -
linkerd check
# Opt a namespace into automatic mTLS sidecar injection:
kubectl annotate namespace polymarket linkerd.io/inject=enabled --overwrite
kubectl -n polymarket rollout restart deploy   # pods come back 2/2 (app + proxy)
```

## 5. App workloads + segmentation
```bash
sudo deploy/k8s/import-images.sh <services...>   # Docker images -> containerd
helm upgrade --install polymarket deploy/k8s -n polymarket --create-namespace
kubectl apply -f deploy/k8s/base/networkpolicies.yaml   # default-deny + allow
```

## 6. Observability (eBPF-first, low overhead)
```bash
# Hubble eBPF flow metrics -> Prometheus
helm upgrade cilium cilium/cilium --version 1.16.5 -n kube-system --reuse-values \
  --set hubble.metrics.enableOpenMetrics=true \
  --set hubble.metrics.enabled="{dns,drop,tcp,flow,icmp,http}"
# Tetragon: eBPF runtime-security events (process exec / syscalls)
helm install tetragon cilium/tetragon -n kube-system
tetra getevents -o compact            # inside the tetragon pod
# Metrics backbone (disk-aware: 2d retention, no PVC, alertmanager off)
helm upgrade --install kps prometheus-community/kube-prometheus-stack -n monitoring \
  --create-namespace -f deploy/observability/kube-prometheus-values.yaml \
  --set grafana.adminPassword="<from .env GRAFANA_ADMIN_PASSWORD>"
```
Loki (logs) + Tempo (traces) are deferred — disk-heavy; the eBPF layer + metrics
cover core observability for now (low-overhead goal, plan Faza 3).

## 7. Vault — dynamic DB secrets (Faza 4)
Standalone Vault (file storage) + Vault Secrets Operator. Vault issues
short-lived Postgres credentials; services consume a native K8s Secret that VSO
keeps rotated — no static DB passwords in env. SOPS still owns Vault's own
bootstrap keys (`deploy/secrets/vault-bootstrap.env`); they are complementary.
```bash
helm repo add hashicorp https://helm.releases.hashicorp.com && helm repo update
# Server + operator
helm upgrade --install vault hashicorp/vault --version 0.32.0 -n vault \
  --create-namespace -f deploy/k8s/base/vault/vault-values.yaml
helm upgrade --install vault-secrets-operator hashicorp/vault-secrets-operator \
  --version 1.4.0 -n vault

# Init + unseal (1 share/threshold; keys -> SOPS, NOT plain). After a pod
# restart Vault is sealed again — unseal with the key from vault-bootstrap.env.
kubectl -n vault exec vault-0 -- vault operator init -key-shares=1 -key-threshold=1
kubectl -n vault exec vault-0 -- vault operator unseal <UNSEAL_KEY>

# Engines + auth (run with VAULT_TOKEN=<root>)
vault secrets enable database
vault auth enable kubernetes
vault write auth/kubernetes/config kubernetes_host="https://$KUBERNETES_PORT_443_TCP_ADDR:443"
vault write database/config/polymarket-postgres plugin_name=postgresql-database-plugin \
  allowed_roles=auth-service,readonly username=polymarket password=<POSTGRES_PASSWORD> \
  connection_url='postgresql://{{username}}:{{password}}@57.129.112.224:15432/polymarket?sslmode=disable'
vault write database/roles/auth-service db_name=polymarket-postgres default_ttl=1h max_ttl=24h \
  creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; GRANT ..."
# Policy + role bind SA polymarket/auth-service -> read database/creds/auth-service
vault write auth/kubernetes/role/auth-service bound_service_account_names=auth-service \
  bound_service_account_namespaces=polymarket policies=auth-service ttl=1h

# Wire VSO CRs -> materializes Secret polymarket/auth-service-db (auto-rotated)
kubectl apply -f deploy/k8s/base/vault/vso-auth-service.yaml
```

### Hybrid-phase DB relay (host)
Pods can't reach the Docker-bridge IP of the Compose Postgres (Cilium treats that
directly-connected subnet as local and doesn't masquerade, so replies have no
return route). The node *can* reach the container, and pods *can* reach the node
— so Postgres is relayed at `<NODE_IP>:15432` via DNAT+SNAT. Idempotent; runs at
boot via a systemd unit. Removed in Faza 5 when Postgres moves into the cluster.
```bash
sudo bash deploy/k8s/base/vault/compose-db-relay.sh        # one-off / manual
sudo systemctl enable --now compose-db-relay.service       # persist across reboot
```

## Notes
- WAF (ingress-nginx + ModSecurity/OWASP-CRS) is intentionally deployed at the
  **edge cutover** step, once application services serve real traffic on k8s —
  installing it against an empty cluster would protect nothing. See plan Faza 2/5.
- Databases remain on Docker Compose during the hybrid phase (plan Faza 1c).
- Vault has no cloud auto-unseal on this self-hosted VPS, so unseal is manual
  after a restart (key in the SOPS-encrypted `vault-bootstrap.env`).
