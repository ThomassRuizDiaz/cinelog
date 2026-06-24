import { useState, useEffect, useRef, type MouseEvent } from 'react';
import Icon from './Icon';
import type { IconName } from './Icon';
import { fmtScore } from '../lib/scoring';

interface RatingScaleControlProps {
  value: number;
  onChange: (value: number) => void;
  /** Glyph icon size in px. */
  starSize?: number;
  /** Gap between glyphs in px (inline layout only — stacked spreads edge-to-edge). */
  starGap?: number;
  /** Glyph used as the rating unit. Default 'star'. Category cards pass their own glyph. */
  icon?: IconName;
  /** Active/filled glyph color. Default amber star. Keep within the amber identity. */
  fillColor?: string;
  /**
   * Full-width layout: a large glyph row that spreads edge-to-edge with the
   * ±0.25 controls + live value centered beneath it. Used by category cards so
   * the glyph row reads as the primary interaction. Default false = compact inline.
   */
  stacked?: boolean;
}

/**
 * 10-unit rating control for 0.00–10.00 in 0.25 increments.
 *
 * Glyphs: each glyph = 1 point; pointer/touch position within a glyph quantizes
 * to the nearest 0.25 (leftmost → +0.25, rightmost → +1.00). Partial fill is a
 * clipped overlay so 0.25-steps read clearly. The glyph can be category-specific
 * (script, clapper, masks, …) so the rating unit carries the category identity.
 * Tactile feedback: glyphs lift on hover and compress on press (`.cl-glyph`); on
 * any value change an amber sweep runs across the row and the live value pops.
 * Bumpers: ±0.25 buttons. Value: live `fmtScore` (7.25 stays "7.25").
 */
export default function RatingScaleControl({
  value,
  onChange,
  starSize = 22,
  starGap = 3,
  icon = 'star',
  fillColor = 'var(--star)',
  stacked = false,
}: RatingScaleControlProps) {
  /* `pulse` re-keys the sweep + value-pop animations so they replay on each change. */
  const [pulse, setPulse] = useState(0);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setPulse(p => p + 1);
  }, [value]);

  const bump = (d: number) =>
    onChange(Math.max(0, Math.min(10, Math.round((value + d) * 4) / 4)));

  const handleStarClick = (starIdx: number, e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const frac = Math.max(0.25, Math.round(pct * 4) / 4);
    onChange(Math.min(10, starIdx + frac));
  };

  const glyphRow = (
    <div
      style={{
        position: 'relative',
        display: 'flex', alignItems: 'center',
        gap: stacked ? 0 : starGap,
        justifyContent: stacked ? 'space-between' : 'flex-start',
        width: stacked ? '100%' : 'auto', flex: stacked ? 1 : 'none',
      }}
    >
      {Array.from({ length: 10 }, (_, i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <button
            key={i}
            className="cl-tap cl-glyph"
            aria-label={`${i + 1} de 10`}
            onClick={e => handleStarClick(i, e)}
            style={{
              position: 'relative', width: starSize, height: starSize,
              border: 'none', background: 'none', padding: 0,
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <span style={{ position: 'absolute', inset: 0, color: 'rgba(255,255,255,0.13)' }}>
              <Icon name={icon} size={starSize} color="currentColor" stroke={1.8} />
            </span>
            <span style={{
              position: 'absolute', inset: 0, overflow: 'hidden',
              width: `${fill * 100}%`,
              color: fillColor,
              filter: fill > 0 ? 'drop-shadow(0 0 5px rgba(232,185,116,0.55))' : 'none',
              transition: 'width 140ms var(--ease-out)',
            }}>
              <span style={{ display: 'block', width: starSize }}>
                <Icon name={icon} size={starSize} color="currentColor" stroke={1.8} />
              </span>
            </span>
          </button>
        );
      })}

      {/* amber sweep on change */}
      {value > 0 && (
        <span
          key={pulse}
          aria-hidden
          style={{
            position: 'absolute', top: 0, bottom: 0, left: 0, width: '40%',
            background: 'linear-gradient(90deg, transparent, rgba(247,214,160,0.28), transparent)',
            pointerEvents: 'none', opacity: 0,
            animation: 'ratingSweep 560ms var(--ease-out)',
          }}
        />
      )}
    </div>
  );

  const controls = (
    <div style={{ display: 'flex', alignItems: 'center', gap: stacked ? 16 : 7, justifyContent: 'center', flexShrink: 0 }}>
      <button
        className="pressable cl-tap"
        aria-label="Bajar 0.25"
        onClick={() => bump(-0.25)}
        style={{
          border: '1px solid var(--line-strong)', background: 'var(--ink-760)',
          borderRadius: 8, width: stacked ? 30 : 22, height: stacked ? 30 : 22,
          display: 'grid', placeItems: 'center',
          color: 'var(--text)', fontSize: stacked ? 17 : 13, lineHeight: 1,
          flexShrink: 0, cursor: 'pointer',
        }}
      >−</button>

      <span
        key={pulse}
        className="display tnum"
        style={{
          fontSize: stacked ? 20 : 14, fontWeight: 700,
          color: value > 0 ? 'var(--accent)' : 'var(--text-ghost)',
          minWidth: stacked ? 46 : 32, textAlign: 'center', flexShrink: 0,
          animation: value > 0 ? 'ratingValuePop 360ms var(--ease-spring)' : 'none',
        }}
      >
        {value > 0 ? fmtScore(value) : '—'}
      </span>

      <button
        className="pressable cl-tap"
        aria-label="Subir 0.25"
        onClick={() => bump(0.25)}
        style={{
          border: '1px solid var(--line-strong)', background: 'var(--ink-760)',
          borderRadius: 8, width: stacked ? 30 : 22, height: stacked ? 30 : 22,
          display: 'grid', placeItems: 'center',
          color: 'var(--text)', fontSize: stacked ? 17 : 13, lineHeight: 1,
          flexShrink: 0, cursor: 'pointer',
        }}
      >+</button>
    </div>
  );

  if (stacked) {
    return (
      <div style={{ width: '100%' }}>
        {glyphRow}
        <div style={{ marginTop: 12 }}>{controls}</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
      {glyphRow}
      {controls}
    </div>
  );
}
