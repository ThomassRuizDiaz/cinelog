package com.cinelog.external.tmdb;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.cinelog.actor.ActorRepository;
import com.cinelog.actor.CastImportService;
import com.cinelog.actor.MovieCastMemberRepository;
import com.cinelog.movie.Movie;
import com.cinelog.movie.MovieRepository;
import com.cinelog.watch.WatchEntryRepository;
import com.cinelog.watch.WatchLocation;
import com.cinelog.watch.WatchType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class WatchlistCastImportIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private ActorRepository actorRepository;

    @Autowired
    private MovieCastMemberRepository castMemberRepository;

    @Autowired
    private WatchEntryRepository watchEntryRepository;

    @Autowired
    private CastImportService castImportService;

    @Autowired
    private TmdbCastImportService tmdbCastImportService;

    @MockitoBean
    private TmdbClient tmdbClient;

    @Test
    void convertingTmdbWatchlistItemImportsTopCastWithProfileImages() throws Exception {
        when(tmdbClient.getMovie(603L)).thenReturn(metadata(List.of(
                cast(1L, "Keanu Reeves", "Neo", 0, "/keanu.jpg"),
                cast(2L, "Laurence Fishburne", "Morpheus", 1, "/laurence.jpg"),
                cast(3L, "Carrie-Anne Moss", "Trinity", 2, "/carrie.jpg"),
                cast(4L, "Hugo Weaving", "Agent Smith", 3, "/hugo.jpg"),
                cast(5L, "Gloria Foster", "Oracle", 4, "/gloria.jpg"),
                cast(6L, "Joe Pantoliano", "Cypher", 5, "/joe.jpg"))));

        Long watchlistId = createWatchlistItem(603L, "The Matrix");

        mockMvc.perform(post("/api/watchlist/{id}/convert-to-watch-entry", watchlistId)
                        .with(user("admin"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(convertJson()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.movie.cast.length()").value(5))
                .andExpect(jsonPath("$.movie.cast[0].name").value("Keanu Reeves"))
                .andExpect(jsonPath("$.movie.cast[0].profilePath").value("/keanu.jpg"))
                .andExpect(jsonPath("$.movie.cast[0].profileUrl")
                        .value("https://image.tmdb.org/t/p/w500/keanu.jpg"));

        Movie movie = movieRepository.findByTmdbId(603L).orElseThrow();
        assertThat(actorRepository.count()).isEqualTo(5);
        assertThat(castMemberRepository.findByMovie_IdOrderByCastOrderAscIdAsc(movie.getId())).hasSize(5);
        assertThat(actorRepository.findByTmdbId(1L).orElseThrow().getProfilePath()).isEqualTo("/keanu.jpg");
    }

    @Test
    void repeatedCastImportAfterWatchlistConversionDoesNotDuplicateActorsOrCastRows() throws Exception {
        when(tmdbClient.getMovie(604L)).thenReturn(metadata(List.of(
                cast(11L, "Actor One", "One", 0, "/one.jpg"),
                cast(12L, "Actor Two", "Two", 1, "/two.jpg"))));

        Long watchlistId = createWatchlistItem(604L, "Duplicate Guard");
        mockMvc.perform(post("/api/watchlist/{id}/convert-to-watch-entry", watchlistId)
                        .with(user("admin"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(convertJson()))
                .andExpect(status().isOk());

        Movie movie = movieRepository.findByTmdbId(604L).orElseThrow();
        castImportService.importCast(movie, tmdbCastImportService.topCast(604L));

        assertThat(actorRepository.count()).isEqualTo(2);
        assertThat(castMemberRepository.findByMovie_IdOrderByCastOrderAscIdAsc(movie.getId())).hasSize(2);
    }

    @Test
    void watchlistConversionSucceedsWhenTmdbCreditsAreUnavailable() throws Exception {
        when(tmdbClient.getMovie(605L)).thenThrow(new TmdbUpstreamException("credits unavailable"));

        Long watchlistId = createWatchlistItem(605L, "No Credits");

        mockMvc.perform(post("/api/watchlist/{id}/convert-to-watch-entry", watchlistId)
                        .with(user("admin"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(convertJson()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.movie.tmdbId").value(605))
                .andExpect(jsonPath("$.movie.cast").isArray())
                .andExpect(jsonPath("$.movie.cast.length()").value(0));

        assertThat(movieRepository.findByTmdbId(605L)).isPresent();
        assertThat(watchEntryRepository.count()).isEqualTo(1);
        assertThat(actorRepository.count()).isZero();
        assertThat(castMemberRepository.count()).isZero();
    }

    private Long createWatchlistItem(Long tmdbId, String title) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/watchlist")
                        .with(user("admin"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(watchlistJson(tmdbId, title)))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        return body.get("id").asLong();
    }

    private String watchlistJson(Long tmdbId, String title) {
        return """
                {
                  "source": "TMDB",
                  "externalId": "%d",
                  "title": "%s",
                  "originalTitle": "%s",
                  "releaseYear": 1999,
                  "directors": ["Lana Wachowski", "Lilly Wachowski"],
                  "posterPath": "/poster.jpg",
                  "posterUrl": "https://example.test/poster.jpg",
                  "genres": ["Action", "Science Fiction"]
                }
                """.formatted(tmdbId, title, title);
    }

    private String convertJson() {
        return """
                {
                  "watchedAt": "%s",
                  "watchType": "%s",
                  "watchLocation": "%s"
                }
                """.formatted(LocalDate.of(2026, 6, 1), WatchType.FIRST_WATCH, WatchLocation.HOME);
    }

    private TmdbMovieMetadata metadata(List<TmdbCastMember> cast) {
        return new TmdbMovieMetadata(null, new TmdbCreditsResponse(List.of(), cast));
    }

    private TmdbCastMember cast(Long id, String name, String character, Integer order, String profilePath) {
        return new TmdbCastMember(id, name, character, order, profilePath);
    }
}
