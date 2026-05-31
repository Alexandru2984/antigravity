# PolyMarket database backups

Logical, restorable backups of the databases still running on Docker Compose.
This is the **pre-cutover safety net** (plan Faza 5): the migration/cutover to
K3s must not proceed until these dumps exist and restore cleanly.

Scope is strictly the `polymarket-*` containers — the VPS also hosts unrelated
projects (mailcow, cinetrack, …) which the script never touches.

## Run
```bash
sudo bash deploy/backup/backup-databases.sh          # writes /var/backups/polymarket/<ts>/
sudo systemctl enable --now polymarket-backup.timer  # daily at 03:30 (+jitter), keeps 7 days
```
Each run writes a timestamped dir with a `MANIFEST.sha256`. Tunables via env:
`BACKUP_ROOT`, `KEEP_DAYS`.

## What's captured
| Store      | Artifact                       | Method                              |
|------------|--------------------------------|-------------------------------------|
| Postgres   | `postgres-all.sql.gz`          | `pg_dumpall` (all DBs + roles)      |
| MongoDB    | `mongo.archive.gz`             | `mongodump --archive --gzip`        |
| MySQL      | `mysql-all.sql.gz`             | `mysqldump --all-databases`         |
| Redis      | `redis-dump.rdb.gz`            | `SAVE` + RDB copy                   |
| ClickHouse | `clickhouse/<t>.{sql,native.gz}` | DDL + `FORMAT Native` per table   |
| Neo4j      | `neo4j-data.tar.gz`            | volume snapshot (no online dump)    |
| MinIO      | `minio-data.tar.gz`            | volume snapshot                     |

## Restore (verified procedures)
```bash
D=/var/backups/polymarket/<timestamp>

# Postgres — into a target with the same superuser
zcat $D/postgres-all.sql.gz | docker exec -i <pg-container> psql -U polymarket

# MongoDB
cat $D/mongo.archive.gz | docker exec -i <mongo-container> mongorestore --archive --gzip --drop

# MySQL
zcat $D/mysql-all.sql.gz | docker exec -i <mysql-container> sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD"'

# Redis — stop, drop RDB in, start
zcat $D/redis-dump.rdb.gz > dump.rdb && docker cp dump.rdb <redis-container>:/data/dump.rdb

# ClickHouse — re-create each table then load
for f in $D/clickhouse/*.sql; do docker exec -i <ch> clickhouse-client < "$f"; done
# then per table: zcat $D/clickhouse/<t>.native.gz | docker exec -i <ch> \
#   clickhouse-client --query "INSERT INTO polymarket_analytics.<t> FORMAT Native"

# Neo4j / MinIO — restore the volume contents into the target's /data
```
Postgres + Mongo restores are smoke-tested into throwaway containers as part of
verifying this script (see commit history / Faza 5 notes).
