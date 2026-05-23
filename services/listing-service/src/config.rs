use anyhow::Result;
use std::env;

#[derive(Debug, Clone)]
pub struct Config {
    pub port: u16,
    pub mongo_uri: String,
    pub mongo_db: String,
    pub kafka_brokers: String,
    pub internal_service_token: String,
    #[allow(dead_code)]
    pub redis_url: String,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        let internal_service_token = env::var("INTERNAL_SERVICE_TOKEN")?;
        if internal_service_token.trim().is_empty() {
            anyhow::bail!("INTERNAL_SERVICE_TOKEN must not be empty");
        }

        Ok(Self {
            port: env::var("PORT").unwrap_or("4002".into()).parse()?,
            mongo_uri: env::var("MONGO_URI")
                .unwrap_or("mongodb://polymarket:polymarket_dev@localhost:27017".into()),
            mongo_db: env::var("MONGO_DB").unwrap_or("polymarket".into()),
            kafka_brokers: env::var("KAFKA_BROKERS").unwrap_or("localhost:9092".into()),
            internal_service_token,
            redis_url: env::var("REDIS_URL").unwrap_or("redis://localhost:6379".into()),
        })
    }
}
