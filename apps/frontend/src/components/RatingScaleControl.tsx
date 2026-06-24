import Icon from './Icon';
import { fmtScore } from '../lib/scoring';

interface RatingScaleControlProps {
  value: number;
  onChange: (value: number) => void;
  /** Star icon size in px. Default 16. */
  starSize?: number;
  /** Gap between stars in px. Default 2. */
  starGap?: number;
}

/**
 * 10-star rating control supporting 0.00–10.00 in 0.25 increments.
 *
 * Stars: tap position within each star is quantized to nearest 0.25
 * (leftmost → +0.25, rightmost → +1.00).
 * Bumper buttons: ±0.25 for precise adjustment.
 * Value display: shows exact value using fmtScore (preserves 7.25, 7.75).
 */
export default function RatingScaleControl({
  value,
  onChange,
  starSize = 16,
  starGap = 2,
}: RatingScaleControlProps) {
  const bump = (d: number) =>
    onChange(Math.max(0, Math.min(10, Math.round((value + d) * 4) / 4)));

  const handleStarClick = (starIdx: number, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const frac = Math.max(0.25, Math.round(pct * 4) / 4);
    onChange(Math.min(10, starIdx + frac));
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
      {/* 10-star row */}
      <div style={{ display: 'flex', gap: starGap, flexShrink: 0 }}>
        {Array.from({ length: 10 }, (_, i) => {
          const fill = Math.max(0, Math.min(1, value - i));
          return (
            <button
              key={i}
              className="cl-tap"
              aria-label={`${i + 1} de 10`}
              onClick={e => handleStarClick(i, e)}
              style={{
                position: 'relative', width: starSize, height: starSize,
                border: 'none', background: 'none', padding: 0,
                cursor: 'pointer', flexShrink: 0,
              }}
            >
              <span style={{ position: 'absolute', inset: 0, color: 'rgba(255,255,255,0.14)' }}>
                <Icon name="star" size={starSize} color="currentColor" />
              </span>
              <span style={{
                position: 'absolute', inset: 0, overflow: 'hidden',
                width: `${fill * 100}%`,
                color: 'var(--star)',
                filter: fill > 0 ? 'drop-shadow(0 0 4px rgba(232,185,116,0.35))' : 'none',
                transition: 'width 120ms var(--ease-out)',
              }}>
                <span style={{ display: 'block', width: starSize }}>
                  <Icon name="star" size={starSize} color="currentColor" />
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* bumper − */}
      <button
        className="cl-tap"
        aria-label="Bajar 0.25"
        onClick={() => bump(-0.25)}
        style={{
          border: '1px solid var(--line-strong)', background: 'var(--ink-760)',
          borderRadius: 6, width: 22, height: 22, display: 'grid', placeItems: 'center',
          color: 'var(--text)', fontSize: 13, lineHeight: 1,
          flexShrink: 0, cursor: 'pointer',
        }}
      >−</button>

      {/* live value */}
      <span
        className="display tnum"
        style={{
          fontSize: 14, fontWeight: 700,
          color: value > 0 ? 'var(--accent)' : 'var(--text-ghost)',
          minWidth: 32, textAlign: 'center', flexShrink: 0,
        }}
      >
        {value > 0 ? fmtScore(value) : '—'}
      </span>

      {/* bumper + */}
      <button
        className="cl-tap"
        aria-label="Subir 0.25"
        onClick={() => bump(0.25)}
        style={{
          border: '1px solid var(--line-strong)', background: 'var(--ink-760)',
          borderRadius: 6, width: 22, height: 22, display: 'grid', placeItems: 'center',
          color: 'var(--text)', fontSize: 13, lineHeight: 1,
          flexShrink: 0, cursor: 'pointer',
        }}
      >+</button>
    </div>
  );
}
