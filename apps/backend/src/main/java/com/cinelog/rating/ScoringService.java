package com.cinelog.rating;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class ScoringService {

    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final BigDecimal TEN = new BigDecimal("10.00");
    private static final BigDecimal QUARTER_POINT = new BigDecimal("0.25");
    private static final BigDecimal OBJECTIVE_WEIGHT = new BigDecimal("0.88");
    private static final TypeReference<Map<String, BigDecimal>> WEIGHTS_TYPE = new TypeReference<>() {
    };

    private final ObjectMapper objectMapper;

    public ScoringService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public ScoreResult calculate(ScoreInput input, RatingProfile profile) {
        validate(input);
        Map<String, BigDecimal> weights = readWeights(profile);

        BigDecimal technicalScore = weightedSum(input.categories(), weights)
                .setScale(2, RoundingMode.HALF_UP);

        Map<String, BigDecimal> objectiveCategories = new LinkedHashMap<>(input.categories());
        objectiveCategories.remove("personalImpactEnjoyment");
        BigDecimal objectiveScore = weightedSum(objectiveCategories, weights)
                .divide(OBJECTIVE_WEIGHT, 2, RoundingMode.HALF_UP);

        BigDecimal displayScore = technicalScore.divide(QUARTER_POINT, 0, RoundingMode.HALF_UP)
                .multiply(QUARTER_POINT)
                .setScale(2, RoundingMode.UNNECESSARY);

        BigDecimal personalRankingScore = personalRankingScore(
                input.personalFinalScore(), displayScore, technicalScore);

        return new ScoreResult(technicalScore, objectiveScore, displayScore, personalRankingScore);
    }

    public BigDecimal personalRankingScore(
            BigDecimal personalFinalScore,
            BigDecimal displayScore,
            BigDecimal technicalScore) {
        if (personalFinalScore != null) {
            return personalFinalScore;
        }
        if (displayScore != null) {
            return displayScore;
        }
        return technicalScore;
    }

    public void validate(ScoreInput input) {
        input.categories().forEach((name, score) -> validateScore(name, score, false));
        validateScore("personalFinalScore", input.personalFinalScore(), true);
    }

    private void validateScore(String name, BigDecimal score, boolean optional) {
        if (score == null) {
            if (optional) {
                return;
            }
            throw new IllegalArgumentException(name + " is required");
        }
        if (score.compareTo(ZERO) < 0 || score.compareTo(TEN) > 0) {
            throw new IllegalArgumentException(name + " must be between 0.00 and 10.00");
        }
        if (score.remainder(QUARTER_POINT).compareTo(ZERO) != 0) {
            throw new IllegalArgumentException(name + " must be a multiple of 0.25");
        }
    }

    private Map<String, BigDecimal> readWeights(RatingProfile profile) {
        try {
            Map<String, BigDecimal> weights = objectMapper.readValue(profile.getWeightsJson(), WEIGHTS_TYPE);
            for (String category : ScoreInput.categoryNames()) {
                if (!weights.containsKey(category)) {
                    throw new IllegalStateException("Missing rating profile weight: " + category);
                }
            }
            return weights;
        } catch (IllegalStateException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalStateException("Invalid rating profile weights JSON", exception);
        }
    }

    private BigDecimal weightedSum(Map<String, BigDecimal> categories, Map<String, BigDecimal> weights) {
        return categories.entrySet().stream()
                .map(entry -> entry.getValue().multiply(weights.get(entry.getKey())))
                .reduce(ZERO, BigDecimal::add);
    }

    public record ScoreInput(
            BigDecimal storyScreenplay,
            BigDecimal direction,
            BigDecimal performancesCharacters,
            BigDecimal pacingEditing,
            BigDecimal visualsArtDesign,
            BigDecimal musicSound,
            BigDecimal themesDepth,
            BigDecimal originalityConcept,
            BigDecimal personalImpactEnjoyment,
            BigDecimal personalFinalScore) {

        public Map<String, BigDecimal> categories() {
            Map<String, BigDecimal> categories = new LinkedHashMap<>();
            categories.put("storyScreenplay", storyScreenplay);
            categories.put("direction", direction);
            categories.put("performancesCharacters", performancesCharacters);
            categories.put("pacingEditing", pacingEditing);
            categories.put("visualsArtDesign", visualsArtDesign);
            categories.put("musicSound", musicSound);
            categories.put("themesDepth", themesDepth);
            categories.put("originalityConcept", originalityConcept);
            categories.put("personalImpactEnjoyment", personalImpactEnjoyment);
            return categories;
        }

        static Iterable<String> categoryNames() {
            return new ScoreInput(null, null, null, null, null, null, null, null, null, null)
                    .categories()
                    .keySet();
        }
    }

    public record ScoreResult(
            BigDecimal technicalScore,
            BigDecimal objectiveScore,
            BigDecimal displayScore,
            BigDecimal personalRankingScore) {
    }
}
