CREATE TABLE rating_profile (
    id BIGINT NOT NULL AUTO_INCREMENT,
    version INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    weights_json TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT pk_rating_profile PRIMARY KEY (id),
    CONSTRAINT uk_rating_profile_version UNIQUE (version)
);

INSERT INTO rating_profile (version, name, weights_json, active, created_at)
VALUES (
    1,
    'Main Rating System',
    '{"storyScreenplay":0.18,"direction":0.13,"performancesCharacters":0.12,"pacingEditing":0.10,"visualsArtDesign":0.10,"musicSound":0.07,"themesDepth":0.10,"originalityConcept":0.08,"personalImpactEnjoyment":0.12}',
    TRUE,
    CURRENT_TIMESTAMP(6)
);
