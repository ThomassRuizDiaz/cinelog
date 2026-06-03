/* ───────────────────────── CineLog — Movie Detail ───────────────────────── */
const { useState } = React;
function DetailScreen({ movie, onBack, onRate }) {
  const tech = CL.technical(movie.scores);
  const visible = CL.roundHalf(tech);
  const hasOverride = Math.abs(movie.personal - visible) > 0.01;
  const [tab, setTab] = useState('profile'); // profile | history

  return (
    <div className="cl-scroll" style={{ paddingBottom: 'calc(var(--safe-bottom) + 96px)' }}>
      {/* hero backdrop */}
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 420, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, transform: 'scale(1.7)', filter: 'blur(40px) saturate(150%)', opacity: 0.55 }}>
            <Poster movie={movie} w={420} rounded={0} frame={false} flat />
          </div>
          <div style={{ position: 'absolute', inset: 0, background:
            'linear-gradient(180deg, rgba(8,8,11,0.45) 0%, rgba(8,8,11,0.2) 24%, rgba(8,8,11,0.82) 70%, var(--ink-900) 100%)' }} />
        </div>

        <TopBar onBack={onBack} transparent trailing={
          <button className="pressable cl-tap" style={{ border: '1px solid var(--line-strong)', background: 'rgba(20,20,26,0.6)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', width: 38, height: 38, borderRadius: 12,
            display: 'grid', placeItems: 'center', color: 'var(--text-dim)' }}>
            <Icon name="edit" size={18} color="currentColor" />
          </button>
        } />

        <div style={{ position: 'relative', padding: '6px 20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <Poster movie={movie} w={138} rounded={16} glow />
          <div className="display" style={{ fontSize: 28, fontWeight: 700, marginTop: 20, lineHeight: 1, letterSpacing: '-0.01em', textWrap: 'balance' }}>{movie.title}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginTop: 9, letterSpacing: '0.05em' }}>
            {movie.year} · {movie.director} · {movie.runtime}m
          </div>
          <div style={{ marginTop: 14 }}><GenreChips genres={movie.genres} /></div>
        </div>
      </div>

      {/* score group */}
      <div style={{ padding: '24px 16px 0' }}>
        <div style={{ position: 'relative', padding: '18px 16px', borderRadius: 20, background:
          'linear-gradient(155deg, var(--ink-800), var(--ink-850))', border: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: 8 }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div className="display tnum" style={{ fontSize: 34, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>{CL.fmt1(movie.personal)}</div>
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}><Stars value={movie.personal} size={11} /></div>
            <div className="eyebrow" style={{ marginTop: 8, color: 'var(--accent-deep)' }}>Personal</div>
          </div>
          <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--line)' }} />
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div className="display tnum" style={{ fontSize: 28, fontWeight: 600, lineHeight: 1 }}>{CL.fmt(tech)}</div>
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}><Stars value={visible} size={10} /></div>
            <div className="eyebrow" style={{ marginTop: 8 }}>Technical</div>
          </div>
          <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--line)' }} />
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div className="display tnum" style={{ fontSize: 28, fontWeight: 600, lineHeight: 1 }}>{CL.fmt(movie.objective)}</div>
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}><Stars value={CL.roundHalf(movie.objective)} size={10} /></div>
            <div className="eyebrow" style={{ marginTop: 8 }}>Objective</div>
          </div>
        </div>
        {hasOverride && (
          <div style={{ marginTop: 9, fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-faint)',
            textAlign: 'center', letterSpacing: '0.04em' }}>
            ✶ Personal score overrides the calculated {CL.fmt1(visible)} — heart over math.
          </div>
        )}
      </div>

      {/* review quote */}
      <div style={{ padding: '18px 20px 0' }}>
        <div style={{ position: 'relative', paddingLeft: 18 }}>
          <span className="display" style={{ position: 'absolute', left: -4, top: -14, fontSize: 56, color: 'var(--line-amber)',
            fontWeight: 700, lineHeight: 1 }}>&ldquo;</span>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 17, lineHeight: 1.5, color: 'var(--text)' }}>
            {movie.review}
          </div>
        </div>
      </div>

      {/* quick actions */}
      <div style={{ padding: '20px 16px 0', display: 'flex', gap: 10 }}>
        <button className="pressable cl-tap" onClick={() => onRate(movie)} style={{ flex: 1, border: 'none', borderRadius: 14,
          padding: '14px', background: 'linear-gradient(150deg, var(--accent), var(--accent-deep))', color: '#1a1206',
          fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          boxShadow: '0 10px 24px -12px var(--accent)' }}>
          <Icon name="star" size={16} color="#1a1206" /> Edit Rating
        </button>
        <button className="pressable cl-tap" onClick={() => onRate(movie)} style={{ flex: 1, border: '1px solid var(--line-strong)', borderRadius: 14,
          padding: '14px', background: 'var(--ink-800)', color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          <Icon name="add" size={16} color="currentColor" /> Log Watch
        </button>
      </div>

      {/* tabs */}
      <div style={{ padding: '26px 16px 0' }}>
        <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid var(--line)' }}>
          {[{ id: 'profile', l: 'Score Profile' }, { id: 'history', l: 'Watch History' }].map(t => (
            <button key={t.id} className="cl-tap" onClick={() => setTab(t.id)} style={{ border: 'none', background: 'none', padding: '0 0 11px',
              color: tab === t.id ? 'var(--text)' : 'var(--text-faint)', position: 'relative', cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
              {t.l}
              {tab === t.id && <span style={{ position: 'absolute', left: 0, right: 0, bottom: -1, height: 2,
                background: 'var(--accent)', borderRadius: 2 }} />}
            </button>
          ))}
        </div>
      </div>

      {tab === 'profile' ? (
        <div style={{ animation: 'fadeIn 320ms var(--ease-out) both' }}>
          {/* constellation */}
          <div style={{ padding: '22px 16px 0', display: 'flex', justifyContent: 'center' }}>
            <Constellation scores={movie.scores} size={290} />
          </div>
          <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-faint)',
            letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 6 }}>Score Constellation · 9 categories</div>

          {/* ledger */}
          <div style={{ padding: '20px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
            {CL.cats.map(c => (
              <div key={c.key} style={{ padding: '11px 12px', borderRadius: 13, background: 'var(--ink-820)', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{c.short}</span>
                  <span className="tnum" style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>{CL.fmt1(movie.scores[c.key])}</span>
                </div>
                <div style={{ marginTop: 8, height: 4, borderRadius: 3, background: 'var(--ink-680)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(movie.scores[c.key] / 5) * 100}%`, borderRadius: 3,
                    background: 'linear-gradient(90deg, var(--accent-deep), var(--accent))' }} />
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-faint)', marginTop: 6, letterSpacing: '0.06em' }}>WEIGHT {c.weight}%</div>
              </div>
            ))}
          </div>

          {/* private note */}
          <div style={{ padding: '22px 16px 0' }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Private Note</div>
            <div style={{ padding: '15px 16px', borderRadius: 16, background: 'var(--ink-820)', border: '1px solid var(--line)',
              fontFamily: 'var(--font-display)', fontSize: 14.5, lineHeight: 1.6, color: 'var(--text-dim)', fontStyle: 'italic' }}>
              {movie.note}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '22px 16px 0', animation: 'fadeIn 320ms var(--ease-out) both' }}>
          <div className="eyebrow" style={{ marginBottom: 14, paddingLeft: 4 }}>{movie.watches.length} entries on the strip</div>
          <WatchTimeline movie={movie} />
        </div>
      )}
    </div>
  );
}
window.DetailScreen = DetailScreen;
