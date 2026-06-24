import { useState, useEffect, useCallback, useMemo } from 'react';
import { SafeAreaScreen, MovieCard, MoviePoster, RankingTabs, Icon, Stars } from '../components';
import type { MockMovie } from '../types/movie';
import { technical, fmt1 } from '../lib/scoring';
import { CATEGORIES } from '../data/categories';
import type { ScoreKey } from '../types/rating';
import { getMovies } from '../api/movies';
import { ApiError } from '../api/errors';
import { useAuth } from '../contexts/AuthContext';
import { adaptMovie } from '../lib/movieAdapter';
import { MOCK_MOVIES } from '../data/mockMovies';

interface LibraryScreenProps {
  onOpenMovie: (movie: MockMovie) => void;
}

type SortId = 'personal' | 'technical' | 'objective' | 'latest' | 'year' | 'title' | ScoreKey;
type DataState = 'loading' | 'loaded' | 'error';

const BASE_SORTS = [
  { id: 'personal',  label: 'Personal' },
  { id: 'technical', label: 'Technical' },
  { id: 'objective', label: 'Objective' },
  { id: 'latest',    label: 'Latest' },
  { id: 'year',      label: 'Year' },
  { id: 'title',     label: 'Title' },
];

export default function LibraryScreen({ onOpenMovie }: LibraryScreenProps) {
  const { signOut } = useAuth();
  const [state, setState] = useState<DataState>('loading');
  const [movies, setMovies] = useState<MockMovie[]>([]);
  const [retryKey, setRetryKey] = useState(0);

  const [q, setQ] = useState('');
  const [genre, setGenre] = useState('');
  const [sort, setSort] = useState<SortId>('personal');
  const [grid, setGrid] = useState(false);

  useEffect(() => {
    setState('loading');
    getMovies({ size: 100 })
      .then(list => {
        setMovies(list.map(adaptMovie));
        setState('loaded');
      })
      .catch(err => {
        if (err instanceof ApiError && err.isUnauthorized) { void signOut(); return; }
        if (!(err instanceof ApiError) && import.meta.env.DEV) {
          console.warn('[Cinelog] Backend unreachable — showing demo data (DEV only)');
          setMovies(MOCK_MOVIES);
          setState('loaded');
          return;
        }
        setState('error');
      });
  }, [retryKey, signOut]);

  const retry = useCallback(() => setRetryKey(k => k + 1), []);

  const genreOptions = useMemo(() => {
    const set = new Set<string>();
    movies.forEach(m => m.genres.forEach(g => set.add(g)));
    return ['', ...Array.from(set).sort()];
  }, [movies]);

  const sortOptions = useMemo(() => [
    ...BASE_SORTS,
    ...CATEGORIES.map(c => ({ id: c.key, label: c.short })),
  ], []);

  const list = useMemo(() => {
    const arr = movies.filter(m => {
      const matchQ = !q || m.title.toLowerCase().includes(q.toLowerCase()) || m.director.toLowerCase().includes(q.toLowerCase());
      const matchGenre = !genre || m.genres.includes(genre);
      return matchQ && matchGenre;
    });
    const val = (m: MockMovie): string | number => {
      if (sort === 'personal')  return m.personal;
      if (sort === 'technical') return m.technicalScore ?? technical(m.scores);
      if (sort === 'objective') return m.objective;
      if (sort === 'latest')    return m.watches[0]?.watchedAt ?? '';
      if (sort === 'year')      return m.year;
      if (sort === 'title')     return m.title;
      return m.scores[sort as ScoreKey] ?? 0;
    };
    return [...arr].sort((a, b) => {
      const va = val(a), vb = val(b);
      if (sort === 'title')  return String(va).localeCompare(String(vb));
      if (sort === 'latest') return String(vb).localeCompare(String(va));
      return Number(vb) - Number(va);
    });
  }, [movies, q, genre, sort]);

  const scoreOf = (m: MockMovie): number => {
    if (sort === 'technical') return m.technicalScore ?? technical(m.scores);
    if (sort === 'objective') return m.objective;
    const cat = CATEGORIES.find(c => c.key === sort);
    if (cat) return m.scores[sort as ScoreKey] ?? 0;
    return m.personal;
  };

  const scoreLabel =
    sort === 'technical' ? 'TECHNICAL' :
    sort === 'objective' ? 'OBJECTIVE' :
    CATEGORIES.find(c => c.key === sort)?.short.toUpperCase() ?? 'PERSONAL';

  /* ── Loading ── */
  if (state === 'loading') {
    return (
      <SafeAreaScreen withBottomNav>
        <div style={{ padding: 'calc(var(--safe-top) + 4px) 20px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Cargando archivo…</div>
          <div className="display" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 0.95 }}>Library</div>
        </div>
        <div style={{ padding: '24px 16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ height: 82, borderRadius: 18, background: 'var(--ink-820)', animation: `glowPulse 1.8s ease ${i * 100}ms infinite` }} />
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
            No se pudo cargar la biblioteca.
          </div>
          <button className="pressable cl-tap" onClick={retry} style={{ marginTop: 24, border: '1px solid var(--line-amber)', borderRadius: 14, padding: '13px 28px', background: 'rgba(232,185,116,0.1)', color: 'var(--accent)', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Reintentar
          </button>
        </div>
      </SafeAreaScreen>
    );
  }

  /* ── Loaded (may be empty) ── */
  return (
    <SafeAreaScreen withBottomNav>
      <div style={{ padding: 'calc(var(--safe-top) + 4px) 20px 0', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>{list.length} of {movies.length} films</div>
          <div className="display" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 0.95 }}>Library</div>
        </div>
        <button className="pressable cl-tap" onClick={() => setGrid(g => !g)} style={{ border: '1px solid var(--line-strong)', background: 'var(--ink-800)', width: 40, height: 40, borderRadius: 13, display: 'grid', placeItems: 'center', color: 'var(--text-dim)' }}>
          <Icon name={grid ? 'list' : 'grid2'} size={18} color="currentColor" />
        </button>
      </div>

      <div style={{ padding: '16px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', height: 46, borderRadius: 15, background: 'var(--ink-820)', border: '1px solid var(--line-strong)' }}>
          <Icon name="search" size={18} color="var(--text-faint)" stroke={2} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar en tu archivo"
            style={{ flex: 1, border: 'none', background: 'none', outline: 'none', color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: 15 }} />
          {q && (
            <button className="cl-tap" onClick={() => setQ('')} style={{ border: 'none', background: 'none', color: 'var(--text-faint)', padding: 4, display: 'grid' }}>
              <Icon name="close" size={16} color="currentColor" />
            </button>
          )}
        </div>
      </div>

      {genreOptions.length > 1 && (
        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', padding: '0 16px 12px', scrollbarWidth: 'none' }}>
          {genreOptions.map(g => (
            <button
              key={g || '__all__'}
              className="cl-tap"
              onClick={() => setGenre(g)}
              style={{
                flexShrink: 0, border: genre === g ? '1px solid var(--accent)' : '1px solid var(--line-strong)',
                borderRadius: 20, padding: '5px 13px',
                background: genre === g ? 'rgba(232,185,116,0.14)' : 'var(--ink-820)',
                color: genre === g ? 'var(--accent)' : 'var(--text-dim)',
                fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.06em',
                textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {g || 'Todos los géneros'}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <span style={{ paddingLeft: 16, display: 'inline-flex' }}><Icon name="sort" size={15} color="var(--text-faint)" /></span>
        <RankingTabs options={sortOptions} value={sort} onChange={id => setSort(id as SortId)} />
      </div>

      {movies.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 32px 0' }}>
          <div className="display" style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-dim)' }}>Archivo vacío</div>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 13, color: 'var(--text-faint)', marginTop: 8 }}>
            Sin películas registradas.
          </div>
        </div>
      ) : grid ? (
        <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {list.map((m, i) => (
            <button key={m.id} className="pressable cl-tap" onClick={() => onOpenMovie(m)} style={{ border: 'none', background: 'none', padding: 0, animation: `fadeUp 440ms var(--ease-out) ${i * 35}ms both` }}>
              <MoviePoster title={m.title} year={m.year} genres={m.genres} director={m.director} palette={m.poster} posterUrl={m.posterUrl} width={108} rounded={11} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 7 }}>
                <Icon name="star" size={10} color="var(--star)" />
                <span className="tnum" style={{ fontFamily: 'var(--font-display)', fontSize: 12.5, fontWeight: 600, color: 'var(--accent)' }}>{fmt1(scoreOf(m))}</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map((m, i) => (
            <MovieCard key={m.id} movie={m} onOpen={() => onOpenMovie(m)} score={scoreOf(m)} scoreLabel={scoreLabel} delay={i * 40} />
          ))}
        </div>
      )}

      {list.length === 0 && movies.length > 0 && (
        <div style={{ textAlign: 'center', padding: '60px 32px 0' }}>
          <div className="display" style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-dim)' }}>Sin resultados</div>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 13, color: 'var(--text-faint)', marginTop: 8 }}>
            {q && genre
              ? `No hay resultados para "${q}" en ${genre}.`
              : q
              ? `No hay resultados para "${q}".`
              : `No hay películas en el género ${genre}.`}
            {' '}Prueba otro filtro.
          </div>
          <Stars value={0} size={14} />
        </div>
      )}
    </SafeAreaScreen>
  );
}
