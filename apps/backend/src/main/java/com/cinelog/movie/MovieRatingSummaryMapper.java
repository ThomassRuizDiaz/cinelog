package com.cinelog.movie;

import com.cinelog.movie.dto.MovieRatingSummaryResponse;
import com.cinelog.rating.MovieRating;
import java.math.BigDecimal;
import org.springframework.stereotype.Component;

@Component
public class MovieRatingSummaryMapper {

    public MovieRatingSummaryResponse map(MovieRating rating) {
        if (rating == null) {
            return null;
        }
        return new MovieRatingSummaryResponse(
                rating.getTechnicalScore(),
                rating.getObjectiveScore(),
                rating.getDisplayScore(),
                rating.getPersonalFinalScore(),
                personalRankingScore(rating));
    }

    public BigDecimal personalRankingScore(MovieRating rating) {
        if (rating.getPersonalFinalScore() != null) {
            return rating.getPersonalFinalScore();
        }
        if (rating.getDisplayScore() != null) {
            return rating.getDisplayScore();
        }
        return rating.getTechnicalScore();
    }
}
