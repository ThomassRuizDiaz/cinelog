package com.cinelog.watch;

import com.cinelog.library.LibraryNotFoundException;
import com.cinelog.movie.Movie;
import com.cinelog.movie.MovieRepository;
import com.cinelog.rating.ActiveRatingService;
import com.cinelog.rating.MovieRatingRepository;
import com.cinelog.watch.dto.SaveWatchEntryRequest;
import com.cinelog.watch.dto.WatchEntryResponse;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WatchEntryService {

    private final MovieRepository movieRepository;
    private final WatchEntryRepository watchEntryRepository;
    private final WatchEntryMapper watchEntryMapper;
    private final ActiveRatingService activeRatingService;
    private final MovieRatingRepository movieRatingRepository;

    public WatchEntryService(
            MovieRepository movieRepository,
            WatchEntryRepository watchEntryRepository,
            WatchEntryMapper watchEntryMapper,
            ActiveRatingService activeRatingService,
            MovieRatingRepository movieRatingRepository) {
        this.movieRepository = movieRepository;
        this.watchEntryRepository = watchEntryRepository;
        this.watchEntryMapper = watchEntryMapper;
        this.activeRatingService = activeRatingService;
        this.movieRatingRepository = movieRatingRepository;
    }

    @Transactional(readOnly = true)
    public List<WatchEntryResponse> list(Long movieId) {
        findMovie(movieId);
        return watchEntryRepository.findByMovieIdOrderByWatchedAtDescIdDesc(movieId).stream()
                .map(watchEntryMapper::map)
                .toList();
    }

    @Transactional(readOnly = true)
    public WatchEntryResponse get(Long id) {
        return watchEntryMapper.map(findWatchEntry(id));
    }

    @Transactional
    public WatchEntryResponse create(Long movieId, SaveWatchEntryRequest request) {
        Movie movie = findMovie(movieId);
        WatchEntry watchEntry = new WatchEntry(movie, request.watchedAt(), request.watchType(), request.watchLocation());
        watchEntry.setNotes(request.notes());
        WatchEntry saved = watchEntryRepository.saveAndFlush(watchEntry);
        activeRatingService.recalculate(movieId);
        return watchEntryMapper.map(saved);
    }

    @Transactional
    public WatchEntryResponse update(Long id, SaveWatchEntryRequest request) {
        WatchEntry watchEntry = findWatchEntry(id);
        watchEntry.setWatchedAt(request.watchedAt());
        watchEntry.setWatchType(request.watchType());
        watchEntry.setWatchLocation(request.watchLocation());
        watchEntry.setNotes(request.notes());
        WatchEntry saved = watchEntryRepository.saveAndFlush(watchEntry);
        activeRatingService.recalculate(saved.getMovie().getId());
        return watchEntryMapper.map(saved);
    }

    @Transactional
    public void delete(Long id) {
        WatchEntry watchEntry = findWatchEntry(id);
        Movie movie = watchEntry.getMovie();
        Long movieId = movie.getId();
        if (movie.getActiveWatchEntry() != null && movie.getActiveWatchEntry().getId().equals(id)) {
            movie.setActiveRating(null);
            movie.setActiveWatchEntry(null);
            movieRepository.saveAndFlush(movie);
        }
        movieRatingRepository.deleteAllByWatchEntryId(id);
        watchEntryRepository.deleteOneById(id);
        activeRatingService.recalculate(movieId);
    }

    private Movie findMovie(Long id) {
        return movieRepository.findById(id)
                .orElseThrow(() -> new LibraryNotFoundException("Movie not found: " + id));
    }

    private WatchEntry findWatchEntry(Long id) {
        return watchEntryRepository.findById(id)
                .orElseThrow(() -> new LibraryNotFoundException("Watch entry not found: " + id));
    }
}
