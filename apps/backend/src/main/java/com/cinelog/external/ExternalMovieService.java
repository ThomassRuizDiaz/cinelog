package com.cinelog.external;

import com.cinelog.external.dto.ExternalMovieResponse;
import com.cinelog.external.tmdb.TmdbMovieNotFoundException;
import com.cinelog.external.tmdb.TmdbSearchMovie;
import com.cinelog.external.tmdb.TmdbUpstreamException;
import com.cinelog.external.tmdb.TmdbClient;
import com.cinelog.external.tmdb.TmdbMapper;
import com.cinelog.external.tmdb.TmdbProperties;
import java.time.Year;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class ExternalMovieService {

    private final TmdbClient tmdbClient;
    private final TmdbMapper tmdbMapper;
    private final TmdbProperties tmdbProperties;

    public ExternalMovieService(TmdbClient tmdbClient, TmdbMapper tmdbMapper, TmdbProperties tmdbProperties) {
        this.tmdbClient = tmdbClient;
        this.tmdbMapper = tmdbMapper;
        this.tmdbProperties = tmdbProperties;
    }

    public List<ExternalMovieResponse> search(String query, Integer year, Integer limit) {
        String normalizedQuery = normalizeQuery(query);
        Integer normalizedYear = normalizeYear(year);
        int normalizedLimit = normalizeLimit(limit);
        List<TmdbSearchMovie> searchResults = tmdbClient.search(normalizedQuery).stream()
                .filter(result -> result.id() != null)
                .limit(normalizedLimit)
                .toList();
        if (searchResults.isEmpty()) {
            return List.of();
        }

        List<SearchCandidate> candidates = enrich(normalizedQuery, normalizedYear, searchResults);
        if (candidates.isEmpty()) {
            throw new TmdbUpstreamException("TMDb enrichment failed for every search result");
        }
        return candidates.stream()
                .sorted(SearchCandidate.comparator())
                .map(SearchCandidate::response)
                .toList();
    }

    public ExternalMovieResponse getTmdbMovie(Long tmdbId) {
        if (tmdbId == null || tmdbId < 1) {
            throw new ExternalMovieValidationException("tmdbId must be a positive number");
        }
        return tmdbMapper.map(tmdbClient.getMovie(tmdbId));
    }

    private String normalizeQuery(String query) {
        if (!StringUtils.hasText(query)) {
            throw new ExternalMovieValidationException("query must contain at least 2 characters");
        }
        String normalized = query.trim().replaceAll("\\s+", " ");
        if (normalized.length() < 2) {
            throw new ExternalMovieValidationException("query must contain at least 2 characters");
        }
        return normalized;
    }

    private Integer normalizeYear(Integer year) {
        if (year == null) {
            return null;
        }
        int maxYear = Year.now().getValue() + 5;
        if (year < 1888 || year > maxYear) {
            throw new ExternalMovieValidationException("year must be between 1888 and " + maxYear);
        }
        return year;
    }

    private int normalizeLimit(Integer limit) {
        int maxLimit = Math.max(1, tmdbProperties.getMaxSearchResults());
        if (limit == null) {
            return maxLimit;
        }
        if (limit < 1) {
            throw new ExternalMovieValidationException("limit must be at least 1");
        }
        return Math.min(limit, maxLimit);
    }

    private List<SearchCandidate> enrich(String normalizedQuery, Integer year, List<TmdbSearchMovie> searchResults) {
        List<SearchCandidate> candidates = new ArrayList<>();
        for (int index = 0; index < searchResults.size(); index++) {
            SearchCandidate candidate = enrichOne(normalizedQuery, year, index, searchResults.get(index));
            if (candidate != null) {
                candidates.add(candidate);
            }
        }
        return candidates;
    }

    private SearchCandidate enrichOne(String normalizedQuery, Integer year, int index, TmdbSearchMovie result) {
        try {
            ExternalMovieResponse response = tmdbMapper.map(tmdbClient.getMovie(result.id()));
            return SearchCandidate.from(normalizedQuery, year, index, result, response);
        } catch (TmdbMovieNotFoundException | TmdbUpstreamException exception) {
            return null;
        }
    }

    private static String comparableTitle(String value) {
        return StringUtils.hasText(value) ? value.trim().replaceAll("\\s+", " ").toLowerCase() : "";
    }

    private record SearchCandidate(
            ExternalMovieResponse response,
            int sourceOrder,
            boolean exactTitle,
            boolean yearMatch,
            boolean hasPoster,
            boolean hasDirector) {
        static SearchCandidate from(
                String normalizedQuery,
                Integer year,
                int sourceOrder,
                TmdbSearchMovie searchMovie,
                ExternalMovieResponse response) {
            String comparableQuery = comparableTitle(normalizedQuery);
            boolean exactTitle = comparableQuery.equals(comparableTitle(response.title()))
                    || comparableQuery.equals(comparableTitle(response.originalTitle()))
                    || comparableQuery.equals(comparableTitle(searchMovie.title()))
                    || comparableQuery.equals(comparableTitle(searchMovie.originalTitle()));
            boolean yearMatch = year != null && year.equals(response.releaseYear());
            boolean hasPoster = StringUtils.hasText(response.posterPath());
            boolean hasDirector = response.directors() != null && !response.directors().isEmpty();
            return new SearchCandidate(response, sourceOrder, exactTitle, yearMatch, hasPoster, hasDirector);
        }

        static Comparator<SearchCandidate> comparator() {
            return Comparator.comparing(SearchCandidate::exactTitle).reversed()
                    .thenComparing(SearchCandidate::yearMatch, Comparator.reverseOrder())
                    .thenComparing(SearchCandidate::hasPoster, Comparator.reverseOrder())
                    .thenComparing(SearchCandidate::hasDirector, Comparator.reverseOrder())
                    .thenComparingInt(SearchCandidate::sourceOrder);
        }
    }
}
