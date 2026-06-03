import Icon from './Icon';
import { fmt1 } from '../lib/scoring';

export type ScoreBadgeVariant = 'primary' | 'ghost' | 'line';
export type ScoreBadgeSize = 'md' | 'lg';

interface ScoreBadgeProps {
  value: number;
  label?: string;
  variant?: ScoreBadgeVariant;
  size?: ScoreBadgeSize;
}

const VARIANT_STYLES = {
  primary: { bg: 'linear-gradient(160deg, var(--accent), var(--accent-deep))', col: '#1a1206', border: 'transparent', sub: 'rgba(26,18,6,0.62)' },
  ghost:   { bg: 'var(--ink-760)', col: 'var(--text)', border: 'var(--line-strong)', sub: 'var(--text-faint)' },
  line:    { bg: 'transparent', col: 'var(--text)', border: 'var(--line-amber)', sub: 'var(--text-faint)' },
} as const;

export default function ScoreBadge({ value, label, variant = 'ghost', size = 'md' }: ScoreBadgeProps) {
  const big = size === 'lg';
  const s = VARIANT_STYLES[variant];
  return (
    <div
      style={{
        display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        padding: big ? '11px 18px' : '7px 13px',
        borderRadius: big ? 16 : 12,
        background: s.bg, color: s.col,
        boxShadow: variant === 'primary' ? '0 8px 22px -10px var(--accent)' : 'none',
        border: `1px solid ${s.border}`,
        minWidth: big ? 76 : 56,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span className="tnum" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: big ? 27 : 19, lineHeight: 1 }}>
          {fmt1(value)}
        </span>
        <Icon name="star" size={big ? 13 : 10} color={variant === 'primary' ? '#2a1d08' : 'var(--star)'} />
      </div>
      {label && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: big ? 8.5 : 7.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: s.sub }}>
          {label}
        </span>
      )}
    </div>
  );
}
