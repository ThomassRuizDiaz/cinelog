package com.cinelog.ranking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

import com.cinelog.dashboard.DashboardService;
import com.cinelog.dashboard.dto.DashboardResponse;
import com.cinelog.external.tmdb.TmdbClient;
import com.cinelog.movie.MetadataSource;
import com.cinelog.movie.Movie;
import com.cinelog.movie.MovieRepository;
import com.cinelog.ranking.dto.RankingItemResponse;
import com.cinelog.rating.MovieRating;
import com.cinelog.rating.MovieRatingRepository;
import com.cinelog.watch.WatchEntry;
import com.cinelog.watch.WatchEntryRepository;
import com.cinelog.watch.WatchLocation;
import com.cinelog.watch.WatchType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
class RankingDashboardIntegrationTests {

    @Autowired
    private RankingService rankingService;

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private WatchEntryRepository watchEntryRepository;

    @Autowired
    private MovieRatingRepository movieRatingRepository;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TmdbClient tmdbClient;

    @BeforeEach
    void cleanDatabase() {
        movieRepository.findAll().forEach(movie -> {
            movie.setActiveRating(null);
            movie.setActiveWatchEntry(null);
        });
        movieRepository.flush();
        movieRatingRepository.deleteAll();
        watchEntryRepository.deleteAll();
        movieRepository.deleteAll();
    }

    @AfterEach
    void cleanDatabaseAfterTest() {
        cleanDatabase();
    }

