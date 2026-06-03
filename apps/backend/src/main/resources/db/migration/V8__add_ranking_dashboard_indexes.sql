CREATE INDEX idx_watch_entry_watched_at_id ON watch_entry (watched_at, id);
CREATE INDEX idx_watch_entry_watch_type ON watch_entry (watch_type);
CREATE INDEX idx_movie_created_at_id ON movie (created_at, id);
