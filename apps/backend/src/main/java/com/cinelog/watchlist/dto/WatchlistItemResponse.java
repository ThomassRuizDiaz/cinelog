package com.cinelog.watchlist.dto;

import com.cinelog.movie.MetadataSource;
import java.time.LocalDateTime;
import java.util.List;

public record WatchlistItemResponse(
        Long id,
        Long tmdbId,
        MetadataSource metadataSource,
        String title,
        String originalTitle,
        Integer releaseYear,
        List<String> directors,
        String posterPath,
        String posterUrl,
        List<String> genres,
        String notes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
