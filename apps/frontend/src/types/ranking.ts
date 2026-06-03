import type { ScoreKey } from './rating';

/* Ranking mode identifiers matching backend ?mode= parameter */
export type RankingModeId =
  | 'PERSONAL'
  | 'TECHNICAL'
  | 'OBJECTIVE'
  | 'STORY'
  | 'DIRECTION'
  | 'PERFORMANCES'
  | 'PACING'
  | 'VISUALS'
  | 'MUSIC'
  | 'THEMES'
  | 'ORIGINALITY'
  | 'IMPACT';

/* Frontend ranking mode descriptor */
export interface RankingMode {
  id: string;
  label: string;
  tag: string;
  /* Which score field to pull from — 'personal' | 'technical' | 'objective' | ScoreKey */
  source: 'personal' | 'technical' | 'objective' | ScoreKey;
}
