from fastapi import APIRouter

from analytics_service.clickhouse import clickhouse_database, get_clickhouse_client

router = APIRouter()


@router.get("/overview")
async def overview():
    ch = get_clickhouse_client()
    database = clickhouse_database()
    rows = ch.execute(f"""
        SELECT
            event_type,
            count() AS total,
            countIf(created_at >= now() - INTERVAL 24 HOUR) AS last_24h
        FROM {database}.events
        GROUP BY event_type
        ORDER BY total DESC
    """)
    return {"events": [{"event_type": r[0], "total": r[1], "last_24h": r[2]} for r in rows]}


@router.get("/listings")
async def listings_stats(days: int = 7):
    ch = get_clickhouse_client()
    database = clickhouse_database()
    rows = ch.execute(f"""
        SELECT
            toDate(created_at) AS day,
            count() AS listings_created
        FROM {database}.events
        WHERE event_type = 'listing_created'
          AND created_at >= now() - INTERVAL %(days)s DAY
        GROUP BY day
        ORDER BY day
    """, {"days": days})
    return {"data": [{"day": str(r[0]), "count": r[1]} for r in rows]}


@router.get("/payments")
async def payments_stats(days: int = 7):
    ch = get_clickhouse_client()
    database = clickhouse_database()
    rows = ch.execute(f"""
        SELECT
            toDate(created_at)  AS day,
            count()              AS transactions,
            sum(coalesce(amount_cents, 0)) / 100 AS total_amount
        FROM {database}.events
        WHERE event_type = 'payment_processed'
          AND created_at >= now() - INTERVAL %(days)s DAY
        GROUP BY day
        ORDER BY day
    """, {"days": days})
    return {"data": [{"day": str(r[0]), "transactions": r[1], "total_amount": r[2]} for r in rows]}
