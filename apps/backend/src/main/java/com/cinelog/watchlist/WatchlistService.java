package com.cinelog.watchlist;

import com.cinelog.actor.CastImportService;
import com.cinelog.external.tmdb.TmdbCastImportService;
import com.cinelog.library.LibraryConflictException;
import com.cinelog.library.LibraryNotFoundException;
import com.cinelog.library.LibraryValidationException;
import com.cinelog.movie.MetadataSource;
import com.cinelog.movie.Movie;
import com.cinelog.movie.MovieMapper;
import com.cinelog.movie.MovieMetadataReader;
import com.cinelog.movie.MovieRepository;
import com.cinelog.rating.ActiveRatingService;
import com.cinelog.watch.WatchEntry;
import com.cinelog.watch.WatchEntryMapper;
import com.cinelog.watch.WatchEntryRepository;
import com.cinelog.watchlist.dto.ConvertWatchlistItemRequest;
import com.cinelog.watchlist.dto.ConvertWatchlistItemResponse;
import com.cinelog.watchlist.dto.CreateWatchlistItemRequest;
import com.cinelog.watchlist.dto.UpdateWatchlistItemRequest;
import com.cinelog.watchlist.dto.WatchlistItemResponse;
import java.time.Year;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.function.Function;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WatchlistService {

    private static final int DEFAULT_SIZE = 20;
    private static final int MAX_SIZE = 100;

    private final WatchlistItemRepository watchlistItemRepository;
    private final MovieRepository movieRepository;
    private final WatchEntryRepository watchEntryRepository;
    private final MovieMetadataReader metadataReader;
    private final WatchlistItemMapper watchlistItemMapper;
    private final MovieMapper movieMapper;
    private final WatchEntryMapper watchEntryMapper;
    private final ActiveRatingService activeRatingService;
    private final CastImportService castImportService;
    private final TmdbCastImportService tmdbCastImportService;

    public WatchlistService(
            WatchlistItemRepository watchlistItemRepository,
            MovieRepository movieRepository,
            WatchEntryRepository watchEntryRepository,
            MovieMetadataReader metadataReader,
            WatchlistItemMapper watchlistItemMapper,
            MovieMapper movieMapper,
            WatchEntryMapper watchEntryMapper,
            ActiveRatingService activeRatingService,
            CastImportService castImportService,
            TmdbCastImportService tmdbCastImportService) {
        this.watchlistItemRepository = watchlistItemRepository;
        this.movieRepository = movieRepository;
        this.watchEntryRepository = watchEntryRepository;
        this.metadataReader = metadataReader;
        this.watchlistItemMapper = watchlistItemMapper;
        this.movieMapper = movieMapper;
        this.watchEntryMapper = watchEntryMapper;
        this.activeRatingService = activeRatingService;
        this.castImportService = castImportService;
        this.tmdbCastImportService = tmdbCastImportService;
    }

    @Transactional(readOnly = true)
    public List<WatchlistItemResponse> list(
            String query,
            String genre,
            Integer year,
            Integer page,
            Integer size,
            WatchlistSort sort) {
        int effectivePage = page == null ? 0 : page;
        int effectiveSize = size == null ? DEFAULT_SIZE : size;
        validatePage(effectivePage, effectiveSize);
        WatchlistSort effectiveSort = sort == null ? WatchlistSort.NEWEST : sort;
        List<WatchlistItem> items = watchlistItemRepository.findAll().stream()
                .filter(item -> matchesQuery(item, query))
                .filter(item -> matchesGenre(item, genre))
                .filter(item -> year == null || year.equals(item.getReleaseYear()))
                .sorted(comparator(effectiveSort))
                .toList();
        int fromIndex = Math.min(effectivePage * effectiveSize, items.size());
        int toIndex = Math.min(fromIndex + effectiveSize, items.size());
        return items.subList(fromIndex, toIndex).stream()
                .map(watchlistItemMapper::map)
                .toList();
    }

    @Transactional(readOnly = true)
    public WatchlistItemResponse get(Long id) {
        return watchlistItemMapper.map(findItem(id));
    }

    @Transactional
    public WatchlistItemResponse create(CreateWatchlistItemRequest request) {
        Long tmdbId = validatedTmdbId(request.source(), request.externalId());
        watchlistItemRepository.findByTmdbId(tmdbId).ifPresent(item -> {
            throw new LibraryConflictException("Watchlist item with tmdbId " + tmdbId + " already exists");
        });
        movieRepository.findByTmdbId(tmdbId).ifPresent(movie -> {
            throw new LibraryConflictException("Movie with tmdbId " + tmdbId + " is already in archive");
        });
        validateReleaseYear(request.releaseYear());
        WatchlistItem item = new WatchlistItem(MetadataSource.TMDB, request.title().trim());
        item.setTmdbId(tmdbId);
        copyMetadata(item, request.originalTitle(), request.releaseYear(), request.directors(),
                request.posterPath(), request.posterUrl(), request.genres());
        item.setNotes(request.notes());
        return watchlistItemMapper.map(watchlistItemRepository.saveAndFlush(item));
    }

    @Transactional
    public WatchlistItemResponse update(Long id, UpdateWatchlistItemRequest request) {
        WatchlistItem item = findItem(id);
        item.setNotes(request.notes());
        return watchlistItemMapper.map(watchlistItemRepository.saveAndFlush(item));
    }

    @Transactional
    public void delete(Long id) {
        WatchlistItem item = findItem(id);
        watchlistItemRepository.delete(item);
        watchlistItemRepository.flush();
    }

    @Transactional
    public ConvertWatchlistItemResponse convert(Long id, ConvertWatchlistItemRequest request) {
        WatchlistItem item = findItem(id);
        Movie movie = item.getTmdbId() == null
                ? null
                : movieRepository.findByTmdbId(item.getTmdbId()).orElse(null);
        if (movie == null) {
            movie = new Movie(item.getMetadataSource(), item.getTitle());
            movie.setTmdbId(item.getTmdbId());
            movie.setOriginalTitle(item.getOriginalTitle());
            movie.setReleaseYear(item.getReleaseYear());
            movie.setDirectorsJson(item.getDirectorsJson());
            movie.setGenresJson(item.getGenresJson());
            movie.setPosterPath(item.getPosterPath());
            movie.setPosterUrl(item.getPosterUrl());
            movie = movieRepository.saveAndFlush(movie);
        }
        importCast(movie);
        WatchEntry watchEntry = new WatchEntry(movie, request.watchedAt(), request.watchType(), request.watchLocation());
        watchEntry.setNotes(request.notes());
        WatchEntry savedWatchEntry = watchEntryRepository.saveAndFlush(watchEntry);
        activeRatingService.recalculate(movie.getId());
        watchlistItemRepository.delete(item);
        watchlistItemRepository.flush();
        return new ConvertWatchlistItemResponse(
                movieMapper.detail(movieRepository.findById(movie.getId()).orElseThrow(), 
                        watchEntryRepository.findByMovieIdOrderByWatchedAtDescIdDesc(movie.getId())),
                watchEntryMapper.map(savedWatchEntry));
    }

    private void importCast(Movie movie) {
        if (movie.getMetadataSource() == MetadataSource.TMDB && movie.getTmdbId() != null) {
            castImportService.importCast(movie, tmdbCastImportService.topCast(movie.getTmdbId()));
        }
    }

    private WatchlistItem findItem(Long id) {
        return watchlistItemRepository.findById(id)
                .orElseThrow(() -> new LibraryNotFoundException("Watchlist item not found: " + id));
    }

    private Long validatedTmdbId(String source, String externalId) {
        if (!"TMDB".equals(source)) {
            throw new LibraryValidationException("source must be TMDB");
        }
        Long tmdbId;
        try {
            tmdbId = Long.valueOf(externalId);
        } catch (NumberFormatException exception) {
            throw new LibraryValidationException("externalId must be a numeric TMDb id");
        }
        if (tmdbId < 1) {
            throw new LibraryValidationException("externalId must be a positive TMDb id");
        }
        return tmdbId;
    }

    private void copyMetadata(
            WatchlistItem item,
            String originalTitle,
            Integer releaseYear,
            List<String> directors,
            String posterPath,
            String posterUrl,
            List<String> genres) {
        item.setOriginalTitle(originalTitle);
        item.setReleaseYear(releaseYear);
        item.setDirectorsJson(metadataReader.writeList(normalize(directors)));
        item.setGenresJson(metadataReader.writeList(normalize(genres)));
        item.setPosterPath(posterPath);
        item.setPosterUrl(posterUrl);
    }

    private List<String> normalize(List<String> values) {
        if (values == null) {
            return List.of();
        }
        return values.stream().filter(value -> value != null && !value.isBlank()).map(String::trim).distinct().toList();
    }

    private boolean matchesQuery(WatchlistItem item, String query) {
        if (query == null || query.isBlank()) {
            return true;
        }
        String normalized = query.trim().toLowerCase(Locale.ROOT);
        return item.getTitle().toLowerCase(Locale.ROOT).contains(normalized)
                || (item.getOriginalTitle() != null
                        && item.getOriginalTitle().toLowerCase(Locale.ROOT).contains(normalized));
    }

    private boolean matchesGenre(WatchlistItem item, String genre) {
        if (genre == null || genre.isBlank()) {
            return true;
        }
        String normalized = genre.trim().toLowerCase(Locale.ROOT);
        return metadataReader.readList(item.getGenresJson()).stream()
                .anyMatch(value -> value.toLowerCase(Locale.ROOT).equals(normalized));
    }

    private Comparator<WatchlistItem> comparator(WatchlistSort sort) {
        return switch (sort) {
            case NEWEST -> descending(WatchlistItem::getCreatedAt).thenComparing(WatchlistItem::getId, Comparator.reverseOrder());
            case OLDEST -> Comparator.comparing(WatchlistItem::getCreatedAt).thenComparing(WatchlistItem::getId);
            case TITLE -> Comparator.comparing(WatchlistItem::getTitle, String.CASE_INSENSITIVE_ORDER)
                    .thenComparing(WatchlistItem::getId);
            case YEAR -> descending(WatchlistItem::getReleaseYear).thenComparing(WatchlistItem::getId);
        };
    }

    private <T extends Comparable<? super T>> Comparator<WatchlistItem> descending(Function<WatchlistItem, T> value) {
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
}
