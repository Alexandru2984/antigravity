import os

from neo4j import AsyncGraphDatabase

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://neo4j:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASS = os.getenv("NEO4J_PASSWORD", "neo4j")

_driver = None


def get_driver():
    global _driver
    if _driver is None:
        _driver = AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASS))
    return _driver


async def get_recommendations(user_id: str, limit: int = 10) -> list[dict]:
    """
    Collaborative filtering via graph:
    Find listings viewed by similar users (users who viewed the same listings).
    """
    async with get_driver().session() as session:
        result = await session.run(
            """
            MATCH (u:User {id: $user_id})-[:VIEWED]->(l:Listing)
                  <-[:VIEWED]-(other:User)-[:VIEWED]->(rec:Listing)
            WHERE NOT (u)-[:VIEWED]->(rec)
              AND rec.id <> l.id
            WITH rec, count(*) AS score
            ORDER BY score DESC
            LIMIT $limit
            RETURN rec.id AS listing_id, rec.title AS title,
                   rec.category AS category, score
        """,
            user_id=user_id,
            limit=limit,
        )

        records = await result.data()
        return [dict(r) for r in records]


async def record_view(user_id: str, listing_id: str):
    """Create or update VIEWED relationship in Neo4j graph."""
    async with get_driver().session() as session:
        await session.run(
            """
            MERGE (u:User {id: $user_id})
            MERGE (l:Listing {id: $listing_id})
            MERGE (u)-[r:VIEWED]->(l)
            ON CREATE SET r.count = 1, r.last_viewed = datetime()
            ON MATCH  SET r.count = r.count + 1, r.last_viewed = datetime()
        """,
            user_id=user_id,
            listing_id=listing_id,
        )
