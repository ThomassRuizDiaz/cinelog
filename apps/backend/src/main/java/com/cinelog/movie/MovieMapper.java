package com.cinelog.movie;

import com.cinelog.actor.ActorService;
import com.cinelog.movie.dto.MovieDetailResponse;
import com.cinelog.movie.dto.MovieListItemResponse;
import com.cinelog.movie.dto.MovieRankingSummaryResponse;
import com.cinelog.rating.MovieRating;
import com.cinelog.watch.WatchEntry;
import com.cinelog.watch.WatchEntryMapper;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class MovieMapper {

    private final MovieMetadataReader metadataReader;
    private final MovieRatingSummaryMapper ratingSummaryMapper;
    private final WatchEntryMapper watchEntryMapper;
    private final ActorService actorService;

    public MovieMapper(
            MovieMetadataReader metadataReader,
            MovieRatingSummaryMapper ratingSummaryMapper,
            WatchEntryMapper watchEntryMapper,
            ActorService actorService) {
        this.metadataReader = metadataReader;
        this.ratingSummaryMapper = ratingSummaryMapper;
        this.watchEntryMapper = watchEntryMapper;
        this.actorService = actorService;
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
                actorService.movieCast(movie.getId()),
                ratingSummaryMapper.map(movie.getActiveRating()),
                rankingSummary(movie, watchEntries),
                watchEntries.stream().map(watchEntryMapper::map).toList(),
                movie.getCreatedAt(),
                movie.getUpdatedAt());
    }

    private MovieRankingSummaryResponse rankingSummary(Movie movie, List<WatchEntry> watchEntries) {
        MovieRating rating = movie.getActiveRating();
        if (rating == null) {
            return null;
        }
        return new MovieRankingSummaryResponse(
                movie.getId(),
                personalScore(rating),
                "Personal",
                rating.getTechnicalScore(),
                rating.getObjectiveScore(),
                rating.getDisplayScore(),
                rating.getPersonalFinalScore(),
                movie.getActiveWatchEntry() == null ? null : movie.getActiveWatchEntry().getWatchedAt());
    }

    private BigDecimal personalScore(MovieRating rating) {
        if (rating.getPersonalFinalScore() != null) {
            return rating.getPersonalFinalScore();
        }
        if (rating.getDisplayScore() != null) {
            return rating.getDisplayScore();
        }
        return rating.getTechnicalScore();
    }
}
