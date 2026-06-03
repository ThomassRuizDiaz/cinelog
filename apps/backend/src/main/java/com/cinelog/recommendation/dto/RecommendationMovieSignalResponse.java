package com.cinelog.recommendation.dto;

import java.math.BigDecimal;
import java.util.List;

public record RecommendationMovieSignalResponse(
        String title,
        Integer releaseYear,
        List<String> directors,
        List<String> genres,
        BigDecimal score) {
}
