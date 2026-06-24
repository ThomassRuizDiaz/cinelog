package com.cinelog.actor.dto;

import java.util.List;

public record ActorDetailResponse(
        Long id,
        Long tmdbId,
        String name,
        String profilePath,
        String profileUrl,
        List<ActorPerformanceResponse> performances) {
}
