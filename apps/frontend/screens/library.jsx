/* ───────────────────────── CineLog — Library ───────────────────────── */
const { useState, useMemo } = React;
function LibraryScreen({ movies, onOpen }) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('personal');
  const [grid, setGrid] = useState(false);

  const sorts = [
    { id: 'personal', label: 'Personal' }, { id: 'technical', label: 'Technical' },
    { id: 'objective', label: 'Objective' }, { id: 'latest', label: 'Latest' },
    { id: 'year', label: 'Year' }, { id: 'title', label: 'Title' },
    ...CL.cats.map(c => ({ id: c.key, label: c.short })),
  ];

  const list = useMemo(() => {
    let arr = movies.filter(m =>
      !q || m.title.toLowerCase().includes(q.toLowerCase()) || m.director.toLowerCase().includes(q.toLowerCase()));
    const val = (m) => {
      if (sort === 'personal') return m.personal;
      if (sort === 'technical') return CL.technical(m.scores);
      if (sort === 'objective') return m.objective;
      if (sort === 'latest') return m.watches[0].date;
      if (sort === 'year') return m.year;
      if (sort === 'title') return m.title;
      return m.scores[sort];
    };
    arr = [...arr].sort((a, b) => {
      const va = val(a), vb = val(b);
      if (sort === 'title') return va.localeCompare(vb);
      if (sort === 'latest') return vb.localeCompare(va);
      return vb - va;
    });
    return arr;
  }, [movies, q, sort]);

  const scoreOf = (m) => sort === 'technical' ? CL.technical(m.scores)
    : sort === 'objective' ? m.objective
    : (sort !== 'personal' && sort !== 'latest' && sort !== 'year' && sort !== 'title') ? m.scores[sort]
    : m.personal;
  const labelOf = sort === 'technical' ? 'TECHNICAL' : sort === 'objective' ? 'OBJECTIVE'
    : (sort !== 'personal' && sort !== 'latest' && sort !== 'year' && sort !== 'title')
    ? (CL.cats.find(c => c.key === sort)?.short.toUpperCase()) : 'PERSONAL';

  return (
    <div className="cl-scroll" style={{ paddingBottom: 'calc(var(--nav-h) + 34px)' }}>
      <div style={{ padding: 'calc(var(--safe-top) + 4px) 20px 0', display: 'flex',
        alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>{list.length} of {movies.length} films</div>
          <div className="display" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 0.95 }}>Library</div>
        </div>
        <button className="pressable cl-tap" onClick={() => setGrid(g => !g)} style={{ border: '1px solid var(--line-strong)',
          background: 'var(--ink-800)', width: 40, height: 40, borderRadius: 13, display: 'grid', placeItems: 'center', color: 'var(--text-dim)' }}>
          <Icon name={grid ? 'list' : 'grid2'} size={18} color="currentColor" />
        </button>
      </div>

      {/* search */}
      <div style={{ padding: '16px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', height: 46,
          borderRadius: 15, background: 'var(--ink-820)', border: '1px solid var(--line-strong)' }}>
          <Icon name="search" size={18} color="var(--text-faint)" stroke={2} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search your archive"
            style={{ flex: 1, border: 'none', background: 'none', outline: 'none', color: 'var(--text)',
              fontFamily: 'var(--font-sans)', fontSize: 15 }} />
          {q && <button className="cl-tap" onClick={() => setQ('')} style={{ border: 'none', background: 'none',
            color: 'var(--text-faint)', padding: 4, display: 'grid' }}><Icon name="close" size={16} color="currentColor" /></button>}
        </div>
      </div>

      {/* sort pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <span style={{ paddingLeft: 16, display: 'inline-flex' }}><Icon name="sort" size={15} color="var(--text-faint)" /></span>
        <Pills options={sorts} value={sort} onChange={setSort} />
      </div>

      {/* list / grid */}
      {grid ? (
        <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {list.map((m, i) => (
            <button key={m.id} className="pressable cl-tap" onClick={() => onOpen(m)} style={{ border: 'none',
              background: 'none', padding: 0, animation: `fadeUp 440ms var(--ease-out) ${i * 35}ms both` }}>
              <Poster movie={m} w={(402 - 32 - 24) / 3} rounded={11} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 7 }}>
                <Icon name="star" size={10} color="var(--star)" />
                <span className="tnum" style={{ fontFamily: 'var(--font-display)', fontSize: 12.5, fontWeight: 600, color: 'var(--accent)' }}>{CL.fmt1(scoreOf(m))}</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map((m, i) => (
            <MovieCard key={m.id} movie={m} onOpen={() => onOpen(m)} score={scoreOf(m)} scoreLabel={labelOf} delay={i * 40} />
          ))}
        </div>
      )}
    </div>
  );
}
window.LibraryScreen = LibraryScreen;
