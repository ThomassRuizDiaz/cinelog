/**
 * Adapts real API response types to MockMovie for backward-compatible rendering.
 *
 * Score semantics:
 *   personal       = activeRating.displayScore — the backend's definitive visible score.
 *                    Do NOT use personalFinalScore as the default display score;
 *                    personalFinalScore is an optional user override, not the card score.
 *   objective      = activeRating.objectiveScore
 *   technicalScore = activeRating.technicalScore (takes priority over technical(scores) in UI)
 *   rated          = activeRating !== null
 *   posterUrl      = real TMDb poster URL; shown by MoviePoster when present
 *   scores         = ZERO_SCORES for list responses; populated via adaptRatingScores() for detail views
 *   poster         = deterministic gradient palette (always present as fallback)
 */

import type { Movie, MovieDetail, MockMovie } from '../types/movie';
import type { MockWatchEntry } from '../types/watch';
import type { RatingScores, RatingResponse } from '../types/rating';
import type { RankingItem, DashboardLatestWatch, DashboardRecentItem } from '../api/movies';
import { derivePalette } from './posterPalette';

const BACKEND_KEY_TO_FRONTEND: Record<string, string> = {
  storyScreenplay:         'story',
  direction:               'direction',
  performancesCharacters:  'performances',
  pacingEditing:           'pacing',
  visualsArtDesign:        'visuals',
  musicSound:              'music',
  themesDepth:             'themes',
  originalityConcept:      'originality',
  personalImpactEnjoyment: 'impact',
};

/** Convert backend-named category notes to frontend ScoreKey names. */
export function adaptCategoryNotes(notes: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(notes)) {
    if (v.trim()) out[BACKEND_KEY_TO_FRONTEND[k] ?? k] = v;
  }
  return out;
}

/** Convert backend RatingResponse category fields to frontend RatingScores. */
export function adaptRatingScores(r: RatingResponse): RatingScores {
  return {
    story:        r.storyScreenplay,
    direction:    r.direction,
    performances: r.performancesCharacters,
    pacing:       r.pacingEditing,
    visuals:      r.visualsArtDesign,
    music:        r.musicSound,
    themes:       r.themesDepth,
    originality:  r.originalityConcept,
    impact:       r.personalImpactEnjoyment,
  };
}

export const ZERO_SCORES: RatingScores = {
  story: 0, direction: 0, performances: 0, pacing: 0,
  visuals: 0, music: 0, themes: 0, originality: 0, impact: 0,
};

function synthWatches(latestWatchedAt: string | null, watchCount: number): MockWatchEntry[] {
  if (!latestWatchedAt) return [];
  const n = Math.max(1, watchCount);
  return Array.from({ length: n }, (_, i) => ({
    watchedAt: latestWatchedAt,
    watchType: i === 0 ? 'FIRST_WATCH' as const : 'REWATCH' as const,
    watchLocation: 'HOME' as const,
    scored: false,
    note: '',
  }));
}

/** Adapt GET /api/movies list item to MockMovie. */
export function adaptMovie(m: Movie): MockMovie {
  return {
    id: String(m.id),
    title: m.title,
    originalTitle: m.originalTitle ?? undefined,
    year: m.releaseYear,
    director: m.directors[0] ?? 'Unknown',
    directors: m.directors,
    genres: m.genres,
    runtime: 0,
    poster: derivePalette(m.title, m.releaseYear),
    posterUrl: m.posterUrl,
    rated: m.activeRating !== null,
    scores: ZERO_SCORES,
    /* Use displayScore as the card score — personalFinalScore is an optional user override, never the default. */
    personal: m.activeRating?.displayScore ?? 0,
    objective: m.activeRating?.objectiveScore ?? 0,
    technicalScore: m.activeRating?.technicalScore ?? 0,
    review: '',
    note: '',
    watches: synthWatches(m.latestWatchedAt, m.watchCount),
  };
}

