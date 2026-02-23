-- ============================================================
-- PolyMarket — PostgreSQL Init
-- Databases + schemas for all services using PG
-- ============================================================

-- Auth Service
CREATE DATABASE polymarket_auth;
\c polymarket_auth;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    roles         TEXT[]       NOT NULL DEFAULT '{user}',
    is_active     BOOLEAN      NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,   -- SHA256 of the opaque token
    expires_at TIMESTAMPTZ NOT NULL,
    used       BOOLEAN     NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email         ON users(email);
CREATE INDEX idx_refresh_token_hash  ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_user_id     ON refresh_tokens(user_id);

-- Profile Service
CREATE DATABASE polymarket_profiles;
\c polymarket_profiles;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE profiles (
    user_id       UUID PRIMARY KEY,              -- FK to auth.users.id (cross-service)
    username      VARCHAR(100) NOT NULL UNIQUE,
    display_name  VARCHAR(255),
    bio           TEXT,
    avatar_url    VARCHAR(500),
    phone         VARCHAR(30),
    location      VARCHAR(255),
    rating_avg    DECIMAL(3,2) DEFAULT 0.00,
    rating_count  INT          DEFAULT 0,
    listings_count INT         DEFAULT 0,
    is_verified   BOOLEAN      DEFAULT false,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_username ON profiles(username);

-- Payment Service
CREATE DATABASE polymarket_payments;
\c polymarket_payments;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'refunded');

CREATE TABLE transactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID         NOT NULL,
    listing_id      VARCHAR(100) NOT NULL,        -- MongoDB ObjectId as string
    amount_cents    INT          NOT NULL,
    currency        VARCHAR(3)   NOT NULL DEFAULT 'RON',
    status          payment_status NOT NULL DEFAULT 'pending',
    stripe_pi_id    VARCHAR(255),                  -- Stripe PaymentIntent ID
    stripe_charge_id VARCHAR(255),
    metadata        JSONB,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tx_user_id      ON transactions(user_id);
CREATE INDEX idx_tx_listing_id   ON transactions(listing_id);
CREATE INDEX idx_tx_stripe_pi_id ON transactions(stripe_pi_id);
CREATE INDEX idx_tx_status       ON transactions(status);

-- Chat Service
CREATE DATABASE polymarket_chat;
\c polymarket_chat;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE conversations (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id   VARCHAR(100) NOT NULL,
    buyer_id     UUID         NOT NULL,
    seller_id    UUID         NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE(listing_id, buyer_id, seller_id)
);

CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       UUID        NOT NULL,
    content         TEXT        NOT NULL,
    is_read         BOOLEAN     NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conv_id   ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_conv_buyer_seller  ON conversations(buyer_id, seller_id);

-- Config Service (F#)
CREATE DATABASE polymarket_config;
\c polymarket_config;

CREATE TABLE feature_flags (
    key         VARCHAR(100) PRIMARY KEY,
    value       JSONB        NOT NULL,
    description TEXT,
    enabled     BOOLEAN      NOT NULL DEFAULT true,
    rollout_pct INT          CHECK (rollout_pct BETWEEN 0 AND 100) DEFAULT 100,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE app_config (
    key         VARCHAR(200) PRIMARY KEY,
    value       TEXT         NOT NULL,
    secret      BOOLEAN      NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Admin Panel (Ruby/Rails)
CREATE DATABASE polymarket_admin;
-- Rails will manage its own schema via migrations

-- Restore default connection
\c polymarket;
SELECT 'PolyMarket PostgreSQL init complete.' AS status;
