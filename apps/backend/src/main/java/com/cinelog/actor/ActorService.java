package com.cinelog.actor;

import com.cinelog.actor.dto.ActorDetailResponse;
import com.cinelog.actor.dto.ActorListItemResponse;
import com.cinelog.actor.dto.CastMemberResponse;
import com.cinelog.library.LibraryNotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ActorService {

    private static final int DEFAULT_SIZE = 50;
    private static final int MAX_SIZE = 100;

    private final ActorRepository actorRepository;
    private final MovieCastMemberRepository castMemberRepository;
    private final ActorMapper actorMapper;

    public ActorService(
            ActorRepository actorRepository,
            MovieCastMemberRepository castMemberRepository,
            ActorMapper actorMapper) {
        this.actorRepository = actorRepository;
        this.castMemberRepository = castMemberRepository;
        this.actorMapper = actorMapper;
    }

    @Transactional(readOnly = true)
    public List<ActorListItemResponse> list(String query, Integer page, Integer size) {
        int effectivePage = page == null ? 0 : page;
        int effectiveSize = size == null ? DEFAULT_SIZE : size;
        validatePage(effectivePage, effectiveSize);
        List<Actor> actors = query == null || query.isBlank()
                ? actorRepository.findAllByOrderByNameAscIdAsc()
                : actorRepository.findByNameContainingIgnoreCaseOrderByNameAscIdAsc(query.trim());
        return actors.stream()
                .skip((long) effectivePage * effectiveSize)
                .limit(effectiveSize)
                .map(actor -> actorMapper.listItem(
                        actor,
                        castMemberRepository.findByActor_IdOrderByMovie_TitleAscMovie_IdAscCastOrderAsc(actor.getId()).size()))
                .toList();
    }

    @Transactional(readOnly = true)
    public ActorDetailResponse get(Long id) {
        Actor actor = actorRepository.findById(id)
                .orElseThrow(() -> new LibraryNotFoundException("Actor not found: " + id));
        return actorMapper.detail(actor, castMemberRepository.findByActor_IdOrderByMovie_TitleAscMovie_IdAscCastOrderAsc(id));
    }

    @Transactional(readOnly = true)
    public List<CastMemberResponse> movieCast(Long movieId) {
        return castMemberRepository.findByMovie_IdOrderByCastOrderAscIdAsc(movieId).stream()
                .map(actorMapper::castMember)
                .toList();
    }

    private void validatePage(int page, int size) {
        if (page < 0) {
            throw new IllegalArgumentException("page must be zero or greater");
        }
        if (size < 1 || size > MAX_SIZE) {
            throw new IllegalArgumentException("size must be between 1 and " + MAX_SIZE);
        }
    }
}
