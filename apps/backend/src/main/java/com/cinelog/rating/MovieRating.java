package com.cinelog.rating;

import com.cinelog.watch.WatchEntry;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "movie_rating")
public class MovieRating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "watch_entry_id", nullable = false, unique = true)
    private WatchEntry watchEntry;

    @NotNull
    @CategoryScore
    @Column(name = "story_screenplay", nullable = false, precision = 4, scale = 2)
    private BigDecimal storyScreenplay;

    @NotNull
    @CategoryScore
    @Column(nullable = false, precision = 4, scale = 2)
    private BigDecimal direction;

    @NotNull
    @CategoryScore
    @Column(name = "performances_characters", nullable = false, precision = 4, scale = 2)
    private BigDecimal performancesCharacters;

    @NotNull
    @CategoryScore
    @Column(name = "pacing_editing", nullable = false, precision = 4, scale = 2)
    private BigDecimal pacingEditing;

    @NotNull
    @CategoryScore
    @Column(name = "visuals_art_design", nullable = false, precision = 4, scale = 2)
    private BigDecimal visualsArtDesign;

    @NotNull
    @CategoryScore
    @Column(name = "music_sound", nullable = false, precision = 4, scale = 2)
    private BigDecimal musicSound;

    @NotNull
    @CategoryScore
    @Column(name = "themes_depth", nullable = false, precision = 4, scale = 2)
    private BigDecimal themesDepth;

    @NotNull
    @CategoryScore
    @Column(name = "originality_concept", nullable = false, precision = 4, scale = 2)
    private BigDecimal originalityConcept;

    @NotNull
    @CategoryScore
    @Column(name = "personal_impact_enjoyment", nullable = false, precision = 4, scale = 2)
    private BigDecimal personalImpactEnjoyment;

    @NotNull
    @DecimalMin("0.00")
    @DecimalMax("10.00")
    @Digits(integer = 2, fraction = 2)
    @Column(name = "technical_score", nullable = false, precision = 4, scale = 2)
    private BigDecimal technicalScore;

    @NotNull
    @DecimalMin("0.00")
    @DecimalMax("10.00")
    @Digits(integer = 2, fraction = 2)
    @Column(name = "objective_score", nullable = false, precision = 4, scale = 2)
    private BigDecimal objectiveScore;

    @NotNull
    @CategoryScore
    @Column(name = "display_score", nullable = false, precision = 4, scale = 2)
    private BigDecimal displayScore;

    @CategoryScore
    @Column(name = "personal_final_score", precision = 4, scale = 2)
    private BigDecimal personalFinalScore;

    @Column(name = "review_summary", columnDefinition = "TEXT")
    private String reviewSummary;

    @Column(name = "private_notes", columnDefinition = "TEXT")
    private String privateNotes;

    @Column(name = "category_notes_json", columnDefinition = "TEXT")
    private String categoryNotesJson;

    @Column(name = "rating_profile_version", nullable = false)
    private int ratingProfileVersion;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected MovieRating() {
    }

    public MovieRating(WatchEntry watchEntry, int ratingProfileVersion) {
        this.watchEntry = watchEntry;
        this.ratingProfileVersion = ratingProfileVersion;
    }

    public Long getId() {
        return id;
    }

    public WatchEntry getWatchEntry() {
        return watchEntry;
    }

    public void setWatchEntry(WatchEntry watchEntry) {
        this.watchEntry = watchEntry;
    }

    public BigDecimal getStoryScreenplay() {
        return storyScreenplay;
    }

    public void setStoryScreenplay(BigDecimal storyScreenplay) {
        this.storyScreenplay = storyScreenplay;
    }

    public BigDecimal getDirection() {
        return direction;
    }

    public void setDirection(BigDecimal direction) {
        this.direction = direction;
    }

    public BigDecimal getPerformancesCharacters() {
        return performancesCharacters;
    }

    public void setPerformancesCharacters(BigDecimal performancesCharacters) {
        this.performancesCharacters = performancesCharacters;
    }

    public BigDecimal getPacingEditing() {
        return pacingEditing;
    }

    public void setPacingEditing(BigDecimal pacingEditing) {
        this.pacingEditing = pacingEditing;
    }

    public BigDecimal getVisualsArtDesign() {
        return visualsArtDesign;
    }

    public void setVisualsArtDesign(BigDecimal visualsArtDesign) {
        this.visualsArtDesign = visualsArtDesign;
    }

    public BigDecimal getMusicSound() {
        return musicSound;
    }

    public void setMusicSound(BigDecimal musicSound) {
        this.musicSound = musicSound;
    }

    public BigDecimal getThemesDepth() {
        return themesDepth;
    }

    public void setThemesDepth(BigDecimal themesDepth) {
        this.themesDepth = themesDepth;
    }

    public BigDecimal getOriginalityConcept() {
        return originalityConcept;
    }

    public void setOriginalityConcept(BigDecimal originalityConcept) {
        this.originalityConcept = originalityConcept;
    }

    public BigDecimal getPersonalImpactEnjoyment() {
        return personalImpactEnjoyment;
    }

    public void setPersonalImpactEnjoyment(BigDecimal personalImpactEnjoyment) {
        this.personalImpactEnjoyment = personalImpactEnjoyment;
    }

    public BigDecimal getTechnicalScore() {
        return technicalScore;
    }

    public void setTechnicalScore(BigDecimal technicalScore) {
        this.technicalScore = technicalScore;
    }

    public BigDecimal getObjectiveScore() {
        return objectiveScore;
    }

    public void setObjectiveScore(BigDecimal objectiveScore) {
        this.objectiveScore = objectiveScore;
    }

    public BigDecimal getDisplayScore() {
        return displayScore;
    }

    public void setDisplayScore(BigDecimal displayScore) {
        this.displayScore = displayScore;
    }

    public BigDecimal getPersonalFinalScore() {
        return personalFinalScore;
    }

    public void setPersonalFinalScore(BigDecimal personalFinalScore) {
        this.personalFinalScore = personalFinalScore;
    }

    public String getReviewSummary() {
        return reviewSummary;
    }

    public void setReviewSummary(String reviewSummary) {
        this.reviewSummary = reviewSummary;
    }

    public String getPrivateNotes() {
        return privateNotes;
    }

    public void setPrivateNotes(String privateNotes) {
        this.privateNotes = privateNotes;
    }

    public String getCategoryNotesJson() {
        return categoryNotesJson;
    }

    public void setCategoryNotesJson(String categoryNotesJson) {
        this.categoryNotesJson = categoryNotesJson;
    }

    public int getRatingProfileVersion() {
        return ratingProfileVersion;
    }

    public void setRatingProfileVersion(int ratingProfileVersion) {
        this.ratingProfileVersion = ratingProfileVersion;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
