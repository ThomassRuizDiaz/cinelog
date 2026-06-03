/* ───────────────────────── CineLog — core components ───────────────────────── */
const { useState, useRef, useEffect, useMemo } = React;

/* ── icons (simple line set) ── */
function Icon({ name, size = 22, stroke = 2, color = 'currentColor', fill = 'none' }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'home':    return <svg {...p}><path d="M3 10.5 12 4l9 6.5"/><path d="M5 9.5V20h14V9.5"/></svg>;
    case 'library': return <svg {...p}><rect x="3.5" y="3.5" width="7" height="7" rx="1.4"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.4"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.4"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.4"/></svg>;
    case 'rankings':return <svg {...p}><path d="M5 20V11"/><path d="M12 20V4"/><path d="M19 20v-6"/></svg>;
    case 'add':     return <svg {...p}><path d="M12 5v14"/><path d="M5 12h14"/></svg>;
    case 'search':  return <svg {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>;
    case 'back':    return <svg {...p}><path d="M15 5l-7 7 7 7"/></svg>;
    case 'close':   return <svg {...p}><path d="M6 6l12 12M18 6 6 18"/></svg>;
    case 'home-loc':return <svg {...p}><path d="M4 11 12 5l8 6"/><path d="M6 10v9h12v-9"/></svg>;
    case 'cinema':  return <svg {...p}><rect x="3.5" y="6" width="17" height="13" rx="2"/><path d="M3.5 10h17"/><path d="M8 6 6 3M13 6l-1.5-3M18 6l-1.5-3"/></svg>;
    case 'rewatch': return <svg {...p}><path d="M3 12a9 9 0 1 0 2.6-6.3"/><path d="M3 4v5h5"/></svg>;
    case 'first':   return <svg {...p}><path d="M12 4v16M4 12h16"/></svg>;
    case 'play':    return <svg {...p} fill={color} stroke="none"><path d="M7 4.5v15l13-7.5z"/></svg>;
    case 'star':    return <svg {...p} fill={color} stroke="none"><path d="M12 2l2.9 6.2 6.8.8-5 4.6 1.3 6.7L12 18.3 5.9 20.3l1.3-6.7-5-4.6 6.8-.8z"/></svg>;
    case 'chevron': return <svg {...p}><path d="M9 5l7 7-7 7"/></svg>;
    case 'chevdown':return <svg {...p}><path d="M5 9l7 7 7-7"/></svg>;
    case 'edit':    return <svg {...p}><path d="M4 20h4l10-10-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>;
    case 'cog':     return <svg {...p}><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v2.6M12 18.9v2.6M21.5 12h-2.6M5.1 12H2.5M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8M18.7 18.7l-1.8-1.8M7.1 7.1 5.3 5.3"/></svg>;
    case 'calendar':return <svg {...p}><rect x="3.5" y="5" width="17" height="16" rx="2.4"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/></svg>;
    case 'grid2':   return <svg {...p}><rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.4"/><rect x="13" y="3.5" width="7.5" height="7.5" rx="1.4"/><rect x="3.5" y="13" width="7.5" height="7.5" rx="1.4"/><rect x="13" y="13" width="7.5" height="7.5" rx="1.4"/></svg>;
    case 'list':    return <svg {...p}><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>;
    case 'sort':    return <svg {...p}><path d="M7 4v16M7 20l-3-3M7 4l3 3"/><path d="M17 20V4M17 4l3 3M17 4l-3 3"/></svg>;
    case 'film':    return <svg {...p}><rect x="3.5" y="4" width="17" height="16" rx="2.2"/><path d="M8 4v16M16 4v16M3.5 8h4.5M16 8h4.5M3.5 12h17M3.5 16h4.5M16 16h4.5"/></svg>;
    case 'dot':     return <svg {...p} fill={color} stroke="none"><circle cx="12" cy="12" r="4"/></svg>;
    case 'arrow':   return <svg {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    default: return null;
  }
}
window.Icon = Icon;

/* ── styled placeholder poster ── */
function Poster({ movie, w = 120, rounded = 14, glow = false, frame = true, flat = false }) {
  const pal = movie.poster;
  const h = Math.round(w * 1.48);
  const titleSize = Math.max(11, Math.round(w * 0.135));
  const showMeta = w >= 92;
  return (
    <div style={{
      position: 'relative', width: w, height: h, borderRadius: rounded, flexShrink: 0,
      background: `linear-gradient(158deg, ${pal.from} 0%, ${pal.to} 92%)`,
      boxShadow: flat ? 'none' : (glow
        ? `var(--shadow-poster), 0 0 60px -14px ${pal.accent}66`
        : 'var(--shadow-poster)'),
      overflow: 'hidden', color: pal.ink, isolation: 'isolate',
    }}>
      {/* projector light */}
      <div style={{ position: 'absolute', inset: 0,
        background: `radial-gradient(120% 80% at 22% 8%, ${pal.accent}26, transparent 55%)` }} />
      <div style={{ position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, transparent 38%, rgba(0,0,0,0.55) 100%)' }} />
      {/* faint stripe texture so it reads as 'placeholder art' */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.07,
        backgroundImage: 'repeating-linear-gradient(135deg, #fff 0 1px, transparent 1px 9px)' }} />
      {/* accent hairline */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${pal.accent}, transparent)`, opacity: 0.7 }} />

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', padding: w >= 92 ? '12px 12px 13px' : '7px 8px 8px' }}>
        {showMeta && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: Math.max(7.5, w * 0.052),
            letterSpacing: '0.12em', color: pal.ink, opacity: 0.72, textTransform: 'uppercase' }}>
            {movie.year} · {movie.genres[0]}
          </div>
        )}
        <div>
          <div className="display" style={{ fontSize: titleSize, lineHeight: 0.98, fontWeight: 700,
            textShadow: '0 2px 18px rgba(0,0,0,0.6)', letterSpacing: '-0.01em' }}>
            {movie.title}
          </div>
          {showMeta && (
            <>
              <div style={{ height: 1, width: 26, background: pal.accent, opacity: 0.85,
                margin: '7px 0 6px' }} />
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: Math.max(7, w * 0.046),
                letterSpacing: '0.08em', color: pal.ink, opacity: 0.66, textTransform: 'uppercase' }}>
                {movie.director}
              </div>
            </>
          )}
        </div>
      </div>
      {frame && <div style={{ position: 'absolute', inset: 0, borderRadius: rounded,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.07)', pointerEvents: 'none' }} />}
    </div>
  );
}
window.Poster = Poster;

/* ── star row (half-step) ── */
function Stars({ value, size = 15, gap = 2.5, color = 'var(--star)' }) {
  const star = (fillPct, key) => (
    <span key={key} style={{ position: 'relative', width: size, height: size, display: 'inline-block', flexShrink: 0 }}>
      <span style={{ position: 'absolute', inset: 0, color: 'rgba(255,255,255,0.14)' }}>
        <Icon name="star" size={size} color="currentColor" />
      </span>
      <span style={{ position: 'absolute', inset: 0, overflow: 'hidden', width: `${fillPct * 100}%`, color }}>
        <span style={{ display: 'block', width: size, color }}>
          <Icon name="star" size={size} color="currentColor" />
        </span>
      </span>
    </span>
  );
  return (
    <span style={{ display: 'inline-flex', gap, alignItems: 'center' }}>
      {[0,1,2,3,4].map(i => star(Math.max(0, Math.min(1, value - i)), i))}
    </span>
  );
}
window.Stars = Stars;

/* ── score capsule ── */
function ScoreCapsule({ value, label, variant = 'ghost', size = 'md' }) {
  const big = size === 'lg';
  const styles = {
    primary: { bg: 'linear-gradient(160deg, var(--accent), var(--accent-deep))', col: '#1a1206', border: 'transparent', sub: 'rgba(26,18,6,0.62)' },
    ghost:   { bg: 'var(--ink-760)', col: 'var(--text)', border: 'var(--line-strong)', sub: 'var(--text-faint)' },
    line:    { bg: 'transparent', col: 'var(--text)', border: 'var(--line-amber)', sub: 'var(--text-faint)' },
  }[variant];
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      padding: big ? '11px 18px' : '7px 13px', borderRadius: big ? 16 : 12,
      background: styles.bg, color: styles.col,
      boxShadow: variant === 'primary' ? '0 8px 22px -10px var(--accent)' : 'none',
      border: `1px solid ${styles.border}`, minWidth: big ? 76 : 56 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span className="tnum" style={{ fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: big ? 27 : 19, lineHeight: 1 }}>{CL.fmt1(value)}</span>
        <Icon name="star" size={big ? 13 : 10} color={variant === 'primary' ? '#2a1d08' : 'var(--star)'} />
      </div>
      {label && <span style={{ fontFamily: 'var(--font-mono)', fontSize: big ? 8.5 : 7.5,
        letterSpacing: '0.16em', textTransform: 'uppercase', color: styles.sub }}>{label}</span>}
    </div>
  );
}
window.ScoreCapsule = ScoreCapsule;

/* ── score ring ── */
function ScoreRing({ value, size = 78, stroke = 5, label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = value / 5;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--accent)" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 700ms var(--ease-out)', filter: 'drop-shadow(0 0 6px var(--accent))' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 0 }}>
        <span className="tnum display" style={{ fontSize: size * 0.3, fontWeight: 700, lineHeight: 1 }}>{CL.fmt1(value)}</span>
        {label && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.14em',
          color: 'var(--text-faint)', textTransform: 'uppercase', marginTop: 2 }}>{label}</span>}
      </div>
    </div>
  );
}
window.ScoreRing = ScoreRing;

/* ── genre chips ── */
function GenreChips({ genres, accent }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {genres.map(g => (
        <span key={g} style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--text-dim)', padding: '4px 9px', borderRadius: 7,
          background: 'var(--ink-760)', border: '1px solid var(--line)' }}>{g}</span>
      ))}
    </div>
  );
}
window.GenreChips = GenreChips;

/* ── SCORE CONSTELLATION (signature) ── */
function Constellation({ scores, size = 260, showLabels = true, animate = true, highlight = null }) {
  const cats = CL.cats;
  const cx = size / 2, cy = size / 2;
  const outer = size * 0.34, inner = size * 0.07;
  const pts = cats.map((c, i) => {
    const a = (-90 + i * (360 / cats.length)) * Math.PI / 180;
    const sc = scores[c.key] || 0;
    const r = inner + (sc / 5) * (outer - inner);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), a, sc, c,
      lx: cx + (outer + size * 0.085) * Math.cos(a), ly: cy + (outer + size * 0.085) * Math.sin(a) };
  });
  const poly = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const rings = [1, 2, 3, 4, 5];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id="constFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.42" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.08" />
        </radialGradient>
        <filter id="constGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.4" result="b" /><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* guide rings */}
      {rings.map(rr => (
        <circle key={rr} cx={cx} cy={cy} r={inner + (rr / 5) * (outer - inner)} fill="none"
          stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      {/* spokes */}
      {pts.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={cx + outer * Math.cos(p.a)} y2={cy + outer * Math.sin(p.a)}
          stroke="rgba(255,255,255,0.045)" strokeWidth="1" />
      ))}
      {/* polygon */}
      <polygon points={poly} fill="url(#constFill)" stroke="var(--accent)" strokeWidth="1.4"
        strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 8px rgba(232,185,116,0.35))',
          transition: animate ? 'all 600ms var(--ease-out)' : 'none' }} />
      {/* vertices */}
      {pts.map((p, i) => {
        const on = highlight === p.c.key;
        const rad = 2 + (p.sc / 5) * 2.4 + (on ? 1.6 : 0);
        return (
          <g key={i} filter="url(#constGlow)">
            <circle cx={p.x} cy={p.y} r={rad} fill={on ? 'var(--accent-bright)' : 'var(--accent)'}
              opacity={0.45 + (p.sc / 5) * 0.55}
              style={{ transition: animate ? 'all 500ms var(--ease-out)' : 'none' }} />
          </g>
        );
      })}
      {/* labels */}
      {showLabels && pts.map((p, i) => {
        const right = Math.cos(p.a) > 0.25, left = Math.cos(p.a) < -0.25;
        const anchor = right ? 'start' : left ? 'end' : 'middle';
        const on = highlight === p.c.key;
        return (
          <text key={i} x={p.lx} y={p.ly} textAnchor={anchor} dominantBaseline="middle"
            style={{ fontFamily: 'var(--font-mono)', fontSize: size * 0.035, letterSpacing: '0.04em',
              textTransform: 'uppercase', fill: on ? 'var(--accent-bright)' : 'var(--text-dim)',
              fontWeight: on ? 600 : 400 }}>
            {p.c.short}
            <tspan dx="4" style={{ fill: 'var(--text-faint)' }}>{CL.fmt1(p.sc)}</tspan>
          </text>
        );
      })}
    </svg>
  );
}
window.Constellation = Constellation;

/* ── place / type meta ── */
function WatchMeta({ place, type, color = 'var(--text-dim)' }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color,
      fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <Icon name={place === 'Cinema' ? 'cinema' : 'home-loc'} size={13} stroke={1.8} /> {place}
      </span>
      <span style={{ opacity: 0.4 }}>·</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <Icon name={type === 'Rewatch' ? 'rewatch' : 'first'} size={12} stroke={1.8} /> {type}
      </span>
    </div>
  );
}
window.WatchMeta = WatchMeta;

function fmtDate(iso) {
  const d = new Date(iso + 'T00:00');
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}
window.fmtDate = fmtDate;
