package com.cinelog.library;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.cinelog.actor.ActorRepository;
import com.cinelog.actor.MovieCastMemberRepository;
import com.cinelog.external.tmdb.TmdbCastImport;
import com.cinelog.external.tmdb.TmdbCastImportService;
import com.cinelog.movie.MetadataSource;
import com.cinelog.movie.Movie;
import com.cinelog.movie.MovieRepository;
import com.cinelog.movie.MovieService;
import com.cinelog.movie.MovieSort;
import com.cinelog.movie.dto.CreateMovieRequest;
import com.cinelog.movie.dto.ImportMovieRequest;
import com.cinelog.movie.dto.MovieDetailResponse;
import com.cinelog.movie.dto.MovieListItemResponse;
import com.cinelog.movie.dto.UpdateMovieRequest;
import com.cinelog.rating.MovieRating;
import com.cinelog.rating.MovieRatingRepository;
import com.cinelog.watch.WatchEntry;
import com.cinelog.watch.WatchEntryRepository;
import com.cinelog.watch.WatchEntryService;
import com.cinelog.watch.WatchLocation;
import com.cinelog.watch.WatchType;
import com.cinelog.watch.dto.SaveWatchEntryRequest;
import com.cinelog.watch.dto.WatchEntryResponse;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class MovieWatchEntryIntegrationTests {

    @Autowired
    private MovieService movieService;

    @Autowired
    private WatchEntryService watchEntryService;

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private WatchEntryRepository watchEntryRepository;

    @Autowired
    private MovieRatingRepository movieRatingRepository;

    @Autowired
    private ActorRepository actorRepository;

    @Autowired
    private MovieCastMemberRepository castMemberRepository;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TmdbCastImportService tmdbCastImportService;

    @Test
    void createsUpdatesGetsListsAndDeletesManualMovie() {
        assertThat(movieService.list(null, null, null, null, null, null, null, null)).isEmpty();

        MovieDetailResponse created = movieService.create(new CreateMovieRequest(
                "  The Prestige  ", "The Prestige", 2006, List.of("Christopher Nolan"),
                "/poster.jpg", "https://example.test/poster.jpg", List.of("Drama", "Mystery")));
        assertThat(created.metadataSource()).isEqualTo(MetadataSource.MANUAL);
        assertThat(created.title()).isEqualTo("The Prestige");

        MovieDetailResponse updated = movieService.update(created.id(), new UpdateMovieRequest(
                "Prestige Updated", "The Prestige", 2006, List.of("Christopher Nolan"),
                "/updated.jpg", "https://example.test/updated.jpg", List.of("Drama")));
        assertThat(updated.title()).isEqualTo("Prestige Updated");
        assertThat(movieService.get(created.id()).genres()).containsExactly("Drama");
        assertThat(movieService.list(null, null, null, null, null, null, null, null))
                .extracting(MovieListItemResponse::title)
                .containsExactly("Prestige Updated");

        movieService.delete(created.id());
        assertThat(movieRepository.findById(created.id())).isEmpty();
        assertThatThrownBy(() -> movieService.get(created.id()))
                .isInstanceOf(LibraryNotFoundException.class);
    }

    @Test
    void importsNormalizedTmdbMovieWithCastAndRejectsDuplicate() throws Exception {
        ImportMovieRequest request = new ImportMovieRequest(
                "TMDB", "1124", "The Prestige", "The Prestige", 2006,
                List.of("Christopher Nolan"), "/poster.jpg", "https://image.tmdb.org/t/p/w500/poster.jpg",
                List.of("Drama", "Mystery"));
        when(tmdbCastImportService.topCast(1124L)).thenReturn(List.of(
                new TmdbCastImport(100L, "Hugh Jackman", "Robert Angier", 0, "/hugh.jpg"),
                new TmdbCastImport(101L, "Christian Bale", "Alfred Borden", 1, null),
                new TmdbCastImport(102L, "Michael Caine", "Cutter", 2, "/michael.jpg")));

        MovieDetailResponse imported = movieService.importMovie(request);

        assertThat(imported.tmdbId()).isEqualTo(1124L);
        assertThat(imported.metadataSource()).isEqualTo(MetadataSource.TMDB);
        assertThat(imported.cast()).extracting("name")
                .containsExactly("Hugh Jackman", "Christian Bale", "Michael Caine");
        assertThat(imported.cast().getFirst().profilePath()).isEqualTo("/hugh.jpg");
        assertThat(imported.cast().getFirst().profileUrl()).isEqualTo("https://image.tmdb.org/t/p/w500/hugh.jpg");
        assertThat(actorRepository.count()).isEqualTo(3);
        assertThat(castMemberRepository.count()).isEqualTo(3);

        mockMvc.perform(get("/api/movies/" + imported.id()).with(user("admin")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cast[0].name").value("Hugh Jackman"))
                .andExpect(jsonPath("$.cast[0].characterName").value("Robert Angier"))
                .andExpect(jsonPath("$.cast[0].profilePath").value("/hugh.jpg"))
                .andExpect(jsonPath("$.cast[0].profileUrl").value("https://image.tmdb.org/t/p/w500/hugh.jpg"));

        mockMvc.perform(get("/api/actors").with(user("admin")).param("query", "bale"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Christian Bale"))
                .andExpect(jsonPath("$[0].performanceCount").value(1))
                .andExpect(jsonPath("$[0].profilePath").isEmpty())
                .andExpect(jsonPath("$[0].profileUrl").isEmpty());

        Long actorId = imported.cast().get(1).actorId();
        mockMvc.perform(get("/api/actors/" + actorId).with(user("admin")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Christian Bale"))
                .andExpect(jsonPath("$.profilePath").isEmpty())
                .andExpect(jsonPath("$.profileUrl").isEmpty())
                .andExpect(jsonPath("$.performances[0].title").value("The Prestige"))
                .andExpect(jsonPath("$.performances[0].characterName").value("Alfred Borden"))
                .andExpect(jsonPath("$.performances[0].activeRating").isEmpty());

        ImportMovieRequest secondRequest = new ImportMovieRequest(
                "TMDB", "2000", "Second Movie", "Second Movie", 2007,
                List.of("Director"), "/second.jpg", "https://image.tmdb.org/t/p/w500/second.jpg",
                List.of("Drama"));
        when(tmdbCastImportService.topCast(2000L)).thenReturn(List.of(
                new TmdbCastImport(101L, "Christian Bale", "Second Role", 0, "/bale.jpg"),
                new TmdbCastImport(103L, "New Actor", "New Role", 1, "/new.jpg")));
        movieService.importMovie(secondRequest);

        assertThat(actorRepository.count()).isEqualTo(4);
        assertThat(castMemberRepository.count()).isEqualTo(5);
        assertThat(actorRepository.findByTmdbId(101L).orElseThrow().getProfilePath()).isEqualTo("/bale.jpg");

        mockMvc.perform(get("/api/actors/" + actorId).with(user("admin")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profilePath").value("/bale.jpg"))
                .andExpect(jsonPath("$.profileUrl").value("https://image.tmdb.org/t/p/w500/bale.jpg"));

        assertThatThrownBy(() -> movieService.importMovie(request))
                .isInstanceOf(LibraryConflictException.class)
                .hasMessageContaining("already exists");
        assertThat(actorRepository.count()).isEqualTo(4);
        assertThat(castMemberRepository.count()).isEqualTo(5);
    }

    @Test
    void createsUpdatesListsAndGetsMultipleWatchEntries() {
        Movie movie = movie("History", 2000, List.of("Drama"));
        WatchEntryResponse first = watchEntryService.create(movie.getId(), watch(
                LocalDate.of(2026, 1, 1), WatchType.FIRST_WATCH, WatchLocation.HOME));
        WatchEntryResponse second = watchEntryService.create(movie.getId(), watch(
                LocalDate.of(2026, 2, 1), WatchType.REWATCH, WatchLocation.CINEMA));

        WatchEntryResponse updated = watchEntryService.update(first.id(), new SaveWatchEntryRequest(
                LocalDate.of(2026, 1, 2), WatchType.REWATCH, WatchLocation.CINEMA, "Updated"));

        assertThat(updated.notes()).isEqualTo("Updated");
        assertThat(watchEntryService.get(second.id()).watchLocation()).isEqualTo(WatchLocation.CINEMA);
        assertThat(watchEntryService.list(movie.getId()))
                .extracting(WatchEntryResponse::id)
                .containsExactly(second.id(), first.id());
        assertThat(movieService.get(movie.getId()).watchEntries()).hasSize(2);
    }

    @Test
    void deletingWatchEntryDeletesRatingAndReactivatesPreviousRating() {
        Movie movie = movie("Delete Watch", 2000, List.of("Drama"));
        MovieRating older = ratedWatch(movie, LocalDate.of(2026, 1, 1), WatchLocation.HOME, "3.0", true);
        MovieRating newer = ratedWatch(movie, LocalDate.of(2026, 2, 1), WatchLocation.CINEMA, "5.0", true);

        watchEntryService.delete(newer.getWatchEntry().getId());

        Movie refreshed = movieRepository.findById(movie.getId()).orElseThrow();
        assertThat(movieRatingRepository.findById(newer.getId())).isEmpty();
        assertThat(refreshed.getActiveRating().getId()).isEqualTo(older.getId());
        assertThat(refreshed.getActiveWatchEntry().getId()).isEqualTo(older.getWatchEntry().getId());
    }

    @Test
    void updatingWatchedAtRecalculatesActiveRating() {
        Movie movie = movie("Date Update", 2000, List.of("Drama"));
        MovieRating older = ratedWatch(movie, LocalDate.of(2026, 1, 1), WatchLocation.HOME, "3.0", true);
        MovieRating newer = ratedWatch(movie, LocalDate.of(2026, 2, 1), WatchLocation.HOME, "4.0", true);

        watchEntryService.update(older.getWatchEntry().getId(), watch(
                LocalDate.of(2026, 3, 1), WatchType.REWATCH, WatchLocation.HOME));

        Movie refreshed = movieRepository.findById(movie.getId()).orElseThrow();
        assertThat(refreshed.getActiveRating().getId()).isEqualTo(older.getId());
        assertThat(refreshed.getActiveRating().getId()).isNotEqualTo(newer.getId());
    }

    @Test
    void deletingMovieCascadesWatchEntriesAndRatings() {
        Movie movie = movie("Cascade", 2000, List.of("Drama"));
        MovieRating rating = ratedWatch(movie, LocalDate.of(2026, 1, 1), WatchLocation.HOME, "3.0", true);
        Long watchEntryId = rating.getWatchEntry().getId();

        movieService.delete(movie.getId());

        assertThat(movieRepository.findById(movie.getId())).isEmpty();
        assertThat(watchEntryRepository.findById(watchEntryId)).isEmpty();
        assertThat(movieRatingRepository.findById(rating.getId())).isEmpty();
    }

    @Test
    void listFiltersAndReturnsActiveRatingCardData() {
        Movie drama = movie("Alpha Drama", 2006, List.of("Drama", "Mystery"));
        ratedWatch(drama, LocalDate.of(2026, 2, 1), WatchLocation.CINEMA, "4.0", true);
        movie("Beta Comedy", 2007, List.of("Comedy"));

        List<MovieListItemResponse> filtered = movieService.list(
                "alpha", null, "drama", 2006, WatchLocation.CINEMA, true, null, null);

        assertThat(filtered).hasSize(1);
        MovieListItemResponse card = filtered.getFirst();
        assertThat(card.watchCount()).isEqualTo(1);
        assertThat(card.latestWatchedAt()).isEqualTo(LocalDate.of(2026, 2, 1));
        assertThat(card.activeRating().personalRankingScore()).isEqualByComparingTo("4.0");
    }

    @Test
    void listSupportsTitleYearLatestAndEveryScoreSort() {
        Movie low = movie("Zulu", 2000, List.of("Drama"));
        ratedWatch(low, LocalDate.of(2026, 1, 1), WatchLocation.HOME, "1.0", true);
        Movie high = movie("Alpha", 2020, List.of("Drama"));
        ratedWatch(high, LocalDate.of(2026, 2, 1), WatchLocation.HOME, "5.0", true);

        assertFirst(MovieSort.TITLE, "Alpha");
        assertFirst(MovieSort.YEAR, "Alpha");
        assertFirst(MovieSort.LATEST_WATCHED, "Alpha");
        for (MovieSort sort : List.of(
                MovieSort.PERSONAL_SCORE, MovieSort.TECHNICAL_SCORE, MovieSort.OBJECTIVE_SCORE,
                MovieSort.STORY, MovieSort.DIRECTION, MovieSort.PERFORMANCES, MovieSort.PACING,
                MovieSort.VISUALS, MovieSort.MUSIC, MovieSort.THEMES, MovieSort.ORIGINALITY, MovieSort.IMPACT)) {
            assertFirst(sort, "Alpha");
        }
    }

    @Test
    void validationAndNotFoundResponsesUseControlledShape() throws Exception {
        mockMvc.perform(post("/api/movies")
                        .with(user("admin"))
                        .with(csrf())
                        .contentType("application/json")
                        .content("{\"title\":\"\",\"posterUrl\":\"invalid\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.fields.title").exists())
                .andExpect(jsonPath("$.fields.posterUrl").exists());

        mockMvc.perform(get("/api/movies/999999").with(user("admin")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Not found"));

        Movie movie = movie("Enums", 2000, List.of());
        mockMvc.perform(post("/api/movies/" + movie.getId() + "/watch-entries")
                        .with(user("admin"))
                        .with(csrf())
                        .contentType("application/json")
                .content("""
                                {"watchedAt":"2026-01-01","watchType":"INVALID","watchLocation":"HOME"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.message").value("Request body is invalid"));
    }

    private void assertFirst(MovieSort sort, String title) {
        assertThat(movieService.list(null, sort, null, null, null, null, null, null).getFirst().title())
                .isEqualTo(title);
    }

    private Movie movie(String title, int year, List<String> genres) {
        Movie movie = new Movie(MetadataSource.MANUAL, title);
        movie.setOriginalTitle(title);
        movie.setReleaseYear(year);
        movie.setDirectorsJson("[\"Director\"]");
        movie.setGenresJson("[\"" + String.join("\",\"", genres) + "\"]");
        return movieRepository.saveAndFlush(movie);
    }

    private MovieRating ratedWatch(Movie movie, LocalDate watchedAt, WatchLocation location, String score, boolean active) {
        WatchEntry watchEntry = watchEntryRepository.saveAndFlush(
                new WatchEntry(movie, watchedAt, WatchType.FIRST_WATCH, location));
        MovieRating rating = new MovieRating(watchEntry, 1);
        BigDecimal value = new BigDecimal(score);
        rating.setStoryScreenplay(value);
        rating.setDirection(value);
        rating.setPerformancesCharacters(value);
        rating.setPacingEditing(value);
        rating.setVisualsArtDesign(value);
        rating.setMusicSound(value);
        rating.setThemesDepth(value);
        rating.setOriginalityConcept(value);
        rating.setPersonalImpactEnjoyment(value);
        rating.setTechnicalScore(value);
        rating.setObjectiveScore(value);
        rating.setDisplayScore(value);
        MovieRating saved = movieRatingRepository.saveAndFlush(rating);
        if (active) {
            movie.setActiveRating(saved);
            movie.setActiveWatchEntry(watchEntry);
            movieRepository.saveAndFlush(movie);
        }
        return saved;
    }

    private SaveWatchEntryRequest watch(LocalDate watchedAt, WatchType type, WatchLocation location) {
        return new SaveWatchEntryRequest(watchedAt, type, location, null);
    }
}
