package com.polymarket.search.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.opensearch.client.opensearch.OpenSearchClient;
import org.opensearch.client.opensearch._types.query_dsl.*;
import org.opensearch.client.opensearch.core.*;
import org.opensearch.client.opensearch.core.search.Hit;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class SearchService {

    private static final String INDEX = "listings";
    private final OpenSearchClient client;

    /**
     * Full-text search across title and description.
     * Also supports category filter and price range.
     */
    public Map<String, Object> search(
            String q,
            String category,
            Long minPrice,
            Long maxPrice,
            int page,
            int size
    ) throws IOException {

        // Build the compound bool query
        BoolQuery.Builder bool = new BoolQuery.Builder();

        if (q != null && !q.isBlank()) {
            bool.must(MultiMatchQuery.of(m -> m
                    .query(q)
                    .fields("title^3", "description", "location.city^2", "category^2")
                    .fuzziness("AUTO")
                    .type(TextQueryType.BestFields)
            )._toQuery());
        } else {
            bool.must(MatchAllQuery.of(m -> m)._toQuery());
        }

        if (category != null && !category.isBlank()) {
            bool.filter(TermQuery.of(t -> t.field("category").value(category))._toQuery());
        }
        if (minPrice != null || maxPrice != null) {
            var range = RangeQuery.of(r -> {
                var b = r.field("price");
                if (minPrice != null) b.gte(JsonData.of(minPrice));
                if (maxPrice != null) b.lte(JsonData.of(maxPrice));
                return b;
            })._toQuery();
            bool.filter(range);
        }
        // Only show active listings
        bool.filter(TermQuery.of(t -> t.field("status").value("active"))._toQuery());

        SearchResponse<Map> response = client.search(s -> s
                .index(INDEX)
                .query(bool.build()._toQuery())
                .from((page - 1) * size)
                .size(size)
                .highlight(h -> h
                        .fields("title", f -> f.numberOfFragments(0))
                        .fields("description", f -> f.numberOfFragments(1).fragmentSize(200))
                ), Map.class);

        List<Map<String, Object>> hits = new ArrayList<>();
        for (Hit<Map> hit : response.hits().hits()) {
            Map<String, Object> result = new LinkedHashMap<>(hit.source() != null ? hit.source() : Map.of());
            result.put("_score", hit.score());
            result.put("_highlights", hit.highlight());
            hits.add(result);
        }

        return Map.of(
                "data",     hits,
                "total",    response.hits().total() != null ? response.hits().total().value() : 0,
                "page",     page,
                "size",     size,
                "hasNext",  hits.size() == size
        );
    }

    /**
     * Index (upsert) a listing document received from Kafka.
     */
    public void indexListing(String id, Map<String, Object> listing) throws IOException {
        client.index(i -> i.index(INDEX).id(id).document(listing));
        log.debug("[OpenSearch] Indexed listing {}", id);
    }

    /**
     * Remove a listing from the index (called on delete/expire events).
     */
    public void removeListing(String id) throws IOException {
        try {
            client.delete(d -> d.index(INDEX).id(id));
            log.debug("[OpenSearch] Removed listing {}", id);
        } catch (Exception e) {
            log.warn("[OpenSearch] Could not remove listing {}: {}", id, e.getMessage());
        }
    }
}
