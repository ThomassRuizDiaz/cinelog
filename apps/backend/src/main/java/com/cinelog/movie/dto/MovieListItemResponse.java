package com.cinelog.movie.dto;

import java.time.LocalDate;
import java.util.List;

public record MovieListItemResponse(
        Long id,
        String title,
        String originalTitle,
        Integer releaseYear,
        List<String> directors,
        String posterUrl,
        List<String> genres,
        LocalDate latestWatchedAt,
        long watchCount,
        MovieRatingSummaryResponse activeRating) {
}
