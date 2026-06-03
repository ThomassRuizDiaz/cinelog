package com.cinelog.external.dto;

import java.util.List;

public record ExternalMovieResponse(
        String source,
        String externalId,
        String title,
        String originalTitle,
        Integer releaseYear,
        List<String> directors,
        String posterPath,
        String posterUrl,
        List<String> genres) {
}
