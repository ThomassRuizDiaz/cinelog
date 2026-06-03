package com.cinelog.ranking;

import com.cinelog.ranking.dto.RankingItemResponse;
import com.cinelog.watch.WatchLocation;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rankings")
public class RankingController {

    private final RankingService rankingService;

    public RankingController(RankingService rankingService) {
        this.rankingService = rankingService;
    }

    @GetMapping
    List<RankingItemResponse> rankings(
            @RequestParam RankingMode mode,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) WatchLocation watchLocation,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return rankingService.rankings(mode, genre, year, watchLocation, limit, page, size);
    }
}
