use anyhow::Result;
use axum::{
    http::{header, HeaderName, HeaderValue, Method},
    routing::{get, post},
    Router,
};

use std::sync::Arc;
use std::time::Duration;
use tower::ServiceBuilder;
use tower_http::{
    cors::{AllowOrigin, CorsLayer},
    request_id::MakeRequestUuid,
    timeout::TimeoutLayer,
    trace::TraceLayer,
    ServiceBuilderExt,
};

mod config;
mod db;
mod error;
mod handlers;
mod kafka;
mod models;

use config::Config;
use db::mongodb::MongoRepo;
use kafka::KafkaProducer;

pub type AppState = Arc<AppStateInner>;

pub struct AppStateInner {
    pub mongo: MongoRepo,
    pub kafka: KafkaProducer,
    pub internal_service_token: String,
}

fn cors_origins() -> Result<Vec<HeaderValue>> {
    let configured = std::env::var("CORS_ORIGINS")
        .or_else(|_| std::env::var("FRONTEND_URL"))
        .unwrap_or_else(|_| "http://localhost:3000".to_string());

    configured
        .split(',')
        .map(str::trim)
        .filter(|origin| !origin.is_empty())
        .map(|origin| origin.parse::<HeaderValue>().map_err(Into::into))
        .collect()
}

#[tokio::main]
async fn main() -> Result<()> {
    dotenvy::dotenv().ok();

    // Logging / OTEL tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive("listing_service=debug".parse()?),
        )
        .json()
        .init();

    let cfg = Config::from_env()?;

    tracing::info!("Connecting to MongoDB...");
    let mongo = MongoRepo::new(&cfg.mongo_uri, &cfg.mongo_db).await?;

    tracing::info!("Connecting to Kafka...");
    let kafka = KafkaProducer::new(&cfg.kafka_brokers)?;

    let state: AppState = Arc::new(AppStateInner {
        mongo,
        kafka,
        internal_service_token: cfg.internal_service_token,
    });

    let cors = CorsLayer::new()
        .allow_origin(AllowOrigin::list(cors_origins()?))
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers([
            header::AUTHORIZATION,
            header::CONTENT_TYPE,
            HeaderName::from_static("x-request-id"),
        ])
        .allow_credentials(true)
        .max_age(Duration::from_secs(600));

    let app = Router::new()
        // ── Health ──────────────────────────────────────────────
        .route("/health", get(handlers::health::health))
        // ── Listings ────────────────────────────────────────────
        .route(
            "/listings",
            get(handlers::listing::list).post(handlers::listing::create),
        )
        .route(
            "/listings/:id",
            get(handlers::listing::get_by_id)
                .put(handlers::listing::update)
                .delete(handlers::listing::delete),
        )
        .route(
            "/listings/:id/mark-sold",
            post(handlers::listing::mark_sold),
        )
        .with_state(state)
        .layer(
            ServiceBuilder::new()
                .layer(TraceLayer::new_for_http())
                .layer(cors)
                .layer(TimeoutLayer::new(Duration::from_secs(30)))
                .set_x_request_id(MakeRequestUuid)
                .propagate_x_request_id(),
        );

    let addr = format!("0.0.0.0:{}", cfg.port);
    tracing::info!("🦀 Listing Service running on {addr}");

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
