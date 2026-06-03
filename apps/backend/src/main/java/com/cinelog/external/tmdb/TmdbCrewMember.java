package com.cinelog.external.tmdb;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
record TmdbCrewMember(String job, String name) {
}
