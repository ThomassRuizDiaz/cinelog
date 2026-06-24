package com.cinelog.external.tmdb;

public record TmdbCastImport(
        Long tmdbId,
        String name,
        String characterName,
        int castOrder,
        String profilePath) {
}
