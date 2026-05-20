#pragma once
#include <string>

class KafkaProducer {
public:
    KafkaProducer();
    void publish(const std::string &topic, const std::string &payload);
private:
    std::string _brokers;
};
