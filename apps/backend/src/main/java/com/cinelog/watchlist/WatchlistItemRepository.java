package com.cinelog.watchlist;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WatchlistItemRepository extends JpaRepository<WatchlistItem, Long> {

    Optional<WatchlistItem> findByTmdbId(Long tmdbId);
}
