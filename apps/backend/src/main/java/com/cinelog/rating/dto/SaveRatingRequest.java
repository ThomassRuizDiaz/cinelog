package com.cinelog.rating.dto;

import com.cinelog.rating.CategoryScore;
import com.cinelog.rating.ScoringService;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.Map;

public record SaveRatingRequest(
        @NotNull @CategoryScore BigDecimal storyScreenplay,
        @NotNull @CategoryScore BigDecimal direction,
        @NotNull @CategoryScore BigDecimal performancesCharacters,
        @NotNull @CategoryScore BigDecimal pacingEditing,
        @NotNull @CategoryScore BigDecimal visualsArtDesign,
        @NotNull @CategoryScore BigDecimal musicSound,
        @NotNull @CategoryScore BigDecimal themesDepth,
        @NotNull @CategoryScore BigDecimal originalityConcept,
        @NotNull @CategoryScore BigDecimal personalImpactEnjoyment,
        @CategoryScore BigDecimal personalFinalScore,
        String reviewSummary,
        String privateNotes,
        Map<String, String> categoryNotes) {

    public ScoringService.ScoreInput toScoreInput() {
        return new ScoringService.ScoreInput(
                storyScreenplay,
                direction,
                performancesCharacters,
                pacingEditing,
                visualsArtDesign,
                musicSound,
                themesDepth,
                originalityConcept,
                personalImpactEnjoyment,
                personalFinalScore);
    }
}
