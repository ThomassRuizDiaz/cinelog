import { describe, it, expect } from 'vitest';
import { technical, roundHalf, visible, fmt, fmt1 } from './scoring';
import { CATEGORIES, TOTAL_WEIGHT } from '../data/categories';
import type { RatingScores } from '../types/rating';

const perfect: RatingScores = {
  story: 5, direction: 5, performances: 5, pacing: 5, visuals: 5,
  music: 5, themes: 5, originality: 5, impact: 5,
};

const half: RatingScores = {
  story: 2.5, direction: 2.5, performances: 2.5, pacing: 2.5, visuals: 2.5,
  music: 2.5, themes: 2.5, originality: 2.5, impact: 2.5,
};

describe('categories', () => {
  it('weights sum to 100', () => {
    expect(TOTAL_WEIGHT).toBe(100);
  });
});

describe('technical()', () => {
  it('perfect scores → 5', () => {
    expect(technical(perfect)).toBe(5);
  });

  it('all 2.5 → 2.5', () => {
    expect(technical(half)).toBe(2.5);
  });

  it('matches manual weighted average for prestige scores', () => {
    const scores: RatingScores = {
      story: 5, direction: 4.5, performances: 4.5, pacing: 4.5,
      visuals: 4.5, music: 4, themes: 4.5, originality: 4.5, impact: 5,
    };
    const manual = CATEGORIES.reduce((s, c) => s + scores[c.key] * c.weight, 0) / 100;
    expect(technical(scores)).toBeCloseTo(manual, 10);
  });
});

describe('roundHalf()', () => {
  it('rounds 4.3 → 4.5', () => expect(roundHalf(4.3)).toBe(4.5));
  it('rounds 4.24 → 4.0', () => expect(roundHalf(4.24)).toBe(4.0));
  it('rounds 3.75 → 4.0', () => expect(roundHalf(3.75)).toBe(4.0));
  it('rounds 5.0 → 5.0', () => expect(roundHalf(5.0)).toBe(5.0));
  it('rounds 0.0 → 0.0', () => expect(roundHalf(0.0)).toBe(0.0));
});

describe('visible()', () => {
  it('perfect scores → 5', () => expect(visible(perfect)).toBe(5));
  it('is roundHalf of technical', () => {
    expect(visible(half)).toBe(roundHalf(technical(half)));
  });
});

describe('fmt()', () => {
  it('formats to 2 decimal places', () => {
    expect(fmt(4)).toBe('4.00');
    expect(fmt(4.5)).toBe('4.50');
    expect(fmt(4.126)).toBe('4.13');
  });
});

describe('fmt1()', () => {
  it('formats to 1 decimal place', () => {
    expect(fmt1(4)).toBe('4.0');
    expect(fmt1(4.5)).toBe('4.5');
    expect(fmt1(4.04)).toBe('4.0');
    expect(fmt1(4.05)).toBe('4.1');
  });
});
