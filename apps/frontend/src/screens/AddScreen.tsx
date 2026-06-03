import { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaScreen, TopBar, MoviePoster, GenreChips,
  SearchInput, Icon, PrimaryButton, SecondaryButton,
} from '../components';
import type { MockMovie, ExternalMovieResult } from '../types/movie';
import type { PosterPalette } from '../types/movie';
import type { IconName } from '../components/Icon';
import type { WatchLocation, WatchType } from '../types/watch';
import { searchExternalMovies } from '../api/movies';
import { importMovie, createWatchEntry } from '../api/watchEntries';
import { addToWatchlist } from '../api/watchlist';
import { ApiError } from '../api/errors';
import { useAuth } from '../contexts/AuthContext';
import { derivePalette, } from '../lib/posterPalette';
import { ZERO_SCORES } from '../lib/movieAdapter';
import { SEARCH_SUGGESTIONS } from '../data/mockSearchPool';

interface AddScreenProps {
  onRateAfterWatch: (movie: MockMovie, watchEntryId: number) => void;
  onSaved: (title: string) => void;
  onSavedToWatchlist?: (title: string) => void;
  initialStep?: AddStep;
  initialLibraryMovie?: MockMovie;
  /** Called when back is pressed in log-watch mode (existing library movie). */
  onCancel?: () => void;
}

type AddStep = 'search' | 'confirm' | 'entry';

/** Internal type for a selected film — bridges external results and library movies. */
interface SelectedFilm {
  /** null = new movie that needs import; number = already in library */
  movieId: number | null;
  title: string;
  year: number;
  director: string;
  genres: string[];
  poster: PosterPalette;
  posterUrl?: string | null;
  externalResult: ExternalMovieResult | null;
}

