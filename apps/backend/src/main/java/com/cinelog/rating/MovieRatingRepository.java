package com.cinelog.rating;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface MovieRatingRepository extends JpaRepository<MovieRating, Long> {

    Optional<MovieRating> findByWatchEntry_Id(Long watchEntryId);

    Optional<MovieRating> findFirstByWatchEntry_Movie_IdOrderByWatchEntry_WatchedAtDescWatchEntry_IdDesc(Long movieId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from MovieRating rating where rating.watchEntry.id = :watchEntryId")
    int deleteAllByWatchEntryId(Long watchEntryId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from MovieRating rating where rating.watchEntry.movie.id = :movieId")
    int deleteAllByMovieId(Long movieId);
}
