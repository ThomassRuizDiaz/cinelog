import { describe, it, expect } from 'vitest';
import { technical, roundHalf, visible, fmt, fmt1, fmtScore } from './scoring';
import { CATEGORIES, TOTAL_WEIGHT } from '../data/categories';
import type { RatingScores } from '../types/rating';

const perfect: RatingScores = {
  story: 10, direction: 10, performances: 10, pacing: 10, visuals: 10,
  music: 10, themes: 10, originality: 10, impact: 10,
};

const half: RatingScores = {
  story: 5, direction: 5, performances: 5, pacing: 5, visuals: 5,
  music: 5, themes: 5, originality: 5, impact: 5,
};

describe('categories', () => {
  it('weights sum to 100', () => {
    expect(TOTAL_WEIGHT).toBe(100);
  });
});

describe('technical()', () => {
  it('perfect scores → 10', () => {
    expect(technical(perfect)).toBe(10);
  });

  it('all 5 → 5', () => {
    expect(technical(half)).toBe(5);
  });

  it('matches manual weighted average for prestige scores', () => {
    const scores: RatingScores = {
      story: 10, direction: 9, performances: 9, pacing: 9,
      visuals: 9, music: 8, themes: 9, originality: 9, impact: 10,
    };
    const manual = CATEGORIES.reduce((s, c) => s + scores[c.key] * c.weight, 0) / 100;
    expect(technical(scores)).toBeCloseTo(manual, 10);
  });
});

describe('roundHalf()', () => {
  it('rounds 8.75 → 9.0', () => expect(roundHalf(8.75)).toBe(9.0));
  it('rounds 8.74 → 8.5', () => expect(roundHalf(8.74)).toBe(8.5));
  it('rounds 8.24 → 8.0', () => expect(roundHalf(8.24)).toBe(8.0));
  it('rounds 7.75 → 8.0', () => expect(roundHalf(7.75)).toBe(8.0));
  it('rounds 10.0 → 10.0', () => expect(roundHalf(10.0)).toBe(10.0));
  it('rounds 0.0 → 0.0', () => expect(roundHalf(0.0)).toBe(0.0));
});

describe('visible()', () => {
  it('perfect scores → 10', () => expect(visible(perfect)).toBe(10));
  it('is roundHalf of technical', () => {
    expect(visible(half)).toBe(roundHalf(technical(half)));
  });
});

describe('fmt()', () => {
  it('formats to 2 decimal places', () => {
    expect(fmt(8)).toBe('8.00');
    expect(fmt(9.0)).toBe('9.00');
    expect(fmt(8.126)).toBe('8.13');
  });
});

describe('fmt1()', () => {
  it('formats to 1 decimal place', () => {
    expect(fmt1(8)).toBe('8.0');
    expect(fmt1(9.0)).toBe('9.0');
    expect(fmt1(8.04)).toBe('8.0');
    expect(fmt1(8.05)).toBe('8.1');
  });
});

describe('fmtScore()', () => {
  it('integers and half-integers → 1 decimal', () => {
    expect(fmtScore(7)).toBe('7.0');
    expect(fmtScore(7.5)).toBe('7.5');
    expect(fmtScore(10)).toBe('10.0');
    expect(fmtScore(0)).toBe('0.0');
  });

  it('quarter values → 2 decimals', () => {
    expect(fmtScore(7.25)).toBe('7.25');
    expect(fmtScore(7.75)).toBe('7.75');
    expect(fmtScore(0.25)).toBe('0.25');
    expect(fmtScore(9.75)).toBe('9.75');
  });
});
