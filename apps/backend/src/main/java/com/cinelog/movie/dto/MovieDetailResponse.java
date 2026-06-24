package com.cinelog.movie.dto;

import com.cinelog.movie.MetadataSource;
import com.cinelog.actor.dto.CastMemberResponse;
import com.cinelog.watch.dto.WatchEntryResponse;
import java.time.LocalDateTime;
import java.util.List;

public record MovieDetailResponse(
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
        List<CastMemberResponse> cast,
        MovieRatingSummaryResponse activeRating,
        MovieRankingSummaryResponse rankingSummary,
        List<WatchEntryResponse> watchEntries,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
