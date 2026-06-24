import { useState, useEffect } from 'react';
import {
  TopBar, MoviePoster, Stars, GenreChips,
  ScoreConstellation, WatchTimeline, ReviewBlock, Icon,
} from '../components';
import type { MockMovie } from '../types/movie';
import type { InitialRatingData } from '../types/rating';
import { technical, roundHalf, fmt, fmt1, fmtScore } from '../lib/scoring';
import { CATEGORIES } from '../data/categories';
import { getMovieDetail, deleteMovie } from '../api/movies';
import { getRating } from '../api/watchEntries';
import { ApiError } from '../api/errors';
import { useAuth } from '../contexts/AuthContext';
import { adaptMovieDetail, adaptRatingScores, adaptCategoryNotes } from '../lib/movieAdapter';

interface DetailScreenProps {
  movie: MockMovie;
  onBack: () => void;
  onRate: (movie: MockMovie, watchEntryId?: number, ratingData?: InitialRatingData) => void;
  onLogWatch: (movie: MockMovie) => void;
  onDeleted?: () => void;
}

type DetailTab = 'profile' | 'history';

export default function DetailScreen({ movie: initialMovie, onBack, onRate, onLogWatch, onDeleted }: DetailScreenProps) {
  const { signOut } = useAuth();
  const [tab, setTab] = useState<DetailTab>('profile');
  const [movie, setMovie] = useState<MockMovie>(initialMovie);
  const [activeWatchEntryId, setActiveWatchEntryId] = useState<number | null>(null);
  const [ratingData, setRatingData] = useState<InitialRatingData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  /* Fetch real detail + category scores when movie came from the real API. */
  useEffect(() => {
    const numericId = parseInt(initialMovie.id);
    if (isNaN(numericId)) return;
    getMovieDetail(numericId)
      .then(detail => {
        const adapted = adaptMovieDetail(detail);
        const activeEntry = detail.watchEntries.find(we => we.activeRating);
        setActiveWatchEntryId(activeEntry?.id ?? null);
        if (activeEntry?.id) {
          getRating(activeEntry.id)
            .then(rating => {
              setMovie({ ...adapted, scores: adaptRatingScores(rating) });
              setRatingData({
                categoryNotes: rating.categoryNotes
                  ? adaptCategoryNotes(rating.categoryNotes)
                  : undefined,
              });
            })
            .catch(err => {
              if (err instanceof ApiError && err.isUnauthorized) { void signOut(); return; }
              setMovie(adapted);
            });
        } else {
          setMovie(adapted);
        }
      })
      .catch(err => {
        if (err instanceof ApiError && err.isUnauthorized) void signOut();
      });
  }, [initialMovie.id, signOut]);

  const tech = movie.technicalScore ?? technical(movie.scores);
  const vis = roundHalf(tech);
  const hasOverride = movie.personal > 0 && Math.abs(movie.personal - vis) > 0.01;
  const numericId = parseInt(movie.id);

  const handleDelete = async () => {
    if (isNaN(numericId) || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteMovie(numericId);
      setDeleting(false);
      setShowDeleteConfirm(false);
      onDeleted?.();
      onBack();
    } catch (err) {
      setDeleting(false);
      if (err instanceof ApiError && err.isUnauthorized) { void signOut(); return; }
      setDeleteError(err instanceof ApiError ? err.message : 'Error al eliminar. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="cl-scroll" style={{ paddingBottom: 'calc(var(--safe-bottom) + 96px)', position: 'absolute', inset: 0 }}>
      {/* hero backdrop */}
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 420, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, transform: 'scale(1.7)', filter: 'blur(40px) saturate(150%)', opacity: 0.55 }}>
            <MoviePoster title={movie.title} year={movie.year} genres={movie.genres} director={movie.director} palette={movie.poster} posterUrl={movie.posterUrl} width={420} rounded={0} frame={false} flat />
          </div>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,8,11,0.45) 0%, rgba(8,8,11,0.2) 24%, rgba(8,8,11,0.82) 70%, var(--ink-900) 100%)' }} />
        </div>

        <TopBar onBack={onBack} transparent trailing={
          !isNaN(numericId) ? (
            <button
              className="pressable cl-tap"
              onClick={() => { setShowDeleteConfirm(true); setDeleteError(null); }}
              style={{ border: '1px solid rgba(184,73,63,0.3)', background: 'rgba(20,20,26,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', width: 38, height: 38, borderRadius: 12, display: 'grid', placeItems: 'center', color: '#c07070' }}
            >
              <Icon name="close" size={18} color="currentColor" />
            </button>
          ) : undefined
        } />

        <div style={{ position: 'relative', padding: '6px 20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <MoviePoster title={movie.title} year={movie.year} genres={movie.genres} director={movie.director} palette={movie.poster} posterUrl={movie.posterUrl} width={138} rounded={16} glow />
          <div className="display" style={{ fontSize: 28, fontWeight: 700, marginTop: 20, lineHeight: 1, letterSpacing: '-0.01em' }}>{movie.title}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginTop: 9, letterSpacing: '0.05em' }}>
            {movie.year} · {movie.director}{movie.runtime > 0 ? ` · ${movie.runtime}m` : ''}
          </div>
          <div style={{ marginTop: 14 }}><GenreChips genres={movie.genres} /></div>
        </div>
      </div>

      {/* score group */}
      <div style={{ padding: '24px 16px 0' }}>
        <div style={{ position: 'relative', padding: '18px 16px', borderRadius: 20, background: 'linear-gradient(155deg, var(--ink-800), var(--ink-850))', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: 8 }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div className="display tnum" style={{ fontSize: 34, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>{fmtScore(movie.personal)}</div>
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}><Stars value={movie.personal} size={11} /></div>
            <div className="eyebrow" style={{ marginTop: 8, color: 'var(--accent-deep)' }}>Personal</div>
          </div>
          <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--line)' }} />
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div className="display tnum" style={{ fontSize: 28, fontWeight: 600, lineHeight: 1 }}>{fmt(tech)}</div>
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}><Stars value={vis} size={10} /></div>
            <div className="eyebrow" style={{ marginTop: 8 }}>Technical</div>
          </div>
          <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--line)' }} />
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div className="display tnum" style={{ fontSize: 28, fontWeight: 600, lineHeight: 1 }}>{fmt(movie.objective)}</div>
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}><Stars value={roundHalf(movie.objective)} size={10} /></div>
            <div className="eyebrow" style={{ marginTop: 8 }}>Objective</div>
          </div>
        </div>
        {hasOverride && (
          <div style={{ marginTop: 9, fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-faint)', textAlign: 'center', letterSpacing: '0.04em' }}>
            ✶ Personal score overrides the calculated {fmt1(vis)} — heart over math.
          </div>
        )}
      </div>

      {/* review */}
      <div style={{ padding: '18px 20px 0' }}>
        <ReviewBlock text={movie.review} />
      </div>

      {/* quick actions */}
      <div style={{ padding: '20px 16px 0', display: 'flex', gap: 10 }}>
        <button className="pressable cl-tap" onClick={() => onRate(movie, activeWatchEntryId ?? undefined, ratingData ?? undefined)} style={{ flex: 1, border: 'none', borderRadius: 14, padding: '14px', background: 'linear-gradient(150deg, var(--accent), var(--accent-deep))', color: '#1a1206', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 10px 24px -12px var(--accent)' }}>
          <Icon name="star" size={16} color="#1a1206" /> Editar puntuación
        </button>
        <button className="pressable cl-tap" onClick={() => onLogWatch(movie)} style={{ flex: 1, border: '1px solid var(--line-strong)', borderRadius: 14, padding: '14px', background: 'var(--ink-800)', color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          <Icon name="add" size={16} color="currentColor" /> Registrar visionado
        </button>
      </div>

      {/* tabs */}
      <div style={{ padding: '26px 16px 0' }}>
        <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid var(--line)' }}>
          {([{ id: 'profile', l: 'Perfil de puntuación' }, { id: 'history', l: 'Historial de visionados' }] as const).map(t => (
            <button key={t.id} className="cl-tap" onClick={() => setTab(t.id)} style={{ border: 'none', background: 'none', padding: '0 0 11px', color: tab === t.id ? 'var(--text)' : 'var(--text-faint)', position: 'relative', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
              {t.l}
              {tab === t.id && <span style={{ position: 'absolute', left: 0, right: 0, bottom: -1, height: 2, background: 'var(--accent)', borderRadius: 2 }} />}
            </button>
          ))}
        </div>
      </div>

      {/* score profile */}
      {tab === 'profile' && (
        <div style={{ animation: 'fadeIn 320ms var(--ease-out) both' }}>
          <div style={{ padding: '22px 16px 0', display: 'flex', justifyContent: 'center' }}>
            <ScoreConstellation scores={movie.scores} size={290} />
          </div>
          <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-faint)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 6 }}>
            Constelación · 9 categorías
          </div>

          {/* score ledger */}
          <div style={{ padding: '20px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
            {CATEGORIES.map(c => (
              <div key={c.key} style={{ padding: '11px 12px', borderRadius: 13, background: 'var(--ink-820)', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{c.short}</span>
                  <span className="tnum" style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>{fmtScore(movie.scores[c.key])}</span>
                </div>
                <div style={{ marginTop: 8, height: 4, borderRadius: 3, background: 'var(--ink-680)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(movie.scores[c.key] / 10) * 100}%`, borderRadius: 3, background: 'linear-gradient(90deg, var(--accent-deep), var(--accent))' }} />
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-faint)', marginTop: 6, letterSpacing: '0.06em' }}>PESO {c.weight}%</div>
              </div>
            ))}
          </div>

          {/* private note */}
          <div style={{ padding: '22px 16px 0' }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Nota privada</div>
            <div style={{ padding: '15px 16px', borderRadius: 16, background: 'var(--ink-820)', border: '1px solid var(--line)', fontFamily: 'var(--font-display)', fontSize: 14.5, lineHeight: 1.6, color: 'var(--text-dim)', fontStyle: 'italic' }}>
              {movie.note}
            </div>
          </div>
        </div>
      )}

      {/* watch history */}
      {tab === 'history' && (
        <div style={{ padding: '22px 16px 0', animation: 'fadeIn 320ms var(--ease-out) both' }}>
          <div className="eyebrow" style={{ marginBottom: 14, paddingLeft: 4 }}>{movie.watches.length} entradas en el archivo</div>
          <WatchTimeline movie={movie} />
        </div>
      )}

      {/* Delete confirmation overlay */}
      {showDeleteConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 90, display: 'grid', placeItems: 'center', background: 'rgba(8,8,11,0.86)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', animation: 'fadeIn 200ms ease both', padding: '0 24px' }}
          onClick={() => !deleting && setShowDeleteConfirm(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 360, padding: '26px 22px', borderRadius: 22, background: 'var(--ink-850)', border: '1px solid rgba(184,73,63,0.28)', animation: 'fadeUp 320ms var(--ease-out) both' }}
          >
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <div className="display" style={{ fontSize: 20, fontWeight: 700 }}>¿Eliminar película?</div>
              <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, color: 'var(--text-dim)', marginTop: 10, lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--text)' }}>{movie.title}</strong> y todos sus visionados y puntuaciones serán eliminados permanentemente.
              </div>
              <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 10, color: '#c07070', letterSpacing: '0.06em' }}>
                Esta acción es irreversible.
              </div>
            </div>
            {deleteError && (
              <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 11, background: 'rgba(184,73,63,0.09)', border: '1px solid rgba(184,73,63,0.22)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#d07070' }}>{deleteError}</div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="pressable cl-tap"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                style={{ flex: 1, border: '1px solid var(--line-strong)', background: 'var(--ink-800)', color: 'var(--text-dim)', borderRadius: 14, padding: '13px', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                className="pressable cl-tap"
                onClick={() => void handleDelete()}
                disabled={deleting}
                style={{ flex: 1, border: '1px solid rgba(184,73,63,0.4)', background: 'rgba(184,73,63,0.12)', color: '#d07070', borderRadius: 14, padding: '13px', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer' }}
              >
                {deleting ? 'Eliminando…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
