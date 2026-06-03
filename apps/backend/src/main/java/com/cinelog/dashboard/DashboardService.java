package com.cinelog.dashboard;

import com.cinelog.dashboard.dto.DashboardLatestWatchResponse;
import com.cinelog.dashboard.dto.DashboardMovieResponse;
import com.cinelog.dashboard.dto.DashboardResponse;
import com.cinelog.dashboard.dto.DashboardStatsResponse;
import com.cinelog.movie.Movie;
import com.cinelog.movie.MovieMetadataReader;
import com.cinelog.movie.MovieRepository;
import com.cinelog.movie.MovieRatingSummaryMapper;
import com.cinelog.ranking.RankingMode;
import com.cinelog.ranking.RankingService;
import com.cinelog.rating.MovieRating;
import com.cinelog.watch.WatchEntry;
import com.cinelog.watch.WatchEntryRepository;
import com.cinelog.watch.WatchType;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardService {

    private static final int DASHBOARD_LIST_SIZE = 5;

    private final MovieRepository movieRepository;
    private final WatchEntryRepository watchEntryRepository;
    private final MovieMetadataReader metadataReader;
    private final MovieRatingSummaryMapper ratingSummaryMapper;
    private final RankingService rankingService;

    public DashboardService(
            MovieRepository movieRepository,
            WatchEntryRepository watchEntryRepository,
            MovieMetadataReader metadataReader,
            MovieRatingSummaryMapper ratingSummaryMapper,
            RankingService rankingService) {
        this.movieRepository = movieRepository;
        this.watchEntryRepository = watchEntryRepository;
        this.metadataReader = metadataReader;
        this.ratingSummaryMapper = ratingSummaryMapper;
        this.rankingService = rankingService;
    }

    @Transactional(readOnly = true)
    public DashboardResponse dashboard() {
        List<Movie> activeMovies = movieRepository.findAllWithActiveRatingAndActiveWatchEntry();
        return new DashboardResponse(
                stats(activeMovies),
                watchEntryRepository.findFirstByOrderByWatchedAtDescIdDesc()
                        .map(this::latestWatch)
                        .orElse(null),
                rankingService.top(RankingMode.PERSONAL, DASHBOARD_LIST_SIZE),
                rankingService.top(RankingMode.TECHNICAL, DASHBOARD_LIST_SIZE),
                recentlyAdded());
    }

    private DashboardStatsResponse stats(List<Movie> activeMovies) {
        return new DashboardStatsResponse(
                movieRepository.count(),
                watchEntryRepository.count(),
                watchEntryRepository.countByWatchType(WatchType.REWATCH),
                average(activeMovies, movie -> movie.getActiveRating().getTechnicalScore()),
                average(activeMovies, movie -> rankingService.personalRankingScore(movie.getActiveRating())));
    }

    private DashboardLatestWatchResponse latestWatch(WatchEntry watchEntry) {
        Movie movie = watchEntry.getMovie();
        return new DashboardLatestWatchResponse(
                watchEntry.getId(),
                movie.getId(),
                movie.getTitle(),
                movie.getPosterUrl(),
                ratingSummaryMapper.map(movie.getActiveRating()),
                watchEntry.getWatchedAt(),
                watchEntry.getWatchType(),
                watchEntry.getWatchLocation());
    }

    private List<DashboardMovieResponse> recentlyAdded() {
        return movieRepository.findAll(PageRequest.of(
                        0,
                        DASHBOARD_LIST_SIZE,
                        Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))))
                .stream()
                .map(this::recentMovie)
                .toList();
    }

    private DashboardMovieResponse recentMovie(Movie movie) {
        return new DashboardMovieResponse(
                movie.getId(),
                movie.getTitle(),
                movie.getReleaseYear(),
                metadataReader.directors(movie),
                movie.getPosterUrl(),
                metadataReader.genres(movie),
                ratingSummaryMapper.map(movie.getActiveRating()),
                movie.getCreatedAt());
    }

    private BigDecimal average(List<Movie> movies, java.util.function.Function<Movie, BigDecimal> value) {
        if (movies.isEmpty()) {
            return null;
        }
        BigDecimal total = movies.stream()
                .map(value)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return total.divide(BigDecimal.valueOf(movies.size()), 2, RoundingMode.HALF_UP);
    }
}
