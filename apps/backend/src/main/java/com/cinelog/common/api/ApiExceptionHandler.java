package com.cinelog.common.api;

import jakarta.servlet.http.HttpServletRequest;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@Order(Ordered.LOWEST_PRECEDENCE)
@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger LOGGER = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiErrorResponse> beanValidation(
            MethodArgumentNotValidException exception,
            HttpServletRequest request) {
        Map<String, String> fields = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors()
                .forEach(error -> fields.putIfAbsent(error.getField(), error.getDefaultMessage()));
        return response(HttpStatus.BAD_REQUEST, "Validation failed", "Request validation failed", request, fields);
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

    @ExceptionHandler(MissingServletRequestParameterException.class)
    ResponseEntity<ApiErrorResponse> missingParameter(
            MissingServletRequestParameterException exception,
            HttpServletRequest request) {
        return response(
                HttpStatus.BAD_REQUEST,
                "Validation failed",
                "Missing query parameter: " + exception.getParameterName(),
                request,
                Map.of());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ApiErrorResponse> unreadableBody(
            HttpMessageNotReadableException exception,
            HttpServletRequest request) {
        return response(HttpStatus.BAD_REQUEST, "Validation failed", "Request body is invalid", request, Map.of());
    }

    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<ApiErrorResponse> responseStatus(
            ResponseStatusException exception,
            HttpServletRequest request) {
        return response(
                exception.getStatusCode(),
                HttpStatus.valueOf(exception.getStatusCode().value()).getReasonPhrase(),
                exception.getReason(),
                request,
                Map.of());
    }

    @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<ApiErrorResponse> noResource(NoResourceFoundException exception, HttpServletRequest request) {
        return response(HttpStatus.NOT_FOUND, "Not found", "Resource not found", request, Map.of());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<ApiErrorResponse> invalidArgument(
            IllegalArgumentException exception,
            HttpServletRequest request) {
        return response(HttpStatus.BAD_REQUEST, "Validation failed", exception.getMessage(), request, Map.of());
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiErrorResponse> unexpected(Exception exception, HttpServletRequest request) {
        LOGGER.error("Unexpected API failure for {}", request.getRequestURI(), exception);
        return response(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Internal server error",
                "Unexpected server error",
                request,
                Map.of());
    }

    private ResponseEntity<ApiErrorResponse> response(
            HttpStatusCode status,
            String error,
            String message,
            HttpServletRequest request,
            Map<String, String> fields) {
        return ResponseEntity.status(status)
                .body(ApiErrorResponse.of(status, error, message, request.getRequestURI(), fields));
    }
}
