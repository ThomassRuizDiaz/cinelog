package com.cinelog.watchlist.dto;

import com.cinelog.watch.WatchLocation;
import com.cinelog.watch.WatchType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record ConvertWatchlistItemRequest(
        @NotNull LocalDate watchedAt,
        @NotNull WatchType watchType,
        @NotNull WatchLocation watchLocation,
        @Size(max = 5000) String notes) {
}
