package com.cinelog.external.tmdb;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

class TmdbCastImportServiceTests {

    private final TmdbClient tmdbClient = Mockito.mock(TmdbClient.class);
    private final TmdbCastImportService service = new TmdbCastImportService(tmdbClient);

    @Test
    void importsTopFiveCastMembersByTmdbOrder() {
        when(tmdbClient.getMovie(1124L)).thenReturn(metadata(List.of(
                cast(105L, "Sixth", "Sixth Role", 5),
                cast(101L, "First", "First Role", 0),
                cast(103L, "Third", "Third Role", 2),
                cast(102L, "Second", "Second Role", 1),
                cast(104L, "Fourth", "Fourth Role", 3),
                cast(106L, "Fifth", "Fifth Role", 4))));

        List<TmdbCastImport> cast = service.topCast(1124L);

        assertThat(cast).hasSize(5);
        assertThat(cast).extracting(TmdbCastImport::name)
                .containsExactly("First", "Second", "Third", "Fourth", "Fifth");
        assertThat(cast.getFirst().tmdbId()).isEqualTo(101L);
        assertThat(cast.getFirst().characterName()).isEqualTo("First Role");
        assertThat(cast.getFirst().castOrder()).isZero();
    }

    @Test
    void handlesMissingEmptyOrInvalidCreditsGracefully() {
        when(tmdbClient.getMovie(1L)).thenReturn(new TmdbMovieMetadata(null, null));
        when(tmdbClient.getMovie(2L)).thenReturn(metadata(List.of()));
        when(tmdbClient.getMovie(3L)).thenReturn(metadata(List.of(cast(1L, " ", "Role", 0))));
        when(tmdbClient.getMovie(4L)).thenThrow(new TmdbUpstreamException("unavailable"));

        assertThat(service.topCast(1L)).isEmpty();
        assertThat(service.topCast(2L)).isEmpty();
        assertThat(service.topCast(3L)).isEmpty();
        assertThat(service.topCast(4L)).isEmpty();
    }

    private TmdbMovieMetadata metadata(List<TmdbCastMember> cast) {
        return new TmdbMovieMetadata(null, new TmdbCreditsResponse(List.of(), cast));
    }

    private TmdbCastMember cast(Long id, String name, String character, Integer order) {
        return new TmdbCastMember(id, name, character, order);
    }
}
