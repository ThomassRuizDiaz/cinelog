package com.cinelog.watchlist;

import com.cinelog.movie.MovieMetadataReader;
import com.cinelog.watchlist.dto.WatchlistItemResponse;
import org.springframework.stereotype.Component;

@Component
public class WatchlistItemMapper {

    private final MovieMetadataReader metadataReader;

    public WatchlistItemMapper(MovieMetadataReader metadataReader) {
        this.metadataReader = metadataReader;
    }

    public WatchlistItemResponse map(WatchlistItem item) {
        return new WatchlistItemResponse(
                item.getId(),
                item.getTmdbId(),
                item.getMetadataSource(),
                item.getTitle(),
                item.getOriginalTitle(),
                item.getReleaseYear(),
                metadataReader.readList(item.getDirectorsJson()),
                item.getPosterPath(),
                item.getPosterUrl(),
                metadataReader.readList(item.getGenresJson()),
                item.getNotes(),
                item.getCreatedAt(),
                item.getUpdatedAt());
    }
}
