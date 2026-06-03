CREATE INDEX idx_movie_title ON movie (title);
CREATE INDEX idx_movie_release_year ON movie (release_year);
CREATE INDEX idx_movie_active_rating_id ON movie (active_rating_id);
CREATE INDEX idx_watch_entry_movie_id ON watch_entry (movie_id);
CREATE INDEX idx_watch_entry_watched_at ON watch_entry (watched_at);
CREATE INDEX idx_movie_rating_technical_score ON movie_rating (technical_score);
CREATE INDEX idx_movie_rating_objective_score ON movie_rating (objective_score);
CREATE INDEX idx_movie_rating_personal_final_score ON movie_rating (personal_final_score);

ALTER TABLE movie
    ADD CONSTRAINT fk_movie_active_rating FOREIGN KEY (active_rating_id) REFERENCES movie_rating (id) ON DELETE SET NULL;

ALTER TABLE movie
    ADD CONSTRAINT fk_movie_active_watch_entry FOREIGN KEY (active_watch_entry_id) REFERENCES watch_entry (id) ON DELETE SET NULL;
