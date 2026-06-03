CREATE TABLE movie (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tmdb_id BIGINT NULL,
    metadata_source VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    original_title VARCHAR(255) NULL,
    release_year INT NULL,
    directors_json TEXT NOT NULL,
    poster_path VARCHAR(500) NULL,
    poster_url TEXT NULL,
    genres_json TEXT NOT NULL,
    active_rating_id BIGINT NULL,
    active_watch_entry_id BIGINT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_movie PRIMARY KEY (id),
    CONSTRAINT uk_movie_tmdb_id UNIQUE (tmdb_id),
    CONSTRAINT ck_movie_release_year CHECK (release_year IS NULL OR release_year BETWEEN 1888 AND 9999)
);
