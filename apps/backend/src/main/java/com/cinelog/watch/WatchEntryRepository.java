package com.cinelog.watch;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface WatchEntryRepository extends JpaRepository<WatchEntry, Long> {

    List<WatchEntry> findByMovieIdOrderByWatchedAtDesc(Long movieId);

    List<WatchEntry> findByMovieIdOrderByWatchedAtDescIdDesc(Long movieId);

    Optional<WatchEntry> findFirstByOrderByWatchedAtDescIdDesc();

    long countByWatchType(WatchType watchType);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from WatchEntry watchEntry where watchEntry.id = :id")
    int deleteOneById(Long id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from WatchEntry watchEntry where watchEntry.movie.id = :movieId")
    int deleteAllByMovieId(Long movieId);
}
