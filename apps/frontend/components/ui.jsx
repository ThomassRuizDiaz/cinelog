/* ───────────────────────── CineLog — shell + list components ───────────────────────── */
const { useState, useRef } = React;

/* ── bottom navigation ── */
function BottomNav({ tab, onTab }) {
  const items = [
    { id: 'home', icon: 'home', label: 'Home' },
    { id: 'library', icon: 'library', label: 'Library' },
    { id: 'rankings', icon: 'rankings', label: 'Rankings' },
    { id: 'add', icon: 'add', label: 'Add' },
  ];
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 30,
      paddingBottom: 'var(--safe-bottom)', paddingTop: 9,
      background: 'linear-gradient(180deg, rgba(8,8,11,0) 0%, rgba(8,8,11,0.86) 34%, var(--ink-900) 100%)' }}>
      <div style={{ margin: '0 14px', height: 60, borderRadius: 24, position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        background: 'rgba(20,20,26,0.72)', backdropFilter: 'blur(22px) saturate(160%)',
        WebkitBackdropFilter: 'blur(22px) saturate(160%)',
        border: '1px solid var(--line-strong)', boxShadow: '0 16px 40px -16px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.04)' }}>
        {items.map(it => {
          const active = tab === it.id;
          const isAdd = it.id === 'add';
          if (isAdd) {
            return (
              <button key={it.id} className="pressable cl-tap" onClick={() => onTab(it.id)}
                style={{ border: 'none', background: 'none', padding: 0, display: 'flex',
                  flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1 }}>
                <span style={{ width: 38, height: 38, borderRadius: 13, display: 'grid', placeItems: 'center',
                  background: active ? 'linear-gradient(155deg, var(--accent), var(--accent-deep))' : 'var(--ink-680)',
                  color: active ? '#1a1206' : 'var(--text)',
                  boxShadow: active ? '0 8px 20px -6px var(--accent)' : 'none',
                  transition: 'all var(--dur) var(--ease-out)' }}>
                  <Icon name="add" size={22} stroke={2.4} color="currentColor" />
                </span>
              </button>
            );
          }
          return (
            <button key={it.id} className="pressable cl-tap" onClick={() => onTab(it.id)}
              style={{ border: 'none', background: 'none', padding: 0, display: 'flex',
                flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1,
                color: active ? 'var(--accent)' : 'var(--text-faint)', transition: 'color var(--dur) var(--ease-out)' }}>
              <Icon name={it.icon} size={22} stroke={active ? 2.2 : 1.9} color="currentColor" />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em',
                textTransform: 'uppercase', opacity: active ? 1 : 0.8 }}>{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
window.BottomNav = BottomNav;

/* ── top bar for pushed screens ── */
function TopBar({ onBack, eyebrow, title, trailing, transparent }) {
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 40, paddingTop: 'var(--safe-top)',
      background: transparent ? 'transparent'
        : 'linear-gradient(180deg, var(--ink-900) 60%, rgba(8,8,11,0))',
      display: 'flex', alignItems: 'center', gap: 12, padding: 'var(--safe-top) 16px 10px' }}>
      {onBack && (
        <button className="pressable cl-tap" onClick={onBack} style={{ border: '1px solid var(--line-strong)',
          background: 'rgba(20,20,26,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          width: 38, height: 38, borderRadius: 12, display: 'grid', placeItems: 'center', color: 'var(--text)', flexShrink: 0 }}>
          <Icon name="back" size={20} color="currentColor" />
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {eyebrow && <div className="eyebrow" style={{ marginBottom: 1 }}>{eyebrow}</div>}
        {title && <div className="display" style={{ fontSize: 19, fontWeight: 600, whiteSpace: 'nowrap',
          overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>}
      </div>
      {trailing}
    </div>
  );
}
window.TopBar = TopBar;

/* ── movie card (list row) ── */
function MovieCard({ movie, onOpen, score, scoreLabel, delay = 0 }) {
  const tech = CL.technical(movie.scores);
  const sval = score != null ? score : movie.personal;
  const lastWatch = movie.watches[0];
  const rewatched = movie.watches.length > 1;
  return (
    <button className="pressable cl-tap" onClick={onOpen}
      style={{ width: '100%', textAlign: 'left', border: 'none', display: 'flex', gap: 13, padding: 11,
        borderRadius: 18, background: 'linear-gradient(150deg, var(--ink-800), var(--ink-820))',
        boxShadow: 'var(--shadow-card)', borderTop: '1px solid rgba(255,255,255,0.04)',
        animation: `fadeUp 460ms var(--ease-out) ${delay}ms both`, alignItems: 'stretch', color: 'var(--text)' }}>
      <Poster movie={movie} w={62} rounded={10} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingTop: 1 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
            <span className="display" style={{ fontSize: 16.5, fontWeight: 600, lineHeight: 1.08, whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis' }}>{movie.title}</span>
            <span className="tnum" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-faint)', flexShrink: 0 }}>{movie.year}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.04em', color: 'var(--text-dim)',
            marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {movie.director} · {movie.genres.slice(0, 2).join(', ')}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 8 }}>
          <Stars value={CL.roundHalf(sval)} size={13} />
          <span className="tnum" style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{CL.fmt1(sval)}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-faint)', letterSpacing: '0.06em' }}>
            {scoreLabel || 'PERSONAL'}
          </span>
          {rewatched && (
            <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 3,
              fontFamily: 'var(--font-mono)', fontSize: 8.5, color: 'var(--text-faint)', letterSpacing: '0.06em' }}>
              <Icon name="rewatch" size={11} stroke={1.8} />×{movie.watches.length}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
window.MovieCard = MovieCard;

/* ── horizontal pills (ranking modes / sort) ── */
function Pills({ options, value, onChange, getKey = o => o.id, getLabel = o => o.label, getTag }) {
  const ref = useRef(null);
  return (
    <div ref={ref} className="cl-scroll" style={{ position: 'static', display: 'flex', gap: 8, overflowX: 'auto',
      padding: '2px 16px 2px', scrollbarWidth: 'none' }}>
      {options.map(o => {
        const k = getKey(o), active = value === k;
        return (
          <button key={k} className="pressable cl-tap" onClick={() => onChange(k)}
            style={{ flexShrink: 0, border: active ? '1px solid var(--line-amber)' : '1px solid var(--line)',
              background: active ? 'linear-gradient(150deg, rgba(232,185,116,0.18), rgba(232,185,116,0.06))' : 'var(--ink-800)',
              color: active ? 'var(--accent-bright)' : 'var(--text-dim)', borderRadius: 12,
              padding: getTag ? '8px 14px' : '9px 15px', display: 'flex', flexDirection: 'column', gap: 1,
              transition: 'all var(--dur) var(--ease-out)', textAlign: 'left' }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: active ? 600 : 500, whiteSpace: 'nowrap' }}>{getLabel(o)}</span>
            {getTag && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>{getTag(o)}</span>}
          </button>
        );
      })}
    </div>
  );
}
window.Pills = Pills;

/* ── WATCH TIMELINE — film strip (signature) ── */
function WatchTimeline({ movie }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {movie.watches.map((w, i) => {
        const active = i === 0; // latest scored = active rating
        return (
          <div key={i} style={{ display: 'flex', gap: 0, alignItems: 'stretch' }}>
            {/* sprocket rail */}
            <div style={{ width: 26, flexShrink: 0, position: 'relative',
              background: 'repeating-linear-gradient(180deg, transparent 0 7px, var(--ink-720) 7px 15px, transparent 15px 22px)',
              borderRadius: 0 }}>
              <div style={{ position: 'absolute', inset: '0 8px', background:
                'repeating-linear-gradient(180deg, transparent 0 9px, rgba(255,255,255,0.07) 9px 13px, transparent 13px 22px)' }} />
              {/* glowing dot */}
              <div style={{ position: 'absolute', left: '50%', top: 22, transform: 'translateX(-50%)',
                width: 9, height: 9, borderRadius: '50%',
                background: active ? 'var(--accent)' : 'var(--text-ghost)',
                boxShadow: active ? '0 0 12px 2px var(--accent)' : 'none', zIndex: 2 }} />
              {i < movie.watches.length - 1 && (
                <div style={{ position: 'absolute', left: '50%', top: 30, bottom: -2, width: 1.5,
                  transform: 'translateX(-50%)', background: 'var(--line-strong)' }} />
              )}
            </div>
            {/* frame */}
            <div style={{ flex: 1, margin: '0 0 12px 10px', padding: 13, borderRadius: 14,
              background: active ? 'linear-gradient(150deg, rgba(232,185,116,0.10), var(--ink-820))' : 'var(--ink-820)',
              border: active ? '1px solid var(--line-amber)' : '1px solid var(--line)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600 }}>{fmtDate(w.date)}</span>
                    {active && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.14em',
                      color: 'var(--accent)', border: '1px solid var(--line-amber)', borderRadius: 5, padding: '2px 5px' }}>ACTIVE</span>}
                  </div>
                  <div style={{ marginTop: 6 }}><WatchMeta place={w.place} type={w.type} /></div>
                </div>
                <Stars value={movie.personal} size={11} />
              </div>
              {w.note && <div style={{ marginTop: 9, fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-dim)',
                fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>&ldquo;{w.note}&rdquo;</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
window.WatchTimeline = WatchTimeline;

/* ── section header ── */
function SectionHead({ eyebrow, title, action, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 13 }}>
      <div>
        {eyebrow && <div className="eyebrow" style={{ marginBottom: 4 }}>{eyebrow}</div>}
        <div className="display" style={{ fontSize: 21, fontWeight: 600, lineHeight: 1, whiteSpace: 'nowrap' }}>{title}</div>
      </div>
      {action && (
        <button className="pressable cl-tap" onClick={onAction} style={{ border: 'none', background: 'none',
          color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em',
          textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 4, padding: 0 }}>
          {action} <Icon name="arrow" size={13} color="currentColor" />
        </button>
      )}
    </div>
  );
}
window.SectionHead = SectionHead;
