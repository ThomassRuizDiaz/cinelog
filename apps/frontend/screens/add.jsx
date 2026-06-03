/* ───────────────────────── CineLog — Add / Search flow ───────────────────────── */
const CL_EXTERNAL = [
  ...window.CL_MOVIES,
  { id: 'ext-oppenheimer', title: 'Oppenheimer', year: 2023, director: 'Christopher Nolan', genres: ['Drama', 'History', 'Thriller'], runtime: 180,
    poster: { from: '#2b1208', to: '#0a0706', accent: '#e07b32', ink: '#f2d2ab' }, external: true },
  { id: 'ext-lalaland', title: 'La La Land', year: 2016, director: 'Damien Chazelle', genres: ['Romance', 'Drama', 'Music'], runtime: 128,
    poster: { from: '#241433', to: '#0a0710', accent: '#7a6fd0', ink: '#e6dcf2' }, external: true },
  { id: 'ext-nocountry', title: 'No Country for Old Men', year: 2007, director: 'Coen Brothers', genres: ['Crime', 'Thriller', 'Drama'], runtime: 122,
    poster: { from: '#2a2316', to: '#0b0907', accent: '#b89a5f', ink: '#ece2cb' }, external: true },
  { id: 'ext-furyroad', title: 'Mad Max: Fury Road', year: 2015, director: 'George Miller', genres: ['Action', 'Adventure', 'Sci-Fi'], runtime: 120,
    poster: { from: '#3a1808', to: '#0c0705', accent: '#e2702a', ink: '#f4cda4' }, external: true },
  { id: 'ext-sicario', title: 'Sicario', year: 2015, director: 'Denis Villeneuve', genres: ['Crime', 'Drama', 'Thriller'], runtime: 121,
    poster: { from: '#291a14', to: '#08070a', accent: '#c06a4a', ink: '#e9cdbd' }, external: true },
];

