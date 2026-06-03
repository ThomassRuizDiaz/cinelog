package com.cinelog.watch.dto;

import com.cinelog.movie.dto.MovieRatingSummaryResponse;
import com.cinelog.watch.WatchLocation;
import com.cinelog.watch.WatchType;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record WatchEntryResponse(
        Long id,
        Long movieId,
        LocalDate watchedAt,
        WatchType watchType,
        WatchLocation watchLocation,
        String notes,
        MovieRatingSummaryResponse rating,
        boolean activeRating,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
