#!/usr/bin/env bash
# Logical backups of the PolyMarket databases that still live on Docker Compose.
# Pre-cutover safety net (Faza 5): nothing migrates or stops until these dumps
# exist and restore cleanly. Targets ONLY polymarket-* containers — the VPS also
# runs unrelated projects (mailcow, cinetrack, …) which must never be touched.
#
# Strategy: logical dumps for the stores with clean dump/restore tooling
# (postgres/mongo/mysql), point-in-time RDB for redis, and volume snapshots for
# the rest (clickhouse/neo4j/minio) — small and mostly regenerable. Passwords are
# read from each container's own env, never hard-coded here. Restore notes:
# deploy/backup/README.md.
set -uo pipefail
shopt -s lastpipe

BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/polymarket}"
KEEP_DAYS="${KEEP_DAYS:-7}"
DEST="$BACKUP_ROOT/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DEST"
fail=0
log()  { echo "[$(date +%H:%M:%S)] $*"; }
have() { docker ps --format '{{.Names}}' | grep -qx "$1"; }
# Run a backup step; a non-zero exit (incl. broken pipe via pipefail) is recorded.
step() { local name="$1"; shift; if ( set -o pipefail; "$@" ); then log "OK   $name"; else log "FAIL $name"; fail=1; fi; }

pg()    { docker exec polymarket-postgres pg_dumpall -U polymarket | gzip > "$DEST/postgres-all.sql.gz"; }
mongo() { docker exec polymarket-mongo sh -c 'mongodump --archive --gzip \
            ${MONGO_INITDB_ROOT_USERNAME:+-u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin}' \
            > "$DEST/mongo.archive.gz"; }
mysql() { docker exec polymarket-mysql sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" \
            --all-databases --single-transaction --quick' | gzip > "$DEST/mysql-all.sql.gz"; }
redis() { docker exec polymarket-redis sh -c 'redis-cli ${REDIS_PASSWORD:+-a "$REDIS_PASSWORD"} --no-auth-warning SAVE >/dev/null' \
            && docker cp -q polymarket-redis:/data/dump.rdb "$DEST/redis-dump.rdb" 2>/dev/null \
            && gzip "$DEST/redis-dump.rdb"; }
clickhouse() {
  local db=polymarket_analytics t rc=0; mkdir -p "$DEST/clickhouse"
  # Skip `.inner*` tables: they are storage for materialized views and are
  # recreated automatically when the view DDL is restored.
  docker exec polymarket-clickhouse clickhouse-client --query \
    "SELECT name FROM system.tables WHERE database='$db' AND name NOT LIKE '.inner%'" | while read -r t; do
    [ -z "$t" ] && continue
    docker exec polymarket-clickhouse clickhouse-client --query "SHOW CREATE TABLE \`$db\`.\`$t\`" > "$DEST/clickhouse/$t.sql" || rc=1
    docker exec polymarket-clickhouse clickhouse-client --query "SELECT * FROM \`$db\`.\`$t\` FORMAT Native" | gzip > "$DEST/clickhouse/$t.native.gz" || rc=1
  done
  return $rc; }
volsnap() { # container path label  — crash-consistent tar of a data volume
  docker run --rm --volumes-from "$1" -v "$DEST":/bk alpine \
    tar czf "/bk/$3-data.tar.gz" -C "$2" . ; }

log "backup -> $DEST"
have polymarket-postgres   && step postgres   pg
have polymarket-mongo      && step mongo      mongo
have polymarket-mysql      && step mysql      mysql
have polymarket-redis      && step redis      redis
have polymarket-clickhouse && step clickhouse clickhouse
have polymarket-neo4j      && step neo4j      volsnap polymarket-neo4j /data neo4j
have polymarket-minio      && step minio      volsnap polymarket-minio /data minio

( cd "$DEST" && find . -type f ! -name MANIFEST.sha256 -exec sha256sum {} + > MANIFEST.sha256 )
du -sh "$DEST" | awk '{print "[size] "$1}'
find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d -mtime +"$KEEP_DAYS" -exec rm -rf {} + 2>/dev/null
log "retained last $KEEP_DAYS days; older pruned"
[ "$fail" -eq 0 ] && log "ALL OK" || log "COMPLETED WITH FAILURES"
exit "$fail"
