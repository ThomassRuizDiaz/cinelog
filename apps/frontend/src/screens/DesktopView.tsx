import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MoviePoster, ScoreBadge, Stars, GenreChips, ScoreConstellation,
  WatchTimeline, WatchMeta, MovieCard, HalfStepRatingControl, Icon,
} from '../components';
import type { MockMovie, ExternalMovieResult, PosterPalette } from '../types/movie';
import type { RatingScores } from '../types/rating';
import type { WatchType, WatchLocation } from '../types/watch';
import type { WatchlistItem } from '../types/watchlist';
import { RANKING_MODES } from '../data/rankings';
import { CATEGORIES } from '../data/categories';
import { technical, roundHalf, fmt, fmt1, fmtDate } from '../lib/scoring';
import {
  getDashboard, getMovies, getRankings, getMovieDetail,
  RANKING_MODE_MAP, deleteMovie, searchExternalMovies,
  type DashboardResponse,
} from '../api/movies';
import { getRating, saveRating, buildSaveRatingRequest, importMovie, createWatchEntry } from '../api/watchEntries';
import {
  getWatchlist, addToWatchlist, deleteWatchlistItem, convertWatchlistItem,
} from '../api/watchlist';
import {
  adaptMovie, adaptMovieDetail, adaptRankingItem,
  adaptDashboardLatestWatch, adaptRatingScores, ZERO_SCORES,
} from '../lib/movieAdapter';
import { derivePalette } from '../lib/posterPalette';
import { ApiError } from '../api/errors';
import { useAuth } from '../contexts/AuthContext';
import GptExportScreen from './GptExportScreen';

type DesktopNav = 'home' | 'library' | 'watchlist' | 'rankings';

interface DeskSelectedFilm {
  movieId: number | null;
  title: string;
  year: number;
  director: string;
  genres: string[];
  poster: PosterPalette;
  posterUrl?: string | null;
  externalResult: ExternalMovieResult | null;
}

/* ── Shared toggle ────────────────────────────────────────────────────────── */
function DeskSegBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button className="pressable cl-tap" onClick={onClick} style={{ flex: 1, border: active ? '1px solid var(--line-amber)' : '1px solid var(--line)', background: active ? 'rgba(232,185,116,0.12)' : 'var(--ink-820)', color: active ? 'var(--accent)' : 'var(--text-dim)', borderRadius: 11, padding: '11px 6px', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-sans)', cursor: 'pointer', transition: 'all 180ms ease' }}>
      {label}
    </button>
  );
}

