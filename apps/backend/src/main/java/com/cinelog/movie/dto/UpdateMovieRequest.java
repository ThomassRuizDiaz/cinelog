package com.cinelog.movie.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

public record UpdateMovieRequest(
        @NotBlank @Size(max = 255) String title,
        @Size(max = 255) String originalTitle,
        Integer releaseYear,
        @Size(max = 20) List<@Size(max = 255) String> directors,
        @Size(max = 500) String posterPath,
        @Pattern(regexp = "^https?://.+$", message = "posterUrl must be an HTTP(S) URL") String posterUrl,
        @Size(max = 30) List<@Size(max = 100) String> genres) {
}
