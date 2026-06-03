package com.cinelog.movie.dto;

import java.math.BigDecimal;

public record MovieRatingSummaryResponse(
        BigDecimal technicalScore,
        BigDecimal objectiveScore,
        BigDecimal displayScore,
        BigDecimal personalFinalScore,
        BigDecimal personalRankingScore) {
}
