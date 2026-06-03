package com.cinelog.external;

import com.cinelog.external.dto.ExternalMovieResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/external/movies")
public class ExternalMovieController {

    private final ExternalMovieService externalMovieService;

    public ExternalMovieController(ExternalMovieService externalMovieService) {
        this.externalMovieService = externalMovieService;
    }

    @GetMapping("/search")
    List<ExternalMovieResponse> search(
            @RequestParam String query,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer limit) {
        return externalMovieService.search(query, year, limit);
    }

    @GetMapping("/tmdb/{tmdbId}")
    ExternalMovieResponse getTmdbMovie(@PathVariable Long tmdbId) {
        return externalMovieService.getTmdbMovie(tmdbId);
    }
}
