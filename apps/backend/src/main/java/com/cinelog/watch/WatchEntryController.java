package com.cinelog.watch;

import com.cinelog.watch.dto.SaveWatchEntryRequest;
import com.cinelog.watch.dto.WatchEntryResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class WatchEntryController {

    private final WatchEntryService watchEntryService;

    public WatchEntryController(WatchEntryService watchEntryService) {
        this.watchEntryService = watchEntryService;
    }

    @GetMapping("/api/movies/{movieId}/watch-entries")
    List<WatchEntryResponse> list(@PathVariable Long movieId) {
        return watchEntryService.list(movieId);
    }

    @PostMapping("/api/movies/{movieId}/watch-entries")
    @ResponseStatus(HttpStatus.CREATED)
    WatchEntryResponse create(@PathVariable Long movieId, @Valid @RequestBody SaveWatchEntryRequest request) {
        return watchEntryService.create(movieId, request);
    }

    @GetMapping("/api/watch-entries/{id}")
    WatchEntryResponse get(@PathVariable Long id) {
        return watchEntryService.get(id);
    }

    @PutMapping("/api/watch-entries/{id}")
    WatchEntryResponse update(@PathVariable Long id, @Valid @RequestBody SaveWatchEntryRequest request) {
        return watchEntryService.update(id, request);
    }

    @DeleteMapping("/api/watch-entries/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@PathVariable Long id) {
        watchEntryService.delete(id);
    }
}
