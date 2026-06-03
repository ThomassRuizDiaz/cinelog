package com.cinelog.library;

public class LibraryNotFoundException extends RuntimeException {

    public LibraryNotFoundException(String message) {
        super(message);
    }
}
