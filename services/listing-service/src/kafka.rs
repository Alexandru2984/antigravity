use anyhow::Result;
use rdkafka::{
    config::ClientConfig,
    producer::{FutureProducer, FutureRecord},
    util::Timeout,
};
use serde::Serialize;
use std::time::Duration;

#[derive(Clone)]
pub struct KafkaProducer {
    producer: FutureProducer,
}

impl KafkaProducer {
    pub fn new(brokers: &str) -> Result<Self> {
        let producer: FutureProducer = ClientConfig::new()
            .set("bootstrap.servers", brokers)
            .set("message.timeout.ms", "5000")
            .set("acks", "1")
            .create()?;

        tracing::info!("[Kafka] Producer ready (brokers: {brokers})");
        Ok(Self { producer })
    }

    pub async fn produce<T: Serialize>(&self, topic: &str, key: &str, payload: &T) -> Result<()> {
        let value = serde_json::to_string(payload)?;

        self.producer
            .send(
                FutureRecord::to(topic).payload(&value).key(key),
                Timeout::After(Duration::from_secs(5)),
            )
            .await
            .map_err(|(e, _)| anyhow::anyhow!("Kafka produce error: {e}"))?;

        tracing::debug!("[Kafka] Produced to {topic}: {value}");
        Ok(())
    }
}
