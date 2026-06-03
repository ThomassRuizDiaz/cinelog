CREATE TABLE watch_entry (
    id BIGINT NOT NULL AUTO_INCREMENT,
    movie_id BIGINT NOT NULL,
    watched_at DATE NOT NULL,
    watch_type VARCHAR(20) NOT NULL,
    watch_location VARCHAR(20) NOT NULL,
    notes TEXT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_watch_entry PRIMARY KEY (id),
    CONSTRAINT fk_watch_entry_movie FOREIGN KEY (movie_id) REFERENCES movie (id) ON DELETE CASCADE,
    CONSTRAINT ck_watch_entry_type CHECK (watch_type IN ('FIRST_WATCH', 'REWATCH')),
    CONSTRAINT ck_watch_entry_location CHECK (watch_location IN ('HOME', 'CINEMA'))
);
