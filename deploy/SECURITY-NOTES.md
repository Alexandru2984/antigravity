# Security remediation — status & residual actions

A full security audit was performed and the findings remediated. This file
records what was fixed and the few items that only the repo owner can complete.

## Fixed (in code / infra)
- **Leaked plaintext secrets** (`.env.bak.*` committed to a public repo): untracked,
  gitignored (`.env.bak*`), and **all values rotated** across the live Compose
  stack and the k8s stack (DB passwords, JWT keypair, SECRET_KEY_BASE ×4,
  INTERNAL_SERVICE_TOKEN, REVIEW_APP_KEY). Vault DB engine reconfigured to the new
  Postgres password. Old credentials verified rejected.
- **Production Postgres exposed to the internet** via the k8s→Compose relay
  (DNAT on the public IP + unrestricted `DOCKER-USER` ACCEPT): restricted to the
  pod CIDR `10.42.0.0/16` (`deploy/k8s/base/vault/compose-db-relay.sh`).
- **Containers ran as root, no cap-drop**: chart now sets `cap_drop: ALL`,
  `allowPrivilegeEscalation: false`, seccomp `RuntimeDefault`,
  `automountServiceAccountToken: false` on all app pods.
- **Wide-open egress**: NetworkPolicy `scoped-egress` (DNS + Linkerd + intra-ns +
  external :443 only). Vault namespace locked down (`vault-networkpolicies.yaml`).
- **Secrets plaintext at rest in etcd**: k3s secrets-encryption enabled (aescbc).
- **Host file perms**: `.env`, `.env.bak*`, kubeconfig → `600`; user kubeconfig at
  `~/.kube/config`.
- **Vault**: audit device enabled; permanent root token revoked (regain admin via
  `vault operator generate-root` + the unseal key in `vault-bootstrap.env`).

## ⚠️ Residual actions — ONLY THE OWNER CAN DO THESE
1. **(Optional, hygiene) Purge `.env.bak` from git history.** Rotation already made
   the leaked values useless, so this is cleanup, not a security necessity. The repo
   can safely stay **public** — SOPS-encrypted files (`secrets.env`,
   `vault-bootstrap.env`) and the age *public* key in `.sops.yaml` are safe to expose;
   the age *private* key lives outside the repo (`~/.config/sops/age/keys.txt`).
   ```bash
   git filter-repo --invert-paths --path .env.bak.20260527-120414   # or BFG
   git push --force --all     # rewrites remote history
   ```
   Going forward, never commit plaintext secrets — the SOPS workflow + hardened
   `.gitignore` enforce this.
2. **Revoke the Stripe keys** in the Stripe dashboard (the leaked `sk_test_…` +
   webhook secret can't be rotated from here). Replace `STRIPE_*` in
   `deploy/secrets/secrets.env` afterward.
2b. *(done)* **OpenSearch admin password** was rotated on both stacks via
   `securityadmin.sh` (hash `internal_users.yml` → push to the security index).
   For future rotations: `hash.sh -p <pw>`, replace the `admin:` hash in
   `config/opensearch-security/internal_users.yml` (ensure it's owned by uid 1000),
   then `securityadmin.sh -cd <dir> -cacert root-ca.pem -cert kirk.pem -key
   kirk-key.pem -h localhost -p 9200`.
