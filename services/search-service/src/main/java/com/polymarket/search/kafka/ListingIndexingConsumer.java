package com.polymarket.search.kafka;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.polymarket.search.service.SearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class ListingIndexingConsumer {

    static final String LISTINGS_CREATED_TOPIC = "polymarket.listings.created";
    static final String LISTINGS_UPDATED_TOPIC = "polymarket.listings.updated";
    static final String LISTINGS_DELETED_TOPIC = "polymarket.listings.deleted";
    static final String LISTINGS_EXPIRED_TOPIC = "polymarket.listings.expired";
    static final String LISTINGS_SOLD_TOPIC = "polymarket.listings.sold";

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    private final SearchService searchService;
    private final ObjectMapper  objectMapper;

    /**
     * Indexes newly created or updated listings into OpenSearch.
     */
    @KafkaListener(topics = {LISTINGS_CREATED_TOPIC, LISTINGS_UPDATED_TOPIC}, groupId = "search-service-indexer")
    public void onListingCreated(ConsumerRecord<String, String> record) {
        try {
            Map<String, Object> payload = objectMapper.readValue(record.value(), MAP_TYPE);
            String id = listingId(payload);
            if (id == null) {
                log.warn("[Kafka→OS] Ignoring listing event without id: topic={}", record.topic());
                return;
            }
            searchService.indexListing(id, payload);
            log.info("[Kafka→OS] Indexed listing {}", id);
        } catch (Exception e) {
            log.error("[Kafka→OS] Failed to index listing: {}", e.getMessage(), e);
        }
    }

    /**
     * Removes deleted or expired listings from the search index.
     */
    @KafkaListener(topics = {LISTINGS_DELETED_TOPIC, LISTINGS_EXPIRED_TOPIC, LISTINGS_SOLD_TOPIC},
                   groupId = "search-service-indexer")
    public void onListingRemoved(ConsumerRecord<String, String> record) {
        try {
            Map<String, Object> payload = objectMapper.readValue(record.value(), MAP_TYPE);
            String id = listingId(payload);
            if (id == null) {
                log.warn("[Kafka→OS] Ignoring listing removal without id: topic={}", record.topic());
                return;
            }
            searchService.removeListing(id);
            log.info("[Kafka→OS] Removed listing {}", id);
        } catch (Exception e) {
            log.error("[Kafka→OS] Failed to remove listing: {}", e.getMessage(), e);
        }
    }

    private String listingId(Map<String, Object> payload) {
        Object rawId = payload.get("id");
        if (rawId instanceof String id && !id.isBlank()) {
            return id;
        }
        return null;
    }
}
