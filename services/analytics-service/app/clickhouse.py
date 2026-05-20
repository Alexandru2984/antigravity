import clickhouse_driver
import os

_client = None

def get_clickhouse_client() -> clickhouse_driver.Client:
    global _client
    if _client is None:
        host = os.getenv("CLICKHOUSE_HOST", "clickhouse")
        port = int(os.getenv("CLICKHOUSE_PORT", "9000"))
        user = os.getenv("CLICKHOUSE_USER", "default")
        pwd  = os.getenv("CLICKHOUSE_PASSWORD", "")
        _client = clickhouse_driver.Client(host=host, port=port, user=user, password=pwd)
    return _client
