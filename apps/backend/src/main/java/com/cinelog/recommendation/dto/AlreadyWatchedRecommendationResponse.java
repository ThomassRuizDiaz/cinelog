package com.cinelog.recommendation.dto;

import java.math.BigDecimal;
import java.util.List;

public record AlreadyWatchedRecommendationResponse(
        String title,
        Integer releaseYear,
        List<String> directors,
        List<String> genres,
        BigDecimal displayScore,
        String reviewSummary,
        String privateNotes) {
}
