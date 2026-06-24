/* The 9 scoring category keys used throughout the frontend */
export type ScoreKey =
  | 'story'
  | 'direction'
  | 'performances'
  | 'pacing'
  | 'visuals'
  | 'music'
  | 'themes'
  | 'originality'
  | 'impact';

/* All 9 category scores (0–10 in 0.25 increments) */
export type RatingScores = Record<ScoreKey, number>;

/* Category definition from CL_CATEGORIES */
export interface RatingCategory {
  key: ScoreKey;
  label: string;
  short: string;
  weight: number;
  desc: string;
  /** Category glyph (see Icon component). */
  icon: import('../components/Icon').IconName;
  /** Subtle per-category accent. Used at low intensity — amber stays dominant. */
  color: string;
}

/* Backend rating response (GET/PUT /api/watch-entries/{id}/rating) */
export interface RatingResponse {
  id: number;
  watchEntryId: number;
  /* Individual category scores — always returned by backend */
  storyScreenplay: number;
  direction: number;
  performancesCharacters: number;
  pacingEditing: number;
  visualsArtDesign: number;
  musicSound: number;
  themesDepth: number;
  originalityConcept: number;
  personalImpactEnjoyment: number;
  technicalScore: number;
  objectiveScore: number;
  displayScore: number;
  personalFinalScore: number | null;
  personalRankingScore: number;
  reviewSummary?: string | null;
  privateNotes?: string | null;
  categoryNotes?: Record<string, string>;
}

/* Pre-populated edit data passed from DetailScreen → App → RatingScreen */
export interface InitialRatingData {
  categoryNotes?: Record<string, string>; /* frontend ScoreKey names */
}

/*
 * Shape for PUT /api/watch-entries/{id}/rating.
 * Backend field names differ from frontend ScoreKey — mapped at the API layer.
 */
export interface SaveRatingRequest {
  storyScreenplay: number;
  direction: number;
  performancesCharacters: number;
  pacingEditing: number;
  visualsArtDesign: number;
  musicSound: number;
  themesDepth: number;
  originalityConcept: number;
  personalImpactEnjoyment: number;
  personalFinalScore?: number;
  reviewSummary?: string;
  privateNotes?: string;
  categoryNotes?: Partial<Record<string, string>>;
}

/* Active rating shown on movie cards */
export interface ActiveRating {
  technicalScore: number;
  objectiveScore: number;
  displayScore: number;
  personalFinalScore: number | null;
  personalRankingScore: number;
}
