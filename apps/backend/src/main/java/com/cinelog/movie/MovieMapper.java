package com.cinelog.movie;

import com.cinelog.movie.dto.MovieDetailResponse;
import com.cinelog.movie.dto.MovieListItemResponse;
import com.cinelog.watch.WatchEntry;
import com.cinelog.watch.WatchEntryMapper;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class MovieMapper {

    private final MovieMetadataReader metadataReader;
    private final MovieRatingSummaryMapper ratingSummaryMapper;
    private final WatchEntryMapper watchEntryMapper;

    public MovieMapper(
            MovieMetadataReader metadataReader,
            MovieRatingSummaryMapper ratingSummaryMapper,
            WatchEntryMapper watchEntryMapper) {
        this.metadataReader = metadataReader;
        this.ratingSummaryMapper = ratingSummaryMapper;
        this.watchEntryMapper = watchEntryMapper;
    }

    public MovieListItemResponse listItem(Movie movie, LocalDate latestWatchedAt, long watchCount) {
        return new MovieListItemResponse(
                movie.getId(),
                movie.getTitle(),
                movie.getOriginalTitle(),
                movie.getReleaseYear(),
                metadataReader.directors(movie),
                movie.getPosterUrl(),
                metadataReader.genres(movie),
                latestWatchedAt,
                watchCount,
                ratingSummaryMapper.map(movie.getActiveRating()));
    }

    public MovieDetailResponse detail(Movie movie, List<WatchEntry> watchEntries) {
        return new MovieDetailResponse(
                movie.getId(),
                movie.getTmdbId(),
                movie.getMetadataSource(),
                movie.getTitle(),
                movie.getOriginalTitle(),
                movie.getReleaseYear(),
                metadataReader.directors(movie),
                movie.getPosterPath(),
                movie.getPosterUrl(),
                metadataReader.genres(movie),
                ratingSummaryMapper.map(movie.getActiveRating()),
                watchEntries.stream().map(watchEntryMapper::map).toList(),
                movie.getCreatedAt(),
                movie.getUpdatedAt());
    }
}
