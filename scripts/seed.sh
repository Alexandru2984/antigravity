#!/usr/bin/env bash
# ============================================================
# PolyMarket — Multi-Database Seeding Script
# Seeds Postgres, MongoDB, MySQL, ClickHouse, Neo4j, SurrealDB
# ============================================================

set -euo pipefail

CONFIRMATION_TOKEN="reset-demo-data"

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<EOF
Usage:
  POLYMARKET_SEED_CONFIRM=$CONFIRMATION_TOKEN bash scripts/seed.sh
  bash scripts/seed.sh --$CONFIRMATION_TOKEN

This script resets demo data across Postgres, MongoDB, MySQL, ClickHouse,
Neo4j, and SurrealDB. Do not run it against production data.
EOF
  exit 0
fi

if [[ "${1:-}" == "--$CONFIRMATION_TOKEN" ]]; then
  POLYMARKET_SEED_CONFIRM="$CONFIRMATION_TOKEN"
fi

if [[ -f .env ]]; then
  set -a; source .env; set +a
fi

if [[ "${POLYMARKET_SEED_CONFIRM:-}" != "$CONFIRMATION_TOKEN" ]]; then
  cat >&2 <<EOF
ERROR: Refusing to reset demo data without explicit confirmation.

This script runs destructive operations, including TRUNCATE, DELETE,
MATCH ... DETACH DELETE, and REMOVE TABLE across multiple databases.

Run only for local/demo data:
  POLYMARKET_SEED_CONFIRM=$CONFIRMATION_TOKEN bash scripts/seed.sh
  bash scripts/seed.sh --$CONFIRMATION_TOKEN
EOF
  exit 2
fi

REQUIRED=(
  MONGO_PASSWORD
  MYSQL_PASSWORD
  CLICKHOUSE_PASSWORD
  NEO4J_PASSWORD
  SURREALDB_PASSWORD
)
for var in "${REQUIRED[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    echo "ERROR: $var is not set. Add it to .env"
    exit 1
  fi
done

echo "🌱 Starting PolyMarket database seeding process..."

# Pre-computed Bcrypt hash for password 'password123'
PASSWORD_HASH='$2b$12$KkQ1pY.yJbe928K9y5bZneH6XF622iYkGg0E0.9fO1P5gXvV34gG2'

BUYER_UUID="11111111-1111-1111-1111-111111111111"
SELLER_UUID="22222222-2222-2222-2222-222222222222"
ADMIN_UUID="33333333-3333-3333-3333-333333333333"

# ── 1. PostgreSQL: Auth Database ─────────────────────────────
echo "🗄️  Seeding Auth Database (Postgres)..."
docker exec -i polymarket-postgres psql -U polymarket -d polymarket_auth <<EOF
TRUNCATE TABLE refresh_tokens, users CASCADE;

INSERT INTO users (id, email, password_hash, roles, is_active, created_at, updated_at) VALUES
('$BUYER_UUID', 'buyer@polymarket.com', '$PASSWORD_HASH', '{user}', true, NOW(), NOW()),
('$SELLER_UUID', 'seller@polymarket.com', '$PASSWORD_HASH', '{user}', true, NOW(), NOW()),
('$ADMIN_UUID', 'admin@polymarket.com', '$PASSWORD_HASH', '{user,admin}', true, NOW(), NOW());
EOF

# ── 2. PostgreSQL: Profile Database ──────────────────────────
echo "🗄️  Seeding Profile Database (Postgres)..."
docker exec -i polymarket-postgres psql -U polymarket -d polymarket_profiles <<EOF
TRUNCATE TABLE profiles CASCADE;

INSERT INTO profiles (user_id, username, display_name, bio, avatar_url, phone, location, rating_avg, rating_count, listings_count, is_verified, created_at, updated_at) VALUES
('$BUYER_UUID', 'alex_buyer', 'Alex Buyer', 'Passionate tech enthusiast looking for great deals.', 'https://avatars.githubusercontent.com/u/10001?v=4', '+40722111111', 'Bucharest, Romania', 4.80, 5, 0, false, NOW(), NOW()),
('$SELLER_UUID', 'john_seller', 'John Seller', 'Certified premium tech reseller. High ratings guaranteed.', 'https://avatars.githubusercontent.com/u/10002?v=4', '+40722222222', 'Cluj-Napoca, Romania', 4.95, 120, 25, true, NOW(), NOW()),
('$ADMIN_UUID', 'system_admin', 'System Admin', 'Core PolyMarket Administrator.', 'https://avatars.githubusercontent.com/u/10003?v=4', '+40722333333', 'Global', 5.00, 0, 0, true, NOW(), NOW());
EOF

# ── 3. PostgreSQL: Config Database ───────────────────────────
echo "🗄️  Seeding Config Database (Postgres)..."
docker exec -i polymarket-postgres psql -U polymarket -d polymarket_config <<EOF
TRUNCATE TABLE feature_flags, app_config CASCADE;

INSERT INTO feature_flags (key, value, description, enabled, rollout_pct, created_at, updated_at) VALUES
('enable_ml_recommendations', '{"enabled": true}', 'Enables customized Neo4j ML recommended listings on homepage.', true, 100, NOW(), NOW()),
('enable_stripe_real_payment', '{"enabled": false}', 'Toggle between mock payment flows and actual Stripe API sandbox.', false, 100, NOW(), NOW());

INSERT INTO app_config (key, value, secret, created_at, updated_at) VALUES
('platform_title', 'PolyMarket Premium', false, NOW(), NOW()),
('support_email', 'support@polymarket.com', false, NOW(), NOW());
EOF

