package com.cinelog.rating;

import com.cinelog.movie.Movie;
import com.cinelog.movie.MovieRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ActiveRatingService {

    private final MovieRepository movieRepository;
    private final MovieRatingRepository movieRatingRepository;

    public ActiveRatingService(MovieRepository movieRepository, MovieRatingRepository movieRatingRepository) {
        this.movieRepository = movieRepository;
        this.movieRatingRepository = movieRatingRepository;
    }

    @Transactional
    public void recalculate(Long movieId) {
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found: " + movieId));
        movieRatingRepository
                .findFirstByWatchEntry_Movie_IdOrderByWatchEntry_WatchedAtDescWatchEntry_IdDesc(movieId)
                .ifPresentOrElse(
                        rating -> {
                            movie.setActiveRating(rating);
                            movie.setActiveWatchEntry(rating.getWatchEntry());
                        },
                        () -> {
                            movie.setActiveRating(null);
                            movie.setActiveWatchEntry(null);
                        });
        movieRepository.saveAndFlush(movie);
    }
}
