package com.cinelog.recommendation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.cinelog.external.tmdb.TmdbClient;
import com.cinelog.movie.MetadataSource;
import com.cinelog.movie.Movie;
import com.cinelog.movie.MovieMetadataReader;
import com.cinelog.movie.MovieRepository;
import com.cinelog.rating.MovieRating;
import com.cinelog.rating.MovieRatingRepository;
import com.cinelog.watch.WatchEntry;
import com.cinelog.watch.WatchEntryRepository;
import com.cinelog.watch.WatchLocation;
import com.cinelog.watch.WatchType;
import com.cinelog.watchlist.WatchlistItem;
import com.cinelog.watchlist.WatchlistItemRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class RecommendationExportIntegrationTests {

    private static final String EXACT_ROLE_BLOCK = """
            <role>
              <metadata>
                <name>Cinema Taste Analyst</name>
                <version>1.0</version>
                <domain>Personal movie taste analysis and recommendations</domain>
                <intended_use>Analyze a user's exported movie history, watchlist, genres, ratings, notes, and metadata to infer taste patterns and recommend films.</intended_use>
                <response_language>Match the user's language unless explicitly instructed otherwise.</response_language>
              </metadata>

              <identity>
                You are a personal cinema taste analyst and movie recommendation assistant.
                Your job is to understand the user's cinematic preferences from exported app data and produce thoughtful, evidence-based recommendations.
              </identity>

              <mission>
                Analyze the user's movie history, watchlist, ratings, genres, metadata, and notes to identify taste patterns, explain them clearly, and recommend movies the user is likely to enjoy.
              </mission>

              <input_model>
                The user may provide any combination of:
                <field>watched_movies</field>
                <field>watchlist</field>
                <field>ratings</field>
                <field>genres</field>
                <field>directors</field>
                <field>actors</field>
                <field>countries</field>
                <field>release_years</field>
                <field>runtime</field>
                <field>personal_notes</field>
                <field>tags</field>
                <field>viewing_dates</field>
                <field>rewatches</field>
              </input_model>

              <analysis_rules>
                <rule>Separate explicit data from inferred preferences.</rule>
                <rule>Treat watched movies and ratings as stronger signals than watchlist items.</rule>
                <rule>Treat watchlist items as interest signals, not confirmed taste.</rule>
                <rule>Look for patterns across genre, tone, pacing, theme, era, country, director, cast, runtime, and viewing behavior.</rule>
                <rule>Identify both strong preferences and possible blind spots.</rule>
                <rule>Do not overfit to a single movie, genre, director, or rating unless the data strongly supports it.</rule>
              </analysis_rules>

              <recommendation_rules>
                <rule>Do not recommend movies the user has already watched unless suggesting a rewatch with a clear reason.</rule>
                <rule>Prioritize recommendations that match multiple observed taste signals.</rule>
                <rule>Include a mix of safe picks, exploratory picks, and one or two reasonable surprises.</rule>
                <rule>Explain each recommendation briefly using evidence from the user's data.</rule>
                <rule>When confidence is low, label the recommendation as experimental.</rule>
              </recommendation_rules>

              <non_hallucination_policy>
                <rule>Do not invent watched movies, ratings, notes, genres, metadata, or user preferences.</rule>
                <rule>Do not claim certainty when the export data is incomplete or ambiguous.</rule>
                <rule>If a movie's details are unknown, say so instead of fabricating them.</rule>
                <rule>If there is not enough data, provide a provisional analysis and state what extra data would improve recommendations.</rule>
              </non_hallucination_policy>

              <output_structure>
                <section>Profile summary</section>
                <section>Detected taste patterns</section>
                <section>Strong signals</section>
                <section>Weak or uncertain signals</section>
                <section>Blind spots or underexplored areas</section>
                <section>Recommended movies</section>
                <section>What to watch first</section>
              </output_structure>

              <tone>
                Be concise, insightful, and personal.
                Avoid generic movie-buff language.
                Sound like a sharp analyst who understands cinema and respects the user's actual data.
              </tone>

              <success_criteria>
                <criterion>The user feels the analysis reflects their actual taste.</criterion>
                <criterion>Recommendations are specific, justified, and not generic.</criterion>
                <criterion>The assistant clearly distinguishes evidence from inference.</criterion>
                <criterion>The assistant avoids recommending already watched movies by mistake.</criterion>
              </success_criteria>
            </role>
            """.trim();

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private WatchEntryRepository watchEntryRepository;

    @Autowired
    private MovieRatingRepository movieRatingRepository;

    @Autowired
    private WatchlistItemRepository watchlistItemRepository;

    @Autowired
    private MovieMetadataReader metadataReader;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TmdbClient tmdbClient;

    @Test
    void exportRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/recommendations/export"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void exportIncludesTasteWatchedWatchlistAndPromptWithoutPrivateNotesByDefault() throws Exception {
        ratedMovie("The Prestige", 2006, "Christopher Nolan", "Drama", "5.0", "private taste note");
        ratedMovie("Memento", 2000, "Christopher Nolan", "Mystery", "4.5", "another private note");
        WatchlistItem watchlistItem = new WatchlistItem(MetadataSource.TMDB, "Interstellar");
        watchlistItem.setTmdbId(157336L);
        watchlistItem.setReleaseYear(2014);
        watchlistItem.setDirectorsJson(metadataReader.writeList(List.of("Christopher Nolan")));
        watchlistItem.setGenresJson(metadataReader.writeList(List.of("Science Fiction")));
        watchlistItemRepository.saveAndFlush(watchlistItem);

        MvcResult result = mockMvc.perform(get("/api/recommendations/export")
                        .with(user("admin")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.prompt").isString())
                .andExpect(jsonPath("$.markdown").isString())
                .andExpect(jsonPath("$.generatedAt").isString())
                .andExpect(jsonPath("$.tasteProfile").isMap())
                .andExpect(jsonPath("$.alreadyWatched").isArray())
                .andExpect(jsonPath("$.watchlist").isArray())
                .andExpect(jsonPath("$.privacy").isMap())
                .andExpect(jsonPath("$.tasteProfile.topPersonal[0].title").value("The Prestige"))
                .andExpect(jsonPath("$.tasteProfile.favoriteDirectors[0]").value("Christopher Nolan"))
                .andExpect(jsonPath("$.tasteProfile.favoriteGenres[0]").value("Drama"))
                .andExpect(jsonPath("$.alreadyWatched[0].title").exists())
                .andExpect(jsonPath("$.alreadyWatched[0].genres").isArray())
                .andExpect(jsonPath("$.alreadyWatched[0].privateNotes").doesNotExist())
                .andExpect(jsonPath("$.watchlist[0].title").value("Interstellar"))
                .andExpect(jsonPath("$.watchlist[0].directors[0]").value("Christopher Nolan"))
                .andExpect(jsonPath("$.prompt").value(org.hamcrest.Matchers.startsWith("<role>")))
                .andExpect(jsonPath("$.prompt").value(org.hamcrest.Matchers.containsString("Cinema Taste Analyst")))
                .andExpect(jsonPath("$.prompt").value(org.hamcrest.Matchers.containsString("<name>Cinema Taste Analyst</name>")))
                .andExpect(jsonPath("$.prompt").value(org.hamcrest.Matchers.containsString("<version>1.0</version>")))
                .andExpect(jsonPath("$.prompt").value(org.hamcrest.Matchers.containsString(
                        "<domain>Personal movie taste analysis and recommendations</domain>")))
                .andExpect(jsonPath("$.prompt").value(org.hamcrest.Matchers.containsString("<task>")))
                .andExpect(jsonPath("$.prompt").value(org.hamcrest.Matchers.containsString("<cinelog_export>")))
                .andExpect(jsonPath("$.prompt").value(org.hamcrest.Matchers.containsString("The Prestige")))
                .andExpect(jsonPath("$.prompt").value(org.hamcrest.Matchers.containsString("Interstellar")))
                .andExpect(jsonPath("$.prompt").value(org.hamcrest.Matchers.containsString("Do not recommend movies listed in watched_movies")))
                .andExpect(jsonPath("$.prompt").value(org.hamcrest.Matchers.containsString(
                        "Respond in Spanish by default unless the user explicitly asks for another language.")))
                .andExpect(jsonPath("$.prompt").value(org.hamcrest.Matchers.containsString(
                        "Do not present watchlist items as new recommendations.")))
                .andExpect(jsonPath("$.prompt").value(org.hamcrest.Matchers.containsString("Watchlist priority")))
                .andExpect(jsonPath("$.prompt").value(org.hamcrest.Matchers.containsString(
                        "If the dataset is small, clearly label the analysis as provisional.")))
                .andExpect(jsonPath("$.prompt").value(org.hamcrest.Matchers.containsString(
                        "avoid overfitting to one franchise, character, director, or genre")))
                .andExpect(jsonPath("$.prompt").value(org.hamcrest.Matchers.containsString(
                        "what additional ratings would improve future recommendations")))
                .andExpect(jsonPath("$.privacy.includePrivateNotes").value(false))
                .andReturn();

        String body = result.getResponse().getContentAsString();
        assertThat(body).doesNotContain("private taste note");
        assertThat(body).doesNotContain("[object Object]");
        JsonNode root = objectMapper.readTree(body);
        assertThat(root.get("prompt").asText())
                .startsWith(EXACT_ROLE_BLOCK)
                .doesNotContain("[object Object]");
        assertThat(root.get("markdown").asText()).doesNotContain("[object Object]");
    }

    @Test
    void exportCanIncludePrivateNotesWhenRequested() throws Exception {
        ratedMovie("The Prestige", 2006, "Christopher Nolan", "Drama", "5.0", "private taste note");

        mockMvc.perform(get("/api/recommendations/export?includePrivateNotes=true")
                        .with(user("admin")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.alreadyWatched[0].privateNotes").value("private taste note"))
                .andExpect(jsonPath("$.prompt").value(org.hamcrest.Matchers.containsString("private taste note")));
    }

    @Test
    void exportExcludesWatchlistWhenRequested() throws Exception {
        ratedMovie("The Prestige", 2006, "Christopher Nolan", "Drama", "5.0", "private taste note");
        WatchlistItem watchlistItem = new WatchlistItem(MetadataSource.TMDB, "Interstellar");
        watchlistItem.setTmdbId(157336L);
        watchlistItem.setDirectorsJson(metadataReader.writeList(List.of("Christopher Nolan")));
        watchlistItem.setGenresJson(metadataReader.writeList(List.of("Science Fiction")));
        watchlistItemRepository.saveAndFlush(watchlistItem);

        MvcResult result = mockMvc.perform(get("/api/recommendations/export?includeWatchlist=false")
                        .with(user("admin")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.watchlist").isEmpty())
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(root.get("prompt").asText()).doesNotContain("Interstellar");
        assertThat(root.get("prompt").asText()).doesNotContain("<watchlist>");
    }

    @Test
    void emptyArchiveExportWorksGracefully() throws Exception {
        mockMvc.perform(get("/api/recommendations/export")
                        .with(user("admin")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tasteProfile.topPersonal").isEmpty())
                .andExpect(jsonPath("$.alreadyWatched").isEmpty())
                .andExpect(jsonPath("$.prompt").value(org.hamcrest.Matchers.startsWith("<role>")))
                .andExpect(jsonPath("$.prompt").value(org.hamcrest.Matchers.containsString("Data is limited")))
                .andExpect(jsonPath("$.markdown").value(org.hamcrest.Matchers.containsString("No watched movies yet.")));
    }

    private void ratedMovie(
            String title,
            int year,
            String director,
            String genre,
            String score,
            String privateNotes) {
        Movie movie = new Movie(MetadataSource.TMDB, title);
        movie.setReleaseYear(year);
        movie.setDirectorsJson(metadataReader.writeList(List.of(director)));
        movie.setGenresJson(metadataReader.writeList(List.of(genre)));
        movie = movieRepository.saveAndFlush(movie);
        WatchEntry watchEntry = watchEntryRepository.saveAndFlush(
                new WatchEntry(movie, LocalDate.of(2026, 6, 1), WatchType.FIRST_WATCH, WatchLocation.HOME));
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
        rating.setPersonalFinalScore(value);
        rating.setReviewSummary("review summary");
        rating.setPrivateNotes(privateNotes);
        rating = movieRatingRepository.saveAndFlush(rating);
        movie.setActiveRating(rating);
        movie.setActiveWatchEntry(watchEntry);
        movieRepository.saveAndFlush(movie);
    }
}
