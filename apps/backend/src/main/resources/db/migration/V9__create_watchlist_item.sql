CREATE TABLE watchlist_item (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tmdb_id BIGINT NULL,
    metadata_source VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    original_title VARCHAR(255) NULL,
    release_year INT NULL,
    directors_json TEXT NOT NULL,
    genres_json TEXT NOT NULL,
    poster_path VARCHAR(500) NULL,
    poster_url TEXT NULL,
    notes TEXT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_watchlist_item PRIMARY KEY (id),
    CONSTRAINT uk_watchlist_item_tmdb_id UNIQUE (tmdb_id),
    CONSTRAINT ck_watchlist_item_release_year CHECK (release_year IS NULL OR release_year BETWEEN 1888 AND 9999)
);

CREATE INDEX idx_watchlist_item_created_at_id ON watchlist_item (created_at, id);
CREATE INDEX idx_watchlist_item_title ON watchlist_item (title);
CREATE INDEX idx_watchlist_item_release_year ON watchlist_item (release_year);
