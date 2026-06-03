package com.cinelog.dashboard.dto;

import com.cinelog.movie.dto.MovieRatingSummaryResponse;
import java.time.LocalDateTime;
import java.util.List;

public record DashboardMovieResponse(
        Long movieId,
        String title,
        Integer releaseYear,
        List<String> directors,
        String posterUrl,
        List<String> genres,
        MovieRatingSummaryResponse activeRating,
        LocalDateTime createdAt) {
}
