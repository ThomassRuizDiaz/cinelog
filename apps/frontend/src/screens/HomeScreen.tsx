import { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaScreen, MoviePoster, ScoreBadge, WatchMeta,
  SectionHead, MovieCard, Icon,
} from '../components';
import type { TabId } from '../components';
import type { MockMovie } from '../types/movie';
import { fmt1, fmtScore } from '../lib/scoring';
import { getDashboard } from '../api/movies';
import { ApiError } from '../api/errors';
import { useAuth } from '../contexts/AuthContext';
import {
  adaptDashboardLatestWatch, adaptRankingItem, adaptRecentItem,
} from '../lib/movieAdapter';
import { MOCK_MOVIES } from '../data/mockMovies';
import { technical } from '../lib/scoring';

interface HomeScreenProps {
  onOpenMovie: (movie: MockMovie) => void;
  onTabChange: (tab: TabId) => void;
  onSettings: () => void;
}

type DataState = 'loading' | 'loaded' | 'error';

interface HomeData {
  films: number;
  watches: number;
  avgP: number;
  avgT: number;
  latestMovie: MockMovie | null;
  latestWatchedAt: string;
  latestWatchType: 'FIRST_WATCH' | 'REWATCH';
  latestWatchLocation: 'HOME' | 'CINEMA';
  top5: MockMovie[];
  recent: MockMovie[];
}

function buildMockHomeData(): HomeData {
  const movies = MOCK_MOVIES;
  const watches = movies.reduce((s, m) => s + m.watches.length, 0);
  const ps = movies.reduce((s, m) => s + m.personal, 0);
  const ts = movies.reduce((s, m) => s + technical(m.scores), 0);

  const allEntries = movies.flatMap(m => m.watches.map(w => ({ movie: m, w })));
  const latestEntry = allEntries.length === 0 ? null
    : allEntries.reduce((best, curr) => curr.w.watchedAt > best.w.watchedAt ? curr : best);

  const top5 = [...movies].sort((a, b) => b.personal - a.personal).slice(0, 5);
  const recent = [...movies]
    .map(m => ({ m, d: m.watches[0].watchedAt }))
    .sort((a, b) => b.d.localeCompare(a.d))
    .slice(0, 4)
    .map(x => x.m);
  return {
    films: movies.length, watches,
    avgP: ps / movies.length, avgT: ts / movies.length,
    latestMovie: latestEntry?.movie ?? null,
    latestWatchedAt: latestEntry?.w.watchedAt ?? '',
    latestWatchType: latestEntry?.w.watchType ?? 'FIRST_WATCH',
    latestWatchLocation: latestEntry?.w.watchLocation ?? 'HOME',
    top5, recent,
  };
}

