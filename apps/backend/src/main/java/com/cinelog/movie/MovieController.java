package com.cinelog.movie;

import com.cinelog.movie.dto.CreateMovieRequest;
import com.cinelog.movie.dto.ImportMovieRequest;
import com.cinelog.movie.dto.MovieDetailResponse;
import com.cinelog.movie.dto.MovieListItemResponse;
import com.cinelog.movie.dto.UpdateMovieRequest;
import com.cinelog.watch.WatchLocation;
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
@RequestMapping("/api/movies")
public class MovieController {

    private final MovieService movieService;

    public MovieController(MovieService movieService) {
        this.movieService = movieService;
    }

    @GetMapping
    List<MovieListItemResponse> list(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) MovieSort sort,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) WatchLocation watchLocation,
            @RequestParam(required = false) Boolean ratedOnly,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return movieService.list(query, sort, genre, year, watchLocation, ratedOnly, page, size);
    }

    @GetMapping("/{id}")
    MovieDetailResponse get(@PathVariable Long id) {
        return movieService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    MovieDetailResponse create(@Valid @RequestBody CreateMovieRequest request) {
        return movieService.create(request);
    }

    @PutMapping("/{id}")
    MovieDetailResponse update(@PathVariable Long id, @Valid @RequestBody UpdateMovieRequest request) {
        return movieService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@PathVariable Long id) {
        movieService.delete(id);
    }

    @PostMapping("/import")
    @ResponseStatus(HttpStatus.CREATED)
    MovieDetailResponse importMovie(@Valid @RequestBody ImportMovieRequest request) {
        return movieService.importMovie(request);
    }
}
