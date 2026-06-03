/* ───────────────────────── CineLog — Rankings (Monolith) ───────────────────────── */
const { useState, useMemo } = React;
function RankingsScreen({ movies, onOpen }) {
  const [mode, setMode] = useState('personal');
  const modeObj = CL_RANKINGS.find(r => r.id === mode);

  const ranked = useMemo(() => {
    return [...movies]
      .map(m => ({ m, v: CL.rankValue(m, modeObj.source) }))
      .sort((a, b) => b.v - a.v || b.m.personal - a.m.personal);
  }, [movies, mode]);

  const top = ranked[0];
  const rest = ranked.slice(1);

  const secondary = (m) => {
    const out = [];
    if (modeObj.source !== 'personal') out.push({ l: 'Pers', v: m.personal });
    if (modeObj.source !== 'technical') out.push({ l: 'Tech', v: CL.technical(m.scores) });
    if (CL.cats.find(c => c.key === modeObj.source))
      out.push({ l: CL.cats.find(c => c.key === modeObj.source).short.slice(0, 5), v: m.scores[modeObj.source] });
    return out.slice(0, 2);
  };

  return (
    <div className="cl-scroll" style={{ paddingBottom: 'calc(var(--nav-h) + 34px)' }}>
      <div style={{ padding: 'calc(var(--safe-top) + 4px) 20px 2px' }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>The Archive, ranked</div>
        <div className="display" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 0.95 }}>Rankings</div>
      </div>

      {/* mode pills */}
      <div style={{ padding: '14px 0 6px' }}>
        <Pills options={CL_RANKINGS} value={mode} onChange={setMode} getTag={o => o.tag} />
      </div>

      {/* current mode banner */}
      <div style={{ padding: '6px 20px 2px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, color: 'var(--text-dim)' }}>
          {modeObj.label} — {modeObj.tag.toLowerCase()}.
        </div>
      </div>

      <div key={mode} style={{ padding: '12px 16px 0' }}>
        {/* #1 hero */}
        <button className="pressable cl-tap" onClick={() => onOpen(top.m)} style={{ width: '100%', border: 'none',
          textAlign: 'left', color: 'var(--text)', padding: 0, position: 'relative', borderRadius: 24,
          overflow: 'hidden', marginBottom: 22, boxShadow: 'var(--shadow-pop)',
          animation: 'fadeUp 500ms var(--ease-out) both' }}>
          <div style={{ position: 'absolute', inset: 0, transform: 'scale(1.5)', filter: 'blur(30px)', opacity: 0.45 }}>
            <Poster movie={top.m} w={400} rounded={0} frame={false} flat />
          </div>
          <div style={{ position: 'absolute', inset: 0, background:
            'linear-gradient(180deg, rgba(8,8,11,0.5), rgba(8,8,11,0.93))' }} />
          <div style={{ position: 'absolute', inset: 0, borderRadius: 24, boxShadow: 'inset 0 0 0 1px var(--line-amber)' }} />
          <div style={{ position: 'relative', padding: 16, display: 'flex', gap: 15, alignItems: 'flex-end' }}>
            <span className="display tnum" style={{ position: 'absolute', top: -22, right: 2, fontSize: 150, fontWeight: 800,
              lineHeight: 1, color: 'transparent', WebkitTextStroke: '2px rgba(232,185,116,0.22)', pointerEvents: 'none' }}>1</span>
            <Poster movie={top.m} w={104} rounded={13} glow />
            <div style={{ flex: 1, minWidth: 0, paddingBottom: 2 }}>
              <div className="eyebrow" style={{ color: 'var(--accent)', marginBottom: 6 }}>★ Number One</div>
              <div className="display" style={{ fontSize: 24, fontWeight: 700, lineHeight: 0.98 }}>{top.m.title}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', marginTop: 5 }}>{top.m.year} · {top.m.director}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
                <span className="display tnum" style={{ fontSize: 34, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>{CL.fmt(top.v)}</span>
                <Stars value={CL.roundHalf(top.v)} size={14} />
              </div>
            </div>
          </div>
        </button>

        {/* 2..N monolith rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {rest.map((r, idx) => {
            const rank = idx + 2;
            return (
              <button key={r.m.id} className="pressable cl-tap" onClick={() => onOpen(r.m)}
                style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', color: 'var(--text)',
                  position: 'relative', display: 'flex', alignItems: 'center', gap: 14, padding: '12px 6px 12px 0',
                  borderTop: '1px solid var(--line)', animation: `fadeUp 500ms var(--ease-out) ${idx * 55}ms both` }}>
                {/* monolith numeral */}
                <span className="display tnum" style={{ width: 58, flexShrink: 0, textAlign: 'center', fontSize: 50,
                  fontWeight: 800, lineHeight: 1, color: 'transparent', WebkitTextStroke: '1.4px rgba(184,73,63,0.55)' }}>{rank}</span>
                <Poster movie={r.m} w={50} rounded={9} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="display" style={{ fontSize: 16.5, fontWeight: 600, lineHeight: 1.05, whiteSpace: 'nowrap',
                    overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.m.title}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-faint)', marginTop: 3 }}>{r.m.year} · {r.m.director}</div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 7 }}>
                    {secondary(r.m).map((s, i) => (
                      <span key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
                        {s.l} <span className="tnum" style={{ color: 'var(--text)', fontWeight: 600 }}>{CL.fmt1(s.v)}</span>
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, paddingRight: 2 }}>
                  <div className="display tnum" style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>{CL.fmt(r.v)}</div>
                  <div style={{ marginTop: 4 }}><Stars value={CL.roundHalf(r.v)} size={9.5} /></div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
window.RankingsScreen = RankingsScreen;
