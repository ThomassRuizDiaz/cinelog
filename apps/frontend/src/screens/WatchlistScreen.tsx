import { useState, useEffect, useCallback } from 'react';
import { SafeAreaScreen, Icon, MoviePoster, PrimaryButton, SecondaryButton } from '../components';
import type { TabId } from '../components';
import type { MockMovie } from '../types/movie';
import type { WatchType, WatchLocation } from '../types/watch';
import type { WatchlistItem, ConvertWatchlistItemRequest } from '../types/watchlist';
import { getWatchlist, deleteWatchlistItem, convertWatchlistItem } from '../api/watchlist';
import { ApiError } from '../api/errors';
import { useAuth } from '../contexts/AuthContext';
import { derivePalette } from '../lib/posterPalette';
import { ZERO_SCORES } from '../lib/movieAdapter';

interface WatchlistScreenProps {
  onTabChange: (tab: TabId) => void;
  onRateAfterConvert: (movie: MockMovie, watchEntryId: number) => void;
}

/* ── Convert overlay ──────────────────────────────────────────────────────── */

function SegBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      className="pressable cl-tap"
      onClick={onClick}
      style={{
        flex: 1, border: active ? '1px solid var(--line-amber)' : '1px solid var(--line)',
        background: active ? 'rgba(232,185,116,0.12)' : 'var(--ink-820)',
        color: active ? 'var(--accent)' : 'var(--text-dim)',
        borderRadius: 12, padding: '12px 6px', fontSize: 13, fontWeight: 600,
        fontFamily: 'var(--font-sans)', cursor: 'pointer',
        transition: 'all 200ms ease',
      }}
    >
      {label}
    </button>
  );
}

interface ConvertOverlayProps {
  item: WatchlistItem;
  onClose: () => void;
  onConverted: (movie: MockMovie, watchEntryId: number) => void;
}

