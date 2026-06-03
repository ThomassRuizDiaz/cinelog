package com.cinelog.ranking;

import com.cinelog.common.api.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(assignableTypes = RankingController.class)
public class RankingExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<ApiErrorResponse> invalidArgument(
            IllegalArgumentException exception,
            HttpServletRequest request) {
        return response(exception.getMessage(), request);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ResponseEntity<ApiErrorResponse> invalidType(
            MethodArgumentTypeMismatchException exception,
            HttpServletRequest request) {
        return response("Invalid ranking query parameter: " + exception.getName(), request);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    ResponseEntity<ApiErrorResponse> missingParameter(
            MissingServletRequestParameterException exception,
            HttpServletRequest request) {
        return response("Missing ranking query parameter: " + exception.getParameterName(), request);
    }

    private ResponseEntity<ApiErrorResponse> response(String message, HttpServletRequest request) {
        return ResponseEntity.badRequest()
                .body(ApiErrorResponse.of(
                        HttpStatus.BAD_REQUEST,
                        "Invalid ranking request",
                        message,
                        request.getRequestURI(),
                        Map.of()));
    }
}
