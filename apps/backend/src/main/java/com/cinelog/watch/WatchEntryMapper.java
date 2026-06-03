package com.cinelog.watch;

import com.cinelog.movie.MovieRatingSummaryMapper;
import com.cinelog.watch.dto.WatchEntryResponse;
import org.springframework.stereotype.Component;

@Component
public class WatchEntryMapper {

    private final MovieRatingSummaryMapper ratingSummaryMapper;

    public WatchEntryMapper(MovieRatingSummaryMapper ratingSummaryMapper) {
        this.ratingSummaryMapper = ratingSummaryMapper;
    }

    public WatchEntryResponse map(WatchEntry watchEntry) {
        boolean activeRating = watchEntry.getMovie().getActiveWatchEntry() != null
                && watchEntry.getMovie().getActiveWatchEntry().getId().equals(watchEntry.getId());
        return new WatchEntryResponse(
                watchEntry.getId(),
                watchEntry.getMovie().getId(),
                watchEntry.getWatchedAt(),
                watchEntry.getWatchType(),
                watchEntry.getWatchLocation(),
                watchEntry.getNotes(),
                ratingSummaryMapper.map(watchEntry.getRating()),
                activeRating,
                watchEntry.getCreatedAt(),
                watchEntry.getUpdatedAt());
    }
}
