package com.cinelog.watchlist;

import com.cinelog.watchlist.dto.ConvertWatchlistItemRequest;
import com.cinelog.watchlist.dto.ConvertWatchlistItemResponse;
import com.cinelog.watchlist.dto.CreateWatchlistItemRequest;
import com.cinelog.watchlist.dto.UpdateWatchlistItemRequest;
import com.cinelog.watchlist.dto.WatchlistItemResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/watchlist")
public class WatchlistController {

    private final WatchlistService watchlistService;

    public WatchlistController(WatchlistService watchlistService) {
        this.watchlistService = watchlistService;
    }

    @GetMapping
    List<WatchlistItemResponse> list(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) WatchlistSort sort) {
        return watchlistService.list(query, genre, year, page, size, sort);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    WatchlistItemResponse create(@Valid @RequestBody CreateWatchlistItemRequest request) {
        return watchlistService.create(request);
    }

    @GetMapping("/{id}")
    WatchlistItemResponse get(@PathVariable Long id) {
        return watchlistService.get(id);
    }

    @PutMapping("/{id}")
    WatchlistItemResponse update(@PathVariable Long id, @Valid @RequestBody UpdateWatchlistItemRequest request) {
        return watchlistService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@PathVariable Long id) {
        watchlistService.delete(id);
    }

    @PostMapping("/{id}/convert-to-watch-entry")
    ConvertWatchlistItemResponse convert(
            @PathVariable Long id,
            @Valid @RequestBody ConvertWatchlistItemRequest request) {
        return watchlistService.convert(id, request);
    }
}
