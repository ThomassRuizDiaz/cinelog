package com.cinelog.actor;

import com.cinelog.external.tmdb.TmdbCastImport;
import com.cinelog.movie.Movie;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class CastImportService {

    private final ActorRepository actorRepository;
    private final MovieCastMemberRepository castMemberRepository;

    public CastImportService(ActorRepository actorRepository, MovieCastMemberRepository castMemberRepository) {
        this.actorRepository = actorRepository;
        this.castMemberRepository = castMemberRepository;
    }

    @Transactional
    public void importCast(Movie movie, List<TmdbCastImport> castMembers) {
        for (TmdbCastImport castMember : castMembers) {
            Actor actor = findOrCreateActor(castMember);
            if (!castMemberRepository.existsByMovie_IdAndActor_IdAndCastOrder(
                    movie.getId(), actor.getId(), castMember.castOrder())) {
                castMemberRepository.save(new MovieCastMember(
                        movie,
                        actor,
                        castMember.characterName(),
                        castMember.castOrder()));
            }
        }
    }

    private Actor findOrCreateActor(TmdbCastImport castMember) {
        if (castMember.tmdbId() != null) {
            return actorRepository.findByTmdbId(castMember.tmdbId())
                    .map(actor -> fillMissingProfilePath(actor, castMember.profilePath()))
                    .orElseGet(() -> actorRepository.save(new Actor(
                            castMember.tmdbId(),
                            castMember.name(),
                            castMember.profilePath())));
        }
        return actorRepository.findFirstByNameIgnoreCase(castMember.name())
                .map(actor -> fillMissingProfilePath(actor, castMember.profilePath()))
                .orElseGet(() -> actorRepository.save(new Actor(null, castMember.name(), castMember.profilePath())));
    }

    private Actor fillMissingProfilePath(Actor actor, String profilePath) {
        if (!StringUtils.hasText(actor.getProfilePath()) && StringUtils.hasText(profilePath)) {
            actor.setProfilePath(profilePath);
            return actorRepository.save(actor);
        }
        return actor;
    }
}
