package com.cinelog.library;

import com.cinelog.common.api.ApiErrorResponse;
import com.cinelog.movie.MovieController;
import com.cinelog.watch.WatchEntryController;
import com.cinelog.watchlist.WatchlistController;
import jakarta.servlet.http.HttpServletRequest;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(assignableTypes = {MovieController.class, WatchEntryController.class, WatchlistController.class})
public class LibraryExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiErrorResponse> beanValidation(
            MethodArgumentNotValidException exception,
            HttpServletRequest request) {
        Map<String, String> fields = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors()
                .forEach(error -> fields.putIfAbsent(error.getField(), error.getDefaultMessage()));
        return response(HttpStatus.BAD_REQUEST, "Validation failed", "Request validation failed", request, fields);
    }

    @ExceptionHandler({LibraryValidationException.class, IllegalArgumentException.class})
    ResponseEntity<ApiErrorResponse> validation(RuntimeException exception, HttpServletRequest request) {
        return response(HttpStatus.BAD_REQUEST, "Validation failed", exception.getMessage(), request, Map.of());
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ResponseEntity<ApiErrorResponse> invalidType(
            MethodArgumentTypeMismatchException exception,
            HttpServletRequest request) {
        return response(
                HttpStatus.BAD_REQUEST,
                "Validation failed",
                "Invalid query parameter: " + exception.getName(),
                request,
                Map.of());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ApiErrorResponse> unreadableBody(
            HttpMessageNotReadableException exception,
            HttpServletRequest request) {
        return response(
                HttpStatus.BAD_REQUEST,
                "Validation failed",
                "Request body is invalid",
                request,
                Map.of());
    }

    @ExceptionHandler(LibraryNotFoundException.class)
    ResponseEntity<ApiErrorResponse> notFound(LibraryNotFoundException exception, HttpServletRequest request) {
        return response(HttpStatus.NOT_FOUND, "Not found", exception.getMessage(), request, Map.of());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ApiErrorResponse> dataIntegrityViolation(
            DataIntegrityViolationException exception,
            HttpServletRequest request) {
        return response(
                HttpStatus.CONFLICT,
                "Conflict",
                "Stored data conflicts with an existing record",
                request,
                Map.of());
    }

    @ExceptionHandler(LibraryConflictException.class)
    ResponseEntity<ApiErrorResponse> conflict(LibraryConflictException exception, HttpServletRequest request) {
        return response(HttpStatus.CONFLICT, "Conflict", exception.getMessage(), request, Map.of());
    }

    private ResponseEntity<ApiErrorResponse> response(
            HttpStatus status,
            String error,
            String message,
            HttpServletRequest request,
            Map<String, String> fields) {
        return ResponseEntity.status(status)
                .body(ApiErrorResponse.of(status, error, message, request.getRequestURI(), fields));
    }
}
