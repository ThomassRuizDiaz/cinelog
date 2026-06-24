ALTER TABLE movie_rating DROP CONSTRAINT ck_movie_rating_story_screenplay;
ALTER TABLE movie_rating DROP CONSTRAINT ck_movie_rating_direction;
ALTER TABLE movie_rating DROP CONSTRAINT ck_movie_rating_performances;
ALTER TABLE movie_rating DROP CONSTRAINT ck_movie_rating_pacing;
ALTER TABLE movie_rating DROP CONSTRAINT ck_movie_rating_visuals;
ALTER TABLE movie_rating DROP CONSTRAINT ck_movie_rating_music;
ALTER TABLE movie_rating DROP CONSTRAINT ck_movie_rating_themes;
ALTER TABLE movie_rating DROP CONSTRAINT ck_movie_rating_originality;
ALTER TABLE movie_rating DROP CONSTRAINT ck_movie_rating_personal_impact;
ALTER TABLE movie_rating DROP CONSTRAINT ck_movie_rating_technical_score;
ALTER TABLE movie_rating DROP CONSTRAINT ck_movie_rating_objective_score;
ALTER TABLE movie_rating DROP CONSTRAINT ck_movie_rating_display_score;
ALTER TABLE movie_rating DROP CONSTRAINT ck_movie_rating_personal_final_score;

ALTER TABLE movie_rating MODIFY COLUMN story_screenplay DECIMAL(4, 2) NOT NULL;
ALTER TABLE movie_rating MODIFY COLUMN direction DECIMAL(4, 2) NOT NULL;
ALTER TABLE movie_rating MODIFY COLUMN performances_characters DECIMAL(4, 2) NOT NULL;
ALTER TABLE movie_rating MODIFY COLUMN pacing_editing DECIMAL(4, 2) NOT NULL;
ALTER TABLE movie_rating MODIFY COLUMN visuals_art_design DECIMAL(4, 2) NOT NULL;
ALTER TABLE movie_rating MODIFY COLUMN music_sound DECIMAL(4, 2) NOT NULL;
ALTER TABLE movie_rating MODIFY COLUMN themes_depth DECIMAL(4, 2) NOT NULL;
ALTER TABLE movie_rating MODIFY COLUMN originality_concept DECIMAL(4, 2) NOT NULL;
ALTER TABLE movie_rating MODIFY COLUMN personal_impact_enjoyment DECIMAL(4, 2) NOT NULL;
ALTER TABLE movie_rating MODIFY COLUMN display_score DECIMAL(4, 2) NOT NULL;
ALTER TABLE movie_rating MODIFY COLUMN personal_final_score DECIMAL(4, 2) NULL;

UPDATE movie_rating
SET story_screenplay = story_screenplay * 2,
    direction = direction * 2,
    performances_characters = performances_characters * 2,
    pacing_editing = pacing_editing * 2,
    visuals_art_design = visuals_art_design * 2,
    music_sound = music_sound * 2,
    themes_depth = themes_depth * 2,
    originality_concept = originality_concept * 2,
    personal_impact_enjoyment = personal_impact_enjoyment * 2,
    technical_score = technical_score * 2,
    objective_score = objective_score * 2,
    display_score = display_score * 2,
    personal_final_score = CASE
        WHEN personal_final_score IS NULL THEN NULL
        ELSE personal_final_score * 2
    END;

ALTER TABLE movie_rating
    ADD CONSTRAINT ck_movie_rating_story_screenplay CHECK (story_screenplay BETWEEN 0.00 AND 10.00 AND MOD(story_screenplay * 100, 25) = 0);
ALTER TABLE movie_rating
    ADD CONSTRAINT ck_movie_rating_direction CHECK (direction BETWEEN 0.00 AND 10.00 AND MOD(direction * 100, 25) = 0);
ALTER TABLE movie_rating
    ADD CONSTRAINT ck_movie_rating_performances CHECK (performances_characters BETWEEN 0.00 AND 10.00 AND MOD(performances_characters * 100, 25) = 0);
ALTER TABLE movie_rating
    ADD CONSTRAINT ck_movie_rating_pacing CHECK (pacing_editing BETWEEN 0.00 AND 10.00 AND MOD(pacing_editing * 100, 25) = 0);
ALTER TABLE movie_rating
    ADD CONSTRAINT ck_movie_rating_visuals CHECK (visuals_art_design BETWEEN 0.00 AND 10.00 AND MOD(visuals_art_design * 100, 25) = 0);
ALTER TABLE movie_rating
    ADD CONSTRAINT ck_movie_rating_music CHECK (music_sound BETWEEN 0.00 AND 10.00 AND MOD(music_sound * 100, 25) = 0);
ALTER TABLE movie_rating
    ADD CONSTRAINT ck_movie_rating_themes CHECK (themes_depth BETWEEN 0.00 AND 10.00 AND MOD(themes_depth * 100, 25) = 0);
ALTER TABLE movie_rating
    ADD CONSTRAINT ck_movie_rating_originality CHECK (originality_concept BETWEEN 0.00 AND 10.00 AND MOD(originality_concept * 100, 25) = 0);
ALTER TABLE movie_rating
    ADD CONSTRAINT ck_movie_rating_personal_impact CHECK (personal_impact_enjoyment BETWEEN 0.00 AND 10.00 AND MOD(personal_impact_enjoyment * 100, 25) = 0);
ALTER TABLE movie_rating
    ADD CONSTRAINT ck_movie_rating_technical_score CHECK (technical_score BETWEEN 0.00 AND 10.00);
ALTER TABLE movie_rating
    ADD CONSTRAINT ck_movie_rating_objective_score CHECK (objective_score BETWEEN 0.00 AND 10.00);
ALTER TABLE movie_rating
    ADD CONSTRAINT ck_movie_rating_display_score CHECK (display_score BETWEEN 0.00 AND 10.00 AND MOD(display_score * 100, 25) = 0);
ALTER TABLE movie_rating
    ADD CONSTRAINT ck_movie_rating_personal_final_score CHECK (personal_final_score IS NULL OR (personal_final_score BETWEEN 0.00 AND 10.00 AND MOD(personal_final_score * 100, 25) = 0));