const { useState, useMemo } = React;
function SegToggle({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {options.map(o => {
        const active = value === o.id;
        return (
          <button key={o.id} className="pressable cl-tap" onClick={() => onChange(o.id)}
            style={{ flex: 1, border: active ? '1px solid var(--line-amber)' : '1px solid var(--line-strong)',
              background: active ? 'linear-gradient(150deg, rgba(232,185,116,0.16), rgba(232,185,116,0.05))' : 'var(--ink-820)',
              color: active ? 'var(--accent-bright)' : 'var(--text-dim)', borderRadius: 14, padding: '14px 10px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, transition: 'all var(--dur) var(--ease-out)' }}>
            <Icon name={o.icon} size={20} color="currentColor" stroke={1.9} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600 }}>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function AddScreen({ onRate, onSaved }) {
  const [step, setStep] = useState('search'); // search | confirm | entry
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(null);
  const [place, setPlace] = useState('Home');
  const [type, setType] = useState('First');
  const [date, setDate] = useState('2026-06-02');
  const [note, setNote] = useState('');

  const results = useMemo(() => {
    if (!q.trim()) return [];
    return CL_EXTERNAL.filter(m =>
      m.title.toLowerCase().includes(q.toLowerCase()) || m.director.toLowerCase().includes(q.toLowerCase())).slice(0, 8);
  }, [q]);

  const suggestions = ['Oppenheimer', 'Sicario', 'Fury Road', 'La La Land', 'No Country'];

  /* ── SEARCH ── */
  if (step === 'search') {
    return (
      <div className="cl-scroll" style={{ paddingBottom: 'calc(var(--nav-h) + 34px)' }}>
        <div style={{ padding: 'calc(var(--safe-top) + 4px) 20px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Add to the archive</div>
          <div className="display" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 0.95 }}>Find a Film</div>
        </div>
        <div style={{ padding: '18px 16px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '0 15px', height: 52,
            borderRadius: 16, background: 'var(--ink-820)', border: '1px solid var(--line-amber)',
            boxShadow: '0 0 0 4px rgba(232,185,116,0.05)' }}>
            <Icon name="search" size={19} color="var(--accent)" stroke={2} />
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search a movie database…"
              style={{ flex: 1, border: 'none', background: 'none', outline: 'none', color: 'var(--text)',
                fontFamily: 'var(--font-sans)', fontSize: 16 }} />
            {q && <button className="cl-tap" onClick={() => setQ('')} style={{ border: 'none', background: 'none', color: 'var(--text-faint)', display: 'grid' }}><Icon name="close" size={17} color="currentColor" /></button>}
          </div>
        </div>

        {!q.trim() ? (
          <div style={{ padding: '30px 24px 0', textAlign: 'center' }}>
            <div style={{ width: 76, height: 76, borderRadius: 24, margin: '0 auto 20px', display: 'grid', placeItems: 'center',
              background: 'radial-gradient(circle at 50% 30%, rgba(232,185,116,0.14), var(--ink-820))', border: '1px solid var(--line)' }}>
              <Icon name="film" size={34} color="var(--accent)" stroke={1.4} />
            </div>
            <div className="display" style={{ fontSize: 19, fontWeight: 600 }}>Every film has a memory</div>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 13.5, color: 'var(--text-dim)',
              marginTop: 8, lineHeight: 1.5, maxWidth: 260, marginInline: 'auto' }}>
              Search the database, import the basics in English, then log when and where you watched it.
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 22 }}>
              {suggestions.map(s => (
                <button key={s} className="pressable cl-tap" onClick={() => setQ(s)} style={{ border: '1px solid var(--line)',
                  background: 'var(--ink-800)', color: 'var(--text-dim)', borderRadius: 11, padding: '8px 13px',
                  fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.04em' }}>{s}</button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ padding: '8px 16px 0' }}>
            <div className="eyebrow" style={{ padding: '0 4px 12px' }}>{results.length} results · metadata in English</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {results.map((m, i) => (
                <button key={m.id} className="pressable cl-tap" onClick={() => { setSel(m); setStep('confirm'); }}
                  style={{ display: 'flex', gap: 13, alignItems: 'center', padding: 11, border: 'none', borderRadius: 16,
                    background: 'var(--ink-820)', color: 'var(--text)', textAlign: 'left',
                    animation: `fadeUp 380ms var(--ease-out) ${i * 40}ms both` }}>
                  <Poster movie={m} w={48} rounded={9} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="display" style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.05 }}>{m.title}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-dim)', marginTop: 4 }}>{m.year} · {m.director}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-faint)', marginTop: 3 }}>{m.genres.join(' · ')}</div>
                  </div>
                  {!m.external
                    ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--accent)', border: '1px solid var(--line-amber)', borderRadius: 6, padding: '3px 6px', letterSpacing: '0.08em' }}>IN LIBRARY</span>
                    : <Icon name="add" size={20} color="var(--text-faint)" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── CONFIRM metadata ── */
  if (step === 'confirm' && sel) {
    return (
      <div className="cl-scroll" style={{ paddingBottom: 'calc(var(--nav-h) + 34px)' }}>
        <TopBar onBack={() => setStep('search')} eyebrow="Step 1 of 2" title="Confirm details" />
        <div style={{ padding: '4px 20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <Poster movie={sel} w={150} rounded={16} glow />
          <div className="display" style={{ fontSize: 26, fontWeight: 700, marginTop: 20, lineHeight: 1 }}>{sel.title}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginTop: 8, letterSpacing: '0.05em' }}>
            {sel.year} · {sel.director} · {sel.runtime}m
          </div>
          <div style={{ marginTop: 14 }}><GenreChips genres={sel.genres} /></div>
        </div>
        <div style={{ padding: '22px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 15px',
            borderRadius: 14, background: 'var(--ink-820)', border: '1px solid var(--line)' }}>
            <div>
              <div className="eyebrow">Metadata source</div>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 3 }}>Imported · English · editable</div>
            </div>
            <button className="pressable cl-tap" style={{ border: '1px solid var(--line-strong)', background: 'var(--ink-760)',
              color: 'var(--text)', borderRadius: 11, padding: '9px 13px', display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 500 }}>
              <Icon name="edit" size={15} color="currentColor" /> Edit
            </button>
          </div>
        </div>
        <div style={{ padding: '22px 16px 0' }}>
          <button className="pressable cl-tap" onClick={() => setStep('entry')} style={{ width: '100%', border: 'none',
            borderRadius: 16, padding: '17px', background: 'linear-gradient(150deg, var(--accent), var(--accent-deep))',
            color: '#1a1206', fontFamily: 'var(--font-sans)', fontSize: 15.5, fontWeight: 700,
            boxShadow: '0 12px 30px -10px var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            Continue <Icon name="arrow" size={18} color="currentColor" />
          </button>
        </div>
      </div>
    );
  }

  /* ── WATCH ENTRY ── */
  return (
    <div className="cl-scroll" style={{ paddingBottom: 'calc(var(--nav-h) + 34px)' }}>
      <TopBar onBack={() => setStep('confirm')} eyebrow="Step 2 of 2" title="Log the watch" />
      <div style={{ padding: '4px 16px 0', display: 'flex', gap: 13, alignItems: 'center' }}>
        <Poster movie={sel} w={56} rounded={11} />
        <div>
          <div className="display" style={{ fontSize: 18, fontWeight: 600 }}>{sel.title}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', marginTop: 3 }}>{sel.year} · {sel.director}</div>
        </div>
      </div>

      <div style={{ padding: '24px 16px 0' }}>
        <div className="eyebrow" style={{ marginBottom: 11 }}>Where did you watch it?</div>
        <SegToggle value={place} onChange={setPlace} options={[{ id: 'Home', label: 'Home', icon: 'home-loc' }, { id: 'Cinema', label: 'Cinema', icon: 'cinema' }]} />
      </div>
      <div style={{ padding: '20px 16px 0' }}>
        <div className="eyebrow" style={{ marginBottom: 11 }}>Watch type</div>
        <SegToggle value={type} onChange={setType} options={[{ id: 'First', label: 'First Watch', icon: 'first' }, { id: 'Rewatch', label: 'Rewatch', icon: 'rewatch' }]} />
      </div>
      <div style={{ padding: '20px 16px 0' }}>
        <div className="eyebrow" style={{ marginBottom: 11 }}>Date</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '0 15px', height: 50, borderRadius: 14,
          background: 'var(--ink-820)', border: '1px solid var(--line-strong)' }}>
          <Icon name="calendar" size={18} color="var(--text-faint)" />
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ flex: 1, border: 'none',
            background: 'none', outline: 'none', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 14,
            colorScheme: 'dark' }} />
        </div>
      </div>
      <div style={{ padding: '20px 16px 0' }}>
        <div className="eyebrow" style={{ marginBottom: 11 }}>Note <span style={{ color: 'var(--text-ghost)' }}>· optional</span></div>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="A first impression, a feeling, a line that stayed…"
          rows={3} style={{ width: '100%', resize: 'none', border: '1px solid var(--line-strong)', background: 'var(--ink-820)',
            borderRadius: 14, padding: '13px 15px', color: 'var(--text)', fontFamily: 'var(--font-display)', fontSize: 14.5,
            lineHeight: 1.5, outline: 'none' }} />
      </div>

      <div style={{ padding: '26px 16px 0', display: 'flex', flexDirection: 'column', gap: 11 }}>
        <button className="pressable cl-tap" onClick={() => onRate(sel)} style={{ width: '100%', border: 'none', borderRadius: 16,
          padding: '17px', background: 'linear-gradient(150deg, var(--accent), var(--accent-deep))', color: '#1a1206',
          fontFamily: 'var(--font-sans)', fontSize: 15.5, fontWeight: 700, boxShadow: '0 12px 30px -10px var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Icon name="star" size={17} color="#1a1206" /> Rate it now
        </button>
        <button className="pressable cl-tap" onClick={() => onSaved(sel)} style={{ width: '100%', border: '1px solid var(--line-strong)',
          borderRadius: 16, padding: '15px', background: 'var(--ink-800)', color: 'var(--text-dim)',
          fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500 }}>
          Save without rating
        </button>
      </div>
    </div>
  );
}
window.AddScreen = AddScreen;
