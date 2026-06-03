/* ───────────────────────── CineLog — app shell ───────────────────────── */
const { useState, useEffect, useMemo } = React;
const FONT_MAP = { 'Bodoni Moda': "'Bodoni Moda', Georgia, serif", 'Fraunces': "'Fraunces', Georgia, serif", 'Archivo': "'Archivo', system-ui, sans-serif" };
const ACCENTS = {
  Amber:   ['#e8b974', '#f7d6a0', '#c79a55'],
  Copper:  ['#c9743f', '#e09a6a', '#a85e30'],
  Crimson: ['#c25149', '#dd7d72', '#9e3d36'],
  Brass:   ['#d8c48f', '#efe1b4', '#b09a63'],
};
const GRAIN_URL = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": ["#e8b974", "#f7d6a0", "#c79a55"],
  "displayFont": "Bodoni Moda",
  "grain": 0.05
}/*EDITMODE-END*/;

/* ── animated layer (push / sheet) ── */
function Layer({ content, render, anim, z }) {
  const [mounted, setMounted] = useState(content);
  const [state, setState] = useState('closed');
  useEffect(() => {
    if (content) { setMounted(content); const r = setTimeout(() => setState('open'), 20); return () => clearTimeout(r); }
    else if (mounted) { setState('closing'); const t = setTimeout(() => { setState('closed'); setMounted(null); }, 360); return () => clearTimeout(t); }
  }, [content]);
  if (!mounted) return null;
  const base = { position: 'absolute', inset: 0, zIndex: z, background: 'var(--ink-900)', willChange: 'transform',
    transition: anim === 'sheet' ? 'transform 380ms var(--ease-out)' : 'transform 360ms var(--ease-out)',
    boxShadow: '-12px 0 40px -12px rgba(0,0,0,0.6)' };
  const t = anim === 'sheet'
    ? (state === 'open' ? 'translateY(0)' : 'translateY(100%)')
    : (state === 'open' ? 'translateX(0)' : 'translateX(100%)');
  return <div style={{ ...base, transform: t, borderRadius: anim === 'sheet' && state === 'open' ? '0' : 0 }}>{render(mounted)}</div>;
}

function useFit(w, h, chrome) {
  const [s, setS] = useState(1);
  useEffect(() => {
    const fn = () => {
      const m = 36;
      setS(Math.min((window.innerWidth - m) / w, (window.innerHeight - chrome - m) / h, 1));
    };
    fn(); window.addEventListener('resize', fn); return () => window.removeEventListener('resize', fn);
  }, [w, h, chrome]);
  return s;
}

