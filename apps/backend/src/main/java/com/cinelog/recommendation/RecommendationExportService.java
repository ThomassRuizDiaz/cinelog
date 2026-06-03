package com.cinelog.recommendation;

import com.cinelog.movie.Movie;
import com.cinelog.movie.MovieMetadataReader;
import com.cinelog.movie.MovieRepository;
import com.cinelog.ranking.RankingService;
import com.cinelog.rating.MovieRating;
import com.cinelog.recommendation.dto.AlreadyWatchedRecommendationResponse;
import com.cinelog.recommendation.dto.RecommendationExportResponse;
import com.cinelog.recommendation.dto.RecommendationMovieSignalResponse;
import com.cinelog.recommendation.dto.RecommendationPrivacyResponse;
import com.cinelog.recommendation.dto.TasteProfileResponse;
import com.cinelog.recommendation.dto.WatchlistRecommendationResponse;
import com.cinelog.watchlist.WatchlistItem;
import com.cinelog.watchlist.WatchlistItemRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RecommendationExportService {

    private static final String ROLE_BLOCK = """
            <role>
              <metadata>
                <name>Cinema Taste Analyst</name>
                <version>1.0</version>
                <domain>Personal movie taste analysis and recommendations</domain>
                <intended_use>Analyze a user's exported movie history, watchlist, genres, ratings, notes, and metadata to infer taste patterns and recommend films.</intended_use>
                <response_language>Match the user's language unless explicitly instructed otherwise.</response_language>
              </metadata>

              <identity>
                You are a personal cinema taste analyst and movie recommendation assistant.
                Your job is to understand the user's cinematic preferences from exported app data and produce thoughtful, evidence-based recommendations.
              </identity>

              <mission>
                Analyze the user's movie history, watchlist, ratings, genres, metadata, and notes to identify taste patterns, explain them clearly, and recommend movies the user is likely to enjoy.
              </mission>

              <input_model>
                The user may provide any combination of:
                <field>watched_movies</field>
                <field>watchlist</field>
                <field>ratings</field>
                <field>genres</field>
                <field>directors</field>
                <field>actors</field>
                <field>countries</field>
                <field>release_years</field>
                <field>runtime</field>
                <field>personal_notes</field>
                <field>tags</field>
                <field>viewing_dates</field>
                <field>rewatches</field>
              </input_model>

              <analysis_rules>
                <rule>Separate explicit data from inferred preferences.</rule>
                <rule>Treat watched movies and ratings as stronger signals than watchlist items.</rule>
                <rule>Treat watchlist items as interest signals, not confirmed taste.</rule>
                <rule>Look for patterns across genre, tone, pacing, theme, era, country, director, cast, runtime, and viewing behavior.</rule>
                <rule>Identify both strong preferences and possible blind spots.</rule>
                <rule>Do not overfit to a single movie, genre, director, or rating unless the data strongly supports it.</rule>
              </analysis_rules>

              <recommendation_rules>
                <rule>Do not recommend movies the user has already watched unless suggesting a rewatch with a clear reason.</rule>
                <rule>Prioritize recommendations that match multiple observed taste signals.</rule>
                <rule>Include a mix of safe picks, exploratory picks, and one or two reasonable surprises.</rule>
                <rule>Explain each recommendation briefly using evidence from the user's data.</rule>
                <rule>When confidence is low, label the recommendation as experimental.</rule>
              </recommendation_rules>

              <non_hallucination_policy>
                <rule>Do not invent watched movies, ratings, notes, genres, metadata, or user preferences.</rule>
                <rule>Do not claim certainty when the export data is incomplete or ambiguous.</rule>
                <rule>If a movie's details are unknown, say so instead of fabricating them.</rule>
                <rule>If there is not enough data, provide a provisional analysis and state what extra data would improve recommendations.</rule>
              </non_hallucination_policy>

              <output_structure>
                <section>Profile summary</section>
                <section>Detected taste patterns</section>
                <section>Strong signals</section>
                <section>Weak or uncertain signals</section>
                <section>Blind spots or underexplored areas</section>
                <section>Recommended movies</section>
                <section>What to watch first</section>
              </output_structure>

              <tone>
                Be concise, insightful, and personal.
                Avoid generic movie-buff language.
                Sound like a sharp analyst who understands cinema and respects the user's actual data.
              </tone>

              <success_criteria>
                <criterion>The user feels the analysis reflects their actual taste.</criterion>
                <criterion>Recommendations are specific, justified, and not generic.</criterion>
                <criterion>The assistant clearly distinguishes evidence from inference.</criterion>
                <criterion>The assistant avoids recommending already watched movies by mistake.</criterion>
              </success_criteria>
            </role>
            """.trim();

    private static final String TASK_BLOCK = """
            <task>
            Adopt the Cinema Taste Analyst role above.
            Respond in Spanish by default unless the user explicitly asks for another language.
            Analyze the Cinelog export below.
            Recommend movies the user is likely to enjoy.
            Do not recommend movies listed in watched_movies.
            Treat watched_movies as strict exclusions.
            Treat watchlist items as interest signals, not confirmed taste.
            Do not present watchlist items as new recommendations.
            You may rank watchlist items separately under a section titled "Watchlist priority".
            If the dataset is small, clearly label the analysis as provisional.
            When data is scarce, avoid overfitting to one franchise, character, director, or genre.
            Include a final section suggesting what additional ratings would improve future recommendations.
            Private notes are excluded unless explicitly included in the export.
            </task>
            """.trim();

    private static final int DEFAULT_LIMIT_FAVORITES = 10;
    private static final int MAX_LIMIT_FAVORITES = 50;
    private static final int DEFAULT_LIMIT_WATCHED = 100;
    private static final int MAX_LIMIT_WATCHED = 500;

    private final MovieRepository movieRepository;
    private final WatchlistItemRepository watchlistItemRepository;
    private final MovieMetadataReader metadataReader;
    private final RankingService rankingService;

    public RecommendationExportService(
            MovieRepository movieRepository,
            WatchlistItemRepository watchlistItemRepository,
            MovieMetadataReader metadataReader,
            RankingService rankingService) {
        this.movieRepository = movieRepository;
        this.watchlistItemRepository = watchlistItemRepository;
        this.metadataReader = metadataReader;
        this.rankingService = rankingService;
    }

    @Transactional(readOnly = true)
    public RecommendationExportResponse export(
            Boolean includePrivateNotes,
            Boolean includeWatchlist,
            String format,
            Integer limitFavorites,
            Integer limitWatched) {
        validateFormat(format);
        boolean effectiveIncludePrivateNotes = Boolean.TRUE.equals(includePrivateNotes);
        boolean effectiveIncludeWatchlist = includeWatchlist == null || includeWatchlist;
        int favoriteLimit = bounded(limitFavorites, DEFAULT_LIMIT_FAVORITES, MAX_LIMIT_FAVORITES, "limitFavorites");
        int watchedLimit = bounded(limitWatched, DEFAULT_LIMIT_WATCHED, MAX_LIMIT_WATCHED, "limitWatched");

        List<Movie> movies = movieRepository.findAll();
        List<Movie> ratedMovies = movies.stream()
                .filter(movie -> movie.getActiveRating() != null)
                .toList();
        TasteProfileResponse tasteProfile = tasteProfile(ratedMovies, favoriteLimit);
        List<AlreadyWatchedRecommendationResponse> alreadyWatched = movies.stream()
                .sorted(Comparator.comparing(Movie::getTitle, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(Movie::getId))
                .limit(watchedLimit)
                .map(movie -> alreadyWatched(movie, effectiveIncludePrivateNotes))
                .toList();
        List<WatchlistRecommendationResponse> watchlist = effectiveIncludeWatchlist
                ? watchlistItemRepository.findAll().stream()
                        .sorted(Comparator.comparing(WatchlistItem::getCreatedAt, Comparator.reverseOrder())
                                .thenComparing(WatchlistItem::getId, Comparator.reverseOrder()))
                        .map(this::watchlistItem)
                        .toList()
                : List.of();
        String prompt = prompt(tasteProfile, alreadyWatched, watchlist, effectiveIncludePrivateNotes, effectiveIncludeWatchlist);
        String markdown = markdown(tasteProfile, alreadyWatched, watchlist, effectiveIncludePrivateNotes);
        return new RecommendationExportResponse(
                prompt,
                markdown,
                Instant.now(),
                tasteProfile,
                alreadyWatched,
                watchlist,
                new RecommendationPrivacyResponse(
                        effectiveIncludePrivateNotes,
                        effectiveIncludePrivateNotes
                                ? "Private notes are included because includePrivateNotes=true."
                                : "Private notes are excluded by default."));
    }

    private TasteProfileResponse tasteProfile(List<Movie> ratedMovies, int limit) {
        return new TasteProfileResponse(
                topMovies(ratedMovies, limit, movie -> rankingService.personalRankingScore(movie.getActiveRating())),
                topMovies(ratedMovies, limit, movie -> movie.getActiveRating().getPersonalImpactEnjoyment()),
                topMovies(ratedMovies, limit, movie -> movie.getActiveRating().getTechnicalScore()),
                favoriteSignals(ratedMovies, limit, movie -> metadataReader.directors(movie)).stream()
                        .map(SignalAggregate::name)
                        .toList(),
                favoriteSignals(ratedMovies, limit, movie -> metadataReader.genres(movie)).stream()
                        .map(SignalAggregate::name)
                        .toList());
    }

    private List<RecommendationMovieSignalResponse> topMovies(
            List<Movie> ratedMovies,
            int limit,
            Function<Movie, BigDecimal> score) {
        return ratedMovies.stream()
                .sorted(Comparator.comparing(score, Comparator.reverseOrder())
                        .thenComparing(Movie::getTitle, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(Movie::getId))
                .limit(limit)
                .map(movie -> movieSignal(movie, score.apply(movie)))
                .toList();
    }

    private RecommendationMovieSignalResponse movieSignal(Movie movie, BigDecimal score) {
        return new RecommendationMovieSignalResponse(
                movie.getTitle(),
                movie.getReleaseYear(),
                metadataReader.directors(movie),
                metadataReader.genres(movie),
                score);
    }

    private List<SignalAggregate> favoriteSignals(
            List<Movie> ratedMovies,
            int limit,
            Function<Movie, List<String>> values) {
        Map<String, SignalAggregate> aggregates = new LinkedHashMap<>();
        ratedMovies.forEach(movie -> values.apply(movie).forEach(value -> {
            String normalized = value.toLowerCase(Locale.ROOT);
            aggregates.computeIfAbsent(normalized, key -> new SignalAggregate(value))
                    .add(rankingService.personalRankingScore(movie.getActiveRating()));
        }));
        return aggregates.values().stream()
                .sorted(Comparator.comparing(SignalAggregate::count).reversed()
                        .thenComparing(SignalAggregate::averagePersonalScore, Comparator.reverseOrder())
                        .thenComparing(SignalAggregate::name, String.CASE_INSENSITIVE_ORDER))
                .limit(limit)
                .toList();
    }

    private AlreadyWatchedRecommendationResponse alreadyWatched(Movie movie, boolean includePrivateNotes) {
        MovieRating rating = movie.getActiveRating();
        return new AlreadyWatchedRecommendationResponse(
                movie.getTitle(),
                movie.getReleaseYear(),
                metadataReader.directors(movie),
                metadataReader.genres(movie),
                rating == null ? null : rating.getDisplayScore(),
                rating == null ? null : rating.getReviewSummary(),
                includePrivateNotes && rating != null ? rating.getPrivateNotes() : null);
    }

    private WatchlistRecommendationResponse watchlistItem(WatchlistItem item) {
        return new WatchlistRecommendationResponse(
                item.getTitle(),
                item.getReleaseYear(),
                metadataReader.readList(item.getDirectorsJson()),
                metadataReader.readList(item.getGenresJson()));
    }

    private String prompt(
            TasteProfileResponse tasteProfile,
            List<AlreadyWatchedRecommendationResponse> alreadyWatched,
            List<WatchlistRecommendationResponse> watchlist,
            boolean includePrivateNotes,
            boolean includeWatchlist) {
        StringBuilder builder = new StringBuilder();
        builder.append(ROLE_BLOCK).append("\n\n");
        builder.append(TASK_BLOCK).append("\n\n");
        builder.append("<cinelog_export>\n");
        builder.append("  <privacy>\n");
        builder.append("    include_private_notes: ").append(includePrivateNotes).append("\n");
        builder.append("    status: ")
                .append(includePrivateNotes ? "private notes included" : "private notes excluded")
                .append("\n");
        builder.append("  </privacy>\n\n");
        appendViewingSignals(builder, alreadyWatched, watchlist, includeWatchlist);
        appendWatchedMovies(builder, alreadyWatched, includePrivateNotes);
        appendWatchlist(builder, watchlist, includeWatchlist);
        appendTasteProfile(builder, tasteProfile);
        builder.append("</cinelog_export>\n\n");
        builder.append("Output instructions: respond in Spanish by default unless the user asks otherwise. ");
        builder.append("Do not recommend already watched movies. ");
        builder.append("Do not present watchlist items as new recommendations; if useful, rank them separately under \"Watchlist priority\". ");
        builder.append("If the dataset is small, clearly label the analysis as provisional. ");
        builder.append("Avoid overfitting to one franchise, character, director, or genre when data is scarce. ");
        builder.append("End with a section explaining what additional ratings would improve future recommendations. ");
        if (alreadyWatched.isEmpty()) {
            builder.append("The archive is empty, so data is limited; ask for clarification if needed.");
        } else {
            builder.append("Use watched_movies as the exclusion list and strongest taste signal.");
        }
        return builder.toString();
    }

    private String markdown(
            TasteProfileResponse tasteProfile,
            List<AlreadyWatchedRecommendationResponse> alreadyWatched,
            List<WatchlistRecommendationResponse> watchlist,
            boolean includePrivateNotes) {
        StringBuilder builder = new StringBuilder();
        builder.append("# Cinelog Recommendation Export\n\n");
        builder.append("## Instructions\n\n")
                .append("Copy the `prompt` field for the full Cinema Taste Analyst prompt.")
                .append("\n\n");
        appendMovieSignals(builder, "Top Personal Favorites", tasteProfile.topPersonal());
        appendMovieSignals(builder, "Top Impact / Enjoyment", tasteProfile.topImpactEnjoyment());
        appendMovieSignals(builder, "Top Technical", tasteProfile.topTechnical());
        appendSignals(builder, "Favorite Directors", tasteProfile.favoriteDirectors());
        appendSignals(builder, "Favorite Genres", tasteProfile.favoriteGenres());
        builder.append("## Already Watched\n\n");
        if (alreadyWatched.isEmpty()) {
            builder.append("No watched movies yet.\n\n");
        } else {
            alreadyWatched.forEach(movie -> {
                builder.append("- ").append(titleLine(movie.title(), movie.releaseYear(), movie.directors()));
                if (!movie.genres().isEmpty()) {
                    builder.append(" - genres: ").append(String.join(", ", movie.genres()));
                }
                if (movie.displayScore() != null) {
                    builder.append(" - display score ").append(movie.displayScore());
                }
                if (movie.reviewSummary() != null && !movie.reviewSummary().isBlank()) {
                    builder.append(" - review: ").append(movie.reviewSummary().trim());
                }
                if (includePrivateNotes && movie.privateNotes() != null && !movie.privateNotes().isBlank()) {
                    builder.append(" - private notes: ").append(movie.privateNotes().trim());
                }
                builder.append("\n");
            });
            builder.append("\n");
        }
        builder.append("## Watchlist\n\n");
        if (watchlist.isEmpty()) {
            builder.append("No watchlist items provided.\n");
        } else {
            watchlist.forEach(item -> builder.append("- ")
                    .append(titleLine(item.title(), item.releaseYear(), item.directors()))
                    .append(item.genres().isEmpty() ? "" : " - genres: " + String.join(", ", item.genres()))
                    .append("\n"));
        }
        return builder.toString();
    }

    private void appendMovieSignals(
            StringBuilder builder,
            String title,
            List<RecommendationMovieSignalResponse> movies) {
        builder.append("## ").append(title).append("\n\n");
        if (movies.isEmpty()) {
            builder.append("No rated movies yet.\n\n");
            return;
        }
        movies.forEach(movie -> builder.append("- ")
                .append(titleLine(movie.title(), movie.releaseYear(), movie.directors()))
                .append(" - score ").append(movie.score())
                .append(movie.genres().isEmpty() ? "" : " - genres: " + String.join(", ", movie.genres()))
                .append("\n"));
        builder.append("\n");
    }

    private void appendSignals(StringBuilder builder, String title, List<String> signals) {
        builder.append("## ").append(title).append("\n\n");
        if (signals.isEmpty()) {
            builder.append("No signals yet.\n\n");
            return;
        }
        signals.forEach(signal -> builder.append("- ").append(signal).append("\n"));
        builder.append("\n");
    }

    private void appendViewingSignals(
            StringBuilder builder,
            List<AlreadyWatchedRecommendationResponse> alreadyWatched,
            List<WatchlistRecommendationResponse> watchlist,
            boolean includeWatchlist) {
        long ratedCount = alreadyWatched.stream().filter(movie -> movie.displayScore() != null).count();
        builder.append("  <viewing_signals>\n");
        builder.append("    watched_movie_count: ").append(alreadyWatched.size()).append("\n");
        builder.append("    rated_movie_count: ").append(ratedCount).append("\n");
        builder.append("    watchlist_included: ").append(includeWatchlist).append("\n");
        builder.append("    watchlist_count: ").append(includeWatchlist ? watchlist.size() : 0).append("\n");
        if (alreadyWatched.isEmpty()) {
            builder.append("    data_quality: limited; no watched movies are available yet\n");
        }
        builder.append("  </viewing_signals>\n\n");
    }

    private void appendWatchedMovies(
            StringBuilder builder,
            List<AlreadyWatchedRecommendationResponse> alreadyWatched,
            boolean includePrivateNotes) {
        builder.append("  <watched_movies>\n");
        if (alreadyWatched.isEmpty()) {
            builder.append("    No watched movies are available yet. Data is limited.\n");
        } else {
            for (AlreadyWatchedRecommendationResponse movie : alreadyWatched) {
                builder.append("    <movie>\n");
                builder.append("      title: ").append(escape(movie.title())).append("\n");
                builder.append("      release_year: ").append(value(movie.releaseYear())).append("\n");
                builder.append("      directors: ").append(readableList(movie.directors())).append("\n");
                builder.append("      genres: ").append(readableList(movie.genres())).append("\n");
                builder.append("      display_score: ").append(value(movie.displayScore())).append("\n");
                if (movie.reviewSummary() != null && !movie.reviewSummary().isBlank()) {
                    builder.append("      review_summary: ").append(escape(movie.reviewSummary().trim())).append("\n");
                }
                if (includePrivateNotes && movie.privateNotes() != null && !movie.privateNotes().isBlank()) {
                    builder.append("      private_notes: ").append(escape(movie.privateNotes().trim())).append("\n");
                }
                builder.append("    </movie>\n");
            }
        }
        builder.append("  </watched_movies>\n\n");
    }

    private void appendWatchlist(
            StringBuilder builder,
            List<WatchlistRecommendationResponse> watchlist,
            boolean includeWatchlist) {
        if (!includeWatchlist) {
            return;
        }
        builder.append("  <watchlist>\n");
        if (watchlist.isEmpty()) {
            builder.append("    No watchlist items are available.\n");
        } else {
            for (WatchlistRecommendationResponse item : watchlist) {
                builder.append("    <item>\n");
                builder.append("      title: ").append(escape(item.title())).append("\n");
                builder.append("      release_year: ").append(value(item.releaseYear())).append("\n");
                builder.append("      directors: ").append(readableList(item.directors())).append("\n");
                builder.append("      genres: ").append(readableList(item.genres())).append("\n");
                builder.append("    </item>\n");
            }
        }
        builder.append("  </watchlist>\n\n");
    }

    private void appendTasteProfile(StringBuilder builder, TasteProfileResponse tasteProfile) {
        builder.append("  <taste_profile>\n");
        appendPromptMovieSignals(builder, "top_personal", tasteProfile.topPersonal());
        appendPromptMovieSignals(builder, "top_impact_enjoyment", tasteProfile.topImpactEnjoyment());
        appendPromptMovieSignals(builder, "top_technical", tasteProfile.topTechnical());
        appendPromptSignals(builder, "favorite_directors", tasteProfile.favoriteDirectors());
        appendPromptSignals(builder, "favorite_genres", tasteProfile.favoriteGenres());
        builder.append("  </taste_profile>\n");
    }

    private void appendPromptMovieSignals(
            StringBuilder builder,
            String tag,
            List<RecommendationMovieSignalResponse> movies) {
        builder.append("    <").append(tag).append(">\n");
        if (movies.isEmpty()) {
            builder.append("      none\n");
        } else {
            for (RecommendationMovieSignalResponse movie : movies) {
                builder.append("      - ")
                        .append(escape(movie.title()))
                        .append(" (").append(value(movie.releaseYear())).append(")")
                        .append("; directors: ").append(readableList(movie.directors()))
                        .append("; genres: ").append(readableList(movie.genres()))
                        .append("; score: ").append(value(movie.score()))
                        .append("\n");
            }
        }
        builder.append("    </").append(tag).append(">\n");
    }

    private void appendPromptSignals(StringBuilder builder, String tag, List<String> signals) {
        builder.append("    <").append(tag).append(">\n");
        if (signals.isEmpty()) {
            builder.append("      none\n");
        } else {
            for (String signal : signals) {
                builder.append("      - ").append(escape(signal)).append("\n");
            }
        }
        builder.append("    </").append(tag).append(">\n");
    }

    private String titleLine(String title, Integer releaseYear, List<String> directors) {
        String year = releaseYear == null ? "year unknown" : releaseYear.toString();
        String directorText = directors.isEmpty() ? "director unknown" : String.join(", ", directors);
        return title + " (" + year + "), " + directorText;
    }

    private String readableList(List<String> values) {
        if (values == null || values.isEmpty()) {
            return "none";
        }
        return values.stream().map(this::escape).toList().toString();
    }

    private String value(Object value) {
        return value == null ? "unknown" : escape(value.toString());
    }

    private String escape(String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }

    private void validateFormat(String format) {
        if (format != null && !format.equalsIgnoreCase("json") && !format.equalsIgnoreCase("markdown")) {
            throw new IllegalArgumentException("format must be json or markdown");
        }
    }

    private int bounded(Integer requested, int defaultValue, int max, String name) {
        int value = requested == null ? defaultValue : requested;
        if (value < 1 || value > max) {
            throw new IllegalArgumentException(name + " must be between 1 and " + max);
        }
        return value;
    }

    private static final class SignalAggregate {
        private final String name;
        private long count;
        private BigDecimal total = BigDecimal.ZERO;

        private SignalAggregate(String name) {
            this.name = name;
        }

        private void add(BigDecimal score) {
            count++;
            total = total.add(score);
        }

        private String name() {
            return name;
        }

        private long count() {
            return count;
        }

        private BigDecimal averagePersonalScore() {
            return total.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP);
        }
    }
}
