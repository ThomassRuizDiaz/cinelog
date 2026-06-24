package com.cinelog.actor;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActorRepository extends JpaRepository<Actor, Long> {

    Optional<Actor> findByTmdbId(Long tmdbId);

    Optional<Actor> findFirstByNameIgnoreCase(String name);

    List<Actor> findByNameContainingIgnoreCaseOrderByNameAscIdAsc(String query);

    List<Actor> findAllByOrderByNameAscIdAsc();
}
