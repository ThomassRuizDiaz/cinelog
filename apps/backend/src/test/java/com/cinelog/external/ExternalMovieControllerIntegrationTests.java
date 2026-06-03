package com.cinelog.external;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
class ExternalMovieControllerIntegrationTests {

    private static final List<String> OBSERVED_QUERIES = new CopyOnWriteArrayList<>();
    private static final AtomicInteger DETAILS_REQUESTS = new AtomicInteger();
    private static final HttpServer TMDB_SERVER = startTmdbServer();

    @Autowired
    private MockMvc mockMvc;

    @DynamicPropertySource
    static void tmdbProperties(DynamicPropertyRegistry registry) {
        registry.add("cinelog.tmdb.api-key", () -> "test-api-key");
        registry.add("cinelog.tmdb.base-url", () -> "http://localhost:" + TMDB_SERVER.getAddress().getPort() + "/3");
        registry.add("cinelog.tmdb.timeout", () -> "100ms");
        registry.add("cinelog.tmdb.max-search-results", () -> "10");
    }

    @BeforeEach
    void resetObservedRequests() {
        OBSERVED_QUERIES.clear();
        DETAILS_REQUESTS.set(0);
    }

    @AfterAll
    static void stopTmdbServer() {
        TMDB_SERVER.stop(0);
    }

