package com.cinelog.external.tmdb;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class TmdbClient {

    private static final String LANGUAGE = "en-US";

    private final TmdbProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public TmdbClient(TmdbProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(properties.getTimeout())
                .build();
    }

    public List<TmdbSearchMovie> search(String query) {
        TmdbSearchResponse response = get(
                "/search/movie",
                "&query=" + encode(query) + "&include_adult=false",
                TmdbSearchResponse.class);
        return response.results() == null ? Collections.emptyList() : response.results();
    }

    public TmdbMovieMetadata getMovie(Long tmdbId) {
        TmdbMovieDetails details = get("/movie/" + tmdbId, "", TmdbMovieDetails.class);
        TmdbCreditsResponse credits = get("/movie/" + tmdbId + "/credits", "", TmdbCreditsResponse.class);
        return new TmdbMovieMetadata(details, credits);
    }

    private <T> T get(String path, String additionalQuery, Class<T> responseType) {
        requireApiKey();
        URI uri = URI.create(trimTrailingSlash(properties.getBaseUrl().toString())
                + path
                + "?api_key="
                + encode(properties.getApiKey())
                + "&language="
                + LANGUAGE
                + additionalQuery);
        HttpRequest request = HttpRequest.newBuilder(uri)
                .timeout(properties.getTimeout())
                .GET()
                .build();
        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 404) {
                throw new TmdbMovieNotFoundException();
            }
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new TmdbUpstreamException("TMDb returned an unsuccessful response");
            }
            return objectMapper.readValue(response.body(), responseType);
        } catch (TmdbMovieNotFoundException | TmdbUpstreamException exception) {
            throw exception;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new TmdbUpstreamException("TMDb request was interrupted", exception);
        } catch (IOException | IllegalArgumentException exception) {
            throw new TmdbUpstreamException("TMDb request failed", exception);
        }
    }

    private void requireApiKey() {
        if (!StringUtils.hasText(properties.getApiKey())) {
            throw new TmdbUpstreamException("TMDb integration is not configured");
        }
    }

    private String trimTrailingSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
