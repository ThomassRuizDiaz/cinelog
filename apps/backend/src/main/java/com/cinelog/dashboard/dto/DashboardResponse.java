package com.cinelog.dashboard.dto;

import com.cinelog.ranking.dto.RankingItemResponse;
import java.util.List;

public record DashboardResponse(
        DashboardStatsResponse stats,
        DashboardLatestWatchResponse latestWatch,
        List<RankingItemResponse> topPersonal,
        List<RankingItemResponse> topTechnical,
        List<DashboardMovieResponse> recentlyAdded) {
}
