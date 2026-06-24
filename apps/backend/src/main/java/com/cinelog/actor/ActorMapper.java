package com.cinelog.actor;

import com.cinelog.actor.dto.ActorDetailResponse;
import com.cinelog.actor.dto.ActorListItemResponse;
import com.cinelog.actor.dto.ActorPerformanceResponse;
import com.cinelog.actor.dto.CastMemberResponse;
import com.cinelog.external.tmdb.TmdbProperties;
import com.cinelog.movie.Movie;
import com.cinelog.movie.MovieRatingSummaryMapper;
import java.util.List;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class ActorMapper {

    private final MovieRatingSummaryMapper ratingSummaryMapper;
    private final TmdbProperties tmdbProperties;

    public ActorMapper(MovieRatingSummaryMapper ratingSummaryMapper, TmdbProperties tmdbProperties) {
        this.ratingSummaryMapper = ratingSummaryMapper;
        this.tmdbProperties = tmdbProperties;
    }

    CastMemberResponse castMember(MovieCastMember castMember) {
        Actor actor = castMember.getActor();
        return new CastMemberResponse(
                actor.getId(),
                actor.getTmdbId(),
                actor.getName(),
                castMember.getCharacterName(),
                castMember.getCastOrder(),
                actor.getProfilePath(),
                profileUrl(actor.getProfilePath()));
    }

    ActorListItemResponse listItem(Actor actor, long performanceCount) {
        return new ActorListItemResponse(
                actor.getId(),
                actor.getTmdbId(),
                actor.getName(),
                performanceCount,
                actor.getProfilePath(),
                profileUrl(actor.getProfilePath()));
    }

    ActorDetailResponse detail(Actor actor, List<MovieCastMember> performances) {
        return new ActorDetailResponse(
                actor.getId(),
                actor.getTmdbId(),
                actor.getName(),
                actor.getProfilePath(),
                profileUrl(actor.getProfilePath()),
                performances.stream().map(this::performance).toList());
    }

    private ActorPerformanceResponse performance(MovieCastMember castMember) {
        Movie movie = castMember.getMovie();
        return new ActorPerformanceResponse(
                movie.getId(),
                movie.getTitle(),
                movie.getReleaseYear(),
                movie.getPosterUrl(),
                castMember.getCharacterName(),
                castMember.getCastOrder(),
                ratingSummaryMapper.map(movie.getActiveRating()));
    }

    private String profileUrl(String profilePath) {
        if (!StringUtils.hasText(profilePath)) {
            return null;
        }
        return trimTrailingSlash(tmdbProperties.getPosterBaseUrl().toString())
                + "/"
                + tmdbProperties.getPosterSize()
                + (profilePath.startsWith("/") ? profilePath : "/" + profilePath);
    }

    private String trimTrailingSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
