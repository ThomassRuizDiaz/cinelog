package com.cinelog.watchlist;

import com.cinelog.movie.MetadataSource;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "watchlist_item")
public class WatchlistItem {

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

    @NotNull
    @Column(name = "genres_json", nullable = false, columnDefinition = "TEXT")
    private String genresJson = "[]";

    @Size(max = 500)
    @Column(name = "poster_path", length = 500)
    private String posterPath;

    @Column(name = "poster_url", columnDefinition = "TEXT")
    private String posterUrl;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected WatchlistItem() {
    }

    public WatchlistItem(MetadataSource metadataSource, String title) {
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

    public String getGenresJson() {
        return genresJson;
    }

    public void setGenresJson(String genresJson) {
        this.genresJson = genresJson;
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

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
