#include "KafkaProducer.h"
#include <librdkafka/rdkafkacpp.h>
#include <cstdlib>
#include <iostream>
#include <stdexcept>

KafkaProducer::KafkaProducer() {
    _brokers = std::getenv("KAFKA_BROKERS") ? std::getenv("KAFKA_BROKERS") : "kafka:9092";
}

void KafkaProducer::publish(const std::string &topic, const std::string &payload) {
    std::string errstr;
    auto *conf = RdKafka::Conf::create(RdKafka::Conf::CONF_GLOBAL);
    conf->set("bootstrap.servers", _brokers, errstr);
    conf->set("message.timeout.ms", "5000", errstr);

    auto *producer = RdKafka::Producer::create(conf, errstr);
    delete conf;

    if (!producer) {
        std::cerr << "[KafkaProducer] Failed to create producer: " << errstr << std::endl;
        return;
    }

    auto ec = producer->produce(
        topic,
        RdKafka::Topic::PARTITION_UA,
        RdKafka::Producer::RK_MSG_COPY,
        const_cast<char *>(payload.data()), payload.size(),
        nullptr, 0,
        0, nullptr, nullptr
    );

    if (ec != RdKafka::ERR_NO_ERROR) {
        std::cerr << "[KafkaProducer] Produce error: " << RdKafka::err2str(ec) << std::endl;
    }

    producer->flush(3000);
    delete producer;
}
