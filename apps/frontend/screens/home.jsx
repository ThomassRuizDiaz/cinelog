/* ───────────────────────── CineLog — Home (Private Screening Room) ───────────────────────── */
const { useMemo } = React;
function HomeScreen({ movies, onOpen, onTab, onSettings }) {
  // latest watched across all entries
  const latest = useMemo(() => {
    let best = null;
    movies.forEach(m => m.watches.forEach(w => {
      if (!best || w.date > best.date) best = { date: w.date, movie: m, w };
    }));
    return best;
  }, [movies]);

  const stats = useMemo(() => {
    const films = movies.length;
    let watchCount = 0, rewatch = 0, ps = 0, ts = 0;
    movies.forEach(m => {
      watchCount += m.watches.length;
      rewatch += m.watches.filter(w => w.type === 'Rewatch').length;
      ps += m.personal; ts += CL.technical(m.scores);
    });
    return { films, rewatch, avgP: ps / films, avgT: ts / films, watchCount };
  }, [movies]);

  const top5 = useMemo(() => [...movies].sort((a, b) =>
    b.personal - a.personal || CL.technical(b.scores) - CL.technical(a.scores)).slice(0, 5), [movies]);

  const recent = useMemo(() => {
    return [...movies].map(m => ({ m, d: m.watches[0].date }))
      .sort((a, b) => b.d.localeCompare(a.d)).slice(0, 4).map(x => x.m);
  }, [movies]);

  const hour = 21;
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const lm = latest.movie;
  const tech = CL.technical(lm.scores);

  return (
    <div className="cl-scroll" style={{ paddingBottom: 'calc(var(--nav-h) + 34px)' }}>
      {/* header */}
      <div style={{ padding: 'calc(var(--safe-top) + 6px) 20px 4px', display: 'flex',
        alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 7, whiteSpace: 'nowrap' }}>Private Screening Room</div>
          <div className="display" style={{ fontSize: 30, fontWeight: 700, lineHeight: 0.96, letterSpacing: '-0.02em' }}>
            Cine<span style={{ fontStyle: 'italic', fontWeight: 500 }}>log</span>
          </div>
        </div>
        <button className="pressable cl-tap" onClick={onSettings} style={{ border: '1px solid var(--line-strong)',
          background: 'var(--ink-800)', width: 40, height: 40, borderRadius: 13, display: 'grid', placeItems: 'center',
          color: 'var(--text-dim)' }}>
          <Icon name="cog" size={19} color="currentColor" />
        </button>
      </div>
      <div style={{ padding: '10px 20px 0', fontFamily: 'var(--font-display)', fontSize: 15,
        fontStyle: 'italic', color: 'var(--text-dim)' }}>
        {greet}. {stats.films} films are waiting in the dark.
      </div>

      {/* LATEST WATCH hero */}
      <div style={{ padding: '20px 16px 4px' }}>
        <button className="pressable cl-tap" onClick={() => onOpen(lm)} style={{ width: '100%', border: 'none',
          padding: 0, borderRadius: 26, position: 'relative', overflow: 'hidden', textAlign: 'left',
          color: 'var(--text)', boxShadow: 'var(--shadow-pop)' }}>
          {/* blurred projected backdrop */}
          <div style={{ position: 'absolute', inset: 0, transform: 'scale(1.6)', filter: 'blur(34px) saturate(150%)',
            opacity: 0.6 }}>
            <Poster movie={lm} w={420} rounded={0} frame={false} flat />
          </div>
          <div style={{ position: 'absolute', inset: 0, background:
            'linear-gradient(180deg, rgba(8,8,11,0.55) 0%, rgba(8,8,11,0.35) 30%, rgba(8,8,11,0.92) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)', borderRadius: 26 }} />

          <div style={{ position: 'relative', padding: '16px 16px 17px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="eyebrow" style={{ color: 'var(--accent)' }}>● Latest Watch</div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-dim)', letterSpacing: '0.08em' }}>
                {fmtDate(latest.date)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 15, marginTop: 14, alignItems: 'flex-end' }}>
              <div style={{ position: 'relative' }}>
                <Poster movie={lm} w={108} rounded={13} glow />
              </div>
              <div style={{ flex: 1, minWidth: 0, paddingBottom: 2 }}>
                <div className="display" style={{ fontSize: 25, fontWeight: 700, lineHeight: 0.98, letterSpacing: '-0.01em' }}>{lm.title}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', marginTop: 6, letterSpacing: '0.05em' }}>
                  {lm.year} · {lm.director}
                </div>
                <div style={{ marginTop: 10 }}><WatchMeta place={latest.w.place} type={latest.w.type} /></div>
                <div style={{ display: 'flex', gap: 8, marginTop: 13 }}>
                  <ScoreCapsule value={lm.personal} label="Personal" variant="primary" />
                  <ScoreCapsule value={tech} label="Technical" variant="line" />
                </div>
              </div>
            </div>
            <div style={{ marginTop: 14, paddingTop: 13, borderTop: '1px solid var(--line)',
              fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14.5, lineHeight: 1.45, color: 'var(--text)' }}>
              &ldquo;{lm.review}&rdquo;
            </div>
          </div>
        </button>
      </div>

      {/* stats plaques */}
      <div style={{ padding: '16px 16px 4px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
        {[
          { n: stats.films, l: 'Films' },
          { n: stats.watchCount, l: 'Watches' },
          { n: CL.fmt1(stats.avgP), l: 'Avg Pers.' },
          { n: CL.fmt1(stats.avgT), l: 'Avg Tech.' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'linear-gradient(160deg, var(--ink-800), var(--ink-850))',
            border: '1px solid var(--line)', borderRadius: 15, padding: '12px 8px 10px', textAlign: 'center',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}>
            <div className="tnum display" style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>{s.n}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--text-faint)', marginTop: 5 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Top 5 canon — mini monolith shelf */}
      <div style={{ padding: '22px 0 0' }}>
        <div style={{ padding: '0 20px' }}>
          <SectionHead eyebrow="Your Canon" title="Top 5 Personal" action="Rankings" onAction={() => onTab('rankings')} />
        </div>
        <div className="cl-scroll" style={{ position: 'static', display: 'flex', gap: 16, overflowX: 'auto',
          padding: '6px 20px 8px', scrollbarWidth: 'none' }}>
          {top5.map((m, i) => (
            <button key={m.id} className="pressable cl-tap" onClick={() => onOpen(m)} style={{ border: 'none',
              background: 'none', padding: 0, position: 'relative', flexShrink: 0, display: 'block',
              paddingLeft: i === 0 ? 4 : 18 }}>
              <span className="display tnum" style={{ position: 'absolute', left: i === 0 ? -8 : 0, bottom: -10, zIndex: 0,
                fontSize: 92, fontWeight: 800, lineHeight: 0.7, color: 'transparent',
                WebkitTextStroke: '1.5px rgba(184,73,63,0.5)', pointerEvents: 'none' }}>{i + 1}</span>
              <span style={{ position: 'relative', zIndex: 1, display: 'block' }}>
                <Poster movie={m} w={104} rounded={12} />
              </span>
              <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 5,
                marginTop: 9, paddingLeft: 2 }}>
                <Icon name="star" size={11} color="var(--star)" />
                <span className="tnum" style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{CL.fmt1(m.personal)}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* recent watches */}
      <div style={{ padding: '18px 16px 0' }}>
        <div style={{ padding: '0 4px' }}>
          <SectionHead eyebrow="From the projector" title="Recent Watches" action="Library" onAction={() => onTab('library')} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {recent.map((m, i) => <MovieCard key={m.id} movie={m} onOpen={() => onOpen(m)} delay={i * 50} />)}
        </div>
      </div>
    </div>
  );
}
window.HomeScreen = HomeScreen;
