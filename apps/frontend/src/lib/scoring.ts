import { CATEGORIES } from '../data/categories';
import type { RatingScores, ScoreKey } from '../types/rating';
import type { MockMovie } from '../types/movie';

export function technical(scores: RatingScores): number {
  let sum = 0;
  let totalWeight = 0;
  for (const c of CATEGORIES) {
    sum += (scores[c.key] ?? 0) * c.weight;
    totalWeight += c.weight;
  }
  return sum / totalWeight;
}

export function roundHalf(v: number): number {
  return Math.round(v * 2) / 2;
}

/**
 * Round to the nearest 0.25 — mirrors the backend's authoritative
 * `displayScore = round(technicalScore / 0.25) * 0.25`. Use this for any
 * calculated-score preview so the frontend never shows a value the backend
 * would round differently (e.g. 9.13 → 9.25, not 9.0).
 */
export function roundQuarter(v: number): number {
  return Math.round(v * 4) / 4;
}

export function visible(scores: RatingScores): number {
  return roundQuarter(technical(scores));
}

export function rankValue(movie: MockMovie, source: string): number {
  if (source === 'personal') return movie.personal;
  if (source === 'technical') return technical(movie.scores);
  if (source === 'objective') return movie.objective;
  const key = source as ScoreKey;
  return movie.scores[key] ?? 0;
}

export function fmt(v: number): string {
  return (Math.round(v * 100) / 100).toFixed(2);
}

export function fmt1(v: number): string {
  return (Math.round(v * 10) / 10).toFixed(1);
}

/** Format a 0–10 score preserving 0.25-precision: 7.0 → "7.0", 7.5 → "7.5", 7.25 → "7.25". */
export function fmtScore(v: number): string {
  const r = Math.round(v * 4) / 4;
  return (Math.round(r * 100) % 50) === 0 ? r.toFixed(1) : r.toFixed(2);
}

export function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00');
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

/*
 * Maps frontend ScoreKey names to backend API field names.
 * Used when building SaveRatingRequest.
 */
export const SCORE_KEY_TO_API_FIELD: Record<ScoreKey, string> = {
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
