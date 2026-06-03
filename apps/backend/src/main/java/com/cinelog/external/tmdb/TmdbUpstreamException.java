package com.cinelog.external.tmdb;

public class TmdbUpstreamException extends RuntimeException {

    public TmdbUpstreamException(String message) {
        super(message);
    }

    public TmdbUpstreamException(String message, Throwable cause) {
        super(message, cause);
    }
}
