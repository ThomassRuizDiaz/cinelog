package com.cinelog.recommendation.dto;

import java.time.Instant;
import java.util.List;

public record RecommendationExportResponse(
        String prompt,
        String markdown,
        Instant generatedAt,
        TasteProfileResponse tasteProfile,
        List<AlreadyWatchedRecommendationResponse> alreadyWatched,
        List<WatchlistRecommendationResponse> watchlist,
        RecommendationPrivacyResponse privacy) {
}
