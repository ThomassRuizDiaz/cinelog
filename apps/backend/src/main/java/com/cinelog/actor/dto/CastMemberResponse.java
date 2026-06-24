package com.cinelog.actor.dto;

public record CastMemberResponse(
        Long actorId,
        Long tmdbId,
        String name,
        String characterName,
        int castOrder) {
}
