package com.cinelog.auth.dto;

public record CsrfTokenResponse(
        String headerName,
        String token) {
}
