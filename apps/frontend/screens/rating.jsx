/* ───────────────────────── CineLog — Rating (Score Constellation forms live) ───────────────────────── */
const { useState } = React;
function HalfStars({ value, onChange, size = 30, gap = 7 }) {
  const star = (i) => {
    const fill = Math.max(0, Math.min(1, value - i));
    const set = (v) => onChange(v);
    return (
      <div key={i} style={{ position: 'relative', width: size, height: size }}>
        <span style={{ position: 'absolute', inset: 0, color: 'rgba(255,255,255,0.13)' }}>
          <Icon name="star" size={size} color="currentColor" />
        </span>
        <span style={{ position: 'absolute', inset: 0, overflow: 'hidden', width: `${fill * 100}%`,
          color: 'var(--star)', filter: fill > 0 ? 'drop-shadow(0 0 5px rgba(232,185,116,0.5))' : 'none',
          transition: 'width 160ms var(--ease-out)' }}>
          <span style={{ display: 'block', width: size }}><Icon name="star" size={size} color="currentColor" /></span>
        </span>
        <button className="cl-tap" aria-label={`${i + 0.5} stars`} onClick={() => set(i + 0.5)}
          style={{ position: 'absolute', left: 0, top: 0, width: '50%', height: '100%', border: 'none', background: 'none', padding: 0, cursor: 'pointer' }} />
        <button className="cl-tap" aria-label={`${i + 1} stars`} onClick={() => set(i + 1)}
          style={{ position: 'absolute', right: 0, top: 0, width: '50%', height: '100%', border: 'none', background: 'none', padding: 0, cursor: 'pointer' }} />
      </div>
    );
  };
  return <div style={{ display: 'flex', gap }}>{[0,1,2,3,4].map(star)}</div>;
}

