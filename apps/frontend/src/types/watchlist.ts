/**
 * Watchlist and recommendations export types — Cinelog v2.
 * Contract: docs/backend/api-contract.md → Watchlist + Recommendations Export sections.
 */
import type { MovieDetail } from './movie';
import type { WatchEntry, WatchType, WatchLocation } from './watch';

/* ── Watchlist item response ─────────────────────────────────────────────── */

export interface WatchlistItem {
  id: number;
  source: string;
  externalId: string;
  title: string;
  originalTitle: string | null;
  releaseYear: number | null;
  directors: string[];
  posterPath: string | null;
  posterUrl: string | null;
  genres: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ── Request shapes ──────────────────────────────────────────────────────── */

export interface AddToWatchlistRequest {
  source: string;
  externalId: string;
  title: string;
  originalTitle?: string | null;
  releaseYear?: number | null;
  directors?: string[];
  posterPath?: string | null;
  posterUrl?: string | null;
  genres?: string[];
  notes?: string | null;
}

export interface UpdateWatchlistItemRequest {
  notes: string | null;
}

export interface ConvertWatchlistItemRequest {
  watchedAt: string;
  watchType: WatchType;
  watchLocation: WatchLocation;
  notes?: string | null;
}

export interface ConvertWatchlistItemResponse {
  movie: MovieDetail;
  watchEntry: WatchEntry;
}

/* ── List params ─────────────────────────────────────────────────────────── */

export type WatchlistSortParam = 'NEWEST' | 'OLDEST' | 'TITLE' | 'YEAR';

export interface WatchlistListParams {
  query?: string;
  genre?: string;
  year?: number;
  page?: number;
  size?: number;
  sort?: WatchlistSortParam;
}

/* ── Recommendations export ──────────────────────────────────────────────── */

export interface RecommendationsExportParams {
  includePrivateNotes?: boolean;
  includeWatchlist?: boolean;
  format?: 'json' | 'markdown';
  limitFavorites?: number;
  limitWatched?: number;
}

export interface TasteProfile {
  topPersonal: string[];
  topImpactEnjoyment: string[];
  topTechnical: string[];
  favoriteDirectors: string[];
  favoriteGenres: string[];
}

export interface RecommendationsExportResponse {
  prompt: string;
  markdown: string;
  generatedAt: string;
  tasteProfile: TasteProfile;
  alreadyWatched: string[];
  watchlist: string[] | null;
  privacy: {
    includePrivateNotes: boolean;
    warning: string | null;
  };
}
