/**
 * Movie, rankings, and dashboard endpoints.
 *
 * Covers: GET /api/dashboard, /api/movies, /api/movies/{id}, /api/rankings,
 *         GET /api/external/movies/search, POST /api/movies/import.
 */

import { apiGet, apiDelete } from './client';
import type { Movie, MovieDetail, ExternalMovieResult } from '../types/movie';

/* ── External search ─────────────────────────────────────────────────────── */

export async function searchExternalMovies(query: string): Promise<ExternalMovieResult[]> {
  return apiGet<ExternalMovieResult[]>(`/external/movies/search?query=${encodeURIComponent(query)}`);
}

/* ── Movie list / detail ─────────────────────────────────────────────────── */

export type MovieSortParam =
  | 'TITLE' | 'YEAR' | 'LATEST_WATCHED' | 'PERSONAL_SCORE'
  | 'TECHNICAL_SCORE' | 'OBJECTIVE_SCORE'
  | 'STORY' | 'DIRECTION' | 'PERFORMANCES' | 'PACING'
  | 'VISUALS' | 'MUSIC' | 'THEMES' | 'ORIGINALITY' | 'IMPACT';

export interface MovieListParams {
  query?: string;
  sort?: MovieSortParam;
  genre?: string;
  year?: number;
  watchLocation?: 'HOME' | 'CINEMA';
  ratedOnly?: boolean;
  page?: number;
  size?: number;
}

export async function getMovies(params?: MovieListParams): Promise<Movie[]> {
  const p = new URLSearchParams();
  if (params?.query) p.set('query', params.query);
  if (params?.sort) p.set('sort', params.sort);
  if (params?.genre) p.set('genre', params.genre);
  if (params?.year != null) p.set('year', String(params.year));
  if (params?.watchLocation) p.set('watchLocation', params.watchLocation);
  if (params?.ratedOnly != null) p.set('ratedOnly', String(params.ratedOnly));
  if (params?.page != null) p.set('page', String(params.page));
  if (params?.size != null) p.set('size', String(params.size));
  const qs = p.toString();
  return apiGet<Movie[]>(`/movies${qs ? `?${qs}` : ''}`);
}

export async function getMovieDetail(id: number): Promise<MovieDetail> {
  return apiGet<MovieDetail>(`/movies/${id}`);
}

/** DELETE /api/movies/{id} — removes the movie, its watch entries, and ratings. */
export async function deleteMovie(id: number): Promise<void> {
  return apiDelete(`/movies/${id}`);
}

/* ── Rankings ────────────────────────────────────────────────────────────── */

export type RankingModeParam =
  | 'PERSONAL' | 'TECHNICAL' | 'OBJECTIVE'
  | 'STORY' | 'DIRECTION' | 'PERFORMANCES' | 'PACING'
  | 'VISUALS' | 'MUSIC' | 'THEMES' | 'ORIGINALITY' | 'IMPACT';

/** Maps frontend ranking mode IDs to backend RankingModeParam values. */
export const RANKING_MODE_MAP: Record<string, RankingModeParam> = {
  personal:     'PERSONAL',
  technical:    'TECHNICAL',
  objective:    'OBJECTIVE',
  story:        'STORY',
  direction:    'DIRECTION',
  performances: 'PERFORMANCES',
  pacing:       'PACING',
  visuals:      'VISUALS',
  music:        'MUSIC',
  themes:       'THEMES',
  originality:  'ORIGINALITY',
  impact:       'IMPACT',
};

export interface RankingItem {
  rank: number;
  movieId: number;
  title: string;
  releaseYear: number;
  directors: string[];
  posterUrl: string | null;
  genres: string[];
  score: number;
  scoreLabel: string;
  technicalScore: number;
  objectiveScore: number;
  personalFinalScore: number;
  latestWatchedAt: string | null;
}

export async function getRankings(mode: RankingModeParam, limit?: number): Promise<RankingItem[]> {
  const params = new URLSearchParams({ mode });
  if (limit) params.set('limit', String(limit));
  return apiGet<RankingItem[]>(`/rankings?${params}`);
}

/* ── Dashboard ───────────────────────────────────────────────────────────── */

export interface DashboardStats {
  totalMovies: number;
  totalWatchEntries: number;
  totalRewatches: number;
  averageTechnicalScore: number | null;
  averagePersonalScore: number | null;
}

export interface DashboardLatestWatch {
  watchEntryId: number;
  movieId: number;
  title: string;
  posterUrl: string | null;
  watchedAt: string;
  watchType: 'FIRST_WATCH' | 'REWATCH';
  watchLocation: 'HOME' | 'CINEMA';
  /** Backend-calculated active rating. Null if this watch entry has no rating. */
  activeRating: import('../types/rating').ActiveRating | null;
}

export interface DashboardRecentItem {
  movieId: number;
  title: string;
  releaseYear: number;
  directors: string[];
  posterUrl: string | null;
  genres: string[];
  createdAt: string;
  /** Backend-calculated active rating. Null when movie is unrated. */
  activeRating: import('../types/rating').ActiveRating | null;
}

export interface DashboardResponse {
  stats: DashboardStats;
  latestWatch: DashboardLatestWatch | null;
  topPersonal: RankingItem[];
  topTechnical: RankingItem[];
  recentlyAdded: DashboardRecentItem[];
}

export async function getDashboard(): Promise<DashboardResponse> {
  return apiGet<DashboardResponse>('/dashboard');
}
