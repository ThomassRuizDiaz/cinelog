package com.cinelog.ranking;

import com.cinelog.movie.Movie;
import com.cinelog.movie.MovieMetadataReader;
import com.cinelog.movie.MovieRepository;
import com.cinelog.ranking.dto.RankingItemResponse;
import com.cinelog.rating.MovieRating;
import com.cinelog.watch.WatchLocation;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.function.Function;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RankingService {

    private static final int DEFAULT_SIZE = 20;
    private static final int MAX_SIZE = 100;

    private final MovieRepository movieRepository;
    private final MovieMetadataReader metadataReader;

    public RankingService(MovieRepository movieRepository, MovieMetadataReader metadataReader) {
        this.movieRepository = movieRepository;
        this.metadataReader = metadataReader;
    }

    @Transactional(readOnly = true)
    public List<RankingItemResponse> rankings(
            RankingMode mode,
            String genre,
            Integer year,
            WatchLocation watchLocation,
            Integer limit,
            Integer page,
            Integer size) {
        validate(mode, limit, page, size);
        int effectivePage = page == null ? 0 : page;
        int effectiveSize = size == null ? DEFAULT_SIZE : size;
        List<Movie> sorted = movieRepository.findAllWithActiveRatingAndActiveWatchEntry().stream()
                .filter(movie -> matchesGenre(movie, genre))
                .filter(movie -> year == null || year.equals(movie.getReleaseYear()))
                .filter(movie -> watchLocation == null
                        || watchLocation == movie.getActiveWatchEntry().getWatchLocation())
                .sorted(comparator(mode))
                .toList();
        int cappedSize = limit == null ? sorted.size() : Math.min(limit, sorted.size());
        int fromIndex = Math.min(effectivePage * effectiveSize, cappedSize);
        int toIndex = Math.min(fromIndex + effectiveSize, cappedSize);
        List<RankingItemResponse> response = new ArrayList<>();
        for (int index = fromIndex; index < toIndex; index++) {
            response.add(toResponse(sorted.get(index), mode, index + 1));
        }
        return response;
    }

    @Transactional(readOnly = true)
    public List<RankingItemResponse> top(RankingMode mode, int limit) {
        return rankings(mode, null, null, null, limit, 0, limit);
    }

    public BigDecimal personalRankingScore(MovieRating rating) {
        if (rating.getPersonalFinalScore() != null) {
            return rating.getPersonalFinalScore();
        }
        if (rating.getDisplayScore() != null) {
            return rating.getDisplayScore();
        }
        return rating.getTechnicalScore();
    }

    private RankingItemResponse toResponse(Movie movie, RankingMode mode, int rank) {
        MovieRating rating = movie.getActiveRating();
        return new RankingItemResponse(
                rank,
                movie.getId(),
                movie.getTitle(),
                movie.getReleaseYear(),
                metadataReader.directors(movie),
                movie.getPosterUrl(),
                metadataReader.genres(movie),
                selectedScore(rating, mode),
                mode.getScoreLabel(),
                rating.getTechnicalScore(),
                rating.getObjectiveScore(),
                rating.getPersonalFinalScore(),
                movie.getActiveWatchEntry().getWatchedAt());
    }

    private Comparator<Movie> comparator(RankingMode mode) {
        return comparingDescending(movie -> selectedScore(movie.getActiveRating(), mode))
                .thenComparing(comparingDescending(movie -> movie.getActiveRating().getTechnicalScore()))
                .thenComparing(comparingDescending(movie -> movie.getActiveRating().getPersonalImpactEnjoyment()))
                .thenComparing(comparingDescending(movie -> movie.getActiveWatchEntry().getWatchedAt()))
                .thenComparing(Movie::getTitle, String.CASE_INSENSITIVE_ORDER)
                .thenComparing(Movie::getId);
    }

    private <T extends Comparable<? super T>> Comparator<Movie> comparingDescending(Function<Movie, T> value) {
        return Comparator.comparing(value, Comparator.reverseOrder());
    }

    private BigDecimal selectedScore(MovieRating rating, RankingMode mode) {
        return switch (mode) {
            case PERSONAL -> personalRankingScore(rating);
            case TECHNICAL -> rating.getTechnicalScore();
            case OBJECTIVE -> rating.getObjectiveScore();
            case STORY -> rating.getStoryScreenplay();
            case DIRECTION -> rating.getDirection();
            case PERFORMANCES -> rating.getPerformancesCharacters();
            case PACING -> rating.getPacingEditing();
            case VISUALS -> rating.getVisualsArtDesign();
            case MUSIC -> rating.getMusicSound();
            case THEMES -> rating.getThemesDepth();
            case ORIGINALITY -> rating.getOriginalityConcept();
            case IMPACT -> rating.getPersonalImpactEnjoyment();
        };
    }

    private boolean matchesGenre(Movie movie, String genre) {
        if (genre == null || genre.isBlank()) {
            return true;
        }
        String normalized = genre.trim().toLowerCase(Locale.ROOT);
        return metadataReader.genres(movie).stream()
                .anyMatch(value -> value.toLowerCase(Locale.ROOT).equals(normalized));
    }

    private void validate(RankingMode mode, Integer limit, Integer page, Integer size) {
        if (mode == null) {
            throw new IllegalArgumentException("mode is required");
        }
        if (limit != null && (limit < 1 || limit > MAX_SIZE)) {
            throw new IllegalArgumentException("limit must be between 1 and " + MAX_SIZE);
        }
        if (page != null && page < 0) {
            throw new IllegalArgumentException("page must be zero or greater");
        }
        if (size != null && (size < 1 || size > MAX_SIZE)) {
            throw new IllegalArgumentException("size must be between 1 and " + MAX_SIZE);
        }
    }
}
