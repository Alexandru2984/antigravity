package com.polymarket.search.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MarketDocument {
    private String id;
    private String title;
    private String description;
    private String category;
    private String status;
    private Double volume;
}
