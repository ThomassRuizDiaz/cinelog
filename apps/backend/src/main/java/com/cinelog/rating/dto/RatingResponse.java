package com.cinelog.rating.dto;

import java.math.BigDecimal;
import java.util.Map;

public record RatingResponse(
        Long id,
        Long watchEntryId,
        BigDecimal storyScreenplay,
        BigDecimal direction,
        BigDecimal performancesCharacters,
        BigDecimal pacingEditing,
        BigDecimal visualsArtDesign,
        BigDecimal musicSound,
        BigDecimal themesDepth,
        BigDecimal originalityConcept,
        BigDecimal personalImpactEnjoyment,
        BigDecimal technicalScore,
        BigDecimal objectiveScore,
        BigDecimal displayScore,
        BigDecimal personalFinalScore,
        BigDecimal personalRankingScore,
        String reviewSummary,
        String privateNotes,
        Map<String, String> categoryNotes,
        int ratingProfileVersion) {
}
