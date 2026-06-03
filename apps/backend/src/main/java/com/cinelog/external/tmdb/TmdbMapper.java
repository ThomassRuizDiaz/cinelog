package com.cinelog.external.tmdb;

import com.cinelog.external.dto.ExternalMovieResponse;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class TmdbMapper {

    private final TmdbProperties properties;

    public TmdbMapper(TmdbProperties properties) {
        this.properties = properties;
    }

    public ExternalMovieResponse map(TmdbMovieMetadata movie) {
        TmdbMovieDetails details = movie.details();
        return new ExternalMovieResponse(
                "TMDB",
                details.id().toString(),
                details.title(),
                details.originalTitle(),
                releaseYear(details.releaseDate()),
                directors(movie.credits()),
                details.posterPath(),
                posterUrl(details.posterPath()),
                genres(details.genres()));
    }

    private List<String> directors(TmdbCreditsResponse credits) {
        if (credits == null || credits.crew() == null) {
            return Collections.emptyList();
        }
        return credits.crew().stream()
                .filter(Objects::nonNull)
                .filter(member -> "Director".equals(member.job()))
                .map(TmdbCrewMember::name)
                .filter(StringUtils::hasText)
                .distinct()
                .toList();
    }

    private List<String> genres(List<TmdbGenre> genres) {
        if (genres == null) {
            return Collections.emptyList();
        }
        return genres.stream()
                .filter(Objects::nonNull)
                .map(TmdbGenre::name)
                .filter(StringUtils::hasText)
                .distinct()
                .toList();
    }

    private Integer releaseYear(String releaseDate) {
        if (!StringUtils.hasText(releaseDate)) {
            return null;
        }
        try {
            return LocalDate.parse(releaseDate).getYear();
        } catch (DateTimeParseException exception) {
            return null;
        }
    }

    private String posterUrl(String posterPath) {
        if (!StringUtils.hasText(posterPath)) {
            return null;
        }
        return trimTrailingSlash(properties.getPosterBaseUrl().toString())
                + "/"
                + properties.getPosterSize()
                + (posterPath.startsWith("/") ? posterPath : "/" + posterPath);
    }

    private String trimTrailingSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
