package com.cinelog.external.tmdb;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class TmdbCastImportService {

    private static final int MAX_CAST_MEMBERS = 5;

    private final TmdbClient tmdbClient;

    public TmdbCastImportService(TmdbClient tmdbClient) {
        this.tmdbClient = tmdbClient;
    }

    public List<TmdbCastImport> topCast(Long tmdbId) {
        try {
            TmdbMovieMetadata metadata = tmdbClient.getMovie(tmdbId);
            TmdbCreditsResponse credits = metadata == null ? null : metadata.credits();
            if (credits == null || credits.cast() == null) {
                return List.of();
            }
            return credits.cast().stream()
                    .filter(Objects::nonNull)
                    .filter(member -> StringUtils.hasText(member.name()))
                    .sorted(Comparator.comparing(
                                    TmdbCastMember::order,
                                    Comparator.nullsLast(Integer::compareTo))
                            .thenComparing(member -> member.name().trim(), String.CASE_INSENSITIVE_ORDER))
                    .limit(MAX_CAST_MEMBERS)
                    .map(member -> new TmdbCastImport(
                            member.id(),
                            member.name().trim(),
                            StringUtils.hasText(member.character()) ? member.character().trim() : null,
                            member.order() == null ? 0 : member.order(),
                            StringUtils.hasText(member.profilePath()) ? member.profilePath().trim() : null))
                    .toList();
        } catch (RuntimeException exception) {
            return List.of();
        }
    }
}
