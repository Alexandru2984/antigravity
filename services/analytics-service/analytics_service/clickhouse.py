import os
import re

import clickhouse_driver

_client = None

_IDENTIFIER_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def clickhouse_database() -> str:
    database = os.getenv("CLICKHOUSE_DB", "polymarket_analytics")
    if not _IDENTIFIER_RE.fullmatch(database):
        raise ValueError("CLICKHOUSE_DB must be a valid ClickHouse identifier")
    return database

def get_clickhouse_client() -> clickhouse_driver.Client:
    global _client
    if _client is None:
        host = os.getenv("CLICKHOUSE_HOST", "clickhouse")
        port = int(os.getenv("CLICKHOUSE_PORT", "9000"))
        user = os.getenv("CLICKHOUSE_USER", "default")
        pwd = os.getenv("CLICKHOUSE_PASSWORD", "")
        database = clickhouse_database()
        _client = clickhouse_driver.Client(
            host=host,
            port=port,
            user=user,
            password=pwd,
            database=database,
        )
    return _client
