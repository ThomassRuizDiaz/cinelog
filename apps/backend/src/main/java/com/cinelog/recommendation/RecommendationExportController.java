package com.cinelog.recommendation;

import com.cinelog.recommendation.dto.RecommendationExportResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationExportController {

    private final RecommendationExportService recommendationExportService;

    public RecommendationExportController(RecommendationExportService recommendationExportService) {
        this.recommendationExportService = recommendationExportService;
    }

    @GetMapping("/export")
    RecommendationExportResponse export(
            @RequestParam(required = false) Boolean includePrivateNotes,
            @RequestParam(required = false) Boolean includeWatchlist,
            @RequestParam(required = false) String format,
            @RequestParam(required = false) Integer limitFavorites,
            @RequestParam(required = false) Integer limitWatched) {
        return recommendationExportService.export(
                includePrivateNotes,
                includeWatchlist,
                format,
                limitFavorites,
                limitWatched);
    }
}
