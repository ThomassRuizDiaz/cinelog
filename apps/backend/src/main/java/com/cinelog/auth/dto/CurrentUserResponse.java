package com.cinelog.auth.dto;

public record CurrentUserResponse(
        boolean authenticated,
        String username,
        String displayName) {

    public static CurrentUserResponse unauthenticated() {
        return new CurrentUserResponse(false, null, null);
    }
}
