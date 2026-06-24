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
        ScoreResult result = scoringService.calculate(validInput(new BigDecimal("10.00")), ratingProfile);

        assertThat(result.technicalScore()).isEqualByComparingTo("9.23");
        assertThat(result.objectiveScore()).isEqualByComparingTo("9.13");
        assertThat(result.displayScore()).isEqualByComparingTo("9.25");
    }

    @Test
    void usesPersonalFinalThenDisplayThenTechnicalForPersonalRanking() {
        assertThat(scoringService.personalRankingScore(
                new BigDecimal("10.00"), new BigDecimal("9.25"), new BigDecimal("9.24")))
                .isEqualByComparingTo("10.00");
        assertThat(scoringService.personalRankingScore(
                null, new BigDecimal("9.25"), new BigDecimal("9.24")))
                .isEqualByComparingTo("9.25");
        assertThat(scoringService.personalRankingScore(
                null, null, new BigDecimal("9.24")))
                .isEqualByComparingTo("9.24");
    }

    @Test
    void rejectsMissingCategoryScore() {
        ScoreInput input = new ScoreInput(
                null,
                new BigDecimal("9.00"),
                new BigDecimal("9.00"),
                new BigDecimal("8.00"),
                new BigDecimal("9.00"),
                new BigDecimal("8.00"),
                new BigDecimal("10.00"),
                new BigDecimal("9.00"),
                new BigDecimal("10.00"),
                null);

        assertThatThrownBy(() -> scoringService.calculate(input, ratingProfile))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("storyScreenplay is required");
    }

    @Test
    void rejectsCategoryScoreOutsideQuarterPointIncrements() {
        ScoreInput input = new ScoreInput(
                new BigDecimal("9.10"),
                new BigDecimal("9.00"),
                new BigDecimal("9.00"),
                new BigDecimal("8.00"),
                new BigDecimal("9.00"),
                new BigDecimal("8.00"),
                new BigDecimal("10.00"),
                new BigDecimal("9.00"),
                new BigDecimal("10.00"),
                null);

        assertThatThrownBy(() -> scoringService.calculate(input, ratingProfile))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("storyScreenplay must be a multiple of 0.25");
    }

    @Test
    void rejectsInvalidPersonalFinalScore() {
        assertThatThrownBy(() -> scoringService.calculate(validInput(new BigDecimal("10.25")), ratingProfile))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("personalFinalScore must be between 0.00 and 10.00");
    }

    private ScoreInput validInput(BigDecimal personalFinalScore) {
        return new ScoreInput(
                new BigDecimal("10.00"),
                new BigDecimal("9.00"),
                new BigDecimal("9.00"),
                new BigDecimal("8.00"),
                new BigDecimal("9.00"),
                new BigDecimal("8.00"),
                new BigDecimal("10.00"),
                new BigDecimal("9.00"),
                new BigDecimal("10.00"),
                personalFinalScore);
    }
}
