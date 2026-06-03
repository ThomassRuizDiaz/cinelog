package com.cinelog.rating;

import com.cinelog.movie.Movie;
import com.cinelog.movie.MovieRepository;
import com.cinelog.rating.ScoringService.ScoreResult;
import com.cinelog.rating.dto.RatingResponse;
import com.cinelog.rating.dto.SaveRatingRequest;
import com.cinelog.watch.WatchEntry;
import com.cinelog.watch.WatchEntryRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Collections;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RatingService {

    private static final TypeReference<Map<String, String>> CATEGORY_NOTES_TYPE = new TypeReference<>() {
    };

    private final MovieRatingRepository movieRatingRepository;
    private final MovieRepository movieRepository;
    private final WatchEntryRepository watchEntryRepository;
    private final RatingProfileRepository ratingProfileRepository;
    private final ScoringService scoringService;
    private final ObjectMapper objectMapper;
    private final ActiveRatingService activeRatingService;

    public RatingService(
            MovieRatingRepository movieRatingRepository,
            MovieRepository movieRepository,
            WatchEntryRepository watchEntryRepository,
            RatingProfileRepository ratingProfileRepository,
            ScoringService scoringService,
            ObjectMapper objectMapper,
            ActiveRatingService activeRatingService) {
        this.movieRatingRepository = movieRatingRepository;
        this.movieRepository = movieRepository;
        this.watchEntryRepository = watchEntryRepository;
        this.ratingProfileRepository = ratingProfileRepository;
        this.scoringService = scoringService;
        this.objectMapper = objectMapper;
        this.activeRatingService = activeRatingService;
    }

    @Transactional(readOnly = true)
    public RatingResponse get(Long watchEntryId) {
        return toResponse(findRating(watchEntryId));
    }

    @Transactional
    public RatingResponse saveOrUpdate(Long watchEntryId, SaveRatingRequest request) {
        WatchEntry watchEntry = watchEntryRepository.findById(watchEntryId)
                .orElseThrow(() -> notFound("Watch entry", watchEntryId));
        RatingProfile ratingProfile = ratingProfileRepository.findByActiveTrue()
                .orElseThrow(() -> new IllegalStateException("Active rating profile is missing"));
        ScoreResult scores = scoringService.calculate(request.toScoreInput(), ratingProfile);

        MovieRating rating = movieRatingRepository.findByWatchEntry_Id(watchEntryId)
                .orElseGet(() -> new MovieRating(watchEntry, ratingProfile.getVersion()));
        copyRequest(rating, request, ratingProfile.getVersion(), scores);
        MovieRating savedRating = movieRatingRepository.saveAndFlush(rating);
        activeRatingService.recalculate(watchEntry.getMovie().getId());
        return toResponse(savedRating);
    }

    @Transactional
    public void delete(Long watchEntryId) {
        MovieRating rating = findRating(watchEntryId);
        Movie movie = rating.getWatchEntry().getMovie();
        Long movieId = movie.getId();
        if (movie.getActiveRating() != null && movie.getActiveRating().getId().equals(rating.getId())) {
            movie.setActiveRating(null);
            movie.setActiveWatchEntry(null);
            movieRepository.saveAndFlush(movie);
        }
        movieRatingRepository.delete(rating);
        movieRatingRepository.flush();
        activeRatingService.recalculate(movieId);
    }

    private MovieRating findRating(Long watchEntryId) {
        return movieRatingRepository.findByWatchEntry_Id(watchEntryId)
                .orElseThrow(() -> notFound("Rating for watch entry", watchEntryId));
    }

    private void copyRequest(
            MovieRating rating,
            SaveRatingRequest request,
            int ratingProfileVersion,
            ScoreResult scores) {
        rating.setStoryScreenplay(request.storyScreenplay());
        rating.setDirection(request.direction());
        rating.setPerformancesCharacters(request.performancesCharacters());
        rating.setPacingEditing(request.pacingEditing());
        rating.setVisualsArtDesign(request.visualsArtDesign());
        rating.setMusicSound(request.musicSound());
        rating.setThemesDepth(request.themesDepth());
        rating.setOriginalityConcept(request.originalityConcept());
        rating.setPersonalImpactEnjoyment(request.personalImpactEnjoyment());
        rating.setTechnicalScore(scores.technicalScore());
        rating.setObjectiveScore(scores.objectiveScore());
        rating.setDisplayScore(scores.displayScore());
        rating.setPersonalFinalScore(request.personalFinalScore());
        rating.setReviewSummary(request.reviewSummary());
        rating.setPrivateNotes(request.privateNotes());
        rating.setCategoryNotesJson(writeCategoryNotes(request.categoryNotes()));
        rating.setRatingProfileVersion(ratingProfileVersion);
    }

    private RatingResponse toResponse(MovieRating rating) {
        return new RatingResponse(
                rating.getId(),
                rating.getWatchEntry().getId(),
                rating.getStoryScreenplay(),
                rating.getDirection(),
                rating.getPerformancesCharacters(),
                rating.getPacingEditing(),
                rating.getVisualsArtDesign(),
                rating.getMusicSound(),
                rating.getThemesDepth(),
                rating.getOriginalityConcept(),
                rating.getPersonalImpactEnjoyment(),
                rating.getTechnicalScore(),
                rating.getObjectiveScore(),
                rating.getDisplayScore(),
                rating.getPersonalFinalScore(),
                scoringService.personalRankingScore(
                        rating.getPersonalFinalScore(),
                        rating.getDisplayScore(),
                        rating.getTechnicalScore()),
                rating.getReviewSummary(),
                rating.getPrivateNotes(),
                readCategoryNotes(rating.getCategoryNotesJson()),
                rating.getRatingProfileVersion());
    }

    private String writeCategoryNotes(Map<String, String> categoryNotes) {
        if (categoryNotes == null || categoryNotes.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(categoryNotes);
        } catch (Exception exception) {
            throw new IllegalArgumentException("Category notes must be valid JSON-compatible values", exception);
        }
    }

    private Map<String, String> readCategoryNotes(String categoryNotesJson) {
        if (categoryNotesJson == null || categoryNotesJson.isBlank()) {
            return Collections.emptyMap();
        }
        try {
            return objectMapper.readValue(categoryNotesJson, CATEGORY_NOTES_TYPE);
        } catch (Exception exception) {
            throw new IllegalStateException("Stored category notes JSON is invalid", exception);
        }
    }

    private ResponseStatusException notFound(String resource, Long id) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, resource + " not found: " + id);
    }
}
