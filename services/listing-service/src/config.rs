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
        Self::from_env_with(|key| env::var(key).ok())
    }

    fn from_env_with(get_env: impl Fn(&str) -> Option<String>) -> Result<Self> {
        let internal_service_token = required_env(&get_env, "INTERNAL_SERVICE_TOKEN")?;
        if internal_service_token.trim().is_empty() {
            anyhow::bail!("INTERNAL_SERVICE_TOKEN must not be empty");
        }

        Ok(Self {
            port: get_env("PORT").unwrap_or("4002".into()).parse()?,
            mongo_uri: required_env(&get_env, "MONGO_URI")?,
            mongo_db: get_env("MONGO_DB").unwrap_or("polymarket".into()),
            kafka_brokers: required_env(&get_env, "KAFKA_BROKERS")?,
            internal_service_token,
            redis_url: get_env("REDIS_URL").unwrap_or("redis://localhost:6379".into()),
        })
    }
}

fn required_env(get_env: &impl Fn(&str) -> Option<String>, key: &str) -> Result<String> {
    let value = get_env(key).ok_or_else(|| anyhow::anyhow!("{key} is required"))?;
    if value.trim().is_empty() {
        anyhow::bail!("{key} must not be empty");
    }
    Ok(value)
}

#[cfg(test)]
mod tests {
    use super::Config;
    use std::collections::HashMap;

    #[test]
    fn requires_runtime_connection_settings() {
        let error = Config::from_env_with(|_| None).unwrap_err();

        assert_eq!(error.to_string(), "INTERNAL_SERVICE_TOKEN is required");
    }

    #[test]
    fn rejects_blank_required_values() {
        let env = HashMap::from([
            ("INTERNAL_SERVICE_TOKEN", "internal-token"),
            ("MONGO_URI", " "),
            ("KAFKA_BROKERS", "kafka:29092"),
        ]);

        let error =
            Config::from_env_with(|key| env.get(key).map(|value| value.to_string())).unwrap_err();

        assert_eq!(error.to_string(), "MONGO_URI must not be empty");
    }

    #[test]
    fn keeps_safe_defaults_for_non_secret_settings() {
        let env = HashMap::from([
            ("INTERNAL_SERVICE_TOKEN", "internal-token"),
            ("MONGO_URI", "mongodb://mongo:27017/polymarket"),
            ("KAFKA_BROKERS", "kafka:29092"),
        ]);

        let config =
            Config::from_env_with(|key| env.get(key).map(|value| value.to_string())).unwrap();

        assert_eq!(config.port, 4002);
        assert_eq!(config.mongo_db, "polymarket");
        assert_eq!(config.kafka_brokers, "kafka:29092");
        assert_eq!(config.redis_url, "redis://localhost:6379");
    }
}
