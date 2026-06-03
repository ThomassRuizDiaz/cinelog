import { MOCK_MOVIES } from './mockMovies';
import { technical } from '../lib/scoring';

/* Matches GET /api/dashboard response shape */
export interface DashboardStats {
  totalMovies: number;
  totalWatchEntries: number;
  totalRewatches: number;
  averageTechnicalScore: number;
  averagePersonalScore: number;
}

const films = MOCK_MOVIES.length;
const allWatches = MOCK_MOVIES.flatMap(m => m.watches);

const MOCK_DASHBOARD_STATS: DashboardStats = {
  totalMovies: films,
  totalWatchEntries: allWatches.length,
  totalRewatches: MOCK_MOVIES.flatMap(m => m.watches.filter(w => w.watchType === 'REWATCH')).length,
  averageTechnicalScore: MOCK_MOVIES.reduce((s, m) => s + technical(m.scores), 0) / films,
  averagePersonalScore: MOCK_MOVIES.reduce((s, m) => s + m.personal, 0) / films,
};

export { MOCK_DASHBOARD_STATS };
