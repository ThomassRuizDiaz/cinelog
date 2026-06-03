import type { RatingCategory } from '../types/rating';

export const CATEGORIES: RatingCategory[] = [
  { key: 'story',        label: 'Story / Screenplay',       short: 'Story',        weight: 18, desc: 'Plot, structure & dialogue' },
  { key: 'direction',    label: 'Direction',                 short: 'Direction',    weight: 13, desc: 'Vision and control of craft' },
  { key: 'performances', label: 'Performances / Characters', short: 'Performances', weight: 12, desc: 'Acting, presence & arcs' },
  { key: 'pacing',       label: 'Pacing / Editing',          short: 'Pacing',       weight: 10, desc: 'Rhythm and momentum' },
  { key: 'visuals',      label: 'Visuals / Art Direction',   short: 'Visuals',      weight: 10, desc: 'Cinematography & design' },
  { key: 'music',        label: 'Music / Sound',             short: 'Sound',        weight: 7,  desc: 'Score and soundscape' },
  { key: 'themes',       label: 'Themes / Depth',            short: 'Themes',       weight: 10, desc: 'Meaning and resonance' },
  { key: 'originality',  label: 'Originality / Concept',     short: 'Originality',  weight: 8,  desc: 'Freshness of the idea' },
  { key: 'impact',       label: 'Personal Impact / Joy',     short: 'Impact',       weight: 12, desc: 'How deeply it landed' },
];

/* Weights sum to 100 — asserted in scoring.test.ts */
export const TOTAL_WEIGHT = CATEGORIES.reduce((s, c) => s + c.weight, 0);
