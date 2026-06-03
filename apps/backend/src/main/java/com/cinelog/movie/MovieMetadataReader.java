package com.cinelog.movie;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Collections;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class MovieMetadataReader {

    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {
    };

    private final ObjectMapper objectMapper;

    public MovieMetadataReader(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public List<String> directors(Movie movie) {
        return readList(movie.getDirectorsJson());
    }

    public List<String> genres(Movie movie) {
        return readList(movie.getGenresJson());
    }

    public String writeList(List<String> values) {
        try {
            return objectMapper.writeValueAsString(values == null ? Collections.emptyList() : values);
        } catch (Exception exception) {
            throw new IllegalArgumentException("Movie metadata must be JSON-compatible", exception);
        }
    }

    private List<String> readList(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, STRING_LIST_TYPE);
        } catch (Exception exception) {
            throw new IllegalStateException("Stored movie metadata JSON is invalid", exception);
        }
    }
}
