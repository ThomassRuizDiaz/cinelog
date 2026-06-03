package com.cinelog.external.tmdb;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
record TmdbMovieDetails(
        Long id,
        String title,
        @JsonProperty("original_title") String originalTitle,
        @JsonProperty("release_date") String releaseDate,
        @JsonProperty("poster_path") String posterPath,
        List<TmdbGenre> genres) {
}