/* ── Desk Rating modal ────────────────────────────────────────────────────── */
function DeskRating({ movie, watchEntryId, onClose, onSave }: {
  movie: MockMovie; watchEntryId?: number; onClose: () => void; onSave: () => void;
}) {
  const { signOut } = useAuth();
  const [scores, setScores] = useState<RatingScores>({ ...movie.scores });
  const [override, setOverride] = useState(Math.abs(movie.personal - roundHalf(technical(movie.scores))) > 0.01);
  const [personal, setPersonal] = useState(movie.personal);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const tech = technical(scores), vis = roundHalf(tech);
  const finalScore = override ? personal : vis;
  const bump = (d: number) => setPersonal(p => Math.max(0, Math.min(5, Math.round((p + d) * 2) / 2)));

  const doSave = async () => {
    if (saving) return;
    setSaveError(null);
    if (watchEntryId) {
      setSaving(true);
      try {
        await saveRating(watchEntryId, buildSaveRatingRequest(scores, { personalFinalScore: override ? personal : undefined }));
        setSaving(false); onSave();
      } catch (err) {
        setSaving(false);
        if (err instanceof ApiError && err.isUnauthorized) { void signOut(); return; }
        setSaveError(err instanceof ApiError ? err.message : 'Error al guardar. Inténtalo de nuevo.');
      }
    } else { onSave(); }
  };

  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 80, display: 'grid', placeItems: 'center', background: 'rgba(6,6,9,0.7)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', animation: 'fadeIn 240ms ease both' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 720, maxHeight: 740, display: 'flex', borderRadius: 24, overflow: 'hidden', background: 'var(--ink-850)', border: '1px solid var(--line-strong)', boxShadow: 'var(--shadow-pop)', animation: 'fadeUp 380ms var(--ease-out) both' }}>
        <div style={{ width: 300, flexShrink: 0, padding: 26, background: 'linear-gradient(160deg, var(--ink-820), var(--ink-870))', borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column' }}>
          <div className="eyebrow">Rating · {movie.year}</div>
          <div className="display" style={{ fontSize: 22, fontWeight: 700, marginTop: 6, lineHeight: 1 }}>{movie.title}</div>
          <div style={{ display: 'grid', placeItems: 'center', marginTop: 18 }}><ScoreConstellation scores={scores} size={244} /></div>
          <div style={{ marginTop: 'auto', paddingTop: 18 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="display tnum" style={{ fontSize: 36, fontWeight: 700, color: 'var(--accent)' }}>{fmt(tech)}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-faint)', letterSpacing: '0.1em' }}>TÉCNICO</span>
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Stars value={vis} size={15} />
              <span className="tnum" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{fmt1(vis)} visible</span>
            </div>
          </div>
        </div>
        <div className="cl-scroll" style={{ position: 'relative', flex: 1, padding: 22 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CATEGORIES.map(c => (
              <div key={c.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '11px 14px', borderRadius: 13, background: 'var(--ink-820)', border: '1px solid var(--line)' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 14.5, fontWeight: 600 }}>{c.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, color: 'var(--text-faint)', border: '1px solid var(--line)', borderRadius: 4, padding: '1px 4px' }}>{c.weight}%</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{c.desc}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  <HalfStepRatingControl value={scores[c.key]} onChange={v => setScores(s => ({ ...s, [c.key]: v }))} size={22} gap={5} />
                  <span className="display tnum" style={{ fontSize: 17, fontWeight: 700, color: scores[c.key] > 0 ? 'var(--accent)' : 'var(--text-ghost)', width: 30, textAlign: 'right' }}>{fmt1(scores[c.key])}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: '13px 15px', borderRadius: 13, background: 'var(--ink-820)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600 }}>Puntuación final personal</div>
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>Anular el cálculo</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {override && (<>
                <button className="pressable cl-tap" onClick={() => bump(-0.5)} style={{ width: 30, height: 30, borderRadius: 9, border: '1px solid var(--line-strong)', background: 'var(--ink-760)', color: 'var(--text)', fontSize: 18, display: 'grid', placeItems: 'center' }}>−</button>
                <span className="display tnum" style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)', width: 34, textAlign: 'center' }}>{fmt1(personal)}</span>
                <button className="pressable cl-tap" onClick={() => bump(0.5)} style={{ width: 30, height: 30, borderRadius: 9, border: '1px solid var(--line-strong)', background: 'var(--ink-760)', color: 'var(--text)', fontSize: 18, display: 'grid', placeItems: 'center' }}>+</button>
              </>)}
              <button className="cl-tap" onClick={() => setOverride(o => !o)} style={{ border: 'none', background: 'none', padding: 0 }}>
                <span style={{ width: 44, height: 26, borderRadius: 20, background: override ? 'var(--accent)' : 'var(--ink-680)', display: 'block', position: 'relative' }}>
                  <span style={{ position: 'absolute', top: 3, left: override ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left var(--dur) var(--ease-spring)', boxShadow: '0 2px 5px rgba(0,0,0,0.4)' }} />
                </span>
              </button>
            </div>
          </div>
          {saveError && <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 11, background: 'rgba(184,73,63,0.09)', border: '1px solid rgba(184,73,63,0.22)' }}><div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#d07070' }}>{saveError}</div></div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="pressable cl-tap" onClick={onClose} style={{ flex: '0 0 auto', padding: '13px 20px', borderRadius: 13, border: '1px solid var(--line-strong)', background: 'var(--ink-800)', color: 'var(--text-dim)', fontSize: 14, fontWeight: 500 }}>Cancelar</button>
            <button className="pressable cl-tap" onClick={() => void doSave()} disabled={saving} style={{ flex: 1, padding: '13px', borderRadius: 13, border: 'none', background: saving ? 'var(--ink-720)' : 'linear-gradient(150deg, var(--accent), var(--accent-deep))', color: saving ? 'var(--text-faint)' : '#1a1206', fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Guardando…' : `Guardar · ${fmt1(finalScore)}★`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Desk Detail drawer ───────────────────────────────────────────────────── */
function DeskDetail({ movie: initialMovie, onClose, onRate, onDeleted, onLogWatch }: {
  movie: MockMovie; onClose: () => void;
  onRate: (movie: MockMovie, watchEntryId?: number) => void;
  onDeleted?: () => void;
  onLogWatch?: (movie: MockMovie) => void;
}) {
  const { signOut } = useAuth();
  const [movie, setMovie] = useState(initialMovie);
  const [activeWatchEntryId, setActiveWatchEntryId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const id = parseInt(initialMovie.id);
    if (isNaN(id)) return;
    getMovieDetail(id)
      .then(detail => {
        const adapted = adaptMovieDetail(detail);
        const activeEntry = detail.watchEntries.find(we => we.activeRating);
        setActiveWatchEntryId(activeEntry?.id ?? null);
        if (activeEntry?.id) {
          getRating(activeEntry.id)
            .then(rating => setMovie({ ...adapted, scores: adaptRatingScores(rating) }))
            .catch(err => { if (err instanceof ApiError && err.isUnauthorized) { void signOut(); return; } setMovie(adapted); });
        } else { setMovie(adapted); }
      })
      .catch(err => { if (err instanceof ApiError && err.isUnauthorized) void signOut(); });
  }, [initialMovie.id, signOut]);

  const handleDelete = async () => {
    const id = parseInt(movie.id);
    if (isNaN(id)) return;
    setDeleting(true);
    try {
      await deleteMovie(id);
      onClose();
      onDeleted?.();
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthorized) { void signOut(); return; }
      setDeleting(false); setDeleteConfirm(false);
    }
  };

  const tech = movie.technicalScore ?? technical(movie.scores);
  const latest = movie.watches[0];

  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 70, display: 'flex', justifyContent: 'flex-end', background: 'rgba(6,6,9,0.6)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', animation: 'fadeIn 240ms ease both' }}>
      <div onClick={e => e.stopPropagation()} className="cl-scroll" style={{ position: 'relative', width: 480, height: '100%', background: 'var(--ink-870)', borderLeft: '1px solid var(--line-strong)', animation: 'deskDrawer 360ms var(--ease-out) both' }}>
        <div style={{ position: 'relative', height: 260 }}>
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, transform: 'scale(1.6)', filter: 'blur(36px)', opacity: 0.5 }}>
              <MoviePoster title={movie.title} year={movie.year} genres={movie.genres} director={movie.director} palette={movie.poster} posterUrl={movie.posterUrl} width={480} rounded={0} frame={false} flat />
            </div>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,8,11,0.3), var(--ink-870))' }} />
          </div>
          <button className="pressable cl-tap" onClick={onClose} style={{ position: 'absolute', top: 18, right: 18, zIndex: 2, width: 38, height: 38, borderRadius: 12, border: '1px solid var(--line-strong)', background: 'rgba(20,20,26,0.7)', color: 'var(--text)', display: 'grid', placeItems: 'center' }}>
            <Icon name="close" size={19} color="currentColor" />
          </button>
          <div style={{ position: 'absolute', left: 28, bottom: -40, display: 'flex', gap: 18, alignItems: 'flex-end', right: 28 }}>
            <MoviePoster title={movie.title} year={movie.year} genres={movie.genres} director={movie.director} palette={movie.poster} posterUrl={movie.posterUrl} width={120} rounded={14} glow />
            <div style={{ paddingBottom: 46 }}>
              <div className="display" style={{ fontSize: 26, fontWeight: 700, lineHeight: 1 }}>{movie.title}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-dim)', marginTop: 7 }}>{movie.year > 0 ? `${movie.year} · ` : ''}{movie.director !== 'Unknown' ? movie.director : ''}</div>
            </div>
          </div>
        </div>
        <div style={{ padding: '54px 28px 0' }}>
          <GenreChips genres={movie.genres} />
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <ScoreBadge value={movie.personal} label="Personal" variant="primary" size="lg" />
            <ScoreBadge value={tech} label="Technical" variant="line" size="lg" />
            <ScoreBadge value={movie.objective} label="Objective" variant="ghost" size="lg" />
          </div>
          {movie.review && <div style={{ marginTop: 20, fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 16, lineHeight: 1.5 }}>&ldquo;{movie.review}&rdquo;</div>}
          <div style={{ marginTop: 14 }}>{latest && <WatchMeta location={latest.watchLocation} watchType={latest.watchType} />}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
            <button className="pressable cl-tap" onClick={() => onRate(movie, activeWatchEntryId ?? undefined)} style={{ flex: 1, border: 'none', borderRadius: 13, padding: '12px', background: 'linear-gradient(150deg, var(--accent), var(--accent-deep))', color: '#1a1206', fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Icon name="star" size={14} color="#1a1206" /> Editar puntuación
            </button>
            {onLogWatch && (
              <button className="pressable cl-tap" onClick={() => { onClose(); onLogWatch(movie); }} style={{ flex: 1, border: '1px solid var(--line-strong)', borderRadius: 13, padding: '12px', background: 'var(--ink-800)', color: 'var(--text-dim)', fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Icon name="rewatch" size={14} color="currentColor" /> Registrar visionado
              </button>
            )}
          </div>
          {/* Delete */}
          <div style={{ marginTop: 10 }}>
            {!deleteConfirm ? (
              <button className="pressable cl-tap" onClick={() => setDeleteConfirm(true)} style={{ width: '100%', border: '1px solid rgba(184,73,63,0.2)', borderRadius: 13, padding: '11px', background: 'rgba(184,73,63,0.04)', color: '#b07070', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                Eliminar película
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="pressable cl-tap" onClick={() => void handleDelete()} disabled={deleting} style={{ flex: 1, border: '1px solid rgba(184,73,63,0.35)', borderRadius: 13, padding: '11px', background: 'rgba(184,73,63,0.1)', color: '#c07070', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {deleting ? 'Eliminando…' : 'Confirmar eliminación'}
                </button>
                <button className="pressable cl-tap" onClick={() => setDeleteConfirm(false)} style={{ flex: '0 0 auto', border: '1px solid var(--line)', borderRadius: 13, padding: '11px 16px', background: 'var(--ink-820)', color: 'var(--text-dim)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                  Cancelar
                </button>
              </div>
            )}
          </div>
          <div style={{ display: 'grid', placeItems: 'center', marginTop: 24 }}><ScoreConstellation scores={movie.scores} size={290} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 18 }}>
            {CATEGORIES.map(c => (
              <div key={c.key} style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--ink-820)', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{c.short}</span>
                  <span className="display tnum" style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{fmt1(movie.scores[c.key])}</span>
                </div>
                <div style={{ marginTop: 7, height: 3.5, borderRadius: 3, background: 'var(--ink-680)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(movie.scores[c.key] / 5) * 100}%`, background: 'linear-gradient(90deg, var(--accent-deep), var(--accent))' }} />
                </div>
              </div>
            ))}
          </div>
          <div className="eyebrow" style={{ margin: '24px 0 12px' }}>Historial de visionados</div>
          <div style={{ paddingBottom: 30 }}><WatchTimeline movie={movie} /></div>
        </div>
      </div>
    </div>
  );
}

/* ── Desk Convert overlay ─────────────────────────────────────────────────── */
function DeskConvertOverlay({ item, onClose, onConverted }: {
  item: WatchlistItem;
  onClose: () => void;
  onConverted: (movie: MockMovie, watchEntryId: number) => void;
}) {
  const { signOut } = useAuth();
  const [watchedAt, setWatchedAt] = useState(new Date().toISOString().slice(0, 10));
  const [watchType, setWatchType] = useState<WatchType>('FIRST_WATCH');
  const [watchLocation, setWatchLocation] = useState<WatchLocation>('HOME');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleConvert = async (rateAfter: boolean) => {
    setSaveState('saving'); setError(null);
    try {
      const res = await convertWatchlistItem(item.id, { watchedAt, watchType, watchLocation });
      const movie: MockMovie = {
        id: String(res.movie.id), title: res.movie.title,
        originalTitle: res.movie.originalTitle ?? undefined,
        year: res.movie.releaseYear, director: res.movie.directors[0] ?? 'Unknown',
        directors: res.movie.directors, genres: res.movie.genres, runtime: 0,
        poster: derivePalette(res.movie.title, res.movie.releaseYear),
        posterUrl: res.movie.posterUrl, rated: false, scores: ZERO_SCORES,
        personal: 0, objective: 0, technicalScore: 0, review: '', note: '',
        watches: [{ watchedAt, watchType, watchLocation, scored: false, note: '', watchEntryId: res.watchEntry.id }],
      };
      onConverted(movie, rateAfter ? res.watchEntry.id : -1);
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthorized) { void signOut(); return; }
      setError(err instanceof ApiError ? err.message : 'Error al convertir.');
      setSaveState('error');
    }
  };

  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 82, display: 'grid', placeItems: 'center', background: 'rgba(6,6,9,0.75)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', animation: 'fadeIn 240ms ease both' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 480, borderRadius: 22, overflow: 'hidden', background: 'var(--ink-850)', border: '1px solid var(--line-strong)', boxShadow: 'var(--shadow-pop)', animation: 'fadeUp 320ms var(--ease-out) both' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="display" style={{ fontSize: 19, fontWeight: 700 }}>Marcar como vista</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', marginTop: 3 }}>{item.title}</div>
          </div>
          <button onClick={onClose} className="pressable cl-tap" style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid var(--line-strong)', background: 'var(--ink-800)', color: 'var(--text-dim)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
            <Icon name="close" size={16} color="currentColor" />
          </button>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>¿Dónde la viste?</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <DeskSegBtn label="Casa" active={watchLocation === 'HOME'} onClick={() => setWatchLocation('HOME')} />
            <DeskSegBtn label="Cine" active={watchLocation === 'CINEMA'} onClick={() => setWatchLocation('CINEMA')} />
          </div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Tipo de visionado</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <DeskSegBtn label="Primer visionado" active={watchType === 'FIRST_WATCH'} onClick={() => setWatchType('FIRST_WATCH')} />
            <DeskSegBtn label="Revisionado" active={watchType === 'REWATCH'} onClick={() => setWatchType('REWATCH')} />
          </div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Fecha</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', height: 46, borderRadius: 12, background: 'var(--ink-820)', border: '1px solid var(--line-strong)', marginBottom: 20 }}>
            <Icon name="calendar" size={16} color="var(--text-faint)" />
            <input type="date" value={watchedAt} onChange={e => setWatchedAt(e.target.value)} style={{ flex: 1, border: 'none', background: 'none', outline: 'none', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 14, colorScheme: 'dark' }} />
          </div>
          {error && <div style={{ marginBottom: 14, padding: '10px 13px', borderRadius: 10, background: 'rgba(184,73,63,0.09)', border: '1px solid rgba(184,73,63,0.22)' }}><span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#d07070' }}>{error}</span></div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="pressable cl-tap" onClick={() => void handleConvert(true)} disabled={saveState === 'saving'} style={{ flex: 1, border: 'none', borderRadius: 13, padding: '13px', background: 'linear-gradient(150deg, var(--accent), var(--accent-deep))', color: '#1a1206', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <Icon name="star" size={14} color="#1a1206" /> {saveState === 'saving' ? 'Guardando…' : 'Puntuar ahora'}
            </button>
            <button className="pressable cl-tap" onClick={() => void handleConvert(false)} disabled={saveState === 'saving'} style={{ flex: 1, border: '1px solid var(--line-strong)', borderRadius: 13, padding: '13px', background: 'var(--ink-800)', color: 'var(--text-dim)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              {saveState === 'saving' ? 'Guardando…' : 'Guardar sin puntuar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Desk Add modal ───────────────────────────────────────────────────────── */
function DeskAdd({ onClose, onSavedToLibrary, onSavedToWatchlist, onRateAfter, initialMovie }: {
  onClose: () => void;
  onSavedToLibrary: (title: string) => void;
  onSavedToWatchlist: (title: string) => void;
  onRateAfter: (movie: MockMovie, watchEntryId: number) => void;
  initialMovie?: MockMovie;
}) {
  const { signOut } = useAuth();
  const [step, setStep] = useState<'search' | 'confirm' | 'entry'>(initialMovie ? 'entry' : 'search');
  const [searchQ, setSearchQ] = useState('');
  const [searchState, setSearchState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [searchResults, setSearchResults] = useState<ExternalMovieResult[]>([]);
  const [sel, setSel] = useState<DeskSelectedFilm | null>(() => {
    if (!initialMovie) return null;
    const numericId = parseInt(initialMovie.id);
    return { movieId: isNaN(numericId) ? null : numericId, title: initialMovie.title, year: initialMovie.year, director: initialMovie.director, genres: initialMovie.genres, poster: initialMovie.poster, posterUrl: initialMovie.posterUrl, externalResult: null };
  });
  const [watchType, setWatchType] = useState<WatchType>('FIRST_WATCH');
  const [watchLocation, setWatchLocation] = useState<WatchLocation>('HOME');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [submitState, setSubmitState] = useState<'idle' | 'saving' | 'conflict' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [wlState, setWlState] = useState<'idle' | 'saving' | 'saved' | 'conflict-watchlist' | 'conflict-library' | 'error'>('idle');

  useEffect(() => {
    const t = searchQ.trim();
    if (!t || t.length < 2) { setSearchResults([]); setSearchState('idle'); return; }
    const timer = setTimeout(() => {
      setSearchState('loading');
      searchExternalMovies(t)
        .then(res => { setSearchResults(res); setSearchState('loaded'); })
        .catch(err => { if (err instanceof ApiError && err.isUnauthorized) { void signOut(); return; } setSearchState('error'); });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQ, signOut]);

  const handleSave = async (rateAfter: boolean) => {
    if (!sel || !date) return;
    setSubmitState('saving'); setSubmitError(null);
    try {
      let movieId = sel.movieId;
      if (movieId === null && sel.externalResult) { const imp = await importMovie(sel.externalResult); movieId = imp.id; }
      if (movieId === null) { setSubmitState('error'); setSubmitError('No movie to import.'); return; }
      const we = await createWatchEntry(movieId, { watchedAt: date, watchType, watchLocation, notes: note.trim() || undefined });
      setSubmitState('idle');
      if (rateAfter) {
        onRateAfter({ id: String(movieId), title: sel.title, year: sel.year, director: sel.director, genres: sel.genres, runtime: 0, poster: sel.poster, posterUrl: sel.posterUrl ?? null, rated: false, scores: ZERO_SCORES, personal: 0, objective: 0, technicalScore: 0, review: '', note: '', watches: [{ watchedAt: date, watchType, watchLocation, scored: false, note: note.trim(), watchEntryId: we.id }] }, we.id);
      } else { onSavedToLibrary(sel.title); }
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthorized) { void signOut(); return; }
      if (err instanceof ApiError && err.isConflict) { setSubmitState('conflict'); }
      else { setSubmitError(err instanceof ApiError ? err.message : 'Something went wrong.'); setSubmitState('error'); }
    }
  };

  const handleSaveToWatchlist = async () => {
    if (!sel?.externalResult) return;
    setWlState('saving');
    const r = sel.externalResult;
    try {
      await addToWatchlist({ source: r.source, externalId: r.externalId, title: r.title, originalTitle: r.originalTitle, releaseYear: r.releaseYear, directors: r.directors, posterPath: r.posterPath, posterUrl: r.posterUrl, genres: r.genres });
      setWlState('saved');
      setTimeout(() => { onSavedToWatchlist(r.title); onClose(); }, 700);
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthorized) { void signOut(); return; }
      if (err instanceof ApiError && err.isConflict) { const msg = err.message?.toLowerCase() ?? ''; setWlState(msg.includes('archive') ? 'conflict-library' : 'conflict-watchlist'); }
      else { setWlState('error'); }
    }
  };

  const stepLabel = step === 'search' ? 'Añadir película' : step === 'confirm' ? 'Confirmar' : 'Registrar visionado';

  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 75, display: 'grid', placeItems: 'center', background: 'rgba(6,6,9,0.75)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', animation: 'fadeIn 240ms ease both' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 580, maxHeight: '84vh', display: 'flex', flexDirection: 'column', borderRadius: 24, overflow: 'hidden', background: 'var(--ink-850)', border: '1px solid var(--line-strong)', boxShadow: 'var(--shadow-pop)', animation: 'fadeUp 320ms var(--ease-out) both' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {step !== 'search' && <button className="pressable cl-tap" onClick={() => setStep(step === 'entry' ? 'confirm' : 'search')} style={{ border: '1px solid var(--line-strong)', background: 'var(--ink-800)', borderRadius: 10, width: 32, height: 32, display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--text-dim)' }}><Icon name="back" size={16} color="currentColor" /></button>}
            <div className="display" style={{ fontSize: 19, fontWeight: 700 }}>{stepLabel}</div>
          </div>
          <button onClick={onClose} className="pressable cl-tap" style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid var(--line-strong)', background: 'var(--ink-800)', color: 'var(--text-dim)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
            <Icon name="close" size={17} color="currentColor" />
          </button>
        </div>

        {/* content */}
        <div className="cl-scroll" style={{ flex: 1, padding: '18px 24px' }}>

          {/* SEARCH */}
          {step === 'search' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', height: 46, borderRadius: 13, background: 'var(--ink-820)', border: '1px solid var(--line-strong)', marginBottom: 16 }}>
                <Icon name="search" size={17} color="var(--text-faint)" />
                <input autoFocus value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Buscar en TMDb…" style={{ flex: 1, border: 'none', background: 'none', outline: 'none', color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: 14 }} />
                {searchQ && <button onClick={() => setSearchQ('')} style={{ border: 'none', background: 'none', color: 'var(--text-faint)', cursor: 'pointer', fontSize: 16, padding: 0 }}>×</button>}
              </div>
              {searchState === 'loading' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[1,2,3].map(i => <div key={i} style={{ height: 62, borderRadius: 13, background: 'var(--ink-820)', animation: `glowPulse 1.8s ease ${i*100}ms infinite` }} />)}
                </div>
              )}
              {searchState === 'loaded' && searchResults.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-faint)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>Sin resultados. Prueba otro título.</div>
              )}
              {searchState === 'loaded' && searchResults.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {searchResults.map(r => {
                    const director = r.directors[0] ?? '—';
                    const palette = derivePalette(r.title, r.releaseYear);
                    return (
                      <button key={r.externalId} className="pressable cl-tap" onClick={() => { setSel({ movieId: null, title: r.title, year: r.releaseYear, director, genres: r.genres, poster: palette, posterUrl: r.posterUrl, externalResult: r }); setStep('confirm'); setWlState('idle'); setSubmitState('idle'); }} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 10, border: 'none', borderRadius: 13, background: 'var(--ink-820)', color: 'var(--text)', textAlign: 'left', cursor: 'pointer' }}>
                        <MoviePoster title={r.title} year={r.releaseYear} genres={r.genres} director={director} palette={palette} posterUrl={r.posterUrl} width={46} rounded={8} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="display" style={{ fontSize: 15, fontWeight: 600 }}>{r.title}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-dim)', marginTop: 3 }}>{r.releaseYear} · {director}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-faint)', marginTop: 2 }}>{r.genres.slice(0,3).join(' · ')}</div>
                        </div>
                        <Icon name="chevron" size={16} color="var(--text-faint)" />
                      </button>
                    );
                  })}
                </div>
              )}
              {!searchQ.trim() && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-faint)', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14 }}>
                  Busca una película para añadirla al archivo o a tu Watchlist.
                </div>
              )}
            </>
          )}

          {/* CONFIRM */}
          {step === 'confirm' && sel && (
            <>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
                <MoviePoster title={sel.title} year={sel.year} genres={sel.genres} director={sel.director} palette={sel.poster} posterUrl={sel.posterUrl} width={80} rounded={12} glow />
                <div>
                  <div className="display" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{sel.title}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-dim)', marginTop: 7 }}>{sel.year > 0 ? `${sel.year} · ` : ''}{sel.director}</div>
                  <div style={{ marginTop: 8 }}><GenreChips genres={sel.genres} /></div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className="pressable cl-tap" onClick={() => setStep('entry')} style={{ border: 'none', borderRadius: 14, padding: '14px', background: 'linear-gradient(150deg, var(--accent), var(--accent-deep))', color: '#1a1206', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Icon name="play" size={15} color="#1a1206" /> Registrar visionado
                </button>
                {sel.externalResult && (
                  <button className="pressable cl-tap" onClick={() => void handleSaveToWatchlist()} disabled={wlState === 'saving' || wlState === 'saved'} style={{ border: '1px solid var(--line-amber)', borderRadius: 14, padding: '13px', background: 'rgba(232,185,116,0.07)', color: 'var(--accent)', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Icon name="watchlist" size={15} color="currentColor" />
                    {wlState === 'saving' ? 'Guardando…' : wlState === 'saved' ? '✓ En Watchlist' : 'Guardar en Watchlist'}
                  </button>
                )}
                {wlState === 'conflict-watchlist' && <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>Ya está en tu Watchlist</div>}
                {wlState === 'conflict-library' && <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>Ya está en tu Library</div>}
                {wlState === 'error' && <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#d07070' }}>Error al guardar. Inténtalo de nuevo.</div>}
              </div>
            </>
          )}

          {/* ENTRY */}
          {step === 'entry' && sel && (
            <>
              {sel.title && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginBottom: 16, letterSpacing: '0.04em' }}>{sel.title}</div>}
              <div className="eyebrow" style={{ marginBottom: 8 }}>¿Dónde la viste?</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <DeskSegBtn label="Casa" active={watchLocation === 'HOME'} onClick={() => setWatchLocation('HOME')} />
                <DeskSegBtn label="Cine" active={watchLocation === 'CINEMA'} onClick={() => setWatchLocation('CINEMA')} />
              </div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Tipo de visionado</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <DeskSegBtn label="Primer visionado" active={watchType === 'FIRST_WATCH'} onClick={() => setWatchType('FIRST_WATCH')} />
                <DeskSegBtn label="Revisionado" active={watchType === 'REWATCH'} onClick={() => setWatchType('REWATCH')} />
              </div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Fecha</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', height: 46, borderRadius: 12, background: 'var(--ink-820)', border: '1px solid var(--line-strong)', marginBottom: 14 }}>
                <Icon name="calendar" size={16} color="var(--text-faint)" />
                <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ flex: 1, border: 'none', background: 'none', outline: 'none', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 14, colorScheme: 'dark' }} />
              </div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Nota <span style={{ color: 'var(--text-ghost)' }}>· opcional</span></div>
              <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Una primera impresión…" rows={2} style={{ width: '100%', resize: 'none', border: '1px solid var(--line-strong)', background: 'var(--ink-820)', borderRadius: 12, padding: '12px 14px', color: 'var(--text)', fontFamily: 'var(--font-display)', fontSize: 14, lineHeight: 1.5, outline: 'none', boxSizing: 'border-box', marginBottom: 14 }} />
              {submitState === 'conflict' && <div style={{ marginBottom: 12, padding: '11px 14px', borderRadius: 12, background: 'rgba(232,185,116,0.07)', border: '1px solid var(--line-amber)' }}><div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>Esta película ya está en tu archivo.</div></div>}
              {submitState === 'error' && submitError && <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 11, background: 'rgba(184,73,63,0.09)', border: '1px solid rgba(184,73,63,0.22)' }}><div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#d07070' }}>{submitError}</div></div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="pressable cl-tap" onClick={() => void handleSave(true)} disabled={submitState === 'saving'} style={{ flex: 1, border: 'none', borderRadius: 13, padding: '13px', background: 'linear-gradient(150deg, var(--accent), var(--accent-deep))', color: '#1a1206', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                  <Icon name="star" size={14} color="#1a1206" /> {submitState === 'saving' ? 'Guardando…' : 'Puntuar ahora'}
                </button>
                <button className="pressable cl-tap" onClick={() => void handleSave(false)} disabled={submitState === 'saving'} style={{ flex: 1, border: '1px solid var(--line-strong)', borderRadius: 13, padding: '13px', background: 'var(--ink-800)', color: 'var(--text-dim)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  {submitState === 'saving' ? 'Guardando…' : 'Guardar sin puntuar'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Desktop App ──────────────────────────────────────────────────────────── */
export default function DesktopView() {
  const { currentUser, signOut } = useAuth();
  const displayName = currentUser?.displayName ?? currentUser?.username ?? null;

  const [nav, setNav] = useState<DesktopNav>('home');
  const [detail, setDetail] = useState<MockMovie | null>(null);
  const [rating, setRating] = useState<MockMovie | null>(null);
  const [ratingWatchEntryId, setRatingWatchEntryId] = useState<number | null>(null);
  const [mode, setMode] = useState('personal');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('personal');

  const [addOpen, setAddOpen] = useState(false);
  const [logWatchMovie, setLogWatchMovie] = useState<MockMovie | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [gptExportOpen, setGptExportOpen] = useState(false);

  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [watchlistLoad, setWatchlistLoad] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [wlKey, setWlKey] = useState(0);
  const [convertItem, setConvertItem] = useState<WatchlistItem | null>(null);
  const [wlConfirmDeleteId, setWlConfirmDeleteId] = useState<number | null>(null);
  const [wlDeletingId, setWlDeletingId] = useState<number | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);

  /* API data */
  const [dashData, setDashData] = useState<DashboardResponse | null>(null);
  const [libraryMovies, setLibraryMovies] = useState<MockMovie[]>([]);
  const [rankingList, setRankingList] = useState<{ m: MockMovie; v: number }[]>([]);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);
  const refreshWl = useCallback(() => setWlKey(k => k + 1), []);

  /* Main data (dashboard + library) */
  useEffect(() => {
    const handleErr = (err: unknown) => { if (err instanceof ApiError && err.isUnauthorized) void signOut(); };
    getDashboard().then(d => setDashData(d)).catch(handleErr);
    getMovies().then(ms => setLibraryMovies(ms.map(adaptMovie))).catch(handleErr);
  }, [signOut, refreshKey]);

  /* Rankings */
  useEffect(() => {
    const backendMode = RANKING_MODE_MAP[mode];
    if (!backendMode) return;
    getRankings(backendMode)
      .then(items => setRankingList(items.map(r => ({ m: adaptRankingItem(r), v: r.score }))))
      .catch(err => { if (err instanceof ApiError && err.isUnauthorized) void signOut(); });
  }, [mode, signOut, refreshKey]);

  /* Watchlist — fetch when tab is active */
  useEffect(() => {
    if (nav !== 'watchlist') return;
    setWatchlistLoad('loading');
    getWatchlist({ sort: 'NEWEST', size: 50 })
      .then(items => { setWatchlistItems(items); setWatchlistLoad('loaded'); })
      .catch(err => {
        if (err instanceof ApiError && err.isUnauthorized) { void signOut(); return; }
        setWatchlistLoad('error');
      });
  }, [nav, signOut, wlKey]);

  /* Watchlist delete */
  const handleWlDelete = useCallback(async (id: number) => {
    setWlDeletingId(id);
    try {
      await deleteWatchlistItem(id);
      setWatchlistItems(prev => prev.filter(it => it.id !== id));
      setWlConfirmDeleteId(null);
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthorized) { void signOut(); return; }
    } finally { setWlDeletingId(null); }
  }, [signOut]);

  /* Watchlist convert done */
  const handleConverted = useCallback((movie: MockMovie, watchEntryId: number) => {
    if (convertItem) setWatchlistItems(prev => prev.filter(it => it.id !== convertItem.id));
    setConvertItem(null);
    refresh();
    if (watchEntryId > 0) { setRating(movie); setRatingWatchEntryId(watchEntryId); }
  }, [convertItem, refresh]);

  /* Derived */
  const latestWatch = dashData?.latestWatch ?? null;
  const latestMovie = latestWatch ? adaptDashboardLatestWatch(latestWatch) : null;
  const latestEntry = latestWatch;
  const dashStats = dashData?.stats ?? null;
  const top5: MockMovie[] = (dashData?.topPersonal ?? []).slice(0, 5).map(adaptRankingItem);

  const archiveStats = [
    { l: 'Películas', v: dashStats?.totalMovies ?? '—' },
    { l: 'Prom. pers.', v: dashStats?.averagePersonalScore != null ? fmt1(dashStats.averagePersonalScore) : '—' },
    { l: 'Prom. téc.', v: dashStats?.averageTechnicalScore != null ? fmt1(dashStats.averageTechnicalScore) : '—' },
  ];

  const homeStats = [
    { n: dashStats?.totalMovies ?? '—', l: 'Películas' },
    { n: dashStats?.totalWatchEntries ?? '—', l: 'Visionados' },
    { n: dashStats?.averagePersonalScore != null ? fmt1(dashStats.averagePersonalScore) : '—', l: 'Prom. pers.' },
    { n: dashStats?.averageTechnicalScore != null ? fmt1(dashStats.averageTechnicalScore) : '—', l: 'Prom. téc.' },
  ];

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  const recentWatches = useMemo(() =>
    [...libraryMovies].sort((a, b) => (b.watches[0]?.watchedAt ?? '').localeCompare(a.watches[0]?.watchedAt ?? '')).slice(0, 6),
    [libraryMovies]);

  const libList = useMemo(() => {
    const arr = libraryMovies.filter(m => !q || m.title.toLowerCase().includes(q.toLowerCase()) || m.director.toLowerCase().includes(q.toLowerCase()));
    const val = (m: MockMovie): number | string => {
      if (sort === 'technical') return m.technicalScore ?? 0;
      if (sort === 'objective') return m.objective;
      if (sort === 'year') return m.year;
      if (sort === 'latest') return m.watches[0]?.watchedAt ?? '';
      return m.personal;
    };
    return [...arr].sort((a, b) => {
      const va = val(a), vb = val(b);
      if (sort === 'latest') return String(vb).localeCompare(String(va));
      return Number(vb) - Number(va);
    });
  }, [libraryMovies, q, sort]);

  const modeObj = RANKING_MODES.find(r => r.id === mode) ?? RANKING_MODES[0];

  const navItems: { id: DesktopNav; icon: 'home' | 'library' | 'watchlist' | 'rankings'; l: string }[] = [
    { id: 'home', icon: 'home', l: 'Home' },
    { id: 'library', icon: 'library', l: 'Library' },
    { id: 'watchlist', icon: 'watchlist', l: 'Watchlist' },
    { id: 'rankings', icon: 'rankings', l: 'Rankings' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', background: 'var(--ink-900)', overflow: 'hidden' }} className="cl-grain">
      {/* ── Sidebar ── */}
      <div style={{ width: 232, flexShrink: 0, borderRight: '1px solid var(--line)', padding: '26px 18px', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, var(--ink-870), var(--ink-900))' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '0 8px 4px' }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at 40% 30%, var(--accent-glow), var(--ink-760))', border: '1px solid var(--line-amber)' }}>
            <Icon name="film" size={20} color="var(--accent)" stroke={1.5} />
          </div>
          <div className="display" style={{ fontSize: 21, fontWeight: 700 }}>Cine<span style={{ fontStyle: 'italic', fontWeight: 500 }}>log</span></div>
        </div>

        {/* Nav items */}
        <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(it => {
            const active = nav === it.id;
            return (
              <button key={it.id} className="cl-tap" onClick={() => setNav(it.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: 12, border: 'none', cursor: 'pointer', textAlign: 'left', color: active ? 'var(--accent-bright)' : 'var(--text-dim)', background: active ? 'linear-gradient(150deg, rgba(232,185,116,0.14), rgba(232,185,116,0.04))' : 'transparent', fontFamily: 'var(--font-sans)', fontSize: 14.5, fontWeight: active ? 600 : 500, transition: 'all var(--dur) var(--ease-out)' }}>
                <Icon name={it.icon} size={19} color="currentColor" stroke={active ? 2.1 : 1.8} /> {it.l}
              </button>
            );
          })}
        </div>

        {/* Add button */}
        <button className="pressable cl-tap" onClick={() => { setLogWatchMovie(null); setAddOpen(true); }} style={{ margin: '14px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: '12px', borderRadius: 13, border: '1px solid rgba(232,185,116,0.3)', background: 'linear-gradient(150deg, rgba(232,185,116,0.12), rgba(232,185,116,0.04))', color: 'var(--accent)', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          <Icon name="add" size={16} color="currentColor" stroke={2.4} /> Añadir película
        </button>

        {/* Bottom: archive stats + settings + user/sign-out */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ padding: '14px 13px', borderRadius: 14, background: 'var(--ink-820)', border: '1px solid var(--line)' }}>
            <div className="eyebrow" style={{ marginBottom: 9 }}>El archivo</div>
            {archiveStats.map(s => (
              <div key={s.l} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
                <span>{s.l}</span><span className="tnum" style={{ color: 'var(--accent)', fontWeight: 600 }}>{s.v}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="pressable cl-tap" onClick={() => setSettingsOpen(true)} style={{ flex: 1, border: '1px solid var(--line)', borderRadius: 10, padding: '8px', background: 'var(--ink-820)', color: 'var(--text-dim)', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Icon name="cog" size={14} color="currentColor" /> Ajustes
            </button>
            <button className="pressable cl-tap" onClick={() => { void signOut(); }} style={{ flex: 1, border: '1px solid rgba(184,73,63,0.25)', borderRadius: 10, padding: '8px', background: 'rgba(184,73,63,0.05)', color: '#b07070', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <Icon name="back" size={13} color="currentColor" /> Cerrar sesión
            </button>
          </div>
          {displayName && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-ghost)', letterSpacing: '0.04em', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </div>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="cl-scroll" style={{ position: 'relative', flex: 1 }}>
        <div style={{ padding: '30px 38px 60px' }}>

          {/* HOME */}
          {nav === 'home' && (
            <div style={{ animation: 'fadeIn 320ms ease both' }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Sala de proyección privada</div>
              <div className="display" style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em' }}>{greet}.</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, marginTop: 26 }}>
                <div>
                  {latestMovie && latestEntry && (
                    <button className="pressable cl-tap" onClick={() => setDetail(latestMovie)} style={{ width: '100%', border: 'none', textAlign: 'left', color: 'var(--text)', position: 'relative', borderRadius: 22, overflow: 'hidden', padding: 0, boxShadow: 'var(--shadow-pop)' }}>
                      <div style={{ position: 'absolute', inset: 0, transform: 'scale(1.5)', filter: 'blur(30px)', opacity: 0.45 }}>
                        <MoviePoster title={latestMovie.title} year={latestMovie.year} genres={latestMovie.genres} director={latestMovie.director} palette={latestMovie.poster} posterUrl={latestMovie.posterUrl} width={700} rounded={0} frame={false} flat />
                      </div>
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(110deg, rgba(8,8,11,0.92) 40%, rgba(8,8,11,0.4))' }} />
                      <div style={{ position: 'relative', padding: 24, display: 'flex', gap: 22, alignItems: 'center' }}>
                        <MoviePoster title={latestMovie.title} year={latestMovie.year} genres={latestMovie.genres} director={latestMovie.director} palette={latestMovie.poster} posterUrl={latestMovie.posterUrl} width={130} rounded={14} glow />
                        <div style={{ flex: 1 }}>
                          <div className="eyebrow" style={{ color: 'var(--accent)' }}>● Último visionado · {fmtDate(latestEntry.watchedAt)}</div>
                          <div className="display" style={{ fontSize: 28, fontWeight: 700, marginTop: 10, lineHeight: 1 }}>{latestMovie.title}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>{latestMovie.year > 0 ? `${latestMovie.year} · ` : ''}{latestMovie.director !== 'Unknown' ? latestMovie.director : ''}</div>
                          <div style={{ marginTop: 12 }}><WatchMeta location={latestEntry.watchLocation} watchType={latestEntry.watchType} /></div>
                          <div style={{ display: 'flex', gap: 9, marginTop: 16 }}>
                            <ScoreBadge value={latestMovie.personal} label="Personal" variant="primary" />
                            <ScoreBadge value={latestMovie.technicalScore ?? technical(latestMovie.scores)} label="Technical" variant="line" />
                          </div>
                        </div>
                      </div>
                    </button>
                  )}
                  {recentWatches.length > 0 && (
                    <>
                      <div className="eyebrow" style={{ margin: '30px 0 14px' }}>Visionados recientes</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {recentWatches.map(m => <MovieCard key={m.id} movie={m} onOpen={() => setDetail(m)} />)}
                      </div>
                    </>
                  )}
                </div>
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                    {homeStats.map((s, i) => (
                      <div key={i} style={{ background: 'var(--ink-820)', border: '1px solid var(--line)', borderRadius: 14, padding: '16px 10px', textAlign: 'center' }}>
                        <div className="display tnum" style={{ fontSize: 26, fontWeight: 700, color: 'var(--accent)' }}>{s.n}</div>
                        <div className="eyebrow" style={{ marginTop: 6 }}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                  {top5.length > 0 && (
                    <>
                      <div className="eyebrow" style={{ margin: '24px 0 12px' }}>Top 5 personal</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {top5.map((m, i) => (
                          <button key={m.id} className="pressable cl-tap" onClick={() => setDetail(m)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, borderRadius: 13, border: '1px solid var(--line)', background: 'var(--ink-820)', color: 'var(--text)', textAlign: 'left' }}>
                            <span className="display tnum" style={{ width: 26, textAlign: 'center', fontSize: 22, fontWeight: 800, color: 'transparent', WebkitTextStroke: '1.2px var(--rank-stroke)' } as React.CSSProperties}>{i + 1}</span>
                            <MoviePoster title={m.title} year={m.year} genres={m.genres} director={m.director} palette={m.poster} posterUrl={m.posterUrl} width={38} rounded={7} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="display" style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
                              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-faint)', marginTop: 2 }}>{m.year}</div>
                            </div>
                            <span className="display tnum" style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>{fmt1(m.personal)}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* LIBRARY */}
          {nav === 'library' && (
            <div style={{ animation: 'fadeIn 320ms ease both' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>{libList.length} of {libraryMovies.length} films</div>
                  <div className="display" style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em' }}>Library</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', height: 44, width: 280, borderRadius: 13, background: 'var(--ink-820)', border: '1px solid var(--line-strong)' }}>
                  <Icon name="search" size={17} color="var(--text-faint)" />
                  <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar en el archivo" style={{ flex: 1, border: 'none', background: 'none', outline: 'none', color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: 14 }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, margin: '20px 0 22px' }}>
                {['personal', 'technical', 'objective', 'latest', 'year'].map(s => (
                  <button key={s} className="pressable cl-tap" onClick={() => setSort(s)} style={{ border: sort === s ? '1px solid var(--line-amber)' : '1px solid var(--line)', background: sort === s ? 'rgba(232,185,116,0.1)' : 'var(--ink-800)', color: sort === s ? 'var(--accent-bright)' : 'var(--text-dim)', borderRadius: 11, padding: '8px 15px', fontSize: 13, fontWeight: 500, textTransform: 'capitalize' }}>{s}</button>
                ))}
              </div>
              {libList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 16, color: 'var(--text-faint)' }}>
                  {libraryMovies.length === 0 ? 'Sin películas en el archivo.' : 'Sin resultados.'}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 18 }}>
                  {libList.map((m, i) => (
                    <button key={m.id} className="pressable cl-tap" onClick={() => setDetail(m)} style={{ border: 'none', background: 'none', padding: 0, animation: `fadeUp 420ms var(--ease-out) ${i * 30}ms both` }}>
                      <MoviePoster title={m.title} year={m.year} genres={m.genres} director={m.director} palette={m.poster} posterUrl={m.posterUrl} width={150} rounded={12} />
                      <div style={{ marginTop: 9 }}>
                        <div className="display" style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                          {m.rated && <><Icon name="star" size={11} color="var(--star)" /><span className="display tnum" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent)' }}>{fmt1(sort === 'technical' ? (m.technicalScore ?? 0) : sort === 'objective' ? m.objective : m.personal)}</span></>}
                          {!m.rated && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-ghost)' }}>Sin puntuar</span>}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* WATCHLIST */}
          {nav === 'watchlist' && (
            <div style={{ animation: 'fadeIn 320ms ease both' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>Por ver</div>
                  <div className="display" style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em' }}>Watchlist</div>
                </div>
                <button className="pressable cl-tap" onClick={() => { setLogWatchMovie(null); setAddOpen(true); }} style={{ border: '1px solid var(--line-amber)', borderRadius: 13, padding: '10px 18px', background: 'rgba(232,185,116,0.08)', color: 'var(--accent)', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Icon name="add" size={15} color="currentColor" stroke={2.2} /> Añadir película
                </button>
              </div>

              {watchlistLoad === 'loading' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[1,2,3].map(i => <div key={i} style={{ height: 80, borderRadius: 16, background: 'var(--ink-820)', animation: `glowPulse 1.8s ease ${i*120}ms infinite` }} />)}
                </div>
              )}

              {watchlistLoad === 'error' && (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 16, color: 'var(--text-faint)', marginBottom: 16 }}>No se pudo cargar la Watchlist.</div>
                  <button className="pressable cl-tap" onClick={() => refreshWl()} style={{ border: '1px solid var(--line-amber)', borderRadius: 12, padding: '10px 22px', background: 'rgba(232,185,116,0.08)', color: 'var(--accent)', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Reintentar</button>
                </div>
              )}

              {watchlistLoad === 'loaded' && watchlistItems.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <div className="display" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 10 }}>Tu Watchlist está vacía</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, color: 'var(--text-faint)' }}>Guarda películas para ver más adelante.</div>
                </div>
              )}

              {watchlistLoad === 'loaded' && watchlistItems.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {watchlistItems.map(item => {
                    const palette = derivePalette(item.title, item.releaseYear ?? 0);
                    const director = item.directors[0];
                    const isConfirming = wlConfirmDeleteId === item.id;
                    const isDeleting = wlDeletingId === item.id;
                    return (
                      <div key={item.id} style={{ background: 'linear-gradient(150deg, var(--ink-800), var(--ink-820))', border: '1px solid var(--line)', borderRadius: 16, padding: 14, animation: 'fadeUp 380ms var(--ease-out) both' }}>
                        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                          <MoviePoster title={item.title} year={item.releaseYear ?? 0} genres={item.genres} director={director ?? ''} palette={palette} posterUrl={item.posterUrl} width={64} rounded={10} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="display" style={{ fontSize: 16, fontWeight: 600 }}>{item.title}</div>
                            {(item.releaseYear || director) && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', marginTop: 3 }}>{[item.releaseYear, director].filter(Boolean).join(' · ')}</div>}
                            {item.genres.length > 0 && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-faint)', marginTop: 2 }}>{item.genres.slice(0,3).join(' · ')}</div>}
                            {item.notes && <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 13, color: 'var(--text-dim)', marginTop: 6 }}>{item.notes}</div>}
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                            <button className="pressable cl-tap" onClick={() => setConvertItem(item)} style={{ border: '1px solid var(--line-amber)', borderRadius: 10, padding: '8px 14px', background: 'rgba(232,185,116,0.07)', color: 'var(--accent)', fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Icon name="play" size={12} color="currentColor" /> Marcar como vista
                            </button>
                            {!isConfirming ? (
                              <button className="pressable cl-tap" onClick={() => setWlConfirmDeleteId(item.id)} style={{ border: '1px solid var(--line)', borderRadius: 10, width: 34, height: 34, display: 'grid', placeItems: 'center', background: 'var(--ink-760)', color: 'var(--text-faint)', cursor: 'pointer' }}>
                                <Icon name="close" size={14} color="currentColor" stroke={2} />
                              </button>
                            ) : (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button className="pressable cl-tap" onClick={() => void handleWlDelete(item.id)} disabled={isDeleting} style={{ border: '1px solid rgba(184,73,63,0.35)', borderRadius: 10, padding: '8px 12px', background: 'rgba(184,73,63,0.1)', color: '#c07070', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                  {isDeleting ? '…' : 'Eliminar'}
                                </button>
                                <button className="pressable cl-tap" onClick={() => setWlConfirmDeleteId(null)} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '8px 12px', background: 'var(--ink-820)', color: 'var(--text-faint)', fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* RANKINGS */}
          {nav === 'rankings' && (
            <div style={{ animation: 'fadeIn 320ms ease both', display: 'grid', gridTemplateColumns: '210px 1fr', gap: 28 }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 14 }}>Ranking mode</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {RANKING_MODES.map(r => (
                    <button key={r.id} className="cl-tap" onClick={() => setMode(r.id)} style={{ border: 'none', cursor: 'pointer', textAlign: 'left', padding: '10px 12px', borderRadius: 10, background: mode === r.id ? 'linear-gradient(150deg, rgba(232,185,116,0.13), transparent)' : 'transparent', color: mode === r.id ? 'var(--accent-bright)' : 'var(--text-dim)' }}>
                      <div style={{ fontSize: 13.5, fontWeight: mode === r.id ? 600 : 500 }}>{r.label}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-faint)', marginTop: 2 }}>{r.tag}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div key={mode}>
                <div className="display" style={{ fontSize: 30, fontWeight: 700 }}>{modeObj.label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, color: 'var(--text-dim)', marginTop: 4 }}>{modeObj.tag}.</div>
                {rankingList.length === 0 ? (
                  <div style={{ marginTop: 40, textAlign: 'center', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 15, color: 'var(--text-faint)' }}>Aún no hay películas valoradas.</div>
                ) : (
                  <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {rankingList.map((r, i) => (
                      <button key={r.m.id} className="pressable cl-tap" onClick={() => setDetail(r.m)} style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '13px 8px', border: 'none', borderTop: i ? '1px solid var(--line)' : 'none', background: 'none', color: 'var(--text)', textAlign: 'left', animation: `fadeUp 440ms var(--ease-out) ${i * 45}ms both` }}>
                        <span className="display tnum" style={{ width: 64, textAlign: 'center', fontSize: i === 0 ? 52 : 44, fontWeight: 800, color: i === 0 ? 'var(--accent)' : 'transparent', WebkitTextStroke: i === 0 ? 'none' : '1.4px var(--rank-stroke)' } as React.CSSProperties}>{i + 1}</span>
                        <MoviePoster title={r.m.title} year={r.m.year} genres={r.m.genres} director={r.m.director} palette={r.m.poster} posterUrl={r.m.posterUrl} width={54} rounded={9} />
                        <div style={{ flex: 1 }}>
                          <div className="display" style={{ fontSize: 18, fontWeight: 600 }}>{r.m.title}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-faint)', marginTop: 3 }}>{r.m.year} · {r.m.director}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="display tnum" style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>{fmt(r.v)}</div>
                          <div style={{ marginTop: 4 }}><Stars value={roundHalf(r.v)} size={11} /></div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Overlays ── */}

      {/* Detail */}
      {detail && (
        <DeskDetail
          movie={detail}
          onClose={() => setDetail(null)}
          onRate={(m, watchEntryId) => { setDetail(null); setRating(m); setRatingWatchEntryId(watchEntryId ?? null); }}
          onDeleted={() => { setDetail(null); refresh(); }}
          onLogWatch={(m) => { setDetail(null); setLogWatchMovie(m); setAddOpen(true); }}
        />
      )}

      {/* Rating */}
      {rating && (
        <DeskRating
          movie={rating}
          watchEntryId={ratingWatchEntryId ?? undefined}
          onClose={() => { setRating(null); setRatingWatchEntryId(null); }}
          onSave={() => { setRating(null); setRatingWatchEntryId(null); refresh(); }}
        />
      )}

      {/* Add */}
      {addOpen && (
        <DeskAdd
          initialMovie={logWatchMovie ?? undefined}
          onClose={() => { setAddOpen(false); setLogWatchMovie(null); }}
          onSavedToLibrary={(title) => { refresh(); if (title) console.info(`[Cinelog] Added to library: ${title}`); }}
          onSavedToWatchlist={(title) => { refreshWl(); if (nav === 'watchlist') setWlKey(k => k + 1); if (title) console.info(`[Cinelog] Added to watchlist: ${title}`); }}
          onRateAfter={(m, watchEntryId) => { refresh(); setRating(m); setRatingWatchEntryId(watchEntryId); }}
        />
      )}

      {/* Convert */}
      {convertItem && (
        <DeskConvertOverlay
          item={convertItem}
          onClose={() => setConvertItem(null)}
          onConverted={handleConverted}
        />
      )}

      {/* Settings drawer */}
      {settingsOpen && (
        <div onClick={() => setSettingsOpen(false)} style={{ position: 'absolute', inset: 0, zIndex: 70, display: 'flex', justifyContent: 'flex-end', background: 'rgba(6,6,9,0.6)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', animation: 'fadeIn 240ms ease both' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 360, height: '100%', background: 'var(--ink-870)', borderLeft: '1px solid var(--line-strong)', padding: '28px 24px', overflowY: 'auto', animation: 'deskDrawer 360ms var(--ease-out) both', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="display" style={{ fontSize: 22, fontWeight: 700 }}>Ajustes</div>
              <button onClick={() => setSettingsOpen(false)} className="pressable cl-tap" style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid var(--line-strong)', background: 'var(--ink-800)', color: 'var(--text-dim)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                <Icon name="close" size={16} color="currentColor" />
              </button>
            </div>
            {/* User */}
            <div style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--ink-820)', border: '1px solid var(--line)' }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Usuario</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-dim)' }}>{displayName ?? '—'}</div>
            </div>
            {/* Stats */}
            <div style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--ink-820)', border: '1px solid var(--line)' }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Archivo</div>
              {[
                { l: 'Películas', v: dashStats?.totalMovies ?? '—' },
                { l: 'Visionados', v: dashStats?.totalWatchEntries ?? '—' },
                { l: 'Revisionados', v: dashStats?.totalRewatches ?? '—' },
                { l: 'Media personal', v: dashStats?.averagePersonalScore != null ? `${fmt1(dashStats.averagePersonalScore)}★` : '—' },
              ].map(s => (
                <div key={s.l} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-dim)', marginTop: 7 }}>
                  <span>{s.l}</span><span className="tnum" style={{ color: 'var(--accent)', fontWeight: 600 }}>{s.v}</span>
                </div>
              ))}
            </div>
            {/* GPT Export */}
            <button className="pressable cl-tap" onClick={() => { setSettingsOpen(false); setGptExportOpen(true); }} style={{ border: '1px solid var(--line-amber)', borderRadius: 14, padding: '14px 16px', background: 'rgba(232,185,116,0.06)', color: 'var(--accent)', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Exportar para ChatGPT</span>
              <Icon name="chevron" size={15} color="currentColor" />
            </button>
            {/* App info */}
            <div style={{ padding: '12px 16px', borderRadius: 14, background: 'var(--ink-820)', border: '1px solid var(--line)' }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>App</div>
              {[{ l: 'Versión', v: '0.1.0' }, { l: 'PWA', v: 'Manifest · SW' }].map(s => (
                <div key={s.l} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
                  <span>{s.l}</span><span>{s.v}</span>
                </div>
              ))}
            </div>
            {/* Sign out */}
            <button className="pressable cl-tap" onClick={() => { void signOut(); }} style={{ border: '1px solid rgba(184,73,63,0.28)', borderRadius: 14, padding: '13px 16px', background: 'rgba(184,73,63,0.06)', color: '#c07070', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Icon name="back" size={15} color="currentColor" /> Cerrar sesión
            </button>
          </div>
        </div>
      )}

      {/* GPT Export modal */}
      {gptExportOpen && (
        <div onClick={() => setGptExportOpen(false)} style={{ position: 'absolute', inset: 0, zIndex: 75, display: 'grid', placeItems: 'center', background: 'rgba(6,6,9,0.75)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', animation: 'fadeIn 240ms ease both' }}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', width: 460, height: 720, borderRadius: 22, overflow: 'hidden', background: 'var(--ink-870)', border: '1px solid var(--line-strong)', boxShadow: 'var(--shadow-pop)', animation: 'fadeUp 320ms var(--ease-out) both' }}>
            <GptExportScreen onBack={() => setGptExportOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
