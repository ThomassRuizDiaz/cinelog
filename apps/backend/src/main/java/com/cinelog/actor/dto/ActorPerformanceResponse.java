package com.cinelog.actor.dto;

import com.cinelog.movie.dto.MovieRatingSummaryResponse;

public record ActorPerformanceResponse(
        Long movieId,
        String title,
        Integer releaseYear,
        String posterUrl,
        String characterName,
        int castOrder,
        MovieRatingSummaryResponse activeRating) {
}
