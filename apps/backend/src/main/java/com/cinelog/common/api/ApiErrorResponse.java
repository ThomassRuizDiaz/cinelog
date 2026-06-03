package com.cinelog.common.api;

import java.time.Instant;
import java.util.Map;
import org.springframework.http.HttpStatusCode;

public record ApiErrorResponse(
        String timestamp,
        int status,
        String error,
        String message,
        String path,
        Map<String, String> fields) {

    public static ApiErrorResponse of(
            HttpStatusCode status,
            String error,
            String message,
            String path,
            Map<String, String> fields) {
        return new ApiErrorResponse(Instant.now().toString(), status.value(), error, message, path, fields);
    }
}
