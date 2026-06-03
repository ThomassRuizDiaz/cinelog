package com.cinelog.external.tmdb;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
record TmdbCreditsResponse(List<TmdbCrewMember> crew) {
}
