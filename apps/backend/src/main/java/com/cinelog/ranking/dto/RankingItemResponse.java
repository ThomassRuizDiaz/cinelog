package com.cinelog.ranking.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record RankingItemResponse(
        int rank,
        Long movieId,
        String title,
        Integer releaseYear,
        List<String> directors,
        String posterUrl,
        List<String> genres,
        BigDecimal score,
        String scoreLabel,
        BigDecimal technicalScore,
        BigDecimal objectiveScore,
        BigDecimal personalFinalScore,
        LocalDate latestWatchedAt) {
}
