package com.cinelog.watchlist.dto;

import jakarta.validation.constraints.Size;

public record UpdateWatchlistItemRequest(
        @Size(max = 5000) String notes) {
}
