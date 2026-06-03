package com.cinelog.external.tmdb;

import java.net.URI;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "cinelog.tmdb")
public class TmdbProperties {

    private String apiKey = "";
    private URI baseUrl = URI.create("https://api.themoviedb.org/3");
    private URI posterBaseUrl = URI.create("https://image.tmdb.org/t/p");
    private String posterSize = "w500";
    private Duration timeout = Duration.ofSeconds(3);
    private int maxSearchResults = 10;

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public URI getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(URI baseUrl) {
        this.baseUrl = baseUrl;
    }

    public URI getPosterBaseUrl() {
        return posterBaseUrl;
    }

    public void setPosterBaseUrl(URI posterBaseUrl) {
        this.posterBaseUrl = posterBaseUrl;
    }

    public String getPosterSize() {
        return posterSize;
    }

    public void setPosterSize(String posterSize) {
        this.posterSize = posterSize;
    }

    public Duration getTimeout() {
        return timeout;
    }

    public void setTimeout(Duration timeout) {
        this.timeout = timeout;
    }

    public int getMaxSearchResults() {
        return maxSearchResults;
    }

    public void setMaxSearchResults(int maxSearchResults) {
        this.maxSearchResults = maxSearchResults;
    }
}
