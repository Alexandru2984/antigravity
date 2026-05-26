package com.polymarket.search.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.polymarket.search.service.SearchService;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.junit.jupiter.api.Test;

import java.io.IOException;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

class ListingIndexingConsumerTest {

    private final SearchService searchService = mock(SearchService.class);
    private final ListingIndexingConsumer consumer = new ListingIndexingConsumer(searchService, new ObjectMapper());

    @Test
    void indexesCreatedListingEvents() throws IOException {
        consumer.onListingCreated(record(
                ListingIndexingConsumer.LISTINGS_CREATED_TOPIC,
                "{\"id\":\"listing-1\",\"title\":\"Camera\"}"
        ));

        verify(searchService).indexListing("listing-1", java.util.Map.of(
                "id", "listing-1",
                "title", "Camera"
        ));
    }

    @Test
    void removesSoldListingsFromSearch() throws IOException {
        consumer.onListingRemoved(record(
                ListingIndexingConsumer.LISTINGS_SOLD_TOPIC,
                "{\"id\":\"listing-2\"}"
        ));

        verify(searchService).removeListing("listing-2");
    }

    @Test
    void ignoresEventsWithoutListingId() throws IOException {
        consumer.onListingCreated(record(
                ListingIndexingConsumer.LISTINGS_CREATED_TOPIC,
                "{\"title\":\"Missing id\"}"
        ));

        verifyNoInteractions(searchService);
    }

    private ConsumerRecord<String, String> record(String topic, String payload) {
        return new ConsumerRecord<>(topic, 0, 0, "key", payload);
    }
}
