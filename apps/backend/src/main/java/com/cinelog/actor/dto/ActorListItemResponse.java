package com.cinelog.actor.dto;

public record ActorListItemResponse(
        Long id,
        Long tmdbId,
        String name,
        long performanceCount,
        String profilePath,
        String profileUrl) {
}
