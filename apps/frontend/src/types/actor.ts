import type { ActiveRating } from './rating';

/* Actor list item from GET /api/actors */
export interface ActorListItem {
  id: number;
  tmdbId: number;
  name: string;
  performanceCount: number;
  profilePath: string | null;
  profileUrl: string | null;
}

/* One performance (a movie the actor appears in) from GET /api/actors/{id} */
export interface ActorPerformance {
  movieId: number;
  title: string;
  releaseYear: number;
  posterUrl: string | null;
  characterName: string | null;
  castOrder: number;
  /** Backend-calculated active rating for the movie. Null when unrated. */
  activeRating: ActiveRating | null;
}

/* Full actor detail from GET /api/actors/{id} */
export interface ActorDetail {
  id: number;
  tmdbId: number;
  name: string;
  profilePath: string | null;
  profileUrl: string | null;
  performances: ActorPerformance[];
}

/* One cast member on a movie detail (GET /api/movies/{id}.cast[]) */
export interface CastMember {
  actorId: number;
  tmdbId: number;
  name: string;
  characterName: string | null;
  castOrder: number;
  profilePath: string | null;
  profileUrl: string | null;
}

/*
 * Per-movie ranking summary (GET /api/movies/{id}.rankingSummary).
 * All score fields are on the backend-owned 0–10 scale; render as-is.
 */
export interface RankingSummary {
  movieId: number;
  personalScore: number;
  scoreLabel: string;
  technicalScore: number;
  objectiveScore: number;
  displayScore: number;
  personalFinalScore: number | null;
  latestWatchedAt: string | null;
}
