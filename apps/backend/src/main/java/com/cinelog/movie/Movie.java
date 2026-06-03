package com.cinelog.movie;

import com.cinelog.rating.MovieRating;
import com.cinelog.watch.WatchEntry;
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
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "movie")
public class Movie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tmdb_id", unique = true)
    private Long tmdbId;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "metadata_source", nullable = false, length = 20)
    private MetadataSource metadataSource;

    @NotBlank
    @Size(max = 255)
    @Column(nullable = false)
    private String title;

    @Size(max = 255)
    @Column(name = "original_title")
    private String originalTitle;

    @Column(name = "release_year")
    private Integer releaseYear;

    @NotNull
    @Column(name = "directors_json", nullable = false, columnDefinition = "TEXT")
    private String directorsJson = "[]";

    @Size(max = 500)
    @Column(name = "poster_path", length = 500)
    private String posterPath;

    @Column(name = "poster_url", columnDefinition = "TEXT")
    private String posterUrl;

    @NotNull
    @Column(name = "genres_json", nullable = false, columnDefinition = "TEXT")
    private String genresJson = "[]";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "active_rating_id")
    private MovieRating activeRating;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "active_watch_entry_id")
    private WatchEntry activeWatchEntry;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected Movie() {
    }

    public Movie(MetadataSource metadataSource, String title) {
        this.metadataSource = metadataSource;
        this.title = title;
    }

    public Long getId() {
        return id;
    }

    public Long getTmdbId() {
        return tmdbId;
    }

    public void setTmdbId(Long tmdbId) {
        this.tmdbId = tmdbId;
    }

    public MetadataSource getMetadataSource() {
        return metadataSource;
    }

    public void setMetadataSource(MetadataSource metadataSource) {
        this.metadataSource = metadataSource;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getOriginalTitle() {
        return originalTitle;
    }

    public void setOriginalTitle(String originalTitle) {
        this.originalTitle = originalTitle;
    }

    public Integer getReleaseYear() {
        return releaseYear;
    }

    public void setReleaseYear(Integer releaseYear) {
        this.releaseYear = releaseYear;
    }

    public String getDirectorsJson() {
        return directorsJson;
    }

    public void setDirectorsJson(String directorsJson) {
        this.directorsJson = directorsJson;
    }

    public String getPosterPath() {
        return posterPath;
    }

    public void setPosterPath(String posterPath) {
        this.posterPath = posterPath;
    }

    public String getPosterUrl() {
        return posterUrl;
    }

    public void setPosterUrl(String posterUrl) {
        this.posterUrl = posterUrl;
    }

    public String getGenresJson() {
        return genresJson;
    }

    public void setGenresJson(String genresJson) {
        this.genresJson = genresJson;
    }

    public MovieRating getActiveRating() {
        return activeRating;
    }

    public void setActiveRating(MovieRating activeRating) {
        this.activeRating = activeRating;
    }

    public WatchEntry getActiveWatchEntry() {
        return activeWatchEntry;
    }

    public void setActiveWatchEntry(WatchEntry activeWatchEntry) {
        this.activeWatchEntry = activeWatchEntry;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
