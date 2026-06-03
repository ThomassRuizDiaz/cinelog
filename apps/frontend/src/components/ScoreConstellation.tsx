import { CATEGORIES } from '../data/categories';
import { fmt1 } from '../lib/scoring';
import type { RatingScores, ScoreKey } from '../types/rating';

interface ScoreConstellationProps {
  scores: RatingScores;
  size?: number;
  showLabels?: boolean;
  animate?: boolean;
  highlight?: ScoreKey | null;
}

export default function ScoreConstellation({ scores, size = 260, showLabels = true, animate = true, highlight = null }: ScoreConstellationProps) {
  const cx = size / 2, cy = size / 2;
  const outer = size * 0.34, inner = size * 0.07;

  const pts = CATEGORIES.map((c, i) => {
    const a = (-90 + i * (360 / CATEGORIES.length)) * Math.PI / 180;
    const sc = scores[c.key] ?? 0;
    const r = inner + (sc / 5) * (outer - inner);
    return {
      x: cx + r * Math.cos(a), y: cy + r * Math.sin(a),
      a, sc, c,
      lx: cx + (outer + size * 0.085) * Math.cos(a),
      ly: cy + (outer + size * 0.085) * Math.sin(a),
    };
  });

  const poly = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id="constFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.42" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.08" />
        </radialGradient>
        <filter id="constGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* guide rings */}
      {[1, 2, 3, 4, 5].map(rr => (
        <circle key={rr} cx={cx} cy={cy} r={inner + (rr / 5) * (outer - inner)} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}

      {/* spokes */}
      {pts.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={cx + outer * Math.cos(p.a)} y2={cy + outer * Math.sin(p.a)} stroke="rgba(255,255,255,0.045)" strokeWidth="1" />
      ))}

      {/* polygon */}
      <polygon
        points={poly}
        fill="url(#constFill)"
        stroke="var(--accent)"
        strokeWidth="1.4"
        strokeLinejoin="round"
        style={{ filter: 'drop-shadow(0 0 8px var(--accent-glow))', transition: animate ? 'all 600ms var(--ease-out)' : 'none' }}
      />

      {/* vertices */}
      {pts.map((p, i) => {
        const on = highlight === p.c.key;
        const rad = 2 + (p.sc / 5) * 2.4 + (on ? 1.6 : 0);
        return (
          <g key={i} filter="url(#constGlow)">
            <circle
              cx={p.x} cy={p.y} r={rad}
              fill={on ? 'var(--accent-bright)' : 'var(--accent)'}
              opacity={0.45 + (p.sc / 5) * 0.55}
              style={{ transition: animate ? 'all 500ms var(--ease-out)' : 'none' }}
            />
          </g>
        );
      })}

      {/* labels */}
      {showLabels && pts.map((p, i) => {
        const right = Math.cos(p.a) > 0.25, left = Math.cos(p.a) < -0.25;
        const anchor = right ? 'start' : left ? 'end' : 'middle';
        const on = highlight === p.c.key;
        return (
          <text
            key={i} x={p.lx} y={p.ly}
            textAnchor={anchor} dominantBaseline="middle"
            style={{ fontFamily: 'var(--font-mono)', fontSize: size * 0.035, letterSpacing: '0.04em', textTransform: 'uppercase', fill: on ? 'var(--accent-bright)' : 'var(--text-dim)', fontWeight: on ? 600 : 400 }}
          >
            {p.c.short}
            <tspan dx="4" style={{ fill: 'var(--text-faint)' }}>{fmt1(p.sc)}</tspan>
          </text>
        );
      })}
    </svg>
  );
}
