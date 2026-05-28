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

## Notes
- WAF (ingress-nginx + ModSecurity/OWASP-CRS) is intentionally deployed at the
  **edge cutover** step, once application services serve real traffic on k8s —
  installing it against an empty cluster would protect nothing. See plan Faza 2/5.
- Databases remain on Docker Compose during the hybrid phase (plan Faza 1c).