    @Test
    void searchNormalizesEnglishDetailsCreditsDirectorsYearAndPoster() throws Exception {
        mockMvc.perform(get("/api/external/movies/search")
                .with(user("admin"))
                .param("query", "The Prestige"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].source").value("TMDB"))
                .andExpect(jsonPath("$[0].externalId").value("1124"))
                .andExpect(jsonPath("$[0].title").value("The Prestige"))
                .andExpect(jsonPath("$[0].originalTitle").value("The Prestige"))
                .andExpect(jsonPath("$[0].releaseYear").value(2006))
                .andExpect(jsonPath("$[0].directors", hasSize(2)))
                .andExpect(jsonPath("$[0].directors[0]").value("Christopher Nolan"))
                .andExpect(jsonPath("$[0].directors[1]").value("Second Director"))
                .andExpect(jsonPath("$[0].posterPath").value("/prestige.jpg"))
                .andExpect(jsonPath("$[0].posterUrl")
                        .value("https://image.tmdb.org/t/p/w500/prestige.jpg"))
                .andExpect(jsonPath("$[0].genres[0]").value("Drama"))
                .andExpect(jsonPath("$[0].genres[1]").value("Mystery"));

        org.assertj.core.api.Assertions.assertThat(OBSERVED_QUERIES)
                .allMatch(query -> query.contains("api_key=test-api-key"))
                .allMatch(query -> query.contains("language=en-US"));
    }

    @Test
    void detailsEndpointSupportsMissingPoster() throws Exception {
        mockMvc.perform(get("/api/external/movies/tmdb/2").with(user("admin")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.externalId").value("2"))
                .andExpect(jsonPath("$.releaseYear").value(nullValue()))
                .andExpect(jsonPath("$.posterPath").value(nullValue()))
                .andExpect(jsonPath("$.posterUrl").value(nullValue()))
                .andExpect(jsonPath("$.directors", hasSize(0)));
    }

    @Test
    void searchRejectsBlankAndTooShortQueries() throws Exception {
        mockMvc.perform(get("/api/external/movies/search").with(user("admin")).param("query", " "))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("query must contain at least 2 characters"));

        mockMvc.perform(get("/api/external/movies/search").with(user("admin")).param("query", "x"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("query must contain at least 2 characters"));
    }

    @Test
    void searchTrimsAndNormalizesRepeatedSpaces() throws Exception {
        mockMvc.perform(get("/api/external/movies/search")
                        .with(user("admin"))
                        .param("query", "  The   Prestige  "))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].externalId").value("1124"));

        org.assertj.core.api.Assertions.assertThat(OBSERVED_QUERIES)
                .anyMatch(query -> query.contains("query=The+Prestige"));
    }

    @Test
    void emptySearchReturnsEmptyArray() throws Exception {
        mockMvc.perform(get("/api/external/movies/search")
                        .with(user("admin"))
                        .param("query", "empty-results"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void missingTmdbMovieReturnsControlledNotFound() throws Exception {
        mockMvc.perform(get("/api/external/movies/tmdb/404").with(user("admin")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("External movie not found"))
                .andExpect(jsonPath("$.message").value("TMDb movie was not found"));
    }

    @Test
    void upstreamFailureDoesNotLeakApiKey() throws Exception {
        mockMvc.perform(get("/api/external/movies/search")
                        .with(user("admin"))
                        .param("query", "upstream-error"))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.error").value("External metadata unavailable"))
                .andExpect(content().string(org.hamcrest.Matchers.not(
                        org.hamcrest.Matchers.containsString("test-api-key"))));
    }

    @Test
    void upstreamTimeoutReturnsControlledBadGateway() throws Exception {
        mockMvc.perform(get("/api/external/movies/search")
                        .with(user("admin"))
                        .param("query", "timeout"))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.message").value("TMDb request failed safely"));
    }

    @Test
    void searchUsesDefaultLimitOfTen() throws Exception {
        mockMvc.perform(get("/api/external/movies/search")
                        .with(user("admin"))
                        .param("query", "many"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(10)));

        org.assertj.core.api.Assertions.assertThat(DETAILS_REQUESTS.get()).isEqualTo(10);
    }

    @Test
    void searchCapsRequestedLimitAtServerMaximum() throws Exception {
        mockMvc.perform(get("/api/external/movies/search")
                        .with(user("admin"))
                        .param("query", "many")
                        .param("limit", "999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(10)));

        org.assertj.core.api.Assertions.assertThat(DETAILS_REQUESTS.get()).isEqualTo(10);
    }

    @Test
    void searchHonorsLowerRequestedLimit() throws Exception {
        mockMvc.perform(get("/api/external/movies/search")
                        .with(user("admin"))
                        .param("query", "many")
                        .param("limit", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)));

        org.assertj.core.api.Assertions.assertThat(DETAILS_REQUESTS.get()).isEqualTo(3);
    }

    @Test
    void exactTitleMatchIsPreferredOverOriginalOrder() throws Exception {
        mockMvc.perform(get("/api/external/movies/search")
                        .with(user("admin"))
                        .param("query", "The Prestige"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].externalId").value("1124"));
    }

    @Test
    void yearMatchIsPreferredWhenYearProvided() throws Exception {
        mockMvc.perform(get("/api/external/movies/search")
                        .with(user("admin"))
                        .param("query", "Year Match")
                        .param("year", "2006"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].externalId").value("3006"))
                .andExpect(jsonPath("$[0].releaseYear").value(2006));
    }

    @Test
    void searchHandlesResultWithMissingPoster() throws Exception {
        mockMvc.perform(get("/api/external/movies/search")
                        .with(user("admin"))
                        .param("query", "no-poster"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].externalId").value("2"))
                .andExpect(jsonPath("$[0].posterPath").value(nullValue()))
                .andExpect(jsonPath("$[0].posterUrl").value(nullValue()));
    }

    @Test
    void oneEnrichmentFailureDoesNotBreakAllSearchResults() throws Exception {
        mockMvc.perform(get("/api/external/movies/search")
                        .with(user("admin"))
                        .param("query", "partial-failure"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].externalId").value("1124"));

        org.assertj.core.api.Assertions.assertThat(DETAILS_REQUESTS.get()).isEqualTo(2);
    }

    private static HttpServer startTmdbServer() {
        try {
            HttpServer server = HttpServer.create(new InetSocketAddress(0), 0);
            server.createContext("/3/", ExternalMovieControllerIntegrationTests::respond);
            server.start();
            return server;
        } catch (IOException exception) {
            throw new IllegalStateException("Could not start fake TMDb server", exception);
        }
    }

    private static void respond(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        String query = exchange.getRequestURI().getRawQuery();
        OBSERVED_QUERIES.add(query == null ? "" : query);

        if (path.equals("/3/search/movie")) {
            if (query.contains("query=upstream-error")) {
                send(exchange, 500, "{}");
                return;
            }
            if (query.contains("query=timeout")) {
                try {
                    Thread.sleep(300);
                } catch (InterruptedException exception) {
                    Thread.currentThread().interrupt();
                }
                send(exchange, 200, "{\"results\":[]}");
                return;
            }
            if (query.contains("query=empty-results")) {
                send(exchange, 200, "{\"results\":[]}");
                return;
            }
            if (query.contains("query=many")) {
                send(exchange, 200, "{\"results\":[{\"id\":1124},{\"id\":1124},{\"id\":1124},"
                        + "{\"id\":1124},{\"id\":1124},{\"id\":1124},{\"id\":1124},{\"id\":1124},"
                        + "{\"id\":1124},{\"id\":1124},{\"id\":1124},{\"id\":1124}]}");
                return;
            }
            if (query.contains("query=no-poster")) {
                send(exchange, 200, "{\"results\":[{\"id\":2,\"title\":\"No Poster\","
                        + "\"original_title\":\"No Poster\",\"release_date\":\"\",\"poster_path\":null}]}");
                return;
            }
            if (query.contains("query=partial-failure")) {
                send(exchange, 200, "{\"results\":[{\"id\":5000,\"title\":\"Broken Result\"},"
                        + "{\"id\":1124,\"title\":\"The Prestige\",\"original_title\":\"The Prestige\","
                        + "\"release_date\":\"2006-10-20\",\"poster_path\":\"/prestige.jpg\"}]}");
                return;
            }
            if (query.contains("query=Year+Match")) {
                send(exchange, 200, "{\"results\":[{\"id\":3020,\"title\":\"Year Match\","
                        + "\"original_title\":\"Year Match\",\"release_date\":\"2020-01-01\","
                        + "\"poster_path\":\"/year-2020.jpg\"},{\"id\":3006,\"title\":\"Year Match\","
                        + "\"original_title\":\"Year Match\",\"release_date\":\"2006-01-01\","
                        + "\"poster_path\":\"/year-2006.jpg\"}]}");
                return;
            }
            send(exchange, 200, "{\"results\":[{\"id\":2000,\"title\":\"Prestige Adjacent\","
                    + "\"original_title\":\"Prestige Adjacent\",\"release_date\":\"2006-01-01\","
                    + "\"poster_path\":\"/adjacent.jpg\"},{\"id\":1124,\"title\":\"The Prestige\","
                    + "\"original_title\":\"The Prestige\",\"release_date\":\"2006-10-20\","
                    + "\"poster_path\":\"/prestige.jpg\"}]}");
            return;
        }

        if (path.equals("/3/movie/404")) {
            send(exchange, 404, "{}");
            return;
        }
        if (path.equals("/3/movie/2")) {
            DETAILS_REQUESTS.incrementAndGet();
            send(exchange, 200, """
                    {"id":2,"title":"No Poster","original_title":"No Poster","release_date":"",
                     "poster_path":null,"genres":[]}
                    """);
            return;
        }
        if (path.equals("/3/movie/2/credits")) {
            send(exchange, 200, "{\"crew\":[]}");
            return;
        }
        if (path.equals("/3/movie/1124")) {
            DETAILS_REQUESTS.incrementAndGet();
            send(exchange, 200, """
                    {"id":1124,"title":"The Prestige","original_title":"The Prestige",
                     "release_date":"2006-10-20","poster_path":"/prestige.jpg",
                     "genres":[{"name":"Drama"},{"name":"Mystery"}],"vote_average":8.2}
                    """);
            return;
        }
        if (path.equals("/3/movie/2000")) {
            DETAILS_REQUESTS.incrementAndGet();
            send(exchange, 200, """
                    {"id":2000,"title":"Prestige Adjacent","original_title":"Prestige Adjacent",
                     "release_date":"2006-01-01","poster_path":"/adjacent.jpg",
                     "genres":[{"name":"Drama"}]}
                    """);
            return;
        }
        if (path.equals("/3/movie/2000/credits")) {
            send(exchange, 200, "{\"crew\":[]}");
            return;
        }
        if (path.equals("/3/movie/3006")) {
            DETAILS_REQUESTS.incrementAndGet();
            send(exchange, 200, """
                    {"id":3006,"title":"Year Match","original_title":"Year Match",
                     "release_date":"2006-01-01","poster_path":"/year-2006.jpg","genres":[]}
                    """);
            return;
        }
        if (path.equals("/3/movie/3006/credits")) {
            send(exchange, 200, "{\"crew\":[{\"job\":\"Director\",\"name\":\"Director 2006\"}]}");
            return;
        }
        if (path.equals("/3/movie/3020")) {
            DETAILS_REQUESTS.incrementAndGet();
            send(exchange, 200, """
                    {"id":3020,"title":"Year Match","original_title":"Year Match",
                     "release_date":"2020-01-01","poster_path":"/year-2020.jpg","genres":[]}
                    """);
            return;
        }
        if (path.equals("/3/movie/3020/credits")) {
            send(exchange, 200, "{\"crew\":[{\"job\":\"Director\",\"name\":\"Director 2020\"}]}");
            return;
        }
        if (path.equals("/3/movie/5000")) {
            DETAILS_REQUESTS.incrementAndGet();
            send(exchange, 500, "{}");
            return;
        }
        if (path.equals("/3/movie/1124/credits")) {
            send(exchange, 200, """
                    {"cast":[{"name":"Ignored Actor"}],
                     "crew":[{"job":"Director","name":"Christopher Nolan"},
                             {"job":"Writer","name":"Ignored Writer"},
                             {"job":"Director","name":"Second Director"},
                             {"job":"Director","name":"Christopher Nolan"}]}
                    """);
            return;
        }
        send(exchange, 404, "{}");
    }

    private static void send(HttpExchange exchange, int status, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }
}