    @Test
    void invalidRankingModeReturnsBadRequest() throws Exception {
        mockMvc.perform(get("/api/rankings").with(user("admin")).param("mode", "INVALID"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid ranking request"))
                .andExpect(jsonPath("$.message").value("Invalid ranking query parameter: mode"));
    }

    @Test
    void personalRankingUsesFinalThenDisplayAndSupportsTechnicalFallback() {
        ratedMovie("Personal Final", 2001, "[\"Drama\"]", WatchLocation.HOME, LocalDate.of(2026, 1, 1),
                scores("3.00", "3.00", "3.0", "5.0", "3.0"));
        ratedMovie("Display Fallback", 2002, "[\"Drama\"]", WatchLocation.HOME, LocalDate.of(2026, 1, 2),
                scores("4.00", "4.00", "4.5", null, "4.0"));

        List<RankingItemResponse> rankings = rankingService.rankings(
                RankingMode.PERSONAL, null, null, null, null, null, null);

        assertThat(rankings).extracting(RankingItemResponse::title)
                .containsExactly("Personal Final", "Display Fallback");
        assertThat(rankings).extracting(RankingItemResponse::score)
                .containsExactly(decimal("5.00"), decimal("4.50"));

        MovieRating incomplete = mock(MovieRating.class);
        when(incomplete.getTechnicalScore()).thenReturn(decimal("3.25"));
        assertThat(rankingService.personalRankingScore(incomplete)).isEqualByComparingTo("3.25");
    }

    @Test
    void technicalObjectiveAndEveryCategoryModeUseExpectedScore() {
        ratedMovie("Mode Matrix", 2006, "[\"Mystery\"]", WatchLocation.CINEMA, LocalDate.of(2026, 2, 1),
                new ScoreValues("4.10", "3.90", "4.0", null, "4.5", "0.5", "1.0", "1.5",
                        "2.0", "2.5", "3.0", "3.5", "4.0"));
        Map<RankingMode, String> expected = Map.ofEntries(
                Map.entry(RankingMode.TECHNICAL, "4.10"),
                Map.entry(RankingMode.OBJECTIVE, "3.90"),
                Map.entry(RankingMode.STORY, "0.5"),
                Map.entry(RankingMode.DIRECTION, "1.0"),
                Map.entry(RankingMode.PERFORMANCES, "1.5"),
                Map.entry(RankingMode.PACING, "2.0"),
                Map.entry(RankingMode.VISUALS, "2.5"),
                Map.entry(RankingMode.MUSIC, "3.0"),
                Map.entry(RankingMode.THEMES, "3.5"),
                Map.entry(RankingMode.ORIGINALITY, "4.0"),
                Map.entry(RankingMode.IMPACT, "4.5"));

        expected.forEach((mode, score) -> assertThat(rankingService
                        .rankings(mode, null, null, null, null, null, null)
                        .getFirst()
                        .score())
                .isEqualByComparingTo(score));
    }

    @Test
    void tieBreakersAreDeterministic() {
        ratedMovie("Fifth", 2000, "[]", WatchLocation.HOME, LocalDate.of(2026, 1, 1),
                scores("3.00", "3.00", "3.0", null, "3.0"));
        ratedMovie("Fourth", 2000, "[]", WatchLocation.HOME, LocalDate.of(2026, 1, 1),
                scores("4.00", "3.00", "4.0", null, "3.0"));
        ratedMovie("Third", 2000, "[]", WatchLocation.HOME, LocalDate.of(2026, 1, 1),
                scores("4.00", "3.00", "4.0", null, "4.0"));
        ratedMovie("Bravo", 2000, "[]", WatchLocation.HOME, LocalDate.of(2026, 1, 2),
                scores("4.00", "3.00", "4.0", null, "4.0"));
        ratedMovie("Alpha", 2000, "[]", WatchLocation.HOME, LocalDate.of(2026, 1, 2),
                scores("4.00", "3.00", "4.0", null, "4.0"));

        assertThat(rankingService.rankings(RankingMode.PERSONAL, null, null, null, null, null, null))
                .extracting(RankingItemResponse::title)
                .containsExactly("Alpha", "Bravo", "Third", "Fourth", "Fifth");
    }

    @Test
    void rankingUsesOnlyActiveRatingAndFiltersGenreYearLocation() {
        Movie movie = movie("Active Low", 2006, "[\"Drama\",\"Mystery\"]");
        rating(movie, LocalDate.of(2025, 1, 1), WatchLocation.HOME,
                scores("5.00", "5.00", "5.0", "5.0", "5.0"), false);
        rating(movie, LocalDate.of(2026, 1, 1), WatchLocation.CINEMA,
                scores("1.00", "1.00", "1.0", "1.0", "1.0"), true);
        ratedMovie("Other", 2007, "[\"Comedy\"]", WatchLocation.HOME, LocalDate.of(2026, 1, 2),
                scores("3.00", "3.00", "3.0", "3.0", "3.0"));

        List<RankingItemResponse> filtered = rankingService.rankings(
                RankingMode.PERSONAL, "mystery", 2006, WatchLocation.CINEMA, null, null, null);

        assertThat(filtered).hasSize(1);
        assertThat(filtered.getFirst().title()).isEqualTo("Active Low");
        assertThat(filtered.getFirst().score()).isEqualByComparingTo("1.0");
        assertThat(movieRatingRepository.count()).isEqualTo(3);
        assertThat(rankingService.rankings(
                RankingMode.PERSONAL, "missing", null, null, null, null, null)).isEmpty();
    }

    @Test
    void rankingSupportsLimitAndPagination() {
        ratedMovie("One", 2001, "[]", WatchLocation.HOME, LocalDate.of(2026, 1, 1),
                scores("5.00", "5.00", "5.0", null, "5.0"));
        ratedMovie("Two", 2002, "[]", WatchLocation.HOME, LocalDate.of(2026, 1, 2),
                scores("4.00", "4.00", "4.0", null, "4.0"));
        ratedMovie("Three", 2003, "[]", WatchLocation.HOME, LocalDate.of(2026, 1, 3),
                scores("3.00", "3.00", "3.0", null, "3.0"));

        assertThat(rankingService.rankings(RankingMode.PERSONAL, null, null, null, 2, null, null))
                .extracting(RankingItemResponse::title)
                .containsExactly("One", "Two");
        List<RankingItemResponse> secondPage = rankingService.rankings(
                RankingMode.PERSONAL, null, null, null, null, 1, 1);
        assertThat(secondPage).extracting(RankingItemResponse::title).containsExactly("Two");
        assertThat(secondPage.getFirst().rank()).isEqualTo(2);
    }

    @Test
    void dashboardHandlesEmptyDatabase() {
        DashboardResponse dashboard = dashboardService.dashboard();

        assertThat(dashboard.stats().totalMovies()).isZero();
        assertThat(dashboard.stats().totalWatchEntries()).isZero();
        assertThat(dashboard.stats().totalRewatches()).isZero();
        assertThat(dashboard.stats().averageTechnicalScore()).isNull();
        assertThat(dashboard.stats().averagePersonalScore()).isNull();
        assertThat(dashboard.latestWatch()).isNull();
        assertThat(dashboard.topPersonal()).isEmpty();
        assertThat(dashboard.topTechnical()).isEmpty();
        assertThat(dashboard.recentlyAdded()).isEmpty();
        verifyNoInteractions(tmdbClient);
    }

    @Test
    void dashboardReturnsStatsLatestWatchTopsAndRecentlyAddedWithoutTmdb() {
        ratedMovie("Older Rated", 2001, "[\"Drama\"]", WatchLocation.HOME, LocalDate.of(2026, 1, 1),
                scores("4.00", "4.00", "4.0", "5.0", "4.0"));
        ratedMovie("Latest Rated", 2002, "[\"Mystery\"]", WatchLocation.CINEMA, LocalDate.of(2026, 2, 1),
                scores("2.00", "2.00", "2.5", null, "2.0"));
        Movie newest = movie("Newest Unrated", 2003, "[\"Comedy\"]");
        watchEntryRepository.saveAndFlush(new WatchEntry(
                newest, LocalDate.of(2026, 3, 1), WatchType.REWATCH, WatchLocation.HOME));

        DashboardResponse dashboard = dashboardService.dashboard();

        assertThat(dashboard.stats().totalMovies()).isEqualTo(3);
        assertThat(dashboard.stats().totalWatchEntries()).isEqualTo(3);
        assertThat(dashboard.stats().totalRewatches()).isEqualTo(1);
        assertThat(dashboard.stats().averageTechnicalScore()).isEqualByComparingTo("3.00");
        assertThat(dashboard.stats().averagePersonalScore()).isEqualByComparingTo("3.75");
        assertThat(dashboard.latestWatch().title()).isEqualTo("Newest Unrated");
        assertThat(dashboard.latestWatch().posterUrl()).isEqualTo("https://example.test/Newest-Unrated.jpg");
        assertThat(dashboard.latestWatch().activeRating()).isNull();
        assertThat(dashboard.topPersonal()).extracting(RankingItemResponse::title)
                .containsExactly("Older Rated", "Latest Rated");
        assertThat(dashboard.topTechnical()).extracting(RankingItemResponse::title)
                .containsExactly("Older Rated", "Latest Rated");
        assertThat(dashboard.recentlyAdded()).extracting(item -> item.title())
                .startsWith("Newest Unrated");
        assertThat(dashboard.recentlyAdded().get(0).activeRating()).isNull();
        assertThat(dashboard.recentlyAdded())
                .filteredOn(item -> item.title().equals("Latest Rated"))
                .singleElement()
                .satisfies(item -> {
                    assertThat(item.posterUrl()).isEqualTo("https://example.test/Latest-Rated.jpg");
                    assertThat(item.activeRating().technicalScore()).isEqualByComparingTo("2.00");
                    assertThat(item.activeRating().objectiveScore()).isEqualByComparingTo("2.00");
                    assertThat(item.activeRating().displayScore()).isEqualByComparingTo("2.5");
                    assertThat(item.activeRating().personalFinalScore()).isNull();
                    assertThat(item.activeRating().personalRankingScore()).isEqualByComparingTo("2.5");
                });
        verifyNoInteractions(tmdbClient);
    }

    @Test
    void dashboardJsonIncludesRecentActiveRatingFields() throws Exception {
        ratedMovie("Rated Recent", 2001, "[\"Drama\"]", WatchLocation.HOME, LocalDate.of(2026, 1, 1),
                scores("4.00", "4.00", "4.0", "5.0", "4.0"));
        Movie unrated = movie("Unrated Latest", 2002, "[\"Comedy\"]");
        watchEntryRepository.saveAndFlush(new WatchEntry(
                unrated, LocalDate.of(2026, 2, 1), WatchType.REWATCH, WatchLocation.HOME));

        mockMvc.perform(get("/api/dashboard").with(user("admin")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.latestWatch.title").value("Unrated Latest"))
                .andExpect(jsonPath("$.latestWatch.posterUrl").value("https://example.test/Unrated-Latest.jpg"))
                .andExpect(jsonPath("$.latestWatch.activeRating").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$.recentlyAdded[0].title").value("Unrated Latest"))
                .andExpect(jsonPath("$.recentlyAdded[0].activeRating").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$.recentlyAdded[1].title").value("Rated Recent"))
                .andExpect(jsonPath("$.recentlyAdded[1].posterUrl").value("https://example.test/Rated-Recent.jpg"))
                .andExpect(jsonPath("$.recentlyAdded[1].activeRating.technicalScore").value(4.00))
                .andExpect(jsonPath("$.recentlyAdded[1].activeRating.objectiveScore").value(4.00))
                .andExpect(jsonPath("$.recentlyAdded[1].activeRating.displayScore").value(4.0))
                .andExpect(jsonPath("$.recentlyAdded[1].activeRating.personalFinalScore").value(5.0))
                .andExpect(jsonPath("$.recentlyAdded[1].activeRating.personalRankingScore").value(5.0))
                .andExpect(jsonPath("$.topPersonal[0].title").value("Rated Recent"))
                .andExpect(jsonPath("$.topTechnical[0].title").value("Rated Recent"));

        verifyNoInteractions(tmdbClient);
    }

    private Movie ratedMovie(
            String title,
            int year,
            String genresJson,
            WatchLocation location,
            LocalDate watchedAt,
            ScoreValues values) {
        Movie movie = movie(title, year, genresJson);
        rating(movie, watchedAt, location, values, true);
        return movie;
    }

    private Movie movie(String title, int year, String genresJson) {
        Movie movie = new Movie(MetadataSource.MANUAL, title);
        movie.setReleaseYear(year);
        movie.setDirectorsJson("[\"Director\"]");
        movie.setGenresJson(genresJson);
        movie.setPosterUrl("https://example.test/" + title.replace(" ", "-") + ".jpg");
        return movieRepository.saveAndFlush(movie);
    }

    private MovieRating rating(
            Movie movie,
            LocalDate watchedAt,
            WatchLocation location,
            ScoreValues values,
            boolean active) {
        WatchEntry watchEntry = watchEntryRepository.saveAndFlush(
                new WatchEntry(movie, watchedAt, WatchType.FIRST_WATCH, location));
        MovieRating rating = new MovieRating(watchEntry, 1);
        rating.setTechnicalScore(decimal(values.technical()));
        rating.setObjectiveScore(decimal(values.objective()));
        rating.setDisplayScore(decimal(values.display()));
        rating.setPersonalFinalScore(decimal(values.personalFinal()));
        rating.setPersonalImpactEnjoyment(decimal(values.impact()));
        rating.setStoryScreenplay(decimal(values.story()));
        rating.setDirection(decimal(values.direction()));
        rating.setPerformancesCharacters(decimal(values.performances()));
        rating.setPacingEditing(decimal(values.pacing()));
        rating.setVisualsArtDesign(decimal(values.visuals()));
        rating.setMusicSound(decimal(values.music()));
        rating.setThemesDepth(decimal(values.themes()));
        rating.setOriginalityConcept(decimal(values.originality()));
        MovieRating saved = movieRatingRepository.saveAndFlush(rating);
        if (active) {
            movie.setActiveRating(saved);
            movie.setActiveWatchEntry(watchEntry);
            movieRepository.saveAndFlush(movie);
        }
        return saved;
    }

    private ScoreValues scores(String technical, String objective, String display, String personalFinal, String impact) {
        return new ScoreValues(
                technical, objective, display, personalFinal, impact,
                "3.0", "3.0", "3.0", "3.0", "3.0", "3.0", "3.0", "3.0");
    }

    private BigDecimal decimal(String value) {
        return value == null ? null : new BigDecimal(value);
    }

    private record ScoreValues(
            String technical,
            String objective,
            String display,
            String personalFinal,
            String impact,
            String story,
            String direction,
            String performances,
            String pacing,
            String visuals,
            String music,
            String themes,
            String originality) {
    }
}