function SegToggle({ options, value, onChange }: {
  options: { id: string; label: string; icon: IconName }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {options.map(o => {
        const active = value === o.id;
        return (
          <button key={o.id} className="pressable cl-tap" onClick={() => onChange(o.id)}
            style={{ flex: 1, border: active ? '1px solid var(--line-amber)' : '1px solid var(--line-strong)', background: active ? 'linear-gradient(150deg, rgba(232,185,116,0.16), rgba(232,185,116,0.05))' : 'var(--ink-820)', color: active ? 'var(--accent-bright)' : 'var(--text-dim)', borderRadius: 14, padding: '14px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, transition: 'all var(--dur) var(--ease-out)' }}>
            <Icon name={o.icon} size={20} color="currentColor" stroke={1.9} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600 }}>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function AddScreen({ onRateAfterWatch, onSaved, onSavedToWatchlist, initialStep = 'search', initialLibraryMovie, onCancel }: AddScreenProps) {
  const { signOut } = useAuth();

  const [step, setStep] = useState<AddStep>(initialStep);

  /* ── Search state ── */
  const [q, setQ] = useState('');
  const [searchState, setSearchState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [searchResults, setSearchResults] = useState<ExternalMovieResult[]>([]);
  const [searchErrorMsg, setSearchErrorMsg] = useState<string | null>(null);

  /* ── Selected film ── */
  const [sel, setSel] = useState<SelectedFilm | null>(() => {
    if (!initialLibraryMovie) return null;
    const numericId = parseInt(initialLibraryMovie.id);
    return {
      movieId: isNaN(numericId) ? null : numericId,
      title: initialLibraryMovie.title,
      year: initialLibraryMovie.year,
      director: initialLibraryMovie.director,
      genres: initialLibraryMovie.genres,
      poster: initialLibraryMovie.poster,
      posterUrl: initialLibraryMovie.posterUrl,
      externalResult: null,
    };
  });

  /* ── Watch entry form ── */
  const [place, setPlace] = useState<WatchLocation>('HOME');
  const [watchType, setWatchType] = useState<WatchType>('FIRST_WATCH');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');

  /* ── Submit state ── */
  const [submitState, setSubmitState] = useState<'idle' | 'saving' | 'conflict' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  /* ── Watchlist save state ── */
  type WlState = 'idle' | 'saving' | 'saved' | 'conflict-watchlist' | 'conflict-library' | 'error';
  const [wlState, setWlState] = useState<WlState>('idle');

  const handleSaveToWatchlist = useCallback(async () => {
    if (!sel?.externalResult) return;
    setWlState('saving');
    const r = sel.externalResult;
    try {
      await addToWatchlist({
        source: r.source, externalId: r.externalId,
        title: r.title, originalTitle: r.originalTitle,
        releaseYear: r.releaseYear, directors: r.directors,
        posterPath: r.posterPath, posterUrl: r.posterUrl,
        genres: r.genres,
      });
      setWlState('saved');
      setTimeout(() => { onSavedToWatchlist?.(r.title); }, 800);
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthorized) { void signOut(); return; }
      if (err instanceof ApiError && err.isConflict) {
        const msg = err.message?.toLowerCase() ?? '';
        setWlState(msg.includes('archive') ? 'conflict-library' : 'conflict-watchlist');
      } else {
        setWlState('error');
      }
    }
  }, [sel, onSavedToWatchlist, signOut]);

  /* ── API search with 400ms debounce ── */
  useEffect(() => {
    const trimmed = q.trim();
    if (!trimmed) {
      setSearchState('idle');
      setSearchResults([]);
      setSearchErrorMsg(null);
      return;
    }
    if (trimmed.length < 2) return;  /* backend requires ≥2 chars */

    const timer = setTimeout(() => {
      setSearchState('loading');
      setSearchErrorMsg(null);
      searchExternalMovies(trimmed)
        .then(results => {
          setSearchResults(results);
          setSearchState('loaded');
        })
        .catch(err => {
          if (err instanceof ApiError && err.isUnauthorized) { void signOut(); return; }
          setSearchErrorMsg(err instanceof ApiError ? err.message : 'Search unavailable.');
          setSearchState('error');
        });
    }, 400);

    return () => clearTimeout(timer);
  }, [q, signOut]);

  /* ── Async save handler ── */
  const handleSave = useCallback(async (rateAfter: boolean) => {
    if (!sel || !date) return;
    setSubmitState('saving');
    setSubmitError(null);

    try {
      let movieId = sel.movieId;

      if (movieId === null) {
        if (!sel.externalResult) { setSubmitState('error'); setSubmitError('No external result to import.'); return; }
        const imported = await importMovie(sel.externalResult);
        movieId = imported.id;
      }

      const watchEntry = await createWatchEntry(movieId, {
        watchedAt: date,
        watchType,
        watchLocation: place,
        notes: note.trim() || undefined,
      });

      setSubmitState('idle');

      if (rateAfter) {
        const forRating: MockMovie = {
          id: String(movieId),
          title: sel.title,
          year: sel.year,
          director: sel.director,
          genres: sel.genres,
          runtime: 0,
          poster: sel.poster,
          posterUrl: sel.posterUrl ?? null,
          rated: false,
          scores: ZERO_SCORES,
          personal: 0, objective: 0, technicalScore: 0,
          review: '', note: '',
          watches: [{
            watchedAt: date, watchType, watchLocation: place,
            scored: false, note: note.trim(), watchEntryId: watchEntry.id,
          }],
        };
        onRateAfterWatch(forRating, watchEntry.id);
      } else {
        onSaved(sel.title);
      }
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthorized) { void signOut(); return; }
      if (err instanceof ApiError && err.isConflict) {
        setSubmitState('conflict');
      } else {
        setSubmitError(err instanceof ApiError ? err.message : 'Something went wrong.');
        setSubmitState('error');
      }
    }
  }, [sel, date, watchType, place, note, onRateAfterWatch, onSaved, signOut]);

  /* ── SEARCH step ── */
  if (step === 'search') return (
    <SafeAreaScreen withBottomNav>
      <div style={{ padding: 'calc(var(--safe-top) + 4px) 20px 0' }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>Añadir al archivo</div>
        <div className="display" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 0.95 }}>Buscar película</div>
      </div>
      <div style={{ padding: '18px 16px 8px' }}>
        <SearchInput value={q} onChange={setQ} onClear={() => setQ('')} />
      </div>

      {!q.trim() ? (
        <div style={{ padding: '30px 24px 0', textAlign: 'center' }}>
          <div style={{ width: 76, height: 76, borderRadius: 24, margin: '0 auto 20px', display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at 50% 30%, rgba(232,185,116,0.14), var(--ink-820))', border: '1px solid var(--line)' }}>
            <Icon name="film" size={34} color="var(--accent)" stroke={1.4} />
          </div>
          <div className="display" style={{ fontSize: 19, fontWeight: 600 }}>Cada película tiene su historia</div>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 13.5, color: 'var(--text-dim)', marginTop: 8, lineHeight: 1.5, maxWidth: 260, marginInline: 'auto' }}>
            Busca en TMDb, importa los metadatos y registra cuándo y dónde la viste.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 22 }}>
            {SEARCH_SUGGESTIONS.map(s => (
              <button key={s} className="pressable cl-tap" onClick={() => setQ(s)} style={{ border: '1px solid var(--line)', background: 'var(--ink-800)', color: 'var(--text-dim)', borderRadius: 11, padding: '8px 13px', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.04em' }}>{s}</button>
            ))}
          </div>
        </div>
      ) : searchState === 'loading' ? (
        <div style={{ padding: '8px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="eyebrow" style={{ padding: '0 4px 4px' }}>Buscando en TMDb…</div>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 68, borderRadius: 16, background: 'var(--ink-820)', animation: `glowPulse 1.8s ease ${i * 100}ms infinite` }} />
          ))}
        </div>
      ) : searchState === 'error' ? (
        <div style={{ padding: '40px 32px 0', textAlign: 'center' }}>
          <div className="display" style={{ fontSize: 16, color: 'var(--text-dim)' }}>Búsqueda no disponible</div>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 13, color: 'var(--text-faint)', marginTop: 8, lineHeight: 1.5 }}>{searchErrorMsg}</div>
          <button className="pressable cl-tap" onClick={() => setQ(prev => prev)} style={{ marginTop: 20, border: '1px solid var(--line-amber)', borderRadius: 12, padding: '11px 24px', background: 'rgba(232,185,116,0.1)', color: 'var(--accent)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>Reintentar</button>
        </div>
      ) : searchState === 'loaded' && searchResults.length === 0 ? (
        <div style={{ padding: '40px 32px 0', textAlign: 'center' }}>
          <div className="display" style={{ fontSize: 16, color: 'var(--text-dim)' }}>Sin resultados</div>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 13, color: 'var(--text-faint)', marginTop: 8 }}>Prueba con otro título o director.</div>
        </div>
      ) : (
        <div style={{ padding: '8px 16px 0' }}>
          <div className="eyebrow" style={{ padding: '0 4px 12px' }}>{searchResults.length} resultados · metadatos en inglés</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {searchResults.map((r, i) => {
              const director = r.directors[0] ?? 'Unknown';
              const palette = derivePalette(r.title, r.releaseYear);
              return (
                <button
                  key={r.externalId}
                  className="pressable cl-tap"
                  onClick={() => {
                    setSel({ movieId: null, title: r.title, year: r.releaseYear, director, genres: r.genres, poster: palette, posterUrl: r.posterUrl, externalResult: r });
                    setStep('confirm');
                  }}
                  style={{ display: 'flex', gap: 13, alignItems: 'center', padding: 11, border: 'none', borderRadius: 16, background: 'var(--ink-820)', color: 'var(--text)', textAlign: 'left', animation: `fadeUp 380ms var(--ease-out) ${i * 40}ms both` }}
                >
                  <MoviePoster title={r.title} year={r.releaseYear} genres={r.genres} director={director} palette={palette} posterUrl={r.posterUrl} width={48} rounded={9} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="display" style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.05 }}>{r.title}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-dim)', marginTop: 4 }}>{r.releaseYear} · {director}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-faint)', marginTop: 3 }}>{r.genres.slice(0, 3).join(' · ')}</div>
                  </div>
                  <Icon name="add" size={20} color="var(--text-faint)" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </SafeAreaScreen>
  );

  if (!sel) return null;

  /* ── CONFIRM step ── */
  if (step === 'confirm') return (
    <SafeAreaScreen withBottomNav>
      <TopBar onBack={() => setStep('search')} eyebrow="Paso 1 de 2" title="Confirmar detalles" />
      <div style={{ padding: '4px 20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <MoviePoster title={sel.title} year={sel.year} genres={sel.genres} director={sel.director} palette={sel.poster} posterUrl={sel.posterUrl} width={150} rounded={16} glow />
        <div className="display" style={{ fontSize: 26, fontWeight: 700, marginTop: 20, lineHeight: 1 }}>{sel.title}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginTop: 8, letterSpacing: '0.05em' }}>
          {sel.year > 0 ? `${sel.year} · ` : ''}{sel.director}
        </div>
        <div style={{ marginTop: 14 }}><GenreChips genres={sel.genres} /></div>
      </div>
      <div style={{ padding: '22px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 15px', borderRadius: 14, background: 'var(--ink-820)', border: '1px solid var(--line)' }}>
          <div>
            <div className="eyebrow">Fuente de metadatos</div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 3 }}>TMDb · inglés · importado</div>
          </div>
          <Icon name="dot" size={8} color="var(--accent)" />
        </div>
      </div>
      <div style={{ padding: '22px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <PrimaryButton onClick={() => { setWlState('idle'); setStep('entry'); }} icon="arrow" fullWidth>Continuar</PrimaryButton>

        {/* Only for external results (not library log-watch) */}
        {sel.externalResult && (
          <>
            <SecondaryButton
              fullWidth
              disabled={wlState === 'saving' || wlState === 'saved'}
              onClick={() => void handleSaveToWatchlist()}
            >
              {wlState === 'saving' ? 'Guardando…'
                : wlState === 'saved' ? '✓ Guardado en Watchlist'
                : 'Guardar en Watchlist'}
            </SecondaryButton>
            {(wlState === 'conflict-watchlist') && (
              <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', letterSpacing: '0.04em' }}>
                Ya está en tu Watchlist
              </div>
            )}
            {(wlState === 'conflict-library') && (
              <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
                Ya está en tu Library
              </div>
            )}
            {(wlState === 'error') && (
              <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#d07070', letterSpacing: '0.04em' }}>
                Error al guardar. Inténtalo de nuevo.
              </div>
            )}
          </>
        )}
      </div>
    </SafeAreaScreen>
  );

  /* ── ENTRY (Log Watch) step ── */

  /* Conflict: duplicate movie */
  if (submitState === 'conflict') return (
    <SafeAreaScreen withBottomNav>
      <TopBar onBack={() => { setSubmitState('idle'); setStep('confirm'); }} eyebrow="Importar" title="Ya en tu archivo" />
      <div style={{ padding: '30px 32px 0', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, margin: '0 auto 20px', display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at 40% 30%, rgba(232,185,116,0.18), var(--ink-820))', border: '1px solid var(--line-amber)' }}>
          <Icon name="library" size={30} color="var(--accent)" stroke={1.5} />
        </div>
        <div className="display" style={{ fontSize: 20, fontWeight: 700 }}>{sel.title}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, color: 'var(--text-dim)', marginTop: 10, lineHeight: 1.6, maxWidth: 280, marginInline: 'auto' }}>
          Esta película ya está en tu archivo. Búscala en Library para registrar otro visionado.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 28 }}>
          <PrimaryButton icon="library" fullWidth onClick={() => { /* parent navigates to library */ onSaved(''); }}>Ir a Library</PrimaryButton>
          <SecondaryButton fullWidth onClick={() => { setSubmitState('idle'); setStep('search'); setQ(''); }}>Buscar de nuevo</SecondaryButton>
        </div>
      </div>
    </SafeAreaScreen>
  );

  return (
    <SafeAreaScreen withBottomNav>
      <TopBar
        onBack={initialLibraryMovie && onCancel ? onCancel : () => setStep('confirm')}
        eyebrow={initialLibraryMovie ? 'Registrar visionado' : 'Paso 2 de 2'}
        title="Registrar el visionado"
      />
      <div style={{ padding: '4px 16px 0', display: 'flex', gap: 13, alignItems: 'center' }}>
        <MoviePoster title={sel.title} year={sel.year} genres={sel.genres} director={sel.director} palette={sel.poster} posterUrl={sel.posterUrl} width={56} rounded={11} />
        <div>
          <div className="display" style={{ fontSize: 18, fontWeight: 600 }}>{sel.title}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', marginTop: 3 }}>{sel.year > 0 ? `${sel.year} · ` : ''}{sel.director}</div>
        </div>
      </div>

      <div style={{ padding: '24px 16px 0' }}>
        <div className="eyebrow" style={{ marginBottom: 11 }}>¿Dónde la viste?</div>
        <SegToggle value={place} onChange={v => setPlace(v as WatchLocation)}
          options={[{ id: 'HOME', label: 'Casa', icon: 'home-loc' }, { id: 'CINEMA', label: 'Cine', icon: 'cinema' }]} />
      </div>
      <div style={{ padding: '20px 16px 0' }}>
        <div className="eyebrow" style={{ marginBottom: 11 }}>Tipo de visionado</div>
        <SegToggle value={watchType} onChange={v => setWatchType(v as WatchType)}
          options={[{ id: 'FIRST_WATCH', label: 'Primer visionado', icon: 'first' }, { id: 'REWATCH', label: 'Revisionado', icon: 'rewatch' }]} />
      </div>
      <div style={{ padding: '20px 16px 0' }}>
        <div className="eyebrow" style={{ marginBottom: 11 }}>Fecha</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '0 15px', height: 50, borderRadius: 14, background: 'var(--ink-820)', border: '1px solid var(--line-strong)' }}>
          <Icon name="calendar" size={18} color="var(--text-faint)" />
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ flex: 1, border: 'none', background: 'none', outline: 'none', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 14, colorScheme: 'dark' }} />
        </div>
      </div>
      <div style={{ padding: '20px 16px 0' }}>
        <div className="eyebrow" style={{ marginBottom: 11 }}>Nota <span style={{ color: 'var(--text-ghost)' }}>· opcional</span></div>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Una primera impresión, un sentimiento, una frase que perduró…" rows={3}
          style={{ width: '100%', resize: 'none', border: '1px solid var(--line-strong)', background: 'var(--ink-820)', borderRadius: 14, padding: '13px 15px', color: 'var(--text)', fontFamily: 'var(--font-display)', fontSize: 14.5, lineHeight: 1.5, outline: 'none', boxSizing: 'border-box' }} />
      </div>

      {/* API error */}
      {submitState === 'error' && submitError && (
        <div style={{ margin: '14px 16px 0', padding: '11px 14px', borderRadius: 12, background: 'rgba(184,73,63,0.09)', border: '1px solid rgba(184,73,63,0.22)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#d07070', letterSpacing: '0.02em' }}>{submitError}</div>
        </div>
      )}

      <div style={{ padding: '26px 16px 0', display: 'flex', flexDirection: 'column', gap: 11 }}>
        <PrimaryButton icon="star" fullWidth disabled={submitState === 'saving'} onClick={() => void handleSave(true)}>
          {submitState === 'saving' ? 'Guardando…' : 'Puntuar ahora'}
        </PrimaryButton>
        <SecondaryButton fullWidth disabled={submitState === 'saving'} onClick={() => void handleSave(false)}>
          {submitState === 'saving' ? 'Guardando…' : 'Guardar sin puntuar'}
        </SecondaryButton>
      </div>
    </SafeAreaScreen>
  );
}
