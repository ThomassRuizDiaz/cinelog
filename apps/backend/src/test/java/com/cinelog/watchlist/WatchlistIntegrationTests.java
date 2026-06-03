package com.cinelog.watchlist;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.cinelog.external.tmdb.TmdbClient;
import com.cinelog.movie.MetadataSource;
import com.cinelog.movie.Movie;
import com.cinelog.movie.MovieMetadataReader;
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
class WatchlistIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private WatchEntryRepository watchEntryRepository;

    @Autowired
    private WatchlistItemRepository watchlistItemRepository;

    @Autowired
    private MovieMetadataReader metadataReader;

    @MockitoBean
    private TmdbClient tmdbClient;

    @Test
    void watchlistRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/watchlist"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createsListsUpdatesAndDeletesWatchlistItem() throws Exception {
        Long id = createWatchlistItem(1124, "The Prestige");

        mockMvc.perform(get("/api/watchlist?query=prestige&genre=Drama&year=2006")
                        .with(user("admin")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(id))
                .andExpect(jsonPath("$[0].tmdbId").value(1124))
                .andExpect(jsonPath("$[0].metadataSource").value("TMDB"))
                .andExpect(jsonPath("$[0].directors[0]").value("Christopher Nolan"))
                .andExpect(jsonPath("$[0].genres[0]").value("Drama"))
                .andExpect(jsonPath("$[0].notes").value("Looks good"));

        mockMvc.perform(get("/api/watchlist/{id}", id).with(user("admin")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("The Prestige"));

        mockMvc.perform(put("/api/watchlist/{id}", id)
                        .with(user("admin"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"notes\":\"Updated note\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notes").value("Updated note"));

        mockMvc.perform(delete("/api/watchlist/{id}", id)
                        .with(user("admin"))
                        .with(csrf()))
                .andExpect(status().isNoContent());
        assertThat(watchlistItemRepository.findById(id)).isEmpty();
    }

    @Test
    void duplicateTmdbIdReturnsControlledConflict() throws Exception {
        createWatchlistItem(1124, "The Prestige");

        mockMvc.perform(post("/api/watchlist")
                        .with(user("admin"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(watchlistJson(1124, "The Prestige")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("Watchlist item with tmdbId 1124 already exists"));
    }

    @Test
    void archiveDuplicateReturnsControlledConflict() throws Exception {
        Movie movie = new Movie(MetadataSource.TMDB, "The Prestige");
        movie.setTmdbId(1124L);
        movie.setDirectorsJson("[]");
        movie.setGenresJson("[]");
        movieRepository.saveAndFlush(movie);

        mockMvc.perform(post("/api/watchlist")
                        .with(user("admin"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(watchlistJson(1124, "The Prestige")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Movie with tmdbId 1124 is already in archive"));
    }

    @Test
    void convertsWatchlistItemToMovieAndWatchEntryThenRemovesItem() throws Exception {
        Long watchlistId = createWatchlistItem(603, "The Matrix");

        mockMvc.perform(post("/api/watchlist/{id}/convert-to-watch-entry", watchlistId)
                        .with(user("admin"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(convertJson()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.movie.id").isNumber())
                .andExpect(jsonPath("$.movie.tmdbId").value(603))
                .andExpect(jsonPath("$.movie.metadataSource").value("TMDB"))
                .andExpect(jsonPath("$.movie.title").value("The Matrix"))
                .andExpect(jsonPath("$.movie.watchEntries").isArray())
                .andExpect(jsonPath("$.movie.activeRating").doesNotExist())
                .andExpect(jsonPath("$.watchEntry.id").isNumber())
                .andExpect(jsonPath("$.watchEntry.movieId").isNumber())
                .andExpect(jsonPath("$.watchEntry.watchedAt").value("2026-06-01"))
                .andExpect(jsonPath("$.watchEntry.watchType").value("FIRST_WATCH"))
                .andExpect(jsonPath("$.watchEntry.watchLocation").value("HOME"))
                .andExpect(jsonPath("$.watchEntry.notes").value("Watched from watchlist"))
                .andExpect(jsonPath("$.watchEntry.rating").doesNotExist());

        assertThat(watchlistItemRepository.findById(watchlistId)).isEmpty();
        assertThat(movieRepository.findByTmdbId(603L)).isPresent();
        assertThat(watchEntryRepository.count()).isEqualTo(1);
    }

    @Test
    void convertUsesExistingMovieWhenPresent() throws Exception {
        Movie movie = new Movie(MetadataSource.TMDB, "The Matrix");
        movie.setTmdbId(603L);
        movie.setDirectorsJson(metadataReader.writeList(List.of("Lana Wachowski", "Lilly Wachowski")));
        movie.setGenresJson(metadataReader.writeList(List.of("Science Fiction")));
        movieRepository.saveAndFlush(movie);
        WatchlistItem item = new WatchlistItem(MetadataSource.TMDB, "The Matrix");
        item.setTmdbId(603L);
        item.setDirectorsJson(movie.getDirectorsJson());
        item.setGenresJson(movie.getGenresJson());
        item = watchlistItemRepository.saveAndFlush(item);

        mockMvc.perform(post("/api/watchlist/{id}/convert-to-watch-entry", item.getId())
                        .with(user("admin"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(convertJson()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.movie.id").value(movie.getId()))
                .andExpect(jsonPath("$.watchEntry.movieId").value(movie.getId()));

        assertThat(movieRepository.findAll()).hasSize(1);
        assertThat(watchlistItemRepository.findById(item.getId())).isEmpty();
    }

    private Long createWatchlistItem(long tmdbId, String title) throws Exception {
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

    private String watchlistJson(long tmdbId, String title) {
        return """
                {
                  "source": "TMDB",
                  "externalId": "%d",
                  "title": "%s",
                  "originalTitle": "%s",
                  "releaseYear": 2006,
                  "directors": ["Christopher Nolan"],
                  "posterPath": "/poster.jpg",
                  "posterUrl": "https://example.test/poster.jpg",
                  "genres": ["Drama", "Mystery"],
                  "notes": "Looks good"
                }
                """.formatted(tmdbId, title, title);
    }

    private String convertJson() {
        return """
                {
                  "watchedAt": "%s",
                  "watchType": "%s",
                  "watchLocation": "%s",
                  "notes": "Watched from watchlist"
                }
                """.formatted(LocalDate.of(2026, 6, 1), WatchType.FIRST_WATCH, WatchLocation.HOME);
    }
}
