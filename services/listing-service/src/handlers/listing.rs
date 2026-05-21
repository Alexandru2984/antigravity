use axum::{
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode},
    Json,
};
use serde_json::json;
use uuid::Uuid;
use validator::Validate;

use crate::{
    error::{AppError, Result},
    models::{CreateListingRequest, ListingQuery, ListingResponse, ListingsResponse},
    AppState,
};

const INTERNAL_SERVICE_TOKEN_HEADER: &str = "x-internal-service-token";

fn require_internal_request(state: &AppState, headers: &HeaderMap) -> Result<()> {
    let provided = headers
        .get(INTERNAL_SERVICE_TOKEN_HEADER)
        .and_then(|v| v.to_str().ok())
        .ok_or(AppError::Forbidden)?;

    if provided != state.internal_service_token {
        return Err(AppError::Forbidden);
    }

    Ok(())
}

fn extract_user_id(headers: &HeaderMap) -> Result<Uuid> {
    let uid = headers
        .get("x-user-id")
        .and_then(|v| v.to_str().ok())
        .ok_or_else(|| AppError::Validation("Missing X-User-Id header".into()))?;

    uid.parse::<Uuid>()
        .map_err(|_| AppError::Validation("Invalid X-User-Id".into()))
}

fn is_admin(headers: &HeaderMap) -> bool {
    headers
        .get("x-user-roles")
        .and_then(|v| v.to_str().ok())
        .map(|roles| roles.contains("admin"))
        .unwrap_or(false)
}

// ── GET /listings ──────────────────────────────────────────────
pub async fn list(
    State(state): State<AppState>,
    Query(query): Query<ListingQuery>,
) -> Result<Json<ListingsResponse>> {
    let (listings, total) = state.mongo.list(&query).await?;

    let page = query.page.unwrap_or(1);
    let limit = query.limit.unwrap_or(20);

    Ok(Json(ListingsResponse {
        has_next: (page * limit) < total,
        total,
        page,
        limit,
        data: listings.into_iter().map(ListingResponse::from).collect(),
    }))
}

// ── POST /listings ─────────────────────────────────────────────
pub async fn create(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<CreateListingRequest>,
) -> Result<(StatusCode, Json<ListingResponse>)> {
    req.validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    require_internal_request(&state, &headers)?;
    let seller_id = extract_user_id(&headers)?;
    let listing = state.mongo.create(seller_id, req).await?;

    // Kafka event
    let listing_id = listing
        .id
        .as_ref()
        .map(|id| id.to_hex())
        .unwrap_or_default();
    let _ = state
        .kafka
        .produce(
            "polymarket.listings.created",
            &listing_id,
            &json!({
                "event":     "listing.created",
                "id":        listing_id,
                "seller_id": seller_id,
                "category":  listing.category,
                "price":     listing.price,
                "ts":        chrono::Utc::now().to_rfc3339(),
            }),
        )
        .await;

    Ok((StatusCode::CREATED, Json(ListingResponse::from(listing))))
}

// ── GET /listings/:id ──────────────────────────────────────────
pub async fn get_by_id(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<ListingResponse>> {
    let listing = state
        .mongo
        .find_by_id(&id)
        .await?
        .ok_or(AppError::NotFound)?;

    // Async view count increment (don't block the response)
    let mongo = state.mongo.clone();
    let id_clone = id.clone();
    tokio::spawn(async move {
        let _ = mongo.increment_views(&id_clone).await;
    });

    Ok(Json(ListingResponse::from(listing)))
}

// ── PUT /listings/:id ──────────────────────────────────────────
pub async fn update(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
    Json(req): Json<CreateListingRequest>,
) -> Result<Json<ListingResponse>> {
    req.validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    require_internal_request(&state, &headers)?;
    let seller_id = extract_user_id(&headers)?;
    let update_doc = bson::doc! {
        "title":       req.title,
        "description": req.description.unwrap_or_default(),
        "price":       req.price,
        "updated_at":  chrono::Utc::now().to_rfc3339(),
    };

    let listing = state
        .mongo
        .update(&id, seller_id, update_doc)
        .await?
        .ok_or(AppError::NotFound)?;

    Ok(Json(ListingResponse::from(listing)))
}

// ── DELETE /listings/:id ───────────────────────────────────────
pub async fn delete(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
) -> Result<StatusCode> {
    require_internal_request(&state, &headers)?;
    let seller_id = extract_user_id(&headers)?;
    let admin = is_admin(&headers);

    let deleted = state.mongo.delete(&id, seller_id, admin).await?;
    if !deleted {
        return Err(AppError::NotFound);
    }

    // Kafka event
    let _ = state
        .kafka
        .produce(
            "polymarket.listings.deleted",
            &id,
            &json!({ "event": "listing.deleted", "id": id, "ts": chrono::Utc::now().to_rfc3339() }),
        )
        .await;

    Ok(StatusCode::NO_CONTENT)
}

// ── POST /listings/:id/mark-sold ───────────────────────────────
pub async fn mark_sold(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
) -> Result<Json<ListingResponse>> {
    require_internal_request(&state, &headers)?;
    let seller_id = extract_user_id(&headers)?;
    let listing = state
        .mongo
        .mark_sold(&id, seller_id)
        .await?
        .ok_or(AppError::NotFound)?;

    let _ = state.kafka.produce(
        "polymarket.listings.sold",
        &id,
        &json!({ "event": "listing.sold", "id": id, "seller_id": seller_id, "ts": chrono::Utc::now().to_rfc3339() }),
    ).await;

    Ok(Json(ListingResponse::from(listing)))
}
