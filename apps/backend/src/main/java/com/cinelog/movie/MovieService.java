package com.cinelog.movie;

import com.cinelog.actor.CastImportService;
import com.cinelog.external.tmdb.TmdbCastImportService;
import com.cinelog.library.LibraryConflictException;
import com.cinelog.library.LibraryNotFoundException;
import com.cinelog.library.LibraryValidationException;
import com.cinelog.movie.dto.CreateMovieRequest;
import com.cinelog.movie.dto.ImportMovieRequest;
import com.cinelog.movie.dto.MovieDetailResponse;
import com.cinelog.movie.dto.MovieListItemResponse;
import com.cinelog.movie.dto.UpdateMovieRequest;
import com.cinelog.rating.MovieRating;
import com.cinelog.rating.MovieRatingRepository;
import com.cinelog.watch.WatchEntry;
import com.cinelog.watch.WatchEntryRepository;
import com.cinelog.watch.WatchLocation;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Year;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.function.Function;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MovieService {

    private static final int DEFAULT_SIZE = 20;
    private static final int MAX_SIZE = 100;

    private final MovieRepository movieRepository;
    private final WatchEntryRepository watchEntryRepository;
    private final MovieMetadataReader metadataReader;
    private final MovieRatingSummaryMapper ratingSummaryMapper;
    private final MovieMapper movieMapper;
    private final MovieRatingRepository movieRatingRepository;
    private final CastImportService castImportService;
    private final TmdbCastImportService tmdbCastImportService;

    public MovieService(
            MovieRepository movieRepository,
            WatchEntryRepository watchEntryRepository,
            MovieMetadataReader metadataReader,
            MovieRatingSummaryMapper ratingSummaryMapper,
            MovieMapper movieMapper,
            MovieRatingRepository movieRatingRepository,
            CastImportService castImportService,
            TmdbCastImportService tmdbCastImportService) {
        this.movieRepository = movieRepository;
        this.watchEntryRepository = watchEntryRepository;
        this.metadataReader = metadataReader;
        this.ratingSummaryMapper = ratingSummaryMapper;
        this.movieMapper = movieMapper;
        this.movieRatingRepository = movieRatingRepository;
        this.castImportService = castImportService;
        this.tmdbCastImportService = tmdbCastImportService;
    }

    @Transactional(readOnly = true)
    public List<MovieListItemResponse> list(
            String query,
            MovieSort sort,
            String genre,
            Integer year,
            WatchLocation watchLocation,
            Boolean ratedOnly,
            Integer page,
            Integer size) {
        int effectivePage = page == null ? 0 : page;
        int effectiveSize = size == null ? DEFAULT_SIZE : size;
        validatePage(effectivePage, effectiveSize);
        MovieSort effectiveSort = sort == null ? MovieSort.TITLE : sort;
        List<MovieView> movies = movieRepository.findAll().stream()
                .map(this::view)
                .filter(movie -> matchesQuery(movie.movie(), query))
                .filter(movie -> matchesGenre(movie.movie(), genre))
                .filter(movie -> year == null || year.equals(movie.movie().getReleaseYear()))
                .filter(movie -> watchLocation == null || movie.watchEntries().stream()
                        .anyMatch(watch -> watch.getWatchLocation() == watchLocation))
                .filter(movie -> !Boolean.TRUE.equals(ratedOnly) || movie.movie().getActiveRating() != null)
                .sorted(comparator(effectiveSort))
                .toList();
        int fromIndex = Math.min(effectivePage * effectiveSize, movies.size());
        int toIndex = Math.min(fromIndex + effectiveSize, movies.size());
        return movies.subList(fromIndex, toIndex).stream()
                .map(movie -> movieMapper.listItem(movie.movie(), movie.latestWatchedAt(), movie.watchEntries().size()))
                .toList();
    }

    @Transactional(readOnly = true)
    public MovieDetailResponse get(Long id) {
        Movie movie = findMovie(id);
        return movieMapper.detail(movie, watchEntryRepository.findByMovieIdOrderByWatchedAtDescIdDesc(id));
    }

    @Transactional
    public MovieDetailResponse create(CreateMovieRequest request) {
        validateReleaseYear(request.releaseYear());
        Movie movie = new Movie(MetadataSource.MANUAL, request.title().trim());
        copyMetadata(movie, request.originalTitle(), request.releaseYear(), request.directors(),
                request.posterPath(), request.posterUrl(), request.genres());
        return movieMapper.detail(movieRepository.saveAndFlush(movie), List.of());
    }

    @Transactional
    public MovieDetailResponse update(Long id, UpdateMovieRequest request) {
        validateReleaseYear(request.releaseYear());
        Movie movie = findMovie(id);
        movie.setTitle(request.title().trim());
        copyMetadata(movie, request.originalTitle(), request.releaseYear(), request.directors(),
                request.posterPath(), request.posterUrl(), request.genres());
        return movieMapper.detail(
                movieRepository.saveAndFlush(movie),
                watchEntryRepository.findByMovieIdOrderByWatchedAtDescIdDesc(id));
    }

    @Transactional
    public MovieDetailResponse importMovie(ImportMovieRequest request) {
        if (!"TMDB".equals(request.source())) {
            throw new LibraryValidationException("source must be TMDB");
        }
        Long tmdbId;
        try {
            tmdbId = Long.valueOf(request.externalId());
        } catch (NumberFormatException exception) {
            throw new LibraryValidationException("externalId must be a numeric TMDb id");
        }
        if (tmdbId < 1) {
            throw new LibraryValidationException("externalId must be a positive TMDb id");
        }
        movieRepository.findByTmdbId(tmdbId).ifPresent(movie -> {
            throw new LibraryConflictException("Movie with tmdbId " + tmdbId + " already exists");
        });
        validateReleaseYear(request.releaseYear());
        Movie movie = new Movie(MetadataSource.TMDB, request.title().trim());
        movie.setTmdbId(tmdbId);
        copyMetadata(movie, request.originalTitle(), request.releaseYear(), request.directors(),
                request.posterPath(), request.posterUrl(), request.genres());
        Movie saved = movieRepository.saveAndFlush(movie);
        castImportService.importCast(saved, tmdbCastImportService.topCast(tmdbId));
        return movieMapper.detail(saved, List.of());
    }

    @Transactional
    public void delete(Long id) {
        Movie movie = findMovie(id);
        movie.setActiveRating(null);
        movie.setActiveWatchEntry(null);
        movieRepository.saveAndFlush(movie);
        movieRatingRepository.deleteAllByMovieId(id);
        watchEntryRepository.deleteAllByMovieId(id);
        movieRepository.deleteById(id);
        movieRepository.flush();
    }

    private Movie findMovie(Long id) {
        return movieRepository.findById(id)
                .orElseThrow(() -> new LibraryNotFoundException("Movie not found: " + id));
    }

    private void copyMetadata(
            Movie movie,
            String originalTitle,
            Integer releaseYear,
            List<String> directors,
            String posterPath,
            String posterUrl,
            List<String> genres) {
        movie.setOriginalTitle(originalTitle);
        movie.setReleaseYear(releaseYear);
        movie.setDirectorsJson(metadataReader.writeList(normalize(directors)));
        movie.setPosterPath(posterPath);
        movie.setPosterUrl(posterUrl);
        movie.setGenresJson(metadataReader.writeList(normalize(genres)));
    }

    private List<String> normalize(List<String> values) {
        if (values == null) {
            return List.of();
        }
        return values.stream().filter(value -> value != null && !value.isBlank()).map(String::trim).distinct().toList();
    }

    private MovieView view(Movie movie) {
        List<WatchEntry> watches = watchEntryRepository.findByMovieIdOrderByWatchedAtDescIdDesc(movie.getId());
        return new MovieView(movie, watches, watches.isEmpty() ? null : watches.getFirst().getWatchedAt());
    }

    private boolean matchesQuery(Movie movie, String query) {
        if (query == null || query.isBlank()) {
            return true;
        }
        String normalized = query.trim().toLowerCase(Locale.ROOT);
        return movie.getTitle().toLowerCase(Locale.ROOT).contains(normalized)
                || movie.getOriginalTitle() != null
                        && movie.getOriginalTitle().toLowerCase(Locale.ROOT).contains(normalized);
    }

    private boolean matchesGenre(Movie movie, String genre) {
        if (genre == null || genre.isBlank()) {
            return true;
        }
        String normalized = genre.trim().toLowerCase(Locale.ROOT);
        return metadataReader.genres(movie).stream()
                .anyMatch(value -> value.toLowerCase(Locale.ROOT).equals(normalized));
    }

    private Comparator<MovieView> comparator(MovieSort sort) {
        Comparator<MovieView> comparator = switch (sort) {
            case TITLE -> Comparator.comparing(movie -> movie.movie().getTitle(), String.CASE_INSENSITIVE_ORDER);
            case YEAR -> descending(movie -> movie.movie().getReleaseYear());
            case LATEST_WATCHED -> descending(MovieView::latestWatchedAt);
            case PERSONAL_SCORE -> scoreDescending(ratingSummaryMapper::personalRankingScore);
            case TECHNICAL_SCORE -> scoreDescending(MovieRating::getTechnicalScore);
            case OBJECTIVE_SCORE -> scoreDescending(MovieRating::getObjectiveScore);
            case STORY -> scoreDescending(MovieRating::getStoryScreenplay);
            case DIRECTION -> scoreDescending(MovieRating::getDirection);
            case PERFORMANCES -> scoreDescending(MovieRating::getPerformancesCharacters);
            case PACING -> scoreDescending(MovieRating::getPacingEditing);
            case VISUALS -> scoreDescending(MovieRating::getVisualsArtDesign);
            case MUSIC -> scoreDescending(MovieRating::getMusicSound);
            case THEMES -> scoreDescending(MovieRating::getThemesDepth);
            case ORIGINALITY -> scoreDescending(MovieRating::getOriginalityConcept);
            case IMPACT -> scoreDescending(MovieRating::getPersonalImpactEnjoyment);
        };
        return comparator
                .thenComparing(movie -> movie.movie().getTitle(), String.CASE_INSENSITIVE_ORDER)
                .thenComparing(movie -> movie.movie().getId());
    }

    private Comparator<MovieView> scoreDescending(Function<MovieRating, BigDecimal> score) {
        return descending(movie -> movie.movie().getActiveRating() == null ? null : score.apply(movie.movie().getActiveRating()));
    }

    private <T extends Comparable<? super T>> Comparator<MovieView> descending(Function<MovieView, T> value) {
        return Comparator.comparing(value, Comparator.nullsLast(Comparator.reverseOrder()));
    }

    private void validatePage(int page, int size) {
        if (page < 0) {
            throw new LibraryValidationException("page must be zero or greater");
        }
        if (size < 1 || size > MAX_SIZE) {
            throw new LibraryValidationException("size must be between 1 and " + MAX_SIZE);
        }
    }

    private void validateReleaseYear(Integer releaseYear) {
        if (releaseYear != null && (releaseYear < 1888 || releaseYear > Year.now().getValue() + 5)) {
            throw new LibraryValidationException("releaseYear must be between 1888 and " + (Year.now().getValue() + 5));
        }
    }

    private record MovieView(Movie movie, List<WatchEntry> watchEntries, LocalDate latestWatchedAt) {
    }
}
