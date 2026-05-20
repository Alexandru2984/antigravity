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

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    private final SearchService searchService;
    private final ObjectMapper  objectMapper;

    /**
     * Indexes newly created or updated listings into OpenSearch.
     */
    @KafkaListener(topics = "polymarket.listings.created", groupId = "search-service-indexer")
    public void onListingCreated(ConsumerRecord<String, String> record) {
        try {
            Map<String, Object> payload = objectMapper.readValue(record.value(), MAP_TYPE);
            String id = (String) payload.get("id");
            searchService.indexListing(id, payload);
            log.info("[Kafka→OS] Indexed listing {}", id);
        } catch (Exception e) {
            log.error("[Kafka→OS] Failed to index listing: {}", e.getMessage(), e);
        }
    }

    /**
     * Removes deleted or expired listings from the search index.
     */
    @KafkaListener(topics = {"polymarket.listings.deleted", "polymarket.listings.expired"},
                   groupId = "search-service-indexer")
    public void onListingRemoved(ConsumerRecord<String, String> record) {
        try {
            Map<String, Object> payload = objectMapper.readValue(record.value(), MAP_TYPE);
            String id = (String) payload.get("id");
            searchService.removeListing(id);
            log.info("[Kafka→OS] Removed listing {}", id);
        } catch (Exception e) {
            log.error("[Kafka→OS] Failed to remove listing: {}", e.getMessage(), e);
        }
    }
}
