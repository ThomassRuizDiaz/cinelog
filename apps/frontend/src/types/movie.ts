import type { ActiveRating, RatingScores } from './rating';
import type { MockWatchEntry, WatchEntry } from './watch';

/* Re-export for convenience */
export type { MockWatchEntry, WatchEntry };

/* Color palette for gradient poster placeholder (used when posterUrl is null) */
export interface PosterPalette {
  from: string;
  to: string;
  accent: string;
  ink: string;
}

/* Movie list item from GET /api/movies */
export interface Movie {
  id: number;
  title: string;
  originalTitle: string;
  releaseYear: number;
  directors: string[];
  posterUrl: string | null;
  genres: string[];
  runtime?: number;
  latestWatchedAt: string | null;
  watchCount: number;
  activeRating: ActiveRating | null;
}

/* Full movie detail from GET /api/movies/{id} */
export interface MovieDetail extends Movie {
  review: string | null;
  privateNote: string | null;
  watchEntries: WatchEntry[];
}

/* External search result from GET /api/external/movies/search */
export interface ExternalMovieResult {
  source: string;
  externalId: string;
  title: string;
  originalTitle: string;
  releaseYear: number;
  directors: string[];
  posterPath: string | null;
  posterUrl: string | null;
  genres: string[];
}

/*
 * Unified UI type — bridges real API responses (via movieAdapter) and the
 * rendering layer. Do NOT send this type directly to the backend API.
 */
export interface MockMovie {
  id: string;
  title: string;
  originalTitle?: string;
  year: number;
  director: string;
  directors?: string[];
  genres: string[];
  runtime: number;
  /** Gradient placeholder palette — always present as fallback. */
  poster: PosterPalette;
  /** Real TMDb poster URL from backend. Shown in MoviePoster when available. */
  posterUrl?: string | null;
  scores: RatingScores;
  personal: number;
  objective: number;
  /** Precomputed technical score from the backend. Takes priority over technical(scores) in UI. */
  technicalScore?: number;
  /** True when backend confirms an active rating exists. False = unrated. */
  rated: boolean;
  review: string;
  note: string;
  watches: MockWatchEntry[];
}
