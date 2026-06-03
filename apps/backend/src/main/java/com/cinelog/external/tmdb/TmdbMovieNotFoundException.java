package com.cinelog.external.tmdb;

public class TmdbMovieNotFoundException extends RuntimeException {

    public TmdbMovieNotFoundException() {
        super("TMDb movie was not found");
    }
}
