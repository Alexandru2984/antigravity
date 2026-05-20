use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

// ── Listing Location ──────────────────────────────────────────
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Location {
    pub city:    String,
    pub county:  String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub address: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub lat:     Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub lng:     Option<f64>,
}

// ── Listing Image ─────────────────────────────────────────────
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ListingImage {
    pub url:       String,
    pub key:       String,
    pub thumbnail: String,
    pub medium:    String,
}

// ── Listing Status ────────────────────────────────────────────
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum ListingStatus {
    Draft,
    #[default]
    Active,
    Sold,
    Expired,
    Deleted,
}

// ── Listing document (MongoDB) ────────────────────────────────
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Listing {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id:          Option<bson::oid::ObjectId>,
    pub title:       String,
    pub description: String,
    pub price:       i64,          // in bani (smallest RON unit)
    pub currency:    String,
    pub category:    String,
    pub subcategory: Option<String>,
    pub seller_id:   Uuid,
    pub images:      Vec<ListingImage>,
    pub location:    Location,
    pub attributes:  serde_json::Value,
    pub status:      ListingStatus,
    pub views:       i64,
    pub created_at:  DateTime<Utc>,
    pub expires_at:  DateTime<Utc>,
    pub updated_at:  DateTime<Utc>,
}

// ── Create request ─────────────────────────────────────────────
#[derive(Debug, Deserialize, Validate)]
pub struct CreateListingRequest {
    #[validate(length(min = 3, max = 200))]
    pub title:       String,
    #[validate(length(max = 5000))]
    pub description: Option<String>,
    #[validate(range(min = 0))]
    pub price:       i64,
    pub currency:    Option<String>,
    #[validate(length(min = 1))]
    pub category:    String,
    pub subcategory: Option<String>,
    pub location:    CreateLocation,
    pub image_ids:   Option<Vec<String>>,
    pub attributes:  Option<serde_json::Value>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateLocation {
    #[validate(length(min = 1))]
    pub city:   String,
    #[validate(length(min = 1))]
    pub county: String,
    pub lat:    Option<f64>,
    pub lng:    Option<f64>,
}

// ── Query params ──────────────────────────────────────────────
#[derive(Debug, Deserialize)]
pub struct ListingQuery {
    pub page:      Option<u64>,
    pub limit:     Option<u64>,
    pub category:  Option<String>,
    pub status:    Option<String>,
    pub seller_id: Option<Uuid>,
}

// ── API response ──────────────────────────────────────────────
#[derive(Debug, Serialize)]
pub struct ListingsResponse {
    pub data:     Vec<ListingResponse>,
    pub total:    u64,
    pub page:     u64,
    pub limit:    u64,
    pub has_next: bool,
}

#[derive(Debug, Serialize)]
pub struct ListingResponse {
    pub id:          String,
    pub title:       String,
    pub description: String,
    pub price:       i64,
    pub currency:    String,
    pub category:    String,
    pub subcategory: Option<String>,
    pub seller_id:   Uuid,
    pub images:      Vec<ListingImage>,
    pub location:    Location,
    pub attributes:  serde_json::Value,
    pub status:      ListingStatus,
    pub views:       i64,
    pub created_at:  DateTime<Utc>,
    pub expires_at:  DateTime<Utc>,
}

impl From<Listing> for ListingResponse {
    fn from(l: Listing) -> Self {
        Self {
            id:          l.id.map(|id| id.to_hex()).unwrap_or_default(),
            title:       l.title,
            description: l.description,
            price:       l.price,
            currency:    l.currency,
            category:    l.category,
            subcategory: l.subcategory,
            seller_id:   l.seller_id,
            images:      l.images,
            location:    l.location,
            attributes:  l.attributes,
            status:      l.status,
            views:       l.views,
            created_at:  l.created_at,
            expires_at:  l.expires_at,
        }
    }
}
