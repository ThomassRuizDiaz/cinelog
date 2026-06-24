package com.cinelog.actor;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MovieCastMemberRepository extends JpaRepository<MovieCastMember, Long> {

    boolean existsByMovie_IdAndActor_IdAndCastOrder(Long movieId, Long actorId, int castOrder);

    List<MovieCastMember> findByMovie_IdOrderByCastOrderAscIdAsc(Long movieId);

    List<MovieCastMember> findByActor_IdOrderByMovie_TitleAscMovie_IdAscCastOrderAsc(Long actorId);
}
