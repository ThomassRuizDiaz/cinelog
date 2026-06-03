package com.cinelog.recommendation.dto;

import java.util.List;

public record TasteProfileResponse(
        List<RecommendationMovieSignalResponse> topPersonal,
        List<RecommendationMovieSignalResponse> topImpactEnjoyment,
        List<RecommendationMovieSignalResponse> topTechnical,
        List<String> favoriteDirectors,
        List<String> favoriteGenres) {
}
