package com.cinelog.rating;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.cinelog.rating.ScoringService.ScoreInput;
import com.cinelog.rating.ScoringService.ScoreResult;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class ScoringServiceTests {

    private static final String WEIGHTS_JSON = """
            {
              "storyScreenplay": 0.18,
              "direction": 0.13,
              "performancesCharacters": 0.12,
              "pacingEditing": 0.10,
              "visualsArtDesign": 0.10,
              "musicSound": 0.07,
              "themesDepth": 0.10,
              "originalityConcept": 0.08,
              "personalImpactEnjoyment": 0.12
            }
            """;

    private final ScoringService scoringService = new ScoringService(new ObjectMapper());
    private final RatingProfile ratingProfile = new RatingProfile(1, "Main Rating System", WEIGHTS_JSON, true);

    @Test
    void calculatesTechnicalObjectiveAndDisplayScores() {
        ScoreResult result = scoringService.calculate(validInput(new BigDecimal("5.0")), ratingProfile);

        assertThat(result.technicalScore()).isEqualByComparingTo("4.62");
        assertThat(result.objectiveScore()).isEqualByComparingTo("4.56");
        assertThat(result.displayScore()).isEqualByComparingTo("4.5");
    }

    @Test
    void usesPersonalFinalThenDisplayThenTechnicalForPersonalRanking() {
        assertThat(scoringService.personalRankingScore(
                new BigDecimal("5.0"), new BigDecimal("4.5"), new BigDecimal("4.62")))
                .isEqualByComparingTo("5.0");
        assertThat(scoringService.personalRankingScore(
                null, new BigDecimal("4.5"), new BigDecimal("4.62")))
                .isEqualByComparingTo("4.5");
        assertThat(scoringService.personalRankingScore(
                null, null, new BigDecimal("4.62")))
                .isEqualByComparingTo("4.62");
    }

    @Test
    void rejectsMissingCategoryScore() {
        ScoreInput input = new ScoreInput(
                null,
                new BigDecimal("4.5"),
                new BigDecimal("4.5"),
                new BigDecimal("4.0"),
                new BigDecimal("4.5"),
                new BigDecimal("4.0"),
                new BigDecimal("5.0"),
                new BigDecimal("4.5"),
                new BigDecimal("5.0"),
                null);

        assertThatThrownBy(() -> scoringService.calculate(input, ratingProfile))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("storyScreenplay is required");
    }

    @Test
    void rejectsCategoryScoreOutsideHalfPointIncrements() {
        ScoreInput input = new ScoreInput(
                new BigDecimal("4.3"),
                new BigDecimal("4.5"),
                new BigDecimal("4.5"),
                new BigDecimal("4.0"),
                new BigDecimal("4.5"),
                new BigDecimal("4.0"),
                new BigDecimal("5.0"),
                new BigDecimal("4.5"),
                new BigDecimal("5.0"),
                null);

        assertThatThrownBy(() -> scoringService.calculate(input, ratingProfile))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("storyScreenplay must be a multiple of 0.5");
    }

    @Test
    void rejectsInvalidPersonalFinalScore() {
        assertThatThrownBy(() -> scoringService.calculate(validInput(new BigDecimal("5.5")), ratingProfile))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("personalFinalScore must be between 0.0 and 5.0");
    }

    private ScoreInput validInput(BigDecimal personalFinalScore) {
        return new ScoreInput(
                new BigDecimal("5.0"),
                new BigDecimal("4.5"),
                new BigDecimal("4.5"),
                new BigDecimal("4.0"),
                new BigDecimal("4.5"),
                new BigDecimal("4.0"),
                new BigDecimal("5.0"),
                new BigDecimal("4.5"),
                new BigDecimal("5.0"),
                personalFinalScore);
    }
}
