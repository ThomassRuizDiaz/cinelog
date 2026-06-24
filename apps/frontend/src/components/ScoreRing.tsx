import { fmtScore } from '../lib/scoring';

interface ScoreRingProps {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
}

export default function ScoreRing({ value, size = 78, stroke = 5, label }: ScoreRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = value / 10;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="var(--accent)" strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 700ms var(--ease-out)', filter: 'drop-shadow(0 0 6px var(--accent))' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
        <span className="tnum display" style={{ fontSize: size * 0.3, fontWeight: 700, lineHeight: 1 }}>{fmtScore(value)}</span>
        {label && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.14em', color: 'var(--text-faint)', textTransform: 'uppercase', marginTop: 2 }}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