# ── 4. MongoDB: Listing Database ─────────────────────────────
echo "🗄️  Seeding Listing Database (MongoDB)..."
docker exec -i polymarket-mongo mongosh -u polymarket -p "$MONGO_PASSWORD" --authenticationDatabase admin polymarket <<EOF
db.listings.deleteMany({});

db.listings.insertMany([
  {
    _id: ObjectId("664cb3f928e4fb801d000001"),
    title: "iPhone 15 Pro Max - 256GB - Titanium",
    description: "Selling a perfect condition iPhone 15 Pro Max. Used for 2 months, 100% battery capacity. Comes with original box and invoice.",
    price: 480000, // 4800.00 RON in cents
    currency: "RON",
    category: "Electronics",
    sub_category: "Mobile Phones",
    status: "active",
    seller_id: "$SELLER_UUID",
    images: ["https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800"],
    attributes: {
      brand: "Apple",
      color: "Natural Titanium",
      storage: "256GB",
      condition: "Like New"
    },
    views: 142,
    favorites_count: 18,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    _id: ObjectId("664cb3f928e4fb801d000002"),
    title: "Sony WH-1000XM5 Noise Cancelling Headphones",
    description: "Industry leading noise-canceling headphones in black. Brand new in sealed box, received as a gift. 2-year warranty.",
    price: 135000, // 1350.00 RON in cents
    currency: "RON",
    category: "Electronics",
    sub_category: "Audio",
    status: "active",
    seller_id: "$SELLER_UUID",
    images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"],
    attributes: {
      brand: "Sony",
      color: "Black",
      wireless: true,
      condition: "Brand New"
    },
    views: 89,
    favorites_count: 6,
    created_at: new Date(),
    updated_at: new Date()
  }
]);
EOF

# ── 5. MySQL: Review Database ────────────────────────────────
echo "🗄️  Seeding Review Database (MySQL)..."
docker exec -i polymarket-mysql mysql -u polymarket -p"$MYSQL_PASSWORD" polymarket_reviews <<EOF
DELETE FROM reviews;

INSERT INTO reviews (id, transaction_id, reviewer_id, reviewee_id, rating, comment, created_at, updated_at) VALUES
(1, 't1111111-1111-1111-1111-111111111111', '$BUYER_UUID', '$SELLER_UUID', 5, 'Super prompt seller! The iPhone was exactly as described, highly recommend John!', NOW(), NOW()),
(2, 't2222222-2222-2222-2222-222222222222', '$SELLER_UUID', '$BUYER_UUID', 5, 'Excellent buyer. Prompt payment, very friendly communication.', NOW(), NOW());
EOF

# ── 6. ClickHouse: Analytics Database ────────────────────────
echo "🗄️  Seeding Analytics Database (ClickHouse)..."
docker exec -i polymarket-clickhouse clickhouse-client --user polymarket --password "$CLICKHOUSE_PASSWORD" --database polymarket_analytics <<EOF
TRUNCATE TABLE listing_events;

INSERT INTO listing_events (event_id, event_type, listing_id, user_id, ip_address, user_agent, timestamp) VALUES
(generateUUIDv4(), 'view', '664cb3f928e4fb801d000001', '$BUYER_UUID', '192.168.1.50', 'Mozilla/5.0 Chrome/120.0', now() - INTERVAL 1 HOUR),
(generateUUIDv4(), 'favorite', '664cb3f928e4fb801d000001', '$BUYER_UUID', '192.168.1.50', 'Mozilla/5.0 Chrome/120.0', now() - INTERVAL 50 MINUTE),
(generateUUIDv4(), 'view', '664cb3f928e4fb801d000002', '$BUYER_UUID', '192.168.1.50', 'Mozilla/5.0 Chrome/120.0', now() - INTERVAL 30 MINUTE);
EOF

# ── 7. Neo4j: ML Graph Database ─────────────────────────────
echo "🗄️  Seeding ML Graph Database (Neo4j)..."
docker exec -i polymarket-neo4j cypher-shell -u neo4j -p "$NEO4J_PASSWORD" <<EOF
MATCH (n) DETACH DELETE n;

CREATE (b:User {id: "$BUYER_UUID", name: "Alex Buyer"})
CREATE (s:User {id: "$SELLER_UUID", name: "John Seller"})
CREATE (l1:Listing {id: "664cb3f928e4fb801d000001", title: "iPhone 15 Pro Max", price: 4800.00, category: "Electronics"})
CREATE (l2:Listing {id: "664cb3f928e4fb801d000002", title: "Sony WH-1000XM5", price: 1350.00, category: "Electronics"})

CREATE (b)-[:VIEWED {at: datetime(), count: 3}]->(l1)
CREATE (b)-[:FAVORITED {at: datetime()}]->(l1)
CREATE (b)-[:VIEWED {at: datetime(), count: 1}]->(l2)
CREATE (l1)-[:SOLD_BY]->(s)
CREATE (l2)-[:SOLD_BY]->(s);
EOF

# ── 8. SurrealDB: Social/Feed Database ───────────────────────
echo "🗄️  Seeding Social/Feed Database (SurrealDB)..."
docker exec -i polymarket-surrealdb surreal sql \
  --conn http://127.0.0.1:8000 \
  --user polymarket \
  --pass "$SURREALDB_PASSWORD" \
  --ns polymarket \
  --db feed <<EOF
REMOVE TABLE follow;
REMOVE TABLE favorite;
CREATE user:buyer SET name = 'Alex Buyer', email = 'buyer@polymarket.com';
CREATE user:seller SET name = 'John Seller', email = 'seller@polymarket.com';
RELATE user:buyer->follow->user:seller SET created_at = time::now();
EOF

echo "🎉 PolyMarket Multi-Database Seeding complete!"
exit 0