/** Adapt GET /api/movies/{id} detail to MockMovie. Merges real watch history. */
export function adaptMovieDetail(m: MovieDetail): MockMovie {
  const realWatches: MockWatchEntry[] = m.watchEntries.map(we => ({
    watchedAt: we.watchedAt,
    watchType: we.watchType,
    watchLocation: we.watchLocation,
    scored: we.rating !== null,
    note: we.notes ?? '',
    watchEntryId: we.id,
  }));
  return {
    id: String(m.id),
    title: m.title,
    originalTitle: m.originalTitle ?? undefined,
    year: m.releaseYear,
    director: m.directors[0] ?? 'Unknown',
    directors: m.directors,
    genres: m.genres,
    runtime: 0,
    poster: derivePalette(m.title, m.releaseYear),
    posterUrl: m.posterUrl,
    rated: m.activeRating !== null,
    scores: ZERO_SCORES,
    personal: m.activeRating?.displayScore ?? 0,
    objective: m.activeRating?.objectiveScore ?? 0,
    technicalScore: m.activeRating?.technicalScore ?? 0,
    review: m.review ?? '',
    note: m.privateNote ?? '',
    watches: realWatches.length > 0
      ? realWatches
      : synthWatches(m.latestWatchedAt, m.watchCount),
  };
}

/** Adapt GET /api/rankings item to MockMovie. Rankings only contain rated movies.
 *  Uses r.score (mode-specific ranking score) — not personalFinalScore which can be 0 when unset. */
export function adaptRankingItem(r: RankingItem): MockMovie {
  return {
    id: String(r.movieId),
    title: r.title,
    year: r.releaseYear,
    director: r.directors[0] ?? 'Unknown',
    directors: r.directors,
    genres: r.genres,
    runtime: 0,
    poster: derivePalette(r.title, r.releaseYear),
    posterUrl: r.posterUrl,
    rated: true,
    scores: ZERO_SCORES,
    personal: r.score,       /* mode-specific ranking score — always > 0 for ranked movies */
    objective: r.objectiveScore ?? 0,
    technicalScore: r.technicalScore ?? 0,
    review: '',
    note: '',
    watches: r.latestWatchedAt
      ? [{ watchedAt: r.latestWatchedAt, watchType: 'FIRST_WATCH', watchLocation: 'HOME', scored: true, note: '' }]
      : [],
  };
}

/** Adapt dashboard latestWatch to MockMovie.
 *  Uses lw.activeRating directly — no cross-reference with ranking lists needed. */
export function adaptDashboardLatestWatch(lw: DashboardLatestWatch): MockMovie {
  return {
    id: String(lw.movieId),
    title: lw.title,
    year: 0,  /* not in latestWatch — DetailScreen fetches full detail via GET /api/movies/{id} */
    director: 'Unknown',
    genres: [],
    runtime: 0,
    poster: derivePalette(lw.title, 0),
    posterUrl: lw.posterUrl,
    rated: lw.activeRating !== null,
    scores: ZERO_SCORES,
    personal: lw.activeRating?.displayScore ?? 0,
    objective: lw.activeRating?.objectiveScore ?? 0,
    technicalScore: lw.activeRating?.technicalScore ?? 0,
    review: '',
    note: '',
    watches: [{
      watchedAt: lw.watchedAt,
      watchType: lw.watchType,
      watchLocation: lw.watchLocation,
      scored: lw.activeRating !== null,
      note: '',
    }],
  };
}

/** Adapt dashboard recentlyAdded item to MockMovie.
 *  Uses item.activeRating directly — no cross-reference with ranking lists. */
export function adaptRecentItem(r: DashboardRecentItem): MockMovie {
  return {
    id: String(r.movieId),
    title: r.title,
    year: r.releaseYear,
    director: r.directors[0] ?? 'Unknown',
    directors: r.directors,
    genres: r.genres,
    runtime: 0,
    poster: derivePalette(r.title, r.releaseYear),
    posterUrl: r.posterUrl,
    rated: r.activeRating !== null,
    scores: ZERO_SCORES,
    personal: r.activeRating?.displayScore ?? 0,
    objective: r.activeRating?.objectiveScore ?? 0,
    technicalScore: r.activeRating?.technicalScore ?? 0,
    review: '',
    note: '',
    watches: [],
  };
}