function MobileApp() {
  const [tab, setTab] = useState('home');
  const [detail, setDetail] = useState(null);
  const [rating, setRating] = useState(null);
  const [settings, setSettings] = useState(false);
  const [toast, setToast] = useState(null);
  const movies = window.CL_MOVIES;

  const stats = useMemo(() => {
    let wc = 0; movies.forEach(m => wc += m.watches.length);
    return { films: movies.length, watchCount: wc };
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const onTab = (t) => { setDetail(null); setRating(null); setSettings(false); setTab(t); };

  let screen;
  if (tab === 'home') screen = <HomeScreen movies={movies} onOpen={setDetail} onTab={onTab} onSettings={() => setSettings(true)} />;
  else if (tab === 'library') screen = <LibraryScreen movies={movies} onOpen={setDetail} />;
  else if (tab === 'rankings') screen = <RankingsScreen movies={movies} onOpen={setDetail} />;
  else screen = <AddScreen onRate={(m) => setRating(m)} onSaved={(m) => { onTab('library'); showToast(`${m.title} saved to your archive`); }} />;

  return (
    <div className="cl-root cl-grain">
      <div style={{ position: 'absolute', inset: 0 }} key={tab}>{screen}</div>

      <BottomNav tab={tab} onTab={onTab} />

      <Layer content={settings ? 'settings' : null} z={40} anim="push"
        render={() => <SettingsScreen onBack={() => setSettings(false)} stats={stats} />} />
      <Layer content={detail} z={42} anim="push"
        render={(m) => <DetailScreen movie={m} onBack={() => setDetail(null)} onRate={(mm) => setRating(mm)} />} />
      <Layer content={rating} z={55} anim="sheet"
        render={(m) => <RatingScreen movie={m} onClose={() => setRating(null)}
          onSave={(mm, sc, f) => { setRating(null); showToast(`${mm.title} rated ${CL.fmt1(f)}★`); }} />} />

      {toast && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 'calc(var(--nav-h) + 40px)', zIndex: 80,
          display: 'flex', justifyContent: 'center', pointerEvents: 'none', animation: 'fadeUp 320ms var(--ease-out) both' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '11px 18px', borderRadius: 14,
            background: 'rgba(28,28,34,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--line-amber)', boxShadow: 'var(--shadow-pop)' }}>
            <Icon name="star" size={15} color="var(--accent)" />
            <span style={{ fontSize: 13, fontWeight: 500 }}>{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = useState('iphone');
  const phoneScale = useFit(402, 874, 70);
  const deskScale = useFit(1280, 824, 70);

  const rootVars = {
    '--accent': t.accent[0], '--accent-bright': t.accent[1], '--accent-deep': t.accent[2],
    '--font-display': FONT_MAP[t.displayFont] || FONT_MAP['Bodoni Moda'],
    '--grain-opacity': t.grain, '--grain-url': GRAIN_URL,
  };

  return (
    <div style={{ ...rootVars, position: 'fixed', inset: 0, background: 'radial-gradient(120% 90% at 50% -10%, #14110d 0%, #0a0a0c 46%, #060608 100%)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* top chrome */}
      <div style={{ height: 54, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: 'var(--text-dim)' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Cine<span style={{ fontStyle: 'italic', fontWeight: 500 }}>log</span></span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>Prototype</span>
        </div>
        <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: 'rgba(20,20,26,0.7)', border: '1px solid var(--line)' }}>
          {[{ id: 'iphone', l: 'iPhone' }, { id: 'desktop', l: 'Desktop' }].map(v => (
            <button key={v.id} onClick={() => setView(v.id)} style={{ border: 'none', cursor: 'pointer', borderRadius: 9, padding: '6px 15px',
              fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600,
              background: view === v.id ? 'var(--accent)' : 'transparent', color: view === v.id ? '#1a1206' : 'var(--text-dim)', transition: 'all var(--dur) var(--ease-out)' }}>{v.l}</button>
          ))}
        </div>
      </div>

      {/* stage */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {view === 'iphone' ? (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%,-50%) scale(${phoneScale})`, transformOrigin: 'center' }}>
            <IOSDevice dark width={402} height={874}>
              <MobileApp />
            </IOSDevice>
          </div>
        ) : (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%,-50%) scale(${deskScale})`, transformOrigin: 'center' }}>
            <div className="cl-grain" style={{ width: 1280, height: 824, borderRadius: 16, overflow: 'hidden', position: 'relative',
              boxShadow: '0 50px 100px -30px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)' }}>
              {/* window chrome */}
              <div style={{ height: 38, background: 'var(--ink-820)', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8, position: 'relative', zIndex: 20 }}>
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#e0655c' }} />
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#e0b34c' }} />
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#5cb868' }} />
                <span style={{ marginLeft: 14, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.04em' }}>cinelog.app</span>
              </div>
              <div style={{ position: 'absolute', top: 38, left: 0, right: 0, bottom: 0 }}>
                <DesktopApp movies={window.CL_MOVIES} onOpenMobile={() => setView('iphone')} />
              </div>
            </div>
          </div>
        )}
      </div>

      <TweaksPanel>
        <TweakSection label="Accent" />
        <TweakColor label="Cinematic accent" value={t.accent}
          options={[ACCENTS.Amber, ACCENTS.Copper, ACCENTS.Crimson, ACCENTS.Brass]}
          onChange={(v) => setTweak('accent', v)} />
        <TweakSection label="Typography" />
        <TweakRadio label="Display face" value={t.displayFont} options={['Bodoni Moda', 'Fraunces', 'Archivo']}
          onChange={(v) => setTweak('displayFont', v)} />
        <TweakSection label="Atmosphere" />
        <TweakSlider label="Film grain" value={t.grain} min={0} max={0.14} step={0.01}
          onChange={(v) => setTweak('grain', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
