package com.polymarket.search.service;

import com.polymarket.search.model.MarketDocument;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.opensearch.client.json.JsonData;
import org.opensearch.client.opensearch.OpenSearchClient;
import org.opensearch.client.opensearch._types.FieldValue;
import org.opensearch.client.opensearch._types.query_dsl.BoolQuery;
import org.opensearch.client.opensearch._types.query_dsl.Query;
import org.opensearch.client.opensearch.core.SearchResponse;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class SearchService {

    private final OpenSearchClient client;

    public List<MarketDocument> search(String text, String category, Long minVolume, Long maxVolume, int page, int size) throws IOException {
        BoolQuery.Builder bool = new BoolQuery.Builder();

        if (text != null && !text.isEmpty()) {
            bool.must(m -> m.multiMatch(mm -> mm.fields("title", "description").query(text)));
        }

        if (category != null && !category.isEmpty()) {
            bool.filter(f -> f.term(t -> t.field("category").value(FieldValue.of(category))));
        }

        if (minVolume != null || maxVolume != null) {
            bool.filter(f -> f.range(r -> {
                var range = r.field("volume");
                if (minVolume != null) {
                    range.gte(JsonData.of(minVolume));
                }
                if (maxVolume != null) {
                    range.lte(JsonData.of(maxVolume));
                }
                return range;
            }));
        }

        SearchResponse<MarketDocument> response = client.search(s -> s
                        .index("markets")
                        .query(new Query(bool.build()))
                        .from(page * size)
                        .size(size),
                MarketDocument.class
        );

        return response.hits().hits().stream()
                .map(hit -> hit.source())
                .collect(Collectors.toList());
    }

    public void indexListing(String id, Map<String, Object> data) throws IOException {
        client.index(i -> i
            .index("markets")
            .id(id)
            .document(data)
        );
    }

    public void removeListing(String id) throws IOException {
        client.delete(d -> d
            .index("markets")
            .id(id)
        );
    }
}
