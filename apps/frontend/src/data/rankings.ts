import type { RankingMode } from '../types/ranking';

export const RANKING_MODES: RankingMode[] = [
  { id: 'personal',     label: 'Personal Favorites', tag: 'What I love most',          source: 'personal' },
  { id: 'technical',    label: 'Technical Best',      tag: 'Weighted craft average',    source: 'technical' },
  { id: 'objective',    label: 'Objective Best',      tag: 'Detached assessment',       source: 'objective' },
  { id: 'story',        label: 'Best Story',          tag: 'Screenplay & structure',    source: 'story' },
  { id: 'direction',    label: 'Best Direction',      tag: 'Authorship & control',      source: 'direction' },
  { id: 'performances', label: 'Best Performances',   tag: 'Acting & characters',       source: 'performances' },
  { id: 'pacing',       label: 'Best Pacing',         tag: 'Rhythm & editing',          source: 'pacing' },
  { id: 'visuals',      label: 'Best Visuals',        tag: 'Image & art direction',     source: 'visuals' },
  { id: 'music',        label: 'Best Sound',          tag: 'Music & soundscape',        source: 'music' },
  { id: 'themes',       label: 'Deepest',             tag: 'Themes & resonance',        source: 'themes' },
  { id: 'originality',  label: 'Most Original',       tag: 'Concept & freshness',       source: 'originality' },
  { id: 'impact',       label: 'Highest Impact',      tag: 'Personal resonance',        source: 'impact' },
];
