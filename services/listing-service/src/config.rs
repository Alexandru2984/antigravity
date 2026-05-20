use std::env;
use anyhow::Result;

#[derive(Debug, Clone)]
pub struct Config {
    pub port:         u16,
    pub mongo_uri:    String,
    pub mongo_db:     String,
    pub kafka_brokers: String,
    pub redis_url:    String,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        Ok(Self {
            port:          env::var("PORT").unwrap_or("4022".into()).parse()?,
            mongo_uri:     env::var("MONGO_URI")
                .unwrap_or("mongodb://polymarket:polymarket_dev@localhost:27017".into()),
            mongo_db:      env::var("MONGO_DB").unwrap_or("polymarket".into()),
            kafka_brokers: env::var("KAFKA_BROKERS").unwrap_or("localhost:9092".into()),
            redis_url:     env::var("REDIS_URL").unwrap_or("redis://localhost:6379".into()),
        })
    }
}
