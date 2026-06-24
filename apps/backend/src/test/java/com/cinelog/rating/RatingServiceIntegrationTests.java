package com.cinelog.rating;

import static org.assertj.core.api.Assertions.assertThat;

import com.cinelog.movie.MetadataSource;
import com.cinelog.movie.Movie;
import com.cinelog.movie.MovieRepository;
import com.cinelog.rating.dto.RatingResponse;
import com.cinelog.rating.dto.SaveRatingRequest;
import com.cinelog.watch.WatchEntry;
import com.cinelog.watch.WatchEntryRepository;
import com.cinelog.watch.WatchLocation;
import com.cinelog.watch.WatchType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@ActiveProfiles("test")
@SpringBootTest
@Transactional
class RatingServiceIntegrationTests {

    @Autowired
    private RatingService ratingService;

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private WatchEntryRepository watchEntryRepository;

    @Autowired
    private MovieRatingRepository movieRatingRepository;

    @Test
    void savesCompleteRatingAndMakesItActive() {
        WatchEntry watchEntry = createWatchEntry(createMovie(), LocalDate.of(2026, 6, 1), WatchType.FIRST_WATCH);

        RatingResponse response = ratingService.saveOrUpdate(watchEntry.getId(), validRequest(new BigDecimal("10.00")));

        Movie movie = movieRepository.findById(watchEntry.getMovie().getId()).orElseThrow();
        assertThat(response.technicalScore()).isEqualByComparingTo("9.23");
        assertThat(response.objectiveScore()).isEqualByComparingTo("9.13");
        assertThat(response.displayScore()).isEqualByComparingTo("9.25");
        assertThat(response.personalRankingScore()).isEqualByComparingTo("10.00");
        assertThat(response.ratingProfileVersion()).isEqualTo(1);
        assertThat(response.categoryNotes()).containsEntry("direction", "Precise");
        assertThat(movie.getActiveRating().getId()).isEqualTo(response.id());
        assertThat(movie.getActiveWatchEntry().getId()).isEqualTo(watchEntry.getId());
    }

    @Test
    void updatesExistingRatingWithoutCreatingHistoryDuplicate() {
        WatchEntry watchEntry = createWatchEntry(createMovie(), LocalDate.of(2026, 6, 1), WatchType.FIRST_WATCH);
        RatingResponse initial = ratingService.saveOrUpdate(watchEntry.getId(), validRequest(new BigDecimal("10.00")));

        RatingResponse updated = ratingService.saveOrUpdate(watchEntry.getId(), allScoresRequest("6.25", null));

        assertThat(updated.id()).isEqualTo(initial.id());
        assertThat(updated.technicalScore()).isEqualByComparingTo("6.25");
        assertThat(updated.personalRankingScore()).isEqualByComparingTo("6.25");
        assertThat(movieRatingRepository.count()).isEqualTo(1);
    }

    @Test
    void latestRatedWatchBecomesActiveAndOlderRatingRemainsPersisted() {
        Movie movie = createMovie();
        WatchEntry firstWatch = createWatchEntry(movie, LocalDate.of(2026, 5, 1), WatchType.FIRST_WATCH);
        WatchEntry rewatch = createWatchEntry(movie, LocalDate.of(2026, 6, 1), WatchType.REWATCH);
        RatingResponse firstRating = ratingService.saveOrUpdate(firstWatch.getId(), allScoresRequest("4.0", null));
        RatingResponse latestRating = ratingService.saveOrUpdate(rewatch.getId(), allScoresRequest("4.5", null));

        Movie reloaded = movieRepository.findById(movie.getId()).orElseThrow();
        assertThat(reloaded.getActiveRating().getId()).isEqualTo(latestRating.id());
        assertThat(reloaded.getActiveWatchEntry().getId()).isEqualTo(rewatch.getId());
        assertThat(movieRatingRepository.findById(firstRating.id())).isPresent();
        assertThat(movieRatingRepository.count()).isEqualTo(2);
    }

    @Test
    void deleteLatestRatingReactivatesPreviousRatingAndThenClearsActiveReferences() {
        Movie movie = createMovie();
        WatchEntry firstWatch = createWatchEntry(movie, LocalDate.of(2026, 5, 1), WatchType.FIRST_WATCH);
        WatchEntry rewatch = createWatchEntry(movie, LocalDate.of(2026, 6, 1), WatchType.REWATCH);
        RatingResponse firstRating = ratingService.saveOrUpdate(firstWatch.getId(), allScoresRequest("4.0", null));
        ratingService.saveOrUpdate(rewatch.getId(), allScoresRequest("4.5", null));

        ratingService.delete(rewatch.getId());

        Movie withPreviousActive = movieRepository.findById(movie.getId()).orElseThrow();
        assertThat(withPreviousActive.getActiveRating().getId()).isEqualTo(firstRating.id());
        assertThat(withPreviousActive.getActiveWatchEntry().getId()).isEqualTo(firstWatch.getId());

        ratingService.delete(firstWatch.getId());

        Movie withoutActive = movieRepository.findById(movie.getId()).orElseThrow();
        assertThat(withoutActive.getActiveRating()).isNull();
        assertThat(withoutActive.getActiveWatchEntry()).isNull();
        assertThat(movieRatingRepository.count()).isZero();
    }

    @Test
    void laterInsertedWatchWinsWhenDatesMatch() {
        Movie movie = createMovie();
        WatchEntry firstInserted = createWatchEntry(movie, LocalDate.of(2026, 6, 1), WatchType.FIRST_WATCH);
        WatchEntry secondInserted = createWatchEntry(movie, LocalDate.of(2026, 6, 1), WatchType.REWATCH);
        ratingService.saveOrUpdate(firstInserted.getId(), allScoresRequest("4.0", null));
        RatingResponse expectedActive = ratingService.saveOrUpdate(secondInserted.getId(), allScoresRequest("4.5", null));

        Movie reloaded = movieRepository.findById(movie.getId()).orElseThrow();
        assertThat(reloaded.getActiveRating().getId()).isEqualTo(expectedActive.id());
        assertThat(reloaded.getActiveWatchEntry().getId()).isEqualTo(secondInserted.getId());
    }

    private Movie createMovie() {
        return movieRepository.saveAndFlush(new Movie(MetadataSource.MANUAL, "Test Movie"));
    }

    private WatchEntry createWatchEntry(Movie movie, LocalDate watchedAt, WatchType watchType) {
        return watchEntryRepository.saveAndFlush(new WatchEntry(movie, watchedAt, watchType, WatchLocation.HOME));
    }

    private SaveRatingRequest validRequest(BigDecimal personalFinalScore) {
        return new SaveRatingRequest(
                new BigDecimal("10.00"),
                new BigDecimal("9.00"),
                new BigDecimal("9.00"),
                new BigDecimal("8.00"),
                new BigDecimal("9.00"),
                new BigDecimal("8.00"),
                new BigDecimal("10.00"),
                new BigDecimal("9.00"),
                new BigDecimal("10.00"),
                personalFinalScore,
                "Review",
                "Private",
                Map.of("direction", "Precise"));
    }

    private SaveRatingRequest allScoresRequest(String score, BigDecimal personalFinalScore) {
        BigDecimal value = new BigDecimal(score);
        return new SaveRatingRequest(
                value,
                value,
                value,
                value,
                value,
                value,
                value,
                value,
                value,
                personalFinalScore,
                null,
                null,
                Map.of());
    }
}
