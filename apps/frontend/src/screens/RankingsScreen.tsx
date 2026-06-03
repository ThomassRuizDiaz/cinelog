import { useState, useEffect, useCallback } from 'react';
import { SafeAreaScreen, RankingTabs, MoviePoster, Stars, RankingListItem } from '../components';
import type { MockMovie } from '../types/movie';
import { RANKING_MODES } from '../data/rankings';
import { fmt, fmt1, roundHalf, technical, rankValue } from '../lib/scoring';
import { getRankings, RANKING_MODE_MAP } from '../api/movies';
import type { RankingItem } from '../api/movies';
import { ApiError } from '../api/errors';
import { useAuth } from '../contexts/AuthContext';
import { adaptRankingItem } from '../lib/movieAdapter';
import { MOCK_MOVIES } from '../data/mockMovies';

interface RankingsScreenProps {
  onOpenMovie: (movie: MockMovie) => void;
}

type DataState = 'loading' | 'loaded' | 'error';

interface RankedEntry {
  m: MockMovie;
  v: number;  /* display score for this mode */
}

export default function RankingsScreen({ onOpenMovie }: RankingsScreenProps) {
  const { signOut } = useAuth();
  const [mode, setMode] = useState('personal');
  const [state, setState] = useState<DataState>('loading');
  const [ranked, setRanked] = useState<RankedEntry[]>([]);

  const modeObj = RANKING_MODES.find(r => r.id === mode) ?? RANKING_MODES[0];

  const loadRankings = useCallback((currentMode: string) => {
    setState('loading');
    const apiMode = RANKING_MODE_MAP[currentMode];
    getRankings(apiMode)
      .then((items: RankingItem[]) => {
        const entries: RankedEntry[] = items.map(r => ({
          m: adaptRankingItem(r),
          v: r.score,  /* use server-computed score directly */
        }));
        setRanked(entries);
        setState('loaded');
      })
      .catch(err => {
        if (err instanceof ApiError && err.isUnauthorized) { void signOut(); return; }
        if (!(err instanceof ApiError) && import.meta.env.DEV) {
          console.warn('[Cinelog] Backend unreachable — showing demo data (DEV only)');
          const modeO = RANKING_MODES.find(r => r.id === currentMode) ?? RANKING_MODES[0];
          const entries = [...MOCK_MOVIES]
            .map(m => ({ m, v: rankValue(m, modeO.source) }))
            .sort((a, b) => b.v - a.v || b.m.personal - a.m.personal);
          setRanked(entries);
          setState('loaded');
          return;
        }
        setState('error');
      });
  }, [signOut]);

  useEffect(() => {
    loadRankings(mode);
  }, [mode, loadRankings]);

  const retry = useCallback(() => loadRankings(mode), [mode, loadRankings]);

  const secondaryFor = (m: MockMovie) => {
    const out: { label: string; value: number }[] = [];
    if (modeObj.source !== 'personal') out.push({ label: 'Pers', value: m.personal });
    if (modeObj.source !== 'technical') out.push({ label: 'Tech', value: m.technicalScore ?? technical(m.scores) });
    return out.slice(0, 2);
  };

  const top = ranked[0];
  const rest = ranked.slice(1);

  /* ── Loading ── */
  if (state === 'loading') {
    return (
      <SafeAreaScreen withBottomNav>
        <div style={{ padding: 'calc(var(--safe-top) + 4px) 20px 2px' }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Cargando rankings…</div>
          <div className="display" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 0.95 }}>Rankings</div>
        </div>
        <div style={{ padding: '14px 0 6px' }}>
          <RankingTabs options={RANKING_MODES} value={mode} onChange={setMode} />
        </div>
        <div style={{ padding: '12px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ height: 160, borderRadius: 24, background: 'var(--ink-820)', animation: 'glowPulse 1.8s ease infinite' }} />
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 64, borderRadius: 14, background: 'var(--ink-820)', animation: `glowPulse 1.8s ease ${i * 120}ms infinite` }} />
          ))}
        </div>
      </SafeAreaScreen>
    );
  }

  /* ── Error ── */
  if (state === 'error') {
    return (
      <SafeAreaScreen withBottomNav>
        <div style={{ padding: 'calc(var(--safe-top) + 4px) 20px 2px' }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>The Archive, ranked</div>
          <div className="display" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 0.95 }}>Rankings</div>
        </div>
        <div style={{ padding: '14px 0 6px' }}>
          <RankingTabs options={RANKING_MODES} value={mode} onChange={setMode} />
        </div>
        <div style={{ padding: 'calc(var(--safe-top) + 40px) 32px 0', textAlign: 'center' }}>
          <div className="display" style={{ fontSize: 18, color: 'var(--text-dim)' }}>Sin conexión</div>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, color: 'var(--text-faint)', marginTop: 10, lineHeight: 1.5 }}>
            No se pudieron cargar los rankings.
          </div>
          <button className="pressable cl-tap" onClick={retry} style={{ marginTop: 24, border: '1px solid var(--line-amber)', borderRadius: 14, padding: '13px 28px', background: 'rgba(232,185,116,0.1)', color: 'var(--accent)', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Reintentar
          </button>
        </div>
      </SafeAreaScreen>
    );
  }

  /* ── Empty rankings ── */
  if (!top) {
    return (
      <SafeAreaScreen withBottomNav>
        <div style={{ padding: 'calc(var(--safe-top) + 4px) 20px 2px' }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>The Archive, ranked</div>
          <div className="display" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 0.95 }}>Rankings</div>
        </div>
        <div style={{ padding: '14px 0 6px' }}>
          <RankingTabs options={RANKING_MODES} value={mode} onChange={setMode} />
        </div>
        <div style={{ textAlign: 'center', padding: '60px 32px 0' }}>
          <div className="display" style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-dim)' }}>Sin películas puntuadas</div>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 13, color: 'var(--text-faint)', marginTop: 8 }}>
            Puntúa películas para verlas aquí.
          </div>
        </div>
      </SafeAreaScreen>
    );
  }

  /* ── Loaded ── */
  return (
    <SafeAreaScreen withBottomNav>
      <div style={{ padding: 'calc(var(--safe-top) + 4px) 20px 2px' }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>The Archive, ranked</div>
        <div className="display" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 0.95 }}>Rankings</div>
      </div>

      <div style={{ padding: '14px 0 6px' }}>
        <RankingTabs options={RANKING_MODES} value={mode} onChange={setMode} />
      </div>

      <div style={{ padding: '6px 20px 2px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, color: 'var(--text-dim)' }}>
          {modeObj.label} — {modeObj.tag.toLowerCase()}.
        </div>
      </div>

      <div key={mode} style={{ padding: '12px 16px 0' }}>
        {/* #1 hero */}
        <button className="pressable cl-tap" onClick={() => onOpenMovie(top.m)} style={{ width: '100%', border: 'none', textAlign: 'left', color: 'var(--text)', padding: 0, position: 'relative', borderRadius: 24, overflow: 'hidden', marginBottom: 22, boxShadow: 'var(--shadow-pop)', animation: 'fadeUp 500ms var(--ease-out) both' }}>
          <div style={{ position: 'absolute', inset: 0, transform: 'scale(1.5)', filter: 'blur(30px)', opacity: 0.45 }}>
            <MoviePoster title={top.m.title} year={top.m.year} genres={top.m.genres} director={top.m.director} palette={top.m.poster} posterUrl={top.m.posterUrl} width={400} rounded={0} frame={false} flat />
          </div>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,8,11,0.5), rgba(8,8,11,0.93))' }} />
          <div style={{ position: 'absolute', inset: 0, borderRadius: 24, boxShadow: 'inset 0 0 0 1px var(--line-amber)' }} />
          <div style={{ position: 'relative', padding: 16, display: 'flex', gap: 15, alignItems: 'flex-end' }}>
            <span className="display tnum" style={{ position: 'absolute', top: -22, right: 2, fontSize: 150, fontWeight: 800, lineHeight: 1, color: 'transparent', WebkitTextStroke: '2px var(--line-amber)', pointerEvents: 'none' } as React.CSSProperties}>1</span>
            <MoviePoster title={top.m.title} year={top.m.year} genres={top.m.genres} director={top.m.director} palette={top.m.poster} posterUrl={top.m.posterUrl} width={104} rounded={13} glow />
            <div style={{ flex: 1, minWidth: 0, paddingBottom: 2 }}>
              <div className="eyebrow" style={{ color: 'var(--accent)', marginBottom: 6 }}>★ Number One</div>
              <div className="display" style={{ fontSize: 24, fontWeight: 700, lineHeight: 0.98 }}>{top.m.title}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', marginTop: 5 }}>{top.m.year > 0 ? `${top.m.year} · ` : ''}{top.m.director}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
                <span className="display tnum" style={{ fontSize: 34, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>{fmt(top.v)}</span>
                <Stars value={roundHalf(top.v)} size={14} />
              </div>
            </div>
          </div>
        </button>

        {/* 2..N */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {rest.map((r, idx) => (
            <RankingListItem
              key={r.m.id}
              movie={r.m}
              rank={idx + 2}
              score={r.v}
              secondaryScores={secondaryFor(r.m)}
              onOpen={() => onOpenMovie(r.m)}
              delay={idx * 55}
            />
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 20px 4px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 8.5, color: 'var(--text-ghost)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {ranked.length} films · {fmt1(ranked.reduce((s, r) => s + r.v, 0) / ranked.length)} avg {modeObj.label.toLowerCase()}
      </div>
    </SafeAreaScreen>
  );
}
