package com.cinelog.movie;

import java.util.Optional;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface MovieRepository extends JpaRepository<Movie, Long> {

    Optional<Movie> findByTmdbId(Long tmdbId);

    @Query("""
            select m
            from Movie m
            join fetch m.activeRating
            join fetch m.activeWatchEntry
            """)
    List<Movie> findAllWithActiveRatingAndActiveWatchEntry();
}
