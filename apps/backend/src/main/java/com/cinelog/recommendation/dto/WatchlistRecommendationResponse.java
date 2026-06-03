package com.cinelog.recommendation.dto;

import java.util.List;

public record WatchlistRecommendationResponse(
        String title,
        Integer releaseYear,
        List<String> directors,
        List<String> genres) {
}
