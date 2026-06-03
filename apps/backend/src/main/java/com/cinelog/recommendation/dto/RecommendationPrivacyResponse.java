package com.cinelog.recommendation.dto;

public record RecommendationPrivacyResponse(
        boolean includePrivateNotes,
        String warning) {
}
