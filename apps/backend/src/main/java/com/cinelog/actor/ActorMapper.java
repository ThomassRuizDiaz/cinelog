package com.cinelog.actor;

import com.cinelog.actor.dto.ActorDetailResponse;
import com.cinelog.actor.dto.ActorListItemResponse;
import com.cinelog.actor.dto.ActorPerformanceResponse;
import com.cinelog.actor.dto.CastMemberResponse;
import com.cinelog.movie.Movie;
import com.cinelog.movie.MovieRatingSummaryMapper;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class ActorMapper {

    private final MovieRatingSummaryMapper ratingSummaryMapper;

    public ActorMapper(MovieRatingSummaryMapper ratingSummaryMapper) {
        this.ratingSummaryMapper = ratingSummaryMapper;
    }

    CastMemberResponse castMember(MovieCastMember castMember) {
        Actor actor = castMember.getActor();
        return new CastMemberResponse(
                actor.getId(),
                actor.getTmdbId(),
                actor.getName(),
                castMember.getCharacterName(),
                castMember.getCastOrder());
    }

    ActorListItemResponse listItem(Actor actor, long performanceCount) {
        return new ActorListItemResponse(actor.getId(), actor.getTmdbId(), actor.getName(), performanceCount);
    }

    ActorDetailResponse detail(Actor actor, List<MovieCastMember> performances) {
        return new ActorDetailResponse(
                actor.getId(),
                actor.getTmdbId(),
                actor.getName(),
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
}