function RatingScreen({ movie, onClose, onSave }) {
  const [scores, setScores] = useState(() => ({ ...movie.scores }));
  const [open, setOpen] = useState(null);
  const [notes, setNotes] = useState({});
  const [override, setOverride] = useState(() => Math.abs(movie.personal - CL.roundHalf(CL.technical(movie.scores))) > 0.01);
  const [personal, setPersonal] = useState(movie.personal);
  const [saved, setSaved] = useState(false);

  const tech = CL.technical(scores);
  const visible = CL.roundHalf(tech);
  const finalScore = override ? personal : visible;

  const setCat = (k, v) => setScores(s => ({ ...s, [k]: v }));
  const bump = (d) => setPersonal(p => Math.max(0, Math.min(5, Math.round((p + d) * 2) / 2)));

  const doSave = () => { setSaved(true); setTimeout(() => onSave(movie, scores, finalScore), 1050); };

  return (
    <div className="cl-scroll" style={{ paddingBottom: 'calc(var(--safe-bottom) + 150px)' }}>
      {/* header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: 'linear-gradient(180deg, var(--ink-900) 72%, rgba(8,8,11,0))',
        padding: 'var(--safe-top) 16px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="pressable cl-tap" onClick={onClose} style={{ border: '1px solid var(--line-strong)', background: 'var(--ink-800)',
          width: 38, height: 38, borderRadius: 12, display: 'grid', placeItems: 'center', color: 'var(--text)', flexShrink: 0 }}>
          <Icon name="close" size={19} color="currentColor" />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="eyebrow">Rating</div>
          <div className="display" style={{ fontSize: 18, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{movie.title}</div>
        </div>
      </div>

      {/* live constellation summary */}
      <div style={{ padding: '6px 16px 0' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: 14, borderRadius: 20,
          background: 'linear-gradient(155deg, var(--ink-800), var(--ink-850))', border: '1px solid var(--line)' }}>
          <Constellation scores={scores} size={132} showLabels={false} highlight={open} />
          <div style={{ flex: 1 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Live Profile</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
              <span className="display tnum" style={{ fontSize: 32, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>{CL.fmt(tech)}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-faint)', letterSpacing: '0.1em' }}>TECHNICAL</span>
            </div>
            <div style={{ marginTop: 9, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Stars value={visible} size={14} />
              <span className="tnum" style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600 }}>{CL.fmt1(visible)}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, color: 'var(--text-faint)', letterSpacing: '0.08em' }}>VISIBLE</span>
            </div>
          </div>
        </div>
      </div>

      {/* category cards */}
      <div style={{ padding: '18px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {CL.cats.map((c, i) => {
          const isOpen = open === c.key;
          return (
            <div key={c.key} style={{ borderRadius: 16, background: 'var(--ink-820)',
              border: isOpen ? '1px solid var(--line-amber)' : '1px solid var(--line)', overflow: 'hidden',
              transition: 'border-color var(--dur) var(--ease-out)' }}>
              <div style={{ padding: '14px 15px 13px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 15.5, fontWeight: 600, lineHeight: 1.15 }}>{c.label}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-faint)', border: '1px solid var(--line)',
                        borderRadius: 5, padding: '2px 5px', letterSpacing: '0.06em' }}>{c.weight}%</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 3 }}>{c.desc}</div>
                  </div>
                  <span className="display tnum" style={{ fontSize: 22, fontWeight: 700, color: scores[c.key] > 0 ? 'var(--accent)' : 'var(--text-ghost)', lineHeight: 1 }}>{CL.fmt1(scores[c.key])}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 13 }}>
                  <HalfStars value={scores[c.key]} onChange={v => setCat(c.key, v)} size={30} />
                  <button className="cl-tap" onClick={() => setOpen(isOpen ? null : c.key)} style={{ border: 'none', background: 'none',
                    color: isOpen ? 'var(--accent)' : 'var(--text-faint)', display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Note <Icon name={isOpen ? 'close' : 'edit'} size={13} color="currentColor" />
                  </button>
                </div>
              </div>
              {isOpen && (
                <div style={{ padding: '0 15px 14px', animation: 'fadeIn 220ms ease both' }}>
                  <textarea autoFocus value={notes[c.key] || ''} onChange={e => setNotes(n => ({ ...n, [c.key]: e.target.value }))}
                    rows={2} placeholder={`A note on ${c.short.toLowerCase()}…`} style={{ width: '100%', resize: 'none',
                      border: '1px solid var(--line-strong)', background: 'var(--ink-850)', borderRadius: 11, padding: '10px 12px',
                      color: 'var(--text)', fontFamily: 'var(--font-display)', fontSize: 13.5, lineHeight: 1.5, outline: 'none', fontStyle: 'italic' }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* personal override */}
      <div style={{ padding: '18px 16px 0' }}>
        <div style={{ padding: '15px 16px', borderRadius: 16, background: 'var(--ink-820)', border: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600 }}>Personal Final Score</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 3 }}>Override the math when the heart disagrees</div>
            </div>
            <button className="cl-tap" onClick={() => setOverride(o => !o)} style={{ border: 'none', background: 'none', padding: 0, flexShrink: 0 }}>
              <span style={{ width: 46, height: 27, borderRadius: 20, background: override ? 'var(--accent)' : 'var(--ink-680)',
                display: 'block', position: 'relative', transition: 'background var(--dur) var(--ease-out)' }}>
                <span style={{ position: 'absolute', top: 3, left: override ? 22 : 3, width: 21, height: 21, borderRadius: '50%',
                  background: '#fff', transition: 'left var(--dur) var(--ease-spring)', boxShadow: '0 2px 5px rgba(0,0,0,0.4)' }} />
              </span>
            </button>
          </div>
          {override && (
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              animation: 'fadeIn 240ms ease both' }}>
              <Stars value={personal} size={20} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button className="pressable cl-tap" onClick={() => bump(-0.5)} style={{ width: 34, height: 34, borderRadius: 10,
                  border: '1px solid var(--line-strong)', background: 'var(--ink-760)', color: 'var(--text)', fontSize: 20, lineHeight: 1, display: 'grid', placeItems: 'center' }}>−</button>
                <span className="display tnum" style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)', minWidth: 38, textAlign: 'center' }}>{CL.fmt1(personal)}</span>
                <button className="pressable cl-tap" onClick={() => bump(0.5)} style={{ width: 34, height: 34, borderRadius: 10,
                  border: '1px solid var(--line-strong)', background: 'var(--ink-760)', color: 'var(--text)', fontSize: 20, lineHeight: 1, display: 'grid', placeItems: 'center' }}>+</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* sticky save bar */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 40, padding: '14px 16px calc(var(--safe-bottom) + 10px)',
        background: 'linear-gradient(180deg, rgba(8,8,11,0), var(--ink-900) 36%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px 11px 16px', borderRadius: 18,
          background: 'rgba(22,22,28,0.86)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--line-strong)', boxShadow: '0 -8px 30px -10px rgba(0,0,0,0.6)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, color: 'var(--text-faint)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {override ? 'Final · personal' : 'Final · calculated'}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginTop: 3 }}>
              <span className="display tnum" style={{ fontSize: 26, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>{CL.fmt1(finalScore)}</span>
              <Stars value={CL.roundHalf(finalScore)} size={13} />
            </div>
          </div>
          <button className="pressable cl-tap" onClick={doSave} style={{ border: 'none', borderRadius: 14, padding: '14px 24px',
            background: 'linear-gradient(150deg, var(--accent), var(--accent-deep))', color: '#1a1206', fontFamily: 'var(--font-sans)',
            fontSize: 15, fontWeight: 700, boxShadow: '0 10px 24px -10px var(--accent)' }}>Save Rating</button>
        </div>
      </div>

      {/* saved confirmation */}
      {saved && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 90, display: 'grid', placeItems: 'center',
          background: 'rgba(8,8,11,0.82)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          animation: 'fadeIn 240ms ease both' }}>
          <div style={{ textAlign: 'center', animation: 'fadeUp 460ms var(--ease-spring) both' }}>
            <div style={{ width: 92, height: 92, borderRadius: '50%', margin: '0 auto 22px', display: 'grid', placeItems: 'center',
              background: 'radial-gradient(circle, rgba(232,185,116,0.22), transparent 70%)' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', display: 'grid', placeItems: 'center',
                background: 'linear-gradient(150deg, var(--accent), var(--accent-deep))', boxShadow: '0 0 40px -6px var(--accent)' }}>
                <Icon name="star" size={34} color="#1a1206" />
              </div>
            </div>
            <div className="display" style={{ fontSize: 24, fontWeight: 700 }}>Rating saved</div>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, color: 'var(--text-dim)', marginTop: 8 }}>
              Filed into your archive at {CL.fmt1(finalScore)} stars.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
window.RatingScreen = RatingScreen;
