package com.polymarket.search.controller;

import com.polymarket.search.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "service", "search-service");
    }

    /**
     * GET /search?q=keyword&category=cars&minPrice=1000&maxPrice=50000&page=1&size=20
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> search(
            @RequestParam(required = false)         String q,
            @RequestParam(required = false)         String category,
            @RequestParam(required = false)         Long   minPrice,
            @RequestParam(required = false)         Long   maxPrice,
            @RequestParam(defaultValue = "1")       int    page,
            @RequestParam(defaultValue = "20")      int    size
    ) throws IOException {
        var result = searchService.search(q, category, minPrice, maxPrice,
                Math.max(1, page), Math.min(100, size));
        return ResponseEntity.ok(result);
    }
}
