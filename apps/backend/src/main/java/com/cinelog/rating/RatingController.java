package com.cinelog.rating;

import com.cinelog.rating.dto.RatingResponse;
import com.cinelog.rating.dto.SaveRatingRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/watch-entries/{watchEntryId}/rating")
public class RatingController {

    private final RatingService ratingService;

    public RatingController(RatingService ratingService) {
        this.ratingService = ratingService;
    }

    @GetMapping
    RatingResponse get(@PathVariable Long watchEntryId) {
        return ratingService.get(watchEntryId);
    }

    @PutMapping
    RatingResponse saveOrUpdate(
            @PathVariable Long watchEntryId,
            @Valid @RequestBody SaveRatingRequest request) {
        return ratingService.saveOrUpdate(watchEntryId, request);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@PathVariable Long watchEntryId) {
        ratingService.delete(watchEntryId);
    }
}
