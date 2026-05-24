package com.polymarket.search.controller;

import com.polymarket.search.model.MarketDocument;
import com.polymarket.search.service.SearchService;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SearchControllerTest {

    private final SearchService searchService = mock(SearchService.class);
    private final SearchController controller = new SearchController(searchService);

    @Test
    void forwardsValidatedSearchRequest() throws IOException {
        var documents = List.of(new MarketDocument(
                "listing-1",
                "Camera",
                "Mirrorless camera",
                "electronics",
                "active",
                1500.0
        ));
        when(searchService.search("camera", "electronics", 100L, 2000L, 1, 25))
                .thenReturn(documents);

        var response = controller.search("camera", "electronics", 100L, 2000L, 1, 25);

        assertEquals(documents, response.getBody());
        verify(searchService).search("camera", "electronics", 100L, 2000L, 1, 25);
    }

    @Test
    void rejectsNegativePage() {
        assertBadRequest(-1, 10, null, null);
    }

    @Test
    void rejectsOversizedPageSize() {
        assertBadRequest(0, 101, null, null);
    }

    @Test
    void rejectsInvertedVolumeRange() {
        assertBadRequest(0, 10, 200L, 100L);
    }

    private void assertBadRequest(int page, int size, Long minVolume, Long maxVolume) {
        var error = assertThrows(
                ResponseStatusException.class,
                () -> controller.search(null, null, minVolume, maxVolume, page, size)
        );

        assertEquals(400, error.getStatusCode().value());
    }
}
