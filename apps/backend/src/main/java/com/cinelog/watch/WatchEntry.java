package com.cinelog.watch;

import com.cinelog.movie.Movie;
import com.cinelog.rating.MovieRating;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "watch_entry")
public class WatchEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "movie_id", nullable = false)
    private Movie movie;

    @NotNull
    @Column(name = "watched_at", nullable = false)
    private LocalDate watchedAt;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "watch_type", nullable = false, length = 20)
    private WatchType watchType;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "watch_location", nullable = false, length = 20)
    private WatchLocation watchLocation;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToOne(mappedBy = "watchEntry", fetch = FetchType.LAZY)
    private MovieRating rating;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected WatchEntry() {
    }

    public WatchEntry(Movie movie, LocalDate watchedAt, WatchType watchType, WatchLocation watchLocation) {
        this.movie = movie;
        this.watchedAt = watchedAt;
        this.watchType = watchType;
        this.watchLocation = watchLocation;
    }

    public Long getId() {
        return id;
    }

    public Movie getMovie() {
        return movie;
    }

    public void setMovie(Movie movie) {
        this.movie = movie;
    }

    public LocalDate getWatchedAt() {
        return watchedAt;
    }

    public void setWatchedAt(LocalDate watchedAt) {
        this.watchedAt = watchedAt;
    }

    public WatchType getWatchType() {
        return watchType;
    }

    public void setWatchType(WatchType watchType) {
        this.watchType = watchType;
    }

    public WatchLocation getWatchLocation() {
        return watchLocation;
    }

    public void setWatchLocation(WatchLocation watchLocation) {
        this.watchLocation = watchLocation;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public MovieRating getRating() {
        return rating;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
