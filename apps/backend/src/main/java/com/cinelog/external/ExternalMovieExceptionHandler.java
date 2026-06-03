package com.cinelog.external;

import com.cinelog.common.api.ApiErrorResponse;
import com.cinelog.external.tmdb.TmdbMovieNotFoundException;
import com.cinelog.external.tmdb.TmdbUpstreamException;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(assignableTypes = ExternalMovieController.class)
public class ExternalMovieExceptionHandler {

    @ExceptionHandler(ExternalMovieValidationException.class)
    ResponseEntity<ApiErrorResponse> validation(
            ExternalMovieValidationException exception,
            HttpServletRequest request) {
        return response(HttpStatus.BAD_REQUEST, "Invalid external movie request", exception.getMessage(), request);
    }

    @ExceptionHandler(TmdbMovieNotFoundException.class)
    ResponseEntity<ApiErrorResponse> notFound(HttpServletRequest request) {
        return response(HttpStatus.NOT_FOUND, "External movie not found", "TMDb movie was not found", request);
    }

    @ExceptionHandler(TmdbUpstreamException.class)
    ResponseEntity<ApiErrorResponse> upstream(HttpServletRequest request) {
        return response(
                HttpStatus.BAD_GATEWAY,
                "External metadata unavailable",
                "TMDb request failed safely",
                request);
    }

    private ResponseEntity<ApiErrorResponse> response(
            HttpStatus status,
            String error,
            String message,
            HttpServletRequest request) {
        return ResponseEntity.status(status)
                .body(ApiErrorResponse.of(status, error, message, request.getRequestURI(), Map.of()));
    }
}
