package com.cinelog.watchlist.dto;

import com.cinelog.movie.dto.MovieDetailResponse;
import com.cinelog.watch.dto.WatchEntryResponse;

public record ConvertWatchlistItemResponse(
        MovieDetailResponse movie,
        WatchEntryResponse watchEntry) {
}