export default function HomeScreen({ onOpenMovie, onTabChange, onSettings }: HomeScreenProps) {
  const { signOut } = useAuth();
  const [state, setState] = useState<DataState>('loading');
  const [data, setData] = useState<HomeData | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    setState('loading');
    getDashboard()
      .then(d => {
        if (d.stats.totalMovies === 0) {
          setData({
            films: 0, watches: 0, avgP: 0, avgT: 0,
            latestMovie: null, latestWatchedAt: '', latestWatchType: 'FIRST_WATCH', latestWatchLocation: 'HOME',
            top5: [], recent: [],
          });
        } else {
          const latestMovie = d.latestWatch
            ? adaptDashboardLatestWatch(d.latestWatch)
            : null;
          const top5 = d.topPersonal.slice(0, 5).map(adaptRankingItem);
          const recent = d.recentlyAdded.slice(0, 4).map(adaptRecentItem);
          setData({
            films: d.stats.totalMovies,
            watches: d.stats.totalWatchEntries,
            avgP: d.stats.averagePersonalScore ?? 0,
            avgT: d.stats.averageTechnicalScore ?? 0,
            latestMovie,
            latestWatchedAt: d.latestWatch?.watchedAt ?? '',
            latestWatchType: d.latestWatch?.watchType ?? 'FIRST_WATCH',
            latestWatchLocation: d.latestWatch?.watchLocation ?? 'HOME',
            top5,
            recent,
          });
        }
        setState('loaded');
      })
      .catch(err => {
        if (err instanceof ApiError && err.isUnauthorized) { void signOut(); return; }
        /* Network error — fall back to mock data */
        if (!(err instanceof ApiError) && import.meta.env.DEV) {
          console.warn('[Cinelog] Backend unreachable — showing demo data (DEV only)');
          setData(buildMockHomeData());
          setState('loaded');
          return;
        }
        setState('error');
      });
  }, [retryKey, signOut]);

  const retry = useCallback(() => setRetryKey(k => k + 1), []);

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  /* ── Loading ── */
  if (state === 'loading') {
    return (
      <SafeAreaScreen withBottomNav>
        <div style={{ padding: 'calc(var(--safe-top) + 6px) 20px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 7 }}>Sala de proyección privada</div>
          <div className="display" style={{ fontSize: 30, fontWeight: 700, lineHeight: 0.96 }}>Cine<span style={{ fontStyle: 'italic', fontWeight: 500 }}>log</span></div>
        </div>
        <div style={{ padding: '20px 16px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[220, 88, 170, 100].map((h, i) => (
            <div key={i} style={{ height: h, borderRadius: 22, background: 'var(--ink-820)', animation: `glowPulse 1.8s ease ${i * 120}ms infinite` }} />
          ))}
        </div>
      </SafeAreaScreen>
    );
  }

  /* ── Error ── */
  if (state === 'error') {
    return (
      <SafeAreaScreen withBottomNav>
        <div style={{ padding: 'calc(var(--safe-top) + 40px) 32px 0', textAlign: 'center' }}>
          <div className="display" style={{ fontSize: 18, color: 'var(--text-dim)' }}>Sin conexión</div>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, color: 'var(--text-faint)', marginTop: 10, lineHeight: 1.5 }}>
            No se pudo conectar al archivo.
          </div>
          <button className="pressable cl-tap" onClick={retry} style={{ marginTop: 24, border: '1px solid var(--line-amber)', borderRadius: 14, padding: '13px 28px', background: 'rgba(232,185,116,0.1)', color: 'var(--accent)', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Reintentar
          </button>
        </div>
      </SafeAreaScreen>
    );
  }

  const d = data!;

  /* ── Empty archive ── */
  if (!d.latestMovie) {
    return (
      <SafeAreaScreen withBottomNav>
        <div style={{ padding: 'calc(var(--safe-top) + 6px) 20px 4px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 7 }}>Sala de proyección privada</div>
            <div className="display" style={{ fontSize: 30, fontWeight: 700, lineHeight: 0.96, letterSpacing: '-0.02em' }}>
              Cine<span style={{ fontStyle: 'italic', fontWeight: 500 }}>log</span>
            </div>
          </div>
          <button className="pressable cl-tap" onClick={onSettings} style={{ border: '1px solid var(--line-strong)', background: 'var(--ink-800)', width: 40, height: 40, borderRadius: 13, display: 'grid', placeItems: 'center', color: 'var(--text-dim)' }}>
            <Icon name="cog" size={19} color="currentColor" />
          </button>
        </div>
        <div style={{ textAlign: 'center', padding: '60px 32px 0' }}>
          <div className="display" style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>Archivo vacío</div>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 15, color: 'var(--text-faint)', marginTop: 12, lineHeight: 1.6 }}>
            Tu archivo cinéfilo privado te espera.<br />Añade una película para comenzar.
          </div>
          <button className="pressable cl-tap" onClick={() => onTabChange('add')} style={{ marginTop: 28, border: 'none', borderRadius: 14, padding: '14px 32px', background: 'linear-gradient(150deg, var(--accent), var(--accent-deep))', color: '#1a1206', fontFamily: 'var(--font-sans)', fontSize: 14.5, fontWeight: 700, cursor: 'pointer' }}>
            Añade tu primera película
          </button>
        </div>
      </SafeAreaScreen>
    );
  }

  const lm = d.latestMovie;
  const tech = lm.technicalScore ?? 0;

  return (
    <SafeAreaScreen withBottomNav>
      {/* header */}
      <div style={{ padding: 'calc(var(--safe-top) + 6px) 20px 4px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 7 }}>Sala de proyección privada</div>
          <div className="display" style={{ fontSize: 30, fontWeight: 700, lineHeight: 0.96, letterSpacing: '-0.02em' }}>
            Cine<span style={{ fontStyle: 'italic', fontWeight: 500 }}>log</span>
          </div>
        </div>
        <button className="pressable cl-tap" onClick={onSettings} style={{ border: '1px solid var(--line-strong)', background: 'var(--ink-800)', width: 40, height: 40, borderRadius: 13, display: 'grid', placeItems: 'center', color: 'var(--text-dim)' }}>
          <Icon name="cog" size={19} color="currentColor" />
        </button>
      </div>
      <div style={{ padding: '10px 20px 0', fontFamily: 'var(--font-display)', fontSize: 15, fontStyle: 'italic', color: 'var(--text-dim)' }}>
        {greet}. {d.films} película{d.films !== 1 ? 's' : ''} {d.films === 1 ? 'espera' : 'esperan'} en la oscuridad.
      </div>

      {/* latest watch hero */}
      <div style={{ padding: '20px 16px 4px' }}>
        <button className="pressable cl-tap" onClick={() => onOpenMovie(lm)} style={{ width: '100%', border: 'none', padding: 0, borderRadius: 26, position: 'relative', overflow: 'hidden', textAlign: 'left', color: 'var(--text)', boxShadow: 'var(--shadow-pop)' }}>
          <div style={{ position: 'absolute', inset: 0, transform: 'scale(1.6)', filter: 'blur(34px) saturate(150%)', opacity: 0.6 }}>
            <MoviePoster title={lm.title} year={lm.year} genres={lm.genres} director={lm.director} palette={lm.poster} posterUrl={lm.posterUrl} width={420} rounded={0} frame={false} flat />
          </div>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,8,11,0.55) 0%, rgba(8,8,11,0.35) 30%, rgba(8,8,11,0.92) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)', borderRadius: 26 }} />
          <div style={{ position: 'relative', padding: '16px 16px 17px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="eyebrow" style={{ color: 'var(--accent)' }}>● Último visionado</div>
              {d.latestWatchedAt && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-dim)', letterSpacing: '0.08em' }}>{d.latestWatchedAt}</span>}
            </div>
            <div style={{ display: 'flex', gap: 15, marginTop: 14, alignItems: 'flex-end' }}>
              <MoviePoster title={lm.title} year={lm.year} genres={lm.genres} director={lm.director} palette={lm.poster} posterUrl={lm.posterUrl} width={108} rounded={13} glow />
              <div style={{ flex: 1, minWidth: 0, paddingBottom: 2 }}>
                <div className="display" style={{ fontSize: 25, fontWeight: 700, lineHeight: 0.98, letterSpacing: '-0.01em' }}>{lm.title}</div>
                {lm.year > 0 && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', marginTop: 6, letterSpacing: '0.05em' }}>{lm.year} · {lm.director}</div>}
                <div style={{ marginTop: 10 }}>
                  <WatchMeta location={d.latestWatchLocation} watchType={d.latestWatchType} />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 13 }}>
                  {lm.personal > 0 && <ScoreBadge value={lm.personal} label="Personal" variant="primary" />}
                  {tech > 0 && <ScoreBadge value={tech} label="Technical" variant="line" />}
                </div>
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* stats plaques */}
      <div style={{ padding: '16px 16px 4px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
        {[
          { n: d.films,              l: 'Películas' },
          { n: d.watches,            l: 'Visionados' },
          { n: d.avgP > 0 ? fmt1(d.avgP) : '—', l: 'Media pers.' },
          { n: d.avgT > 0 ? fmt1(d.avgT) : '—', l: 'Media téc.' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'linear-gradient(160deg, var(--ink-800), var(--ink-850))', border: '1px solid var(--line)', borderRadius: 15, padding: '12px 8px 10px', textAlign: 'center', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}>
            <div className="tnum display" style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>{s.n}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-faint)', marginTop: 5 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Top 5 canon */}
      {d.top5.length > 0 && (
        <div style={{ padding: '22px 0 0' }}>
          <div style={{ padding: '0 20px' }}>
            <SectionHead eyebrow="Tu canon" title="Top 5 personal" action="Rankings" onAction={() => onTabChange('rankings')} />
          </div>
          <div className="cl-scroll" style={{ position: 'static', display: 'flex', gap: 16, overflowX: 'auto', padding: '6px 20px 8px', scrollbarWidth: 'none' }}>
            {d.top5.map((m, i) => (
              <button key={m.id} className="pressable cl-tap" onClick={() => onOpenMovie(m)} style={{ border: 'none', background: 'none', padding: 0, position: 'relative', flexShrink: 0, display: 'block', paddingLeft: i === 0 ? 4 : 18 }}>
                <span className="display tnum" style={{ position: 'absolute', left: i === 0 ? -8 : 0, bottom: -10, zIndex: 0, fontSize: 92, fontWeight: 800, lineHeight: 0.7, color: 'transparent', WebkitTextStroke: '1.5px var(--rank-stroke)', pointerEvents: 'none' } as React.CSSProperties}>{i + 1}</span>
                <span style={{ position: 'relative', zIndex: 1, display: 'block' }}>
                  <MoviePoster title={m.title} year={m.year} genres={m.genres} director={m.director} palette={m.poster} posterUrl={m.posterUrl} width={104} rounded={12} />
                </span>
                <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 5, marginTop: 9, paddingLeft: 2 }}>
                  <Icon name="star" size={11} color="var(--star)" />
                  <span className="tnum" style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{fmtScore(m.personal)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* recent watches */}
      {d.recent.length > 0 && (
        <div style={{ padding: '18px 16px 0' }}>
          <div style={{ padding: '0 4px' }}>
            <SectionHead eyebrow="Desde el proyector" title="Visionados recientes" action="Library" onAction={() => onTabChange('library')} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {d.recent.map((m, i) => <MovieCard key={m.id} movie={m} onOpen={() => onOpenMovie(m)} delay={i * 50} />)}
          </div>
        </div>
      )}
    </SafeAreaScreen>
  );
}
