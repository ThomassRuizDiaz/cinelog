import type { PosterPalette } from '../types/movie';

/* Deterministic gradient palettes — dark, cinematic, amber-safe. */
const PALETTES: PosterPalette[] = [
  { from: '#1a0a1e', to: '#0d1a2e', accent: '#7c3aed', ink: '#0f0a16' },
  { from: '#1e0a0a', to: '#2a1008', accent: '#c2410c', ink: '#170a08' },
  { from: '#0a1a0e', to: '#0d2618', accent: '#166534', ink: '#0a160e' },
  { from: '#0f0a1e', to: '#1a0d2e', accent: '#1d4ed8', ink: '#0a0f1a' },
  { from: '#1e1404', to: '#2a1e08', accent: '#a16207', ink: '#17110a' },
  { from: '#1e0a14', to: '#2a0d1c', accent: '#9d174d', ink: '#170a10' },
  { from: '#0a1a1e', to: '#0d2228', accent: '#0e7490', ink: '#0a1416' },
  { from: '#0e1a0a', to: '#141e0d', accent: '#365314', ink: '#0e1609' },
  { from: '#1a1600', to: '#28200a', accent: '#92400e', ink: '#161200' },
  { from: '#0a0e1e', to: '#100d2a', accent: '#312e81', ink: '#080a16' },
  { from: '#1e0e0a', to: '#2a1410', accent: '#7f1d1d', ink: '#170908' },
  { from: '#0a1614', to: '#0d2220', accent: '#134e4a', ink: '#0a1514' },
];

/** Returns a deterministic palette based on title + year. Never returns null. */
export function derivePalette(title: string, year: number): PosterPalette {
  let h = 0;
  const s = title + String(year);
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(h, 31) + s.charCodeAt(i)) >>> 0;
  }
  return PALETTES[h % PALETTES.length];
}
