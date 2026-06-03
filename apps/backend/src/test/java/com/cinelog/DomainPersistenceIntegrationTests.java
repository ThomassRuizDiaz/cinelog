package com.cinelog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.cinelog.movie.MetadataSource;
import com.cinelog.movie.Movie;
import com.cinelog.movie.MovieRepository;
import com.cinelog.rating.MovieRating;
import com.cinelog.rating.MovieRatingRepository;
import com.cinelog.rating.RatingProfileRepository;
import com.cinelog.watch.WatchEntry;
import com.cinelog.watch.WatchEntryRepository;
import com.cinelog.watch.WatchLocation;
import com.cinelog.watch.WatchType;
import jakarta.validation.ConstraintViolationException;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@ActiveProfiles("test")
@SpringBootTest
@Transactional
class DomainPersistenceIntegrationTests {

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private WatchEntryRepository watchEntryRepository;

    @Autowired
    private MovieRatingRepository movieRatingRepository;

    @Autowired
    private RatingProfileRepository ratingProfileRepository;

    @Autowired
    private JdbcClient jdbcClient;

    @Test
    void persistsDomainGraphAndActiveRatingReferences() {
        assertThat(ratingProfileRepository.findByVersion(1))
                .get()
                .satisfies(profile -> {
                    assertThat(profile.getName()).isEqualTo("Main Rating System");
                    assertThat(profile.isActive()).isTrue();
                    assertThat(profile.getWeightsJson()).contains("\"storyScreenplay\":0.18");
                });

        Movie movie = new Movie(MetadataSource.TMDB, "The Prestige");
        movie.setTmdbId(1124L);
        movie.setOriginalTitle("The Prestige");
        movie.setReleaseYear(2006);
        movie.setDirectorsJson("[\"Christopher Nolan\"]");
        movie.setGenresJson("[\"Drama\",\"Mystery\"]");
        movie.setPosterPath("/example.jpg");
        movie.setPosterUrl("https://image.tmdb.org/t/p/w500/example.jpg");
        movieRepository.saveAndFlush(movie);

        WatchEntry watchEntry = new WatchEntry(movie, LocalDate.of(2026, 6, 2), WatchType.FIRST_WATCH, WatchLocation.HOME);
        watchEntryRepository.saveAndFlush(watchEntry);

        MovieRating rating = completeRating(watchEntry);
        movieRatingRepository.saveAndFlush(rating);

        movie.setActiveWatchEntry(watchEntry);
        movie.setActiveRating(rating);
        movieRepository.saveAndFlush(movie);

        assertThat(movieRepository.findByTmdbId(1124L))
                .get()
                .satisfies(found -> {
                    assertThat(found.getDirectorsJson()).isEqualTo("[\"Christopher Nolan\"]");
                    assertThat(found.getGenresJson()).isEqualTo("[\"Drama\",\"Mystery\"]");
                    assertThat(found.getActiveWatchEntry().getId()).isEqualTo(watchEntry.getId());
                    assertThat(found.getActiveRating().getId()).isEqualTo(rating.getId());
                });
        assertThat(movieRatingRepository.findByWatchEntry_Id(watchEntry.getId())).contains(rating);
    }

    @Test
    void rejectsDuplicateTmdbIdWhenPresent() {
        Movie first = new Movie(MetadataSource.TMDB, "First");
        first.setTmdbId(1124L);
        movieRepository.saveAndFlush(first);

        Movie duplicate = new Movie(MetadataSource.TMDB, "Duplicate");
        duplicate.setTmdbId(1124L);

        assertThatThrownBy(() -> movieRepository.saveAndFlush(duplicate))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void rejectsMoreThanOneRatingForAWatchEntry() {
        Movie movie = movieRepository.saveAndFlush(new Movie(MetadataSource.MANUAL, "Manual Movie"));
        WatchEntry watchEntry = watchEntryRepository.saveAndFlush(
                new WatchEntry(movie, LocalDate.of(2026, 6, 2), WatchType.FIRST_WATCH, WatchLocation.CINEMA));
        movieRatingRepository.saveAndFlush(completeRating(watchEntry));

        assertThatThrownBy(() -> movieRatingRepository.saveAndFlush(completeRating(watchEntry)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void rejectsCategoryScoresOutsideHalfPointIncrements() {
        Movie movie = movieRepository.saveAndFlush(new Movie(MetadataSource.MANUAL, "Manual Movie"));
        WatchEntry watchEntry = watchEntryRepository.saveAndFlush(
                new WatchEntry(movie, LocalDate.of(2026, 6, 2), WatchType.FIRST_WATCH, WatchLocation.HOME));
        MovieRating rating = completeRating(watchEntry);
        rating.setStoryScreenplay(new BigDecimal("4.3"));

        assertThatThrownBy(() -> movieRatingRepository.saveAndFlush(rating))
                .isInstanceOf(ConstraintViolationException.class);
    }

    @Test
    void providesSpringSecurityPersistentLoginsTable() {
        jdbcClient.sql("""
                INSERT INTO persistent_logins (username, series, token, last_used)
                VALUES (:username, :series, :token, CURRENT_TIMESTAMP)
                """)
                .param("username", "admin")
                .param("series", "series-token")
                .param("token", "remember-me-token")
                .update();

        String username = jdbcClient.sql("SELECT username FROM persistent_logins WHERE series = :series")
                .param("series", "series-token")
                .query(String.class)
                .single();

        assertThat(username).isEqualTo("admin");
    }

    private MovieRating completeRating(WatchEntry watchEntry) {
        MovieRating rating = new MovieRating(watchEntry, 1);
        rating.setStoryScreenplay(new BigDecimal("4.5"));
        rating.setDirection(new BigDecimal("4.5"));
        rating.setPerformancesCharacters(new BigDecimal("4.0"));
        rating.setPacingEditing(new BigDecimal("4.0"));
        rating.setVisualsArtDesign(new BigDecimal("4.5"));
        rating.setMusicSound(new BigDecimal("4.0"));
        rating.setThemesDepth(new BigDecimal("4.5"));
        rating.setOriginalityConcept(new BigDecimal("4.0"));
        rating.setPersonalImpactEnjoyment(new BigDecimal("5.0"));
        rating.setTechnicalScore(new BigDecimal("4.25"));
        rating.setObjectiveScore(new BigDecimal("4.20"));
        rating.setDisplayScore(new BigDecimal("4.5"));
        rating.setPersonalFinalScore(new BigDecimal("5.0"));
        rating.setCategoryNotesJson("{}");
        return rating;
    }
}