function ConvertOverlay({ item, onClose, onConverted }: ConvertOverlayProps) {
  const { signOut } = useAuth();
  const [watchedAt, setWatchedAt] = useState(new Date().toISOString().slice(0, 10));
  const [watchType, setWatchType] = useState<WatchType>('FIRST_WATCH');
  const [watchLocation, setWatchLocation] = useState<WatchLocation>('HOME');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleConvert = async (rateAfter: boolean) => {
    setSaveState('saving');
    setError(null);
    const req: ConvertWatchlistItemRequest = { watchedAt, watchType, watchLocation };
    try {
      const res = await convertWatchlistItem(item.id, req);
      const movie: MockMovie = {
        id: String(res.movie.id),
        title: res.movie.title,
        originalTitle: res.movie.originalTitle ?? undefined,
        year: res.movie.releaseYear,
        director: res.movie.directors[0] ?? 'Unknown',
        directors: res.movie.directors,
        genres: res.movie.genres,
        runtime: 0,
        poster: derivePalette(res.movie.title, res.movie.releaseYear),
        posterUrl: res.movie.posterUrl,
        rated: false,
        scores: ZERO_SCORES,
        personal: 0, objective: 0, technicalScore: 0,
        review: '', note: '',
        watches: [{
          watchedAt, watchType, watchLocation,
          scored: false, note: '', watchEntryId: res.watchEntry.id,
        }],
      };
      if (rateAfter) {
        onConverted(movie, res.watchEntry.id);
      } else {
        onConverted(movie, -1); // -1 = skip rating
      }
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthorized) { void signOut(); return; }
      setError(err instanceof ApiError ? err.message : 'Error al convertir. Inténtalo de nuevo.');
      setSaveState('error');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 45,
      background: 'rgba(5,5,8,0.88)',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }}>
      {/* Dismiss tap */}
      <div style={{ flex: 1 }} onClick={onClose} />

      {/* Sheet */}
      <div style={{
        background: 'var(--ink-870)', borderRadius: '22px 22px 0 0',
        border: '1px solid var(--line)', borderBottom: 'none',
        padding: '20px 20px calc(var(--safe-bottom) + 20px)',
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--text-ghost)', margin: '0 auto 18px' }} />

        <div className="display" style={{ fontSize: 19, fontWeight: 700, marginBottom: 4 }}>
          Marcar como vista
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', marginBottom: 20, letterSpacing: '0.04em' }}>
          {item.title}
        </div>

        {/* Donde */}
        <div className="eyebrow" style={{ marginBottom: 8 }}>¿Dónde la viste?</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <SegBtn label="Casa"  active={watchLocation === 'HOME'}   onClick={() => setWatchLocation('HOME')} />
          <SegBtn label="Cine"  active={watchLocation === 'CINEMA'} onClick={() => setWatchLocation('CINEMA')} />
        </div>

        {/* Tipo */}
        <div className="eyebrow" style={{ marginBottom: 8 }}>Tipo de visionado</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <SegBtn label="Primer visionado" active={watchType === 'FIRST_WATCH'} onClick={() => setWatchType('FIRST_WATCH')} />
          <SegBtn label="Revisionado"      active={watchType === 'REWATCH'}      onClick={() => setWatchType('REWATCH')} />
        </div>

        {/* Date */}
        <div className="eyebrow" style={{ marginBottom: 8 }}>Fecha</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', height: 48, borderRadius: 12, background: 'var(--ink-820)', border: '1px solid var(--line-strong)', marginBottom: 20 }}>
          <Icon name="calendar" size={16} color="var(--text-faint)" />
          <input
            type="date" value={watchedAt}
            onChange={e => setWatchedAt(e.target.value)}
            style={{ flex: 1, border: 'none', background: 'none', outline: 'none', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 14, colorScheme: 'dark' }}
          />
        </div>

        {error && (
          <div style={{ marginBottom: 14, padding: '10px 13px', borderRadius: 10, background: 'rgba(184,73,63,0.09)', border: '1px solid rgba(184,73,63,0.22)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#d07070' }}>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <PrimaryButton icon="star" fullWidth disabled={saveState === 'saving'} onClick={() => void handleConvert(true)}>
            {saveState === 'saving' ? 'Guardando…' : 'Puntuar ahora'}
          </PrimaryButton>
          <SecondaryButton fullWidth disabled={saveState === 'saving'} onClick={() => void handleConvert(false)}>
            {saveState === 'saving' ? 'Guardando…' : 'Guardar sin puntuar'}
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}

/* ── Watchlist item card ───────────────────────────────────────────────────── */

interface ItemCardProps {
  item: WatchlistItem;
  confirmDeleteId: number | null;
  deletingId: number | null;
  onConvert: () => void;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}

function ItemCard({ item, confirmDeleteId, deletingId, onConvert, onDeleteRequest, onDeleteConfirm, onDeleteCancel }: ItemCardProps) {
  const palette = derivePalette(item.title, item.releaseYear ?? 0);
  const director = item.directors[0] ?? null;
  const isConfirming = confirmDeleteId === item.id;
  const isDeleting = deletingId === item.id;

  return (
    <div style={{
      background: 'linear-gradient(150deg, var(--ink-800), var(--ink-820))',
      border: '1px solid var(--line)', borderRadius: 18,
      overflow: 'hidden',
      animation: 'fadeUp 420ms var(--ease-out) both',
    }}>
      <div style={{ display: 'flex', gap: 13, padding: 12, alignItems: 'flex-start' }}>
        <MoviePoster
          title={item.title}
          year={item.releaseYear ?? 0}
          genres={item.genres}
          director={director ?? ''}
          palette={palette}
          posterUrl={item.posterUrl}
          width={62} rounded={10}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="display" style={{ fontSize: 16.5, fontWeight: 600, lineHeight: 1.08 }}>
            {item.title}
          </div>
          {(item.releaseYear || director) && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>
              {[item.releaseYear, director].filter(Boolean).join(' · ')}
            </div>
          )}
          {item.genres.length > 0 && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-faint)', marginTop: 3 }}>
              {item.genres.slice(0, 3).join(' · ')}
            </div>
          )}
          {item.notes && (
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 13, color: 'var(--text-dim)', marginTop: 7, lineHeight: 1.45 }}>
              {item.notes}
            </div>
          )}
        </div>
        {/* Delete trigger */}
        <button
          className="pressable cl-tap"
          onClick={onDeleteRequest}
          disabled={isDeleting}
          style={{ border: '1px solid var(--line)', background: 'var(--ink-760)', borderRadius: 10, width: 34, height: 34, display: 'grid', placeItems: 'center', flexShrink: 0, color: 'var(--text-faint)', cursor: 'pointer' }}
        >
          <Icon name="close" size={14} color="currentColor" stroke={2} />
        </button>
      </div>

      {/* Delete confirm row */}
      {isConfirming && (
        <div style={{ display: 'flex', gap: 8, padding: '0 12px 12px', animation: 'fadeUp 200ms var(--ease-out) both' }}>
          <button
            className="pressable cl-tap"
            onClick={onDeleteConfirm}
            disabled={isDeleting}
            style={{ flex: 1, border: '1px solid rgba(184,73,63,0.35)', background: 'rgba(184,73,63,0.1)', borderRadius: 10, padding: '10px 0', color: '#c07070', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-sans)', cursor: 'pointer' }}
          >
            {isDeleting ? 'Eliminando…' : 'Eliminar'}
          </button>
          <button
            className="pressable cl-tap"
            onClick={onDeleteCancel}
            style={{ flex: 1, border: '1px solid var(--line)', background: 'var(--ink-820)', borderRadius: 10, padding: '10px 0', color: 'var(--text-faint)', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-sans)', cursor: 'pointer' }}
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Convert action */}
      {!isConfirming && (
        <div style={{ padding: '0 12px 12px' }}>
          <button
            className="pressable cl-tap"
            onClick={onConvert}
            style={{
              width: '100%', border: '1px solid var(--line-amber)', borderRadius: 12,
              padding: '10px 0', background: 'rgba(232,185,116,0.07)',
              color: 'var(--accent)', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}
          >
            <Icon name="play" size={13} color="currentColor" />
            Marcar como vista
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Screen ───────────────────────────────────────────────────────────────── */

export default function WatchlistScreen({ onTabChange, onRateAfterConvert }: WatchlistScreenProps) {
  const { signOut } = useAuth();

  const [loadState, setLoadState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [retryKey, setRetryKey] = useState(0);

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [convertItem, setConvertItem] = useState<WatchlistItem | null>(null);

  useEffect(() => {
    setLoadState('loading');
    getWatchlist({ sort: 'NEWEST', size: 50 })
      .then(data => { setItems(data); setLoadState('loaded'); })
      .catch(err => {
        if (err instanceof ApiError && err.isUnauthorized) { void signOut(); return; }
        setLoadState('error');
      });
  }, [retryKey, signOut]);

  const handleDeleteConfirm = useCallback(async (id: number) => {
    setDeletingId(id);
    try {
      await deleteWatchlistItem(id);
      setItems(prev => prev.filter(it => it.id !== id));
      setConfirmDeleteId(null);
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthorized) { void signOut(); return; }
    } finally {
      setDeletingId(null);
    }
  }, [signOut]);

  const handleConverted = useCallback((movie: MockMovie, watchEntryId: number) => {
    if (convertItem) setItems(prev => prev.filter(it => it.id !== convertItem.id));
    setConvertItem(null);
    if (watchEntryId > 0) {
      onRateAfterConvert(movie, watchEntryId);
    } else {
      onTabChange('library');
    }
  }, [convertItem, onRateAfterConvert, onTabChange]);

  /* ── Loading ── */
  if (loadState === 'loading') return (
    <SafeAreaScreen withBottomNav>
      <div style={{ padding: 'calc(var(--safe-top) + 6px) 20px 0' }}>
        <div className="eyebrow" style={{ marginBottom: 7 }}>Por ver</div>
        <div className="display" style={{ fontSize: 30, fontWeight: 700, lineHeight: 0.96, letterSpacing: '-0.02em' }}>
          Watch<span style={{ fontStyle: 'italic', fontWeight: 500 }}>list</span>
        </div>
      </div>
      <div style={{ padding: '20px 16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: 88, borderRadius: 18, background: 'var(--ink-820)', animation: `glowPulse 1.8s ease ${i * 100}ms infinite` }} />
        ))}
      </div>
    </SafeAreaScreen>
  );

  /* ── Error ── */
  if (loadState === 'error') return (
    <SafeAreaScreen withBottomNav>
      <div style={{ padding: 'calc(var(--safe-top) + 40px) 32px 0', textAlign: 'center' }}>
        <div className="display" style={{ fontSize: 18, color: 'var(--text-dim)' }}>Sin conexión</div>
        <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, color: 'var(--text-faint)', marginTop: 10, lineHeight: 1.5 }}>
          No se pudo cargar la Watchlist.
        </div>
        <button className="pressable cl-tap" onClick={() => setRetryKey(k => k + 1)} style={{ marginTop: 24, border: '1px solid var(--line-amber)', borderRadius: 14, padding: '13px 28px', background: 'rgba(232,185,116,0.1)', color: 'var(--accent)', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Reintentar
        </button>
      </div>
    </SafeAreaScreen>
  );

  return (
    <>
      <SafeAreaScreen withBottomNav>
        {/* Header */}
        <div style={{ padding: 'calc(var(--safe-top) + 6px) 20px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 7 }}>Por ver</div>
          <div className="display" style={{ fontSize: 30, fontWeight: 700, lineHeight: 0.96, letterSpacing: '-0.02em' }}>
            Watch<span style={{ fontStyle: 'italic', fontWeight: 500 }}>list</span>
          </div>
        </div>

        {items.length === 0 ? (
          /* Empty state */
          <div style={{ textAlign: 'center', padding: '64px 32px 0' }}>
            <div style={{ width: 62, height: 62, borderRadius: 19, background: 'linear-gradient(155deg, var(--ink-800), var(--ink-820))', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', margin: '0 auto 22px' }}>
              <Icon name="watchlist" size={28} color="var(--text-faint)" stroke={1.5} />
            </div>
            <div className="display" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-dim)' }}>
              Tu Watchlist está vacía
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 15, color: 'var(--text-faint)', marginTop: 12, lineHeight: 1.65 }}>
              Guarda películas para ver más adelante.
            </div>
            <button
              className="pressable cl-tap"
              onClick={() => onTabChange('add')}
              style={{ marginTop: 28, border: 'none', borderRadius: 14, padding: '14px 32px', background: 'linear-gradient(150deg, var(--accent), var(--accent-deep))', color: '#1a1206', fontFamily: 'var(--font-sans)', fontSize: 14.5, fontWeight: 700, cursor: 'pointer' }}
            >
              Buscar película
            </button>
          </div>
        ) : (
          /* List */
          <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="eyebrow" style={{ paddingLeft: 4 }}>
              {items.length} {items.length === 1 ? 'película' : 'películas'}
            </div>
            {items.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                confirmDeleteId={confirmDeleteId}
                deletingId={deletingId}
                onConvert={() => setConvertItem(item)}
                onDeleteRequest={() => setConfirmDeleteId(prev => prev === item.id ? null : item.id)}
                onDeleteConfirm={() => void handleDeleteConfirm(item.id)}
                onDeleteCancel={() => setConfirmDeleteId(null)}
              />
            ))}
          </div>
        )}
      </SafeAreaScreen>

      {/* Convert overlay */}
      {convertItem && (
        <ConvertOverlay
          item={convertItem}
          onClose={() => setConvertItem(null)}
          onConverted={handleConverted}
        />
      )}
    </>
  );
}
