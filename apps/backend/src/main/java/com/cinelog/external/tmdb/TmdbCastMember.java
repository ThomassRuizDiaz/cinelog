package com.cinelog.external.tmdb;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
record TmdbCastMember(
        Long id,
        String name,
        String character,
        Integer order,
        @JsonProperty("profile_path") String profilePath) {
}
