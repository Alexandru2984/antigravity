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

### 5b. Full parallel stack (Faza 1c)
The cluster runs the WHOLE app (35 services + 12 databases) with its OWN
databases restored from backup — independent of the Compose stack still serving
live traffic. `databases:` and `services:` in values.yaml are data-driven; flip
`enabled` per item. Bring-up order: databases → mesh workers → app services.
```bash
# 1) Secret from the SOPS-decrypted .env. IMPORTANT: strip surrounding quotes —
#    `kubectl --from-env-file` keeps them (Docker Compose strips them), which
#    corrupts quoted values like JWT_PUBLIC_KEY. Compose-equivalent parse:
bash scripts/secrets-decrypt.sh   # regenerates .env from deploy/secrets
python3 - <<'PY'
out=[]
for l in open('.env'):
    l=l.rstrip('\n')
    if not l or l[0]=='#' or '=' not in l: continue
    k,v=l.split('=',1)
    if len(v)>=2 and v[0]==v[-1] and v[0] in '"\'': v=v[1:-1]
    out.append(f"{k}={v}")
open('/tmp/k8s-secret.env','w').write('\n'.join(out)+'\n')
PY
kubectl -n polymarket create secret generic polymarket-secrets \
  --from-env-file=/tmp/k8s-secret.env --dry-run=client -o yaml | kubectl apply -f -
rm -f /tmp/k8s-secret.env

# 2) Images + deploy (databases come up as StatefulSets with local-path PVCs)
sudo deploy/k8s/import-images.sh        # all infra-* images
helm upgrade polymarket deploy/k8s -n polymarket

# 3) Restore data into the k8s databases from the latest backup, e.g. Postgres:
D=$(ls -dt /var/backups/polymarket/*/ | head -1)
sudo zcat "$D/postgres-all.sql.gz" | kubectl -n polymarket exec -i postgres-0 -c postgres -- psql -U polymarket
# (mongo: mongorestore --archive --gzip --drop; mysql/clickhouse similar — see deploy/backup/README.md)

# 4) Kafka topics
kubectl -n polymarket exec kafka-0 -- bash -c 'for t in listings.created payments.processed ...; do \
  kafka-topics --bootstrap-server localhost:9092 --create --topic $t --partitions 3 --replication-factor 1 --if-not-exists; done'
```
Notes baked into the chart for this to work:
- `enableServiceLinks: false` on every pod (the `{SVC}_PORT` env injection breaks
  kafka/neo4j, which parse such env as config).
- Kafka is **un-meshed** + a **headless** Service + `publishNotReadyAddresses`
  (broker must resolve its own advertised listener at startup).
- envSecret renders before env so composite values (DB URLs, `NEO4J_AUTH`)
  interpolate secrets via `$(VAR)`; neo4j's password var is non-`NEO4J_`-prefixed.

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

## 8. Hardening (Faza 5)
The chart carries production-grade controls, enabled per service from `values.yaml`:
- **Zero-downtime rollouts** — every Deployment uses `RollingUpdate` with
  `maxUnavailable: 0, maxSurge: 1` (a new pod goes Ready before the old retires;
  verified live: ready replicas never dropped during a `rollout restart`).
- **PodDisruptionBudget** — auto-rendered (`minAvailable: 1`) for any service
  with >1 replica or an HPA, so node drains/rollouts never take the last pod.
- **HPA** — opt in with `hpa: { min, max, cpu }`. Uses `ContainerResource` CPU
  on the app container (the injected Linkerd proxy has no CPU request, which
  would otherwise make a pod-level metric read `<unknown>`). Needs metrics-server
  (bundled with K3s). When `hpa` is set the Deployment drops its static replica
  count so the HPA owns scaling.
```bash
helm upgrade polymarket deploy/k8s -n polymarket \
  --set services.<svc>.hpa.min=2 --set services.<svc>.hpa.max=6 --set services.<svc>.hpa.cpu=70
```

### Backups (pre-cutover safety net)
Daily logical dumps of the Compose databases — see `deploy/backup/README.md`.
Restore is smoke-tested (Postgres + Mongo into throwaway containers). The cutover
must not proceed until a fresh backup exists and restores cleanly.
```bash
sudo systemctl enable --now polymarket-backup.timer    # 03:30 daily, keeps 7 days
```

## 9. Cutover & rollback runbook (NOT yet executed)
**Gate:** the cutover stops the live Compose stack and is irreversible in the
moment — run it only on an explicit go, and only after Faza 1c (all app services
+ databases actually serving on k8s). Order:
1. **Backup** — `sudo bash deploy/backup/backup-databases.sh`; confirm `ALL OK`.
2. **Bring up all services on k8s** (Faza 1c): flip remaining `services.*.enabled`,
   migrate DBs to StatefulSets (restore from the dumps above), retire the
   `compose-db-relay` once Postgres is in-cluster.
3. **WAF at edge** — install ingress-nginx + ModSecurity/OWASP-CRS as the Ingress
   (keep the anti-redirect-loop fix: serve HTTP, no 301). Validate a SQLi payload → 403.
4. **Validate on k8s** behind the WAF without moving DNS (host header / local curl):
   listings 200, mesh 18/18 `SUCCESS_PERSISTED`, `linkerd viz stat` mTLS=100%.
5. **Cutover** — point the host nginx / Cloudflare origin at the k8s ingress.
6. **Stop Compose** — `docker compose -f infra/docker-compose.*.yml down` (app first,
   DBs last, only after k8s is verified healthy on real traffic).

**Rollback** (at any step): repoint the edge back to the Compose nginx and
`docker compose up -d`. Compose stays running in parallel until step 6, so
rollback is a single edge switch.

## Notes
- WAF (ingress-nginx + ModSecurity/OWASP-CRS) is intentionally deployed at the
  **edge cutover** step, once application services serve real traffic on k8s —
  installing it against an empty cluster would protect nothing. See plan Faza 2/5.
- Databases remain on Docker Compose during the hybrid phase (plan Faza 1c).
- Vault has no cloud auto-unseal on this self-hosted VPS, so unseal is manual
  after a restart (key in the SOPS-encrypted `vault-bootstrap.env`).
