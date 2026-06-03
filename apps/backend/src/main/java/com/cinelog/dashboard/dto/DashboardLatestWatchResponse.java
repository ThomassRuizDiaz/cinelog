package com.cinelog.dashboard.dto;

import com.cinelog.movie.dto.MovieRatingSummaryResponse;
import com.cinelog.watch.WatchLocation;
import com.cinelog.watch.WatchType;
import java.time.LocalDate;

public record DashboardLatestWatchResponse(
        Long watchEntryId,
        Long movieId,
        String title,
        String posterUrl,
        MovieRatingSummaryResponse activeRating,
        LocalDate watchedAt,
        WatchType watchType,
        WatchLocation watchLocation) {
}
