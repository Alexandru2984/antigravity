-- ============================================================
-- PolyMarket — MySQL Init (Review Service)
-- ============================================================
USE polymarket_reviews;

CREATE TABLE IF NOT EXISTS reviews (
    id              VARCHAR(36)     PRIMARY KEY,
    listing_id      VARCHAR(100)    NOT NULL,
    reviewer_id     VARCHAR(36)     NOT NULL,  -- UUID from auth service
    rating          TINYINT         NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title           VARCHAR(255),
    body            TEXT,
    is_verified_purchase BOOLEAN    DEFAULT FALSE,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_listing_id  (listing_id),
    INDEX idx_reviewer_id (reviewer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS review_replies (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    review_id   VARCHAR(36)     NOT NULL,
    seller_id   VARCHAR(36)     NOT NULL,
    body        TEXT            NOT NULL,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_review_replies_review
        FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
