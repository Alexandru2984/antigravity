package com.polymarket.search.controller;

import com.polymarket.search.model.MarketDocument;
import com.polymarket.search.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private static final int MAX_PAGE_SIZE = 100;

    private final SearchService searchService;

    @GetMapping
    public ResponseEntity<List<MarketDocument>> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Long minVolume,
            @RequestParam(required = false) Long maxVolume,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) throws IOException {
        validateSearchRequest(minVolume, maxVolume, page, size);
        List<MarketDocument> results = searchService.search(q, category, minVolume, maxVolume, page, size);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> status = new HashMap<>();
        status.put("status", "ok");
        return ResponseEntity.ok(status);
    }

    private void validateSearchRequest(Long minVolume, Long maxVolume, int page, int size) {
        if (page < 0) {
            throw badRequest("page must be greater than or equal to 0");
        }
        if (size < 1 || size > MAX_PAGE_SIZE) {
            throw badRequest("size must be between 1 and " + MAX_PAGE_SIZE);
        }
        if (minVolume != null && minVolume < 0) {
            throw badRequest("minVolume must be greater than or equal to 0");
        }
        if (maxVolume != null && maxVolume < 0) {
            throw badRequest("maxVolume must be greater than or equal to 0");
        }
        if (minVolume != null && maxVolume != null && minVolume > maxVolume) {
            throw badRequest("minVolume must be less than or equal to maxVolume");
        }
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
