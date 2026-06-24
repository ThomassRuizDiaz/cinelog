package com.cinelog.movie.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MovieRankingSummaryResponse(
        Long movieId,
        BigDecimal personalScore,
        String scoreLabel,
        BigDecimal technicalScore,
        BigDecimal objectiveScore,
        BigDecimal displayScore,
        BigDecimal personalFinalScore,
        LocalDate latestWatchedAt) {
}
