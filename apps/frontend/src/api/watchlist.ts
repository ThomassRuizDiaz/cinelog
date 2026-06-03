/**
 * Watchlist and recommendations-export endpoints — Cinelog v2.
 *
 * GET requests: credentials include, no CSRF.
 * POST/PUT/DELETE: CSRF auto-fetched by apiFetch in client.ts.
 *
 * 409 on POST /api/watchlist:
 *   - duplicate watchlist tmdbId  → err.isConflict, err.message contains "watchlist"
 *   - already in archive          → err.isConflict, err.message contains "archive"
 */

import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type {
  WatchlistItem,
  AddToWatchlistRequest,
  UpdateWatchlistItemRequest,
  ConvertWatchlistItemRequest,
  ConvertWatchlistItemResponse,
  WatchlistListParams,
  RecommendationsExportParams,
  RecommendationsExportResponse,
} from '../types/watchlist';

/* ── List ────────────────────────────────────────────────────────────────── */

export async function getWatchlist(params?: WatchlistListParams): Promise<WatchlistItem[]> {
  const p = new URLSearchParams();
  if (params?.query)  p.set('query', params.query);
  if (params?.genre)  p.set('genre', params.genre);
  if (params?.year != null)  p.set('year', String(params.year));
  if (params?.page != null)  p.set('page', String(params.page));
  if (params?.size != null)  p.set('size', String(params.size));
  if (params?.sort)   p.set('sort', params.sort);
  const qs = p.toString();
  return apiGet<WatchlistItem[]>(`/watchlist${qs ? `?${qs}` : ''}`);
}

/* ── Item CRUD ───────────────────────────────────────────────────────────── */

export async function addToWatchlist(payload: AddToWatchlistRequest): Promise<WatchlistItem> {
  return apiPost<WatchlistItem>('/watchlist', payload);
}

export async function getWatchlistItem(id: number): Promise<WatchlistItem> {
  return apiGet<WatchlistItem>(`/watchlist/${id}`);
}

export async function updateWatchlistItem(
  id: number,
  payload: UpdateWatchlistItemRequest,
): Promise<WatchlistItem> {
  return apiPut<WatchlistItem>(`/watchlist/${id}`, payload);
}

export async function deleteWatchlistItem(id: number): Promise<void> {
  return apiDelete(`/watchlist/${id}`);
}

/* ── Convert ─────────────────────────────────────────────────────────────── */

export async function convertWatchlistItem(
  id: number,
  payload: ConvertWatchlistItemRequest,
): Promise<ConvertWatchlistItemResponse> {
  return apiPost<ConvertWatchlistItemResponse>(`/watchlist/${id}/convert-to-watch-entry`, payload);
}

/* ── Recommendations export ──────────────────────────────────────────────── */

export async function getRecommendationsExport(
  params?: RecommendationsExportParams,
): Promise<RecommendationsExportResponse> {
  const p = new URLSearchParams();
  if (params?.includePrivateNotes != null) p.set('includePrivateNotes', String(params.includePrivateNotes));
  if (params?.includeWatchlist != null)    p.set('includeWatchlist', String(params.includeWatchlist));
  if (params?.format)                      p.set('format', params.format);
  if (params?.limitFavorites != null)      p.set('limitFavorites', String(params.limitFavorites));
  if (params?.limitWatched != null)        p.set('limitWatched', String(params.limitWatched));
  const qs = p.toString();
  return apiGet<RecommendationsExportResponse>(`/recommendations/export${qs ? `?${qs}` : ''}`);
}
