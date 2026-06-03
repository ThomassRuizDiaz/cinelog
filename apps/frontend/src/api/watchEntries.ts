/**
 * Watch entry and rating endpoints.
 *
 * POST/PUT mutations auto-fetch CSRF via client.ts ensureCsrfToken().
 */

import { apiGet, apiPost, apiPut } from './client';
import type { ExternalMovieResult, MovieDetail } from '../types/movie';
import type { WatchEntry, CreateWatchEntryRequest } from '../types/watch';
import type { RatingScores, SaveRatingRequest, RatingResponse } from '../types/rating';

/* ── Movie import ──────────────────────────────────────────────────────────── */

/**
 * POST /api/movies/import
 * Sends the normalized ExternalMovieResult directly — no re-fetching from TMDb.
 * Throws ApiError with isConflict() === true on duplicate tmdbId (409).
 */
export async function importMovie(payload: ExternalMovieResult): Promise<MovieDetail> {
  return apiPost<MovieDetail>('/movies/import', payload);
}

/* ── Watch entries ─────────────────────────────────────────────────────────── */

/**
 * POST /api/movies/{movieId}/watch-entries
 * watchedAt, watchType and watchLocation are required.
 */
export async function createWatchEntry(
  movieId: number,
  payload: CreateWatchEntryRequest,
): Promise<WatchEntry> {
  return apiPost<WatchEntry>(`/movies/${movieId}/watch-entries`, payload);
}

/* ── Ratings ───────────────────────────────────────────────────────────────── */

/**
 * GET /api/watch-entries/{watchEntryId}/rating
 * Returns the stored rating with all 9 category scores, or throws ApiError 404 when unrated.
 */
export async function getRating(watchEntryId: number): Promise<RatingResponse> {
  return apiGet<RatingResponse>(`/watch-entries/${watchEntryId}/rating`);
}

/**
 * Frontend ScoreKey → backend SaveRatingRequest field names.
 * The backend uses long descriptive field names; the frontend uses short keys.
 */
const SCORE_KEY_MAP: Record<keyof RatingScores, string> = {
  story:        'storyScreenplay',
  direction:    'direction',
  performances: 'performancesCharacters',
  pacing:       'pacingEditing',
  visuals:      'visualsArtDesign',
  music:        'musicSound',
  themes:       'themesDepth',
  originality:  'originalityConcept',
  impact:       'personalImpactEnjoyment',
};

/**
 * Map frontend RatingScores + options to SaveRatingRequest.
 * categoryNotes keys are mapped from frontend short names to backend long names.
 */
export function buildSaveRatingRequest(
  scores: RatingScores,
  opts?: {
    personalFinalScore?: number;
    categoryNotes?: Record<string, string>;
  },
): SaveRatingRequest {
  const req: SaveRatingRequest = {
    storyScreenplay:          scores.story,
    direction:                scores.direction,
    performancesCharacters:   scores.performances,
    pacingEditing:            scores.pacing,
    visualsArtDesign:         scores.visuals,
    musicSound:               scores.music,
    themesDepth:              scores.themes,
    originalityConcept:       scores.originality,
    personalImpactEnjoyment:  scores.impact,
  };

  if (opts?.personalFinalScore != null) {
    req.personalFinalScore = opts.personalFinalScore;
  }

  if (opts?.categoryNotes) {
    const mapped: Record<string, string> = {};
    for (const [k, v] of Object.entries(opts.categoryNotes)) {
      if (!v.trim()) continue;
      mapped[SCORE_KEY_MAP[k as keyof RatingScores] ?? k] = v;
    }
    if (Object.keys(mapped).length > 0) req.categoryNotes = mapped;
  }

  return req;
}

/**
 * PUT /api/watch-entries/{watchEntryId}/rating
 * Saves or replaces the rating for the given watch entry.
 * Backend calculates and returns all derived scores.
 */
export async function saveRating(
  watchEntryId: number,
  payload: SaveRatingRequest,
): Promise<RatingResponse> {
  return apiPut<RatingResponse>(`/watch-entries/${watchEntryId}/rating`, payload);
}
