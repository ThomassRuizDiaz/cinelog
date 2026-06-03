package com.cinelog.dashboard.dto;

import java.math.BigDecimal;

public record DashboardStatsResponse(
        long totalMovies,
        long totalWatchEntries,
        long totalRewatches,
        BigDecimal averageTechnicalScore,
        BigDecimal averagePersonalScore) {
}
