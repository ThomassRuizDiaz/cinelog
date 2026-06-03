/* ───────────────────────── CineLog — Desktop adaptation ───────────────────────── */
const { useState, useMemo } = React;
function DeskRating({ movie, onClose, onSave }) {
  const [scores, setScores] = useState({ ...movie.scores });
  const [override, setOverride] = useState(Math.abs(movie.personal - CL.roundHalf(CL.technical(movie.scores))) > 0.01);
  const [personal, setPersonal] = useState(movie.personal);
  const tech = CL.technical(scores), visible = CL.roundHalf(tech);
  const finalScore = override ? personal : visible;
  const bump = d => setPersonal(p => Math.max(0, Math.min(5, Math.round((p + d) * 2) / 2)));
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 80, display: 'grid', placeItems: 'center',
      background: 'rgba(6,6,9,0.7)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', animation: 'fadeIn 240ms ease both' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 720, maxHeight: 740, display: 'flex', borderRadius: 24, overflow: 'hidden',
        background: 'var(--ink-850)', border: '1px solid var(--line-strong)', boxShadow: 'var(--shadow-pop)', animation: 'fadeUp 380ms var(--ease-out) both' }}>
        {/* left: live constellation */}
        <div style={{ width: 300, flexShrink: 0, padding: 26, background: 'linear-gradient(160deg, var(--ink-820), var(--ink-870))',
          borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column' }}>
          <div className="eyebrow">Rating · {movie.year}</div>
          <div className="display" style={{ fontSize: 22, fontWeight: 700, marginTop: 6, lineHeight: 1 }}>{movie.title}</div>
          <div style={{ display: 'grid', placeItems: 'center', marginTop: 18 }}>
            <Constellation scores={scores} size={244} />
          </div>
          <div style={{ marginTop: 'auto', paddingTop: 18 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="display tnum" style={{ fontSize: 36, fontWeight: 700, color: 'var(--accent)' }}>{CL.fmt(tech)}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-faint)', letterSpacing: '0.1em' }}>TECHNICAL</span>
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Stars value={visible} size={15} /><span className="tnum" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{CL.fmt1(visible)} visible</span>
            </div>
          </div>
        </div>
        {/* right: categories */}
        <div className="cl-scroll" style={{ position: 'relative', flex: 1, padding: 22 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CL.cats.map(c => (
              <div key={c.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
                padding: '11px 14px', borderRadius: 13, background: 'var(--ink-820)', border: '1px solid var(--line)' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 14.5, fontWeight: 600 }}>{c.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, color: 'var(--text-faint)', border: '1px solid var(--line)', borderRadius: 4, padding: '1px 4px' }}>{c.weight}%</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{c.desc}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  <HalfStars value={scores[c.key]} onChange={v => setScores(s => ({ ...s, [c.key]: v }))} size={22} gap={5} />
                  <span className="display tnum" style={{ fontSize: 17, fontWeight: 700, color: scores[c.key] > 0 ? 'var(--accent)' : 'var(--text-ghost)', width: 30, textAlign: 'right' }}>{CL.fmt1(scores[c.key])}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: '13px 15px', borderRadius: 13, background: 'var(--ink-820)', border: '1px solid var(--line)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600 }}>Personal Final Score</div>
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>Override the math</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {override && <>
                <button className="pressable cl-tap" onClick={() => bump(-0.5)} style={{ width: 30, height: 30, borderRadius: 9, border: '1px solid var(--line-strong)', background: 'var(--ink-760)', color: 'var(--text)', fontSize: 18, display: 'grid', placeItems: 'center' }}>−</button>
                <span className="display tnum" style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)', width: 34, textAlign: 'center' }}>{CL.fmt1(personal)}</span>
                <button className="pressable cl-tap" onClick={() => bump(0.5)} style={{ width: 30, height: 30, borderRadius: 9, border: '1px solid var(--line-strong)', background: 'var(--ink-760)', color: 'var(--text)', fontSize: 18, display: 'grid', placeItems: 'center' }}>+</button>
              </>}
              <button className="cl-tap" onClick={() => setOverride(o => !o)} style={{ border: 'none', background: 'none', padding: 0 }}>
                <span style={{ width: 44, height: 26, borderRadius: 20, background: override ? 'var(--accent)' : 'var(--ink-680)', display: 'block', position: 'relative' }}>
                  <span style={{ position: 'absolute', top: 3, left: override ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left var(--dur) var(--ease-spring)' }} />
                </span>
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="pressable cl-tap" onClick={onClose} style={{ flex: '0 0 auto', padding: '13px 20px', borderRadius: 13, border: '1px solid var(--line-strong)', background: 'var(--ink-800)', color: 'var(--text-dim)', fontSize: 14, fontWeight: 500 }}>Cancel</button>
            <button className="pressable cl-tap" onClick={() => onSave(movie, scores, finalScore)} style={{ flex: 1, padding: '13px', borderRadius: 13, border: 'none',
              background: 'linear-gradient(150deg, var(--accent), var(--accent-deep))', color: '#1a1206', fontSize: 15, fontWeight: 700, boxShadow: '0 10px 24px -10px var(--accent)' }}>
              Save Rating · {CL.fmt1(finalScore)}★
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeskDetail({ movie, onClose, onRate }) {
  const tech = CL.technical(movie.scores), visible = CL.roundHalf(tech);
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 70, display: 'flex', justifyContent: 'flex-end',
      background: 'rgba(6,6,9,0.6)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', animation: 'fadeIn 240ms ease both' }}>
      <div onClick={e => e.stopPropagation()} className="cl-scroll" style={{ position: 'relative', width: 480, height: '100%',
        background: 'var(--ink-870)', borderLeft: '1px solid var(--line-strong)', animation: 'deskDrawer 360ms var(--ease-out) both' }}>
        {/* backdrop */}
        <div style={{ position: 'relative', height: 260 }}>
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, transform: 'scale(1.6)', filter: 'blur(36px)', opacity: 0.5 }}><Poster movie={movie} w={480} rounded={0} frame={false} flat /></div>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,8,11,0.3), var(--ink-870))' }} />
          </div>
          <button className="pressable cl-tap" onClick={onClose} style={{ position: 'absolute', top: 18, right: 18, zIndex: 2, width: 38, height: 38, borderRadius: 12,
            border: '1px solid var(--line-strong)', background: 'rgba(20,20,26,0.7)', color: 'var(--text)', display: 'grid', placeItems: 'center' }}><Icon name="close" size={19} color="currentColor" /></button>
          <div style={{ position: 'absolute', left: 28, bottom: -40, display: 'flex', gap: 18, alignItems: 'flex-end', right: 28 }}>
            <Poster movie={movie} w={120} rounded={14} glow />
            <div style={{ paddingBottom: 46 }}>
              <div className="display" style={{ fontSize: 26, fontWeight: 700, lineHeight: 1 }}>{movie.title}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-dim)', marginTop: 7 }}>{movie.year} · {movie.director} · {movie.runtime}m</div>
            </div>
          </div>
        </div>
        <div style={{ padding: '54px 28px 0' }}>
          <GenreChips genres={movie.genres} />
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <ScoreCapsule value={movie.personal} label="Personal" variant="primary" size="lg" />
            <ScoreCapsule value={tech} label="Technical" variant="line" size="lg" />
            <ScoreCapsule value={movie.objective} label="Objective" variant="ghost" size="lg" />
          </div>
          <div style={{ marginTop: 20, fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 16, lineHeight: 1.5 }}>&ldquo;{movie.review}&rdquo;</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button className="pressable cl-tap" onClick={() => onRate(movie)} style={{ flex: 1, border: 'none', borderRadius: 13, padding: '13px',
              background: 'linear-gradient(150deg, var(--accent), var(--accent-deep))', color: '#1a1206', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <Icon name="star" size={15} color="#1a1206" /> Edit Rating</button>
          </div>
          <div style={{ display: 'grid', placeItems: 'center', marginTop: 24 }}><Constellation scores={movie.scores} size={290} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 18 }}>
            {CL.cats.map(c => (
              <div key={c.key} style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--ink-820)', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{c.short}</span>
                  <span className="display tnum" style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{CL.fmt1(movie.scores[c.key])}</span>
                </div>
                <div style={{ marginTop: 7, height: 3.5, borderRadius: 3, background: 'var(--ink-680)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${movie.scores[c.key] / 5 * 100}%`, background: 'linear-gradient(90deg, var(--accent-deep), var(--accent))' }} />
                </div>
              </div>
            ))}
          </div>
          <div className="eyebrow" style={{ margin: '24px 0 12px' }}>Watch History · film strip</div>
          <div style={{ paddingBottom: 30 }}><WatchTimeline movie={movie} /></div>
        </div>
      </div>
    </div>
  );
}

