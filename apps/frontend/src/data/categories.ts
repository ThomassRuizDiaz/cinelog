import type { RatingCategory } from '../types/rating';

/*
 * Per-category icon + accent. Colors are deliberately desaturated, warm-leaning
 * tints so amber stays the dominant identity — used only for small glyphs and
 * thin accents, never large fills. Do not turn these into loud, saturated hues.
 */
export const CATEGORIES: RatingCategory[] = [
  { key: 'story',        label: 'Story / Screenplay',       short: 'Story',        weight: 18, desc: 'Plot, structure & dialogue',  icon: 'script',   color: '#e8b974' },
  { key: 'direction',    label: 'Direction',                 short: 'Direction',    weight: 13, desc: 'Vision and control of craft', icon: 'clapper',  color: '#cf9a6a' },
  { key: 'performances', label: 'Performances / Characters', short: 'Performances', weight: 12, desc: 'Acting, presence & arcs',     icon: 'masks',    color: '#cf9b8e' },
  { key: 'pacing',       label: 'Pacing / Editing',          short: 'Pacing',       weight: 10, desc: 'Rhythm and momentum',         icon: 'scissors', color: '#bfae86' },
  { key: 'visuals',      label: 'Visuals / Art Direction',   short: 'Visuals',      weight: 10, desc: 'Cinematography & design',     icon: 'eye',      color: '#9fb0cc' },
  { key: 'music',        label: 'Music / Sound',             short: 'Sound',        weight: 7,  desc: 'Score and soundscape',        icon: 'note',     color: '#b8a0c4' },
  { key: 'themes',       label: 'Themes / Depth',            short: 'Themes',       weight: 10, desc: 'Meaning and resonance',       icon: 'layers',   color: '#9fb58f' },
  { key: 'originality',  label: 'Originality / Concept',     short: 'Originality',  weight: 8,  desc: 'Freshness of the idea',       icon: 'spark',    color: '#f0c98a' },
  { key: 'impact',       label: 'Personal Impact / Joy',     short: 'Impact',       weight: 12, desc: 'How deeply it landed',        icon: 'heart',    color: '#cf7a6a' },
];

/* Weights sum to 100 — asserted in scoring.test.ts */
export const TOTAL_WEIGHT = CATEGORIES.reduce((s, c) => s + c.weight, 0);
