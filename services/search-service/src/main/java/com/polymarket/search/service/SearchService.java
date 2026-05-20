package com.polymarket.search.service;

import com.polymarket.search.model.MarketDocument;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.opensearch.client.opensearch.OpenSearchClient;
import org.opensearch.client.opensearch._types.FieldValue;
import org.opensearch.client.opensearch._types.query_dsl.BoolQuery;
import org.opensearch.client.opensearch._types.query_dsl.Query;
import org.opensearch.client.opensearch.core.SearchResponse;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class SearchService {

    private final OpenSearchClient client;

    public List<MarketDocument> searchMarkets(String text, String category, String status) throws IOException {
        BoolQuery.Builder bool = new BoolQuery.Builder();

        if (text != null && !text.isEmpty()) {
            bool.must(m -> m.multiMatch(mm -> mm.fields("title", "description").query(text)));
        }

        if (category != null && !category.isEmpty()) {
            bool.filter(f -> f.term(t -> t.field("category").value(FieldValue.of(category))));
        }

        if (status != null && !status.isEmpty()) {
            bool.filter(f -> f.term(t -> t.field("status").value(FieldValue.of(status))));
        }

        SearchResponse<MarketDocument> response = client.search(s -> s
                        .index("markets")
                        .query(new Query(bool.build())),
                MarketDocument.class
        );

        return response.hits().hits().stream()
                .map(hit -> hit.source())
                .collect(Collectors.toList());
    }
}
