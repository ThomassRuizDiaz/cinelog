CREATE TABLE actor (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tmdb_id BIGINT NULL,
    name VARCHAR(255) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_actor PRIMARY KEY (id),
    CONSTRAINT uk_actor_tmdb_id UNIQUE (tmdb_id),
    CONSTRAINT ck_actor_name_not_blank CHECK (CHAR_LENGTH(TRIM(name)) > 0)
);

CREATE TABLE movie_cast_member (
    id BIGINT NOT NULL AUTO_INCREMENT,
    movie_id BIGINT NOT NULL,
    actor_id BIGINT NOT NULL,
    character_name VARCHAR(255) NULL,
    cast_order INT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_movie_cast_member PRIMARY KEY (id),
    CONSTRAINT fk_movie_cast_member_movie FOREIGN KEY (movie_id) REFERENCES movie (id) ON DELETE CASCADE,
    CONSTRAINT fk_movie_cast_member_actor FOREIGN KEY (actor_id) REFERENCES actor (id) ON DELETE CASCADE,
    CONSTRAINT uk_movie_cast_member_movie_actor_order UNIQUE (movie_id, actor_id, cast_order),
    CONSTRAINT ck_movie_cast_member_cast_order CHECK (cast_order >= 0)
);

CREATE INDEX idx_actor_name ON actor (name);
CREATE INDEX idx_movie_cast_member_movie_order ON movie_cast_member (movie_id, cast_order);
CREATE INDEX idx_movie_cast_member_actor ON movie_cast_member (actor_id);