function DesktopApp({ movies, onOpenMobile }) {
  const [nav, setNav] = useState('home');
  const [detail, setDetail] = useState(null);
  const [rating, setRating] = useState(null);
  const [mode, setMode] = useState('personal');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('personal');

  const stats = useMemo(() => {
    let wc = 0, ps = 0, ts = 0; movies.forEach(m => { wc += m.watches.length; ps += m.personal; ts += CL.technical(m.scores); });
    return { films: movies.length, wc, avgP: ps / movies.length, avgT: ts / movies.length };
  }, [movies]);
  const latest = useMemo(() => { let b = null; movies.forEach(m => m.watches.forEach(w => { if (!b || w.date > b.date) b = { date: w.date, m, w }; })); return b; }, [movies]);
  const top5 = useMemo(() => [...movies].sort((a, b) => b.personal - a.personal).slice(0, 5), [movies]);

  const navItems = [{ id: 'home', icon: 'home', l: 'Home' }, { id: 'library', icon: 'library', l: 'Library' }, { id: 'rankings', icon: 'rankings', l: 'Rankings' }];

  const libList = useMemo(() => {
    let arr = movies.filter(m => !q || m.title.toLowerCase().includes(q.toLowerCase()) || m.director.toLowerCase().includes(q.toLowerCase()));
    const val = m => sort === 'technical' ? CL.technical(m.scores) : sort === 'objective' ? m.objective : sort === 'year' ? m.year : sort === 'latest' ? m.watches[0].date : m.personal;
    return [...arr].sort((a, b) => { const x = val(a), y = val(b); return sort === 'latest' ? String(y).localeCompare(String(x)) : y - x; });
  }, [movies, q, sort]);

  const modeObj = CL_RANKINGS.find(r => r.id === mode);
  const ranked = useMemo(() => [...movies].map(m => ({ m, v: CL.rankValue(m, modeObj.source) })).sort((a, b) => b.v - a.v), [movies, mode]);

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', background: 'var(--ink-900)', overflow: 'hidden' }}>
      {/* left rail */}
      <div style={{ width: 232, flexShrink: 0, borderRight: '1px solid var(--line)', padding: '26px 18px', display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(180deg, var(--ink-870), var(--ink-900))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '0 8px 4px' }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at 40% 30%, rgba(232,185,116,0.22), var(--ink-760))', border: '1px solid var(--line-amber)' }}>
            <Icon name="film" size={20} color="var(--accent)" stroke={1.5} />
          </div>
          <div className="display" style={{ fontSize: 21, fontWeight: 700 }}>Cine<span style={{ fontStyle: 'italic', fontWeight: 500 }}>log</span></div>
        </div>
        <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(it => {
            const active = nav === it.id;
            return (
              <button key={it.id} className="cl-tap" onClick={() => setNav(it.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: 12,
                border: 'none', cursor: 'pointer', textAlign: 'left', color: active ? 'var(--accent-bright)' : 'var(--text-dim)',
                background: active ? 'linear-gradient(150deg, rgba(232,185,116,0.14), rgba(232,185,116,0.04))' : 'transparent',
                fontFamily: 'var(--font-sans)', fontSize: 14.5, fontWeight: active ? 600 : 500, transition: 'all var(--dur) var(--ease-out)' }}>
                <Icon name={it.icon} size={19} color="currentColor" stroke={active ? 2.1 : 1.8} /> {it.l}
              </button>
            );
          })}
          <button className="cl-tap" onClick={() => onOpenMobile()} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: 12, border: 'none', cursor: 'pointer', textAlign: 'left', color: 'var(--text-dim)', background: 'transparent', fontFamily: 'var(--font-sans)', fontSize: 14.5, fontWeight: 500, whiteSpace: 'nowrap' }}>
            <Icon name="add" size={19} color="currentColor" stroke={1.8} /> Add Film
          </button>
        </div>
        <div style={{ marginTop: 'auto', padding: '14px 13px', borderRadius: 14, background: 'var(--ink-820)', border: '1px solid var(--line)' }}>
          <div className="eyebrow" style={{ marginBottom: 9 }}>The Archive</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>
            <span>Films</span><span className="tnum" style={{ color: 'var(--accent)', fontWeight: 600 }}>{stats.films}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
            <span>Avg personal</span><span className="tnum" style={{ color: 'var(--accent)', fontWeight: 600 }}>{CL.fmt1(stats.avgP)}</span>
          </div>
        </div>
      </div>

      {/* main */}
      <div className="cl-scroll" style={{ position: 'relative', flex: 1 }}>
        <div style={{ padding: '30px 38px 60px' }}>
          {nav === 'home' && (
            <div style={{ animation: 'fadeIn 320ms ease both' }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Private Screening Room</div>
              <div className="display" style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em' }}>Good evening.</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, marginTop: 26 }}>
                <div>
                  {/* latest hero */}
                  <button className="pressable cl-tap" onClick={() => setDetail(latest.m)} style={{ width: '100%', border: 'none', textAlign: 'left', color: 'var(--text)', position: 'relative', borderRadius: 22, overflow: 'hidden', padding: 0, boxShadow: 'var(--shadow-pop)' }}>
                    <div style={{ position: 'absolute', inset: 0, transform: 'scale(1.5)', filter: 'blur(30px)', opacity: 0.45 }}><Poster movie={latest.m} w={700} rounded={0} frame={false} flat /></div>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(110deg, rgba(8,8,11,0.92) 40%, rgba(8,8,11,0.4))' }} />
                    <div style={{ position: 'relative', padding: 24, display: 'flex', gap: 22, alignItems: 'center' }}>
                      <Poster movie={latest.m} w={130} rounded={14} glow />
                      <div style={{ flex: 1 }}>
                        <div className="eyebrow" style={{ color: 'var(--accent)' }}>● Latest Watch · {fmtDate(latest.date)}</div>
                        <div className="display" style={{ fontSize: 28, fontWeight: 700, marginTop: 10, lineHeight: 1 }}>{latest.m.title}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>{latest.m.year} · {latest.m.director}</div>
                        <div style={{ marginTop: 12 }}><WatchMeta place={latest.w.place} type={latest.w.type} /></div>
                        <div style={{ display: 'flex', gap: 9, marginTop: 16 }}>
                          <ScoreCapsule value={latest.m.personal} label="Personal" variant="primary" />
                          <ScoreCapsule value={CL.technical(latest.m.scores)} label="Technical" variant="line" />
                        </div>
                      </div>
                    </div>
                  </button>
                  <div className="eyebrow" style={{ margin: '30px 0 14px' }}>Recent Watches</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[...movies].sort((a, b) => b.watches[0].date.localeCompare(a.watches[0].date)).slice(0, 6).map(m => (
                      <MovieCard key={m.id} movie={m} onOpen={() => setDetail(m)} />
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                    {[{ n: stats.films, l: 'Films' }, { n: stats.wc, l: 'Watches' }, { n: CL.fmt1(stats.avgP), l: 'Avg Pers.' }, { n: CL.fmt1(stats.avgT), l: 'Avg Tech.' }].map((s, i) => (
                      <div key={i} style={{ background: 'var(--ink-820)', border: '1px solid var(--line)', borderRadius: 14, padding: '16px 10px', textAlign: 'center' }}>
                        <div className="display tnum" style={{ fontSize: 26, fontWeight: 700, color: 'var(--accent)' }}>{s.n}</div>
                        <div className="eyebrow" style={{ marginTop: 6 }}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                  <div className="eyebrow" style={{ margin: '24px 0 12px' }}>Top 5 Personal</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {top5.map((m, i) => (
                      <button key={m.id} className="pressable cl-tap" onClick={() => setDetail(m)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, borderRadius: 13, border: '1px solid var(--line)', background: 'var(--ink-820)', color: 'var(--text)', textAlign: 'left' }}>
                        <span className="display tnum" style={{ width: 26, textAlign: 'center', fontSize: 22, fontWeight: 800, color: 'transparent', WebkitTextStroke: '1.2px rgba(184,73,63,0.6)' }}>{i + 1}</span>
                        <Poster movie={m} w={38} rounded={7} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="display" style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-faint)', marginTop: 2 }}>{m.year}</div>
                        </div>
                        <span className="display tnum" style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>{CL.fmt1(m.personal)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {nav === 'library' && (
            <div style={{ animation: 'fadeIn 320ms ease both' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>{libList.length} of {movies.length} films</div>
                  <div className="display" style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em' }}>Library</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', height: 44, width: 280, borderRadius: 13, background: 'var(--ink-820)', border: '1px solid var(--line-strong)' }}>
                  <Icon name="search" size={17} color="var(--text-faint)" />
                  <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search archive" style={{ flex: 1, border: 'none', background: 'none', outline: 'none', color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: 14 }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, margin: '20px 0 22px' }}>
                {[{ id: 'personal', l: 'Personal' }, { id: 'technical', l: 'Technical' }, { id: 'objective', l: 'Objective' }, { id: 'latest', l: 'Latest' }, { id: 'year', l: 'Year' }].map(s => (
                  <button key={s.id} className="pressable cl-tap" onClick={() => setSort(s.id)} style={{ border: sort === s.id ? '1px solid var(--line-amber)' : '1px solid var(--line)', background: sort === s.id ? 'rgba(232,185,116,0.1)' : 'var(--ink-800)', color: sort === s.id ? 'var(--accent-bright)' : 'var(--text-dim)', borderRadius: 11, padding: '8px 15px', fontSize: 13, fontWeight: 500 }}>{s.l}</button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 18 }}>
                {libList.map((m, i) => (
                  <button key={m.id} className="pressable cl-tap" onClick={() => setDetail(m)} style={{ border: 'none', background: 'none', padding: 0, animation: `fadeUp 420ms var(--ease-out) ${i * 30}ms both` }}>
                    <Poster movie={m} w={150} rounded={12} />
                    <div style={{ marginTop: 9 }}>
                      <div className="display" style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                        <Icon name="star" size={11} color="var(--star)" />
                        <span className="display tnum" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent)' }}>{CL.fmt1(sort === 'technical' ? CL.technical(m.scores) : sort === 'objective' ? m.objective : m.personal)}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {nav === 'rankings' && (
            <div style={{ animation: 'fadeIn 320ms ease both', display: 'grid', gridTemplateColumns: '210px 1fr', gap: 28 }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 14 }}>Ranking mode</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {CL_RANKINGS.map(r => (
                    <button key={r.id} className="cl-tap" onClick={() => setMode(r.id)} style={{ border: 'none', cursor: 'pointer', textAlign: 'left', padding: '10px 12px', borderRadius: 10,
                      background: mode === r.id ? 'linear-gradient(150deg, rgba(232,185,116,0.13), transparent)' : 'transparent', color: mode === r.id ? 'var(--accent-bright)' : 'var(--text-dim)' }}>
                      <div style={{ fontSize: 13.5, fontWeight: mode === r.id ? 600 : 500 }}>{r.label}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-faint)', marginTop: 2 }}>{r.tag}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div key={mode}>
                <div className="display" style={{ fontSize: 30, fontWeight: 700 }}>{modeObj.label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, color: 'var(--text-dim)', marginTop: 4 }}>{modeObj.tag}.</div>
                <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {ranked.map((r, i) => (
                    <button key={r.m.id} className="pressable cl-tap" onClick={() => setDetail(r.m)} style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '13px 8px', border: 'none', borderTop: i ? '1px solid var(--line)' : 'none', background: 'none', color: 'var(--text)', textAlign: 'left', animation: `fadeUp 440ms var(--ease-out) ${i * 45}ms both` }}>
                      <span className="display tnum" style={{ width: 64, textAlign: 'center', fontSize: i === 0 ? 52 : 44, fontWeight: 800, color: i === 0 ? 'var(--accent)' : 'transparent', WebkitTextStroke: i === 0 ? 'none' : '1.4px rgba(184,73,63,0.5)' }}>{i + 1}</span>
                      <Poster movie={r.m} w={54} rounded={9} />
                      <div style={{ flex: 1 }}>
                        <div className="display" style={{ fontSize: 18, fontWeight: 600 }}>{r.m.title}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-faint)', marginTop: 3 }}>{r.m.year} · {r.m.director}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="display tnum" style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>{CL.fmt(r.v)}</div>
                        <div style={{ marginTop: 4 }}><Stars value={CL.roundHalf(r.v)} size={11} /></div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {detail && <DeskDetail movie={detail} onClose={() => setDetail(null)} onRate={(m) => { setDetail(null); setRating(m); }} />}
      {rating && <DeskRating movie={rating} onClose={() => setRating(null)} onSave={() => setRating(null)} />}
    </div>
  );
}
window.DesktopApp = DesktopApp;
