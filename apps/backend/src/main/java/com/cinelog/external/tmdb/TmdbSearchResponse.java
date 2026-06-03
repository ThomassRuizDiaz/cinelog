package com.cinelog.external.tmdb;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
record TmdbSearchResponse(List<TmdbSearchMovie> results) {
}
