/* Backend enums: WatchType, WatchLocation */
export type WatchType = 'FIRST_WATCH' | 'REWATCH';
export type WatchLocation = 'HOME' | 'CINEMA';

/* API response shape for a watch entry */
export interface WatchEntry {
  id: number;
  movieId: number;
  watchedAt: string;
  watchType: WatchType;
  watchLocation: WatchLocation;
  notes: string | null;
  /** Rating summary for this entry, or null if unrated. */
  rating: import('../types/rating').ActiveRating | null;
  /** True when this entry's rating is the current active movie rating. */
  activeRating: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/* Shape for POST /api/movies/{movieId}/watch-entries */
export interface CreateWatchEntryRequest {
  watchedAt: string;
  watchType: WatchType;
  watchLocation: WatchLocation;
  notes?: string;
}

/* Display-friendly labels used in UI */
export const WATCH_TYPE_LABELS: Record<WatchType, string> = {
  FIRST_WATCH: 'First Watch',
  REWATCH: 'Rewatch',
};

export const WATCH_LOCATION_LABELS: Record<WatchLocation, string> = {
  HOME: 'Home',
  CINEMA: 'Cinema',
};

/* Mock data shape — standalone (not API-aligned) for prototype preview */
export interface MockWatchEntry {
  watchedAt: string;
  watchType: WatchType;
  watchLocation: WatchLocation;
  scored: boolean;
  note: string;
  /** Real API watch entry ID — present for movies fetched from the backend. */
  watchEntryId?: number;
}
