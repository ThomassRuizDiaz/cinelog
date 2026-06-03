import { useState, useEffect, useCallback } from 'react';
import { TopBar, Icon } from '../components';
import type { RecommendationsExportResponse } from '../types/watchlist';
import { getRecommendationsExport } from '../api/watchlist';
import { ApiError } from '../api/errors';
import { useAuth } from '../contexts/AuthContext';

interface GptExportScreenProps {
  onBack: () => void;
}

type FetchState = 'loading' | 'loaded' | 'error';

/* Safely converts an unknown value to a display string.
   Handles the case where the backend might return an object instead of a plain string. */
function safeStr(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (typeof o.name === 'string') return o.name;
    if (typeof o.title === 'string') return o.title;
    const count = typeof o.count === 'number' ? ` (${o.count})` : '';
    const label = typeof o.label === 'string' ? o.label : '';
    if (label) return `${label}${count}`;
  }
  return '';
}

function safeStrArr(arr: unknown[]): string[] {
  return arr.map(safeStr).filter(Boolean);
}

/* ── Toggle ───────────────────────────────────────────────────────────────── */

function Toggle({ label, checked, onChange }: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      className="cl-tap"
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', padding: '14px 16px',
        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)',
      }}
    >
      <span style={{ fontSize: 14.5 }}>{label}</span>
      <div style={{
        width: 44, height: 26, borderRadius: 13, flexShrink: 0,
        background: checked ? 'var(--accent)' : 'var(--ink-680)',
        transition: 'background 200ms ease', position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 3, left: checked ? 21 : 3,
          width: 20, height: 20, borderRadius: '50%',
          background: checked ? '#1a1206' : 'var(--text-ghost)',
          transition: 'left 200ms ease',
        }} />
      </div>
    </button>
  );
}

/* ── Chips row ────────────────────────────────────────────────────────────── */

function Chips({ items }: { items: string[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {items.map((s, i) => (
        <span key={i} style={{
          fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.04em',
          color: 'var(--text-dim)', padding: '4px 9px',
          background: 'var(--ink-800)', border: '1px solid var(--line)',
          borderRadius: 8,
        }}>
          {s}
        </span>
      ))}
    </div>
  );
}

/* ── Screen ───────────────────────────────────────────────────────────────── */

export default function GptExportScreen({ onBack }: GptExportScreenProps) {
  const { signOut } = useAuth();

  const [fetchState, setFetchState] = useState<FetchState>('loading');
  const [data, setData] = useState<RecommendationsExportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [includePrivateNotes, setIncludePrivateNotes] = useState(false);
  const [includeWatchlist, setIncludeWatchlist] = useState(true);
  const [stale, setStale] = useState(false);

  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  const fetchExport = useCallback(async (privNotes: boolean, watchlist: boolean) => {
    setFetchState('loading');
    setError(null);
    setStale(false);
    try {
      const res = await getRecommendationsExport({
        includePrivateNotes: privNotes,
        includeWatchlist: watchlist,
        format: 'markdown',
      });
      setData(res);
      setFetchState('loaded');
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthorized) { void signOut(); return; }
      setError(err instanceof ApiError ? err.message : 'No se pudo generar el export.');
      setFetchState('error');
    }
  }, [signOut]);

  useEffect(() => { void fetchExport(false, true); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleWatchlist = (v: boolean) => { setIncludeWatchlist(v); setStale(true); };
  const handleTogglePrivate   = (v: boolean) => { setIncludePrivateNotes(v); setStale(true); };

  const handleCopy = () => {
    if (!data?.prompt) {
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2500);
      return;
    }
    navigator.clipboard?.writeText(data.prompt)
      .then(() => { setCopyStatus('copied'); setTimeout(() => setCopyStatus('idle'), 2200); })
      .catch(() => { setCopyStatus('error'); setTimeout(() => setCopyStatus('idle'), 2500); });
  };

  const handleOpenChatGPT = () => {
    window.open('https://chat.openai.com', '_blank', 'noopener,noreferrer');
  };

  const loaded = fetchState === 'loaded' && data != null;

  /* Safe taste profile */
  const genres    = loaded && data.tasteProfile ? safeStrArr(data.tasteProfile.favoriteGenres ?? []) : [];
  const directors = loaded && data.tasteProfile ? safeStrArr(data.tasteProfile.favoriteDirectors?.slice(0, 4) ?? []) : [];
  const watchedCount   = loaded ? (data.alreadyWatched?.length ?? 0) : 0;
  const watchlistCount = loaded ? (data.watchlist?.length ?? 0) : 0;
  const isEmpty = loaded && watchedCount === 0;

  const copyLabel = copyStatus === 'copied' ? '✓ Copiado' : copyStatus === 'error' ? 'Error al copiar' : 'Copiar para GPT';
  const copyColor = copyStatus === 'copied' ? '#60c880' : copyStatus === 'error' ? '#d07070' : undefined;

  return (
    <div className="cl-scroll" style={{ position: 'absolute', inset: 0, paddingBottom: 'calc(var(--safe-bottom) + 30px)' }}>
      <TopBar onBack={onBack} eyebrow="Cinelog" title="Recomendaciones" />

      <div style={{ padding: '4px 20px 0' }}>
        <div className="display" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.1, marginBottom: 6 }}>
          Recomendaciones con GPT
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 22 }}>
          Genera un prompt con tu historial cinematográfico y pégalo en ChatGPT para recibir recomendaciones personalizadas.
        </div>

        {/* Options */}
        <div style={{ background: 'var(--ink-820)', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
          <Toggle label="Incluir Watchlist como contexto" checked={includeWatchlist} onChange={handleToggleWatchlist} />
          <div style={{ height: 1, background: 'var(--line)' }} />
          <Toggle label="Incluir notas privadas" checked={includePrivateNotes} onChange={handleTogglePrivate} />
        </div>

        {/* Stale regenerate */}
        {stale && fetchState !== 'loading' && (
          <button
            className="pressable cl-tap"
            onClick={() => void fetchExport(includePrivateNotes, includeWatchlist)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              border: '1px solid var(--line-amber)', borderRadius: 12, padding: '12px 14px',
              background: 'rgba(232,185,116,0.06)', color: 'var(--accent)',
              fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
              marginBottom: 14,
            }}
          >
            <Icon name="rewatch" size={14} color="currentColor" />
            Regenerar con nuevas opciones
          </button>
        )}

        {/* Loading */}
        {fetchState === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {[64, 100, 56].map((h, i) => (
              <div key={i} style={{ height: h, borderRadius: 14, background: 'var(--ink-820)', animation: `glowPulse 1.8s ease ${i * 120}ms infinite` }} />
            ))}
          </div>
        )}

        {/* Error */}
        {fetchState === 'error' && (
          <div style={{ marginBottom: 20, padding: '14px 16px', background: 'rgba(184,73,63,0.08)', border: '1px solid rgba(184,73,63,0.22)', borderRadius: 14 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#d07070', marginBottom: 10 }}>{error}</div>
            <button className="pressable cl-tap" onClick={() => void fetchExport(includePrivateNotes, includeWatchlist)} style={{ border: '1px solid rgba(184,73,63,0.3)', borderRadius: 10, padding: '8px 16px', background: 'rgba(184,73,63,0.1)', color: '#c07070', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Reintentar
            </button>
          </div>
        )}

        {/* Empty archive */}
        {isEmpty && (
          <div style={{ marginBottom: 18, padding: '14px 16px', background: 'var(--ink-820)', border: '1px solid var(--line)', borderRadius: 14 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.55 }}>
              Sin películas valoradas todavía. Las recomendaciones mejoran después de puntuar películas.
            </div>
          </div>
        )}

        {/* Summary */}
        {loaded && !isEmpty && (
          <div style={{ background: 'var(--ink-820)', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ padding: '13px 16px', borderBottom: genres.length > 0 || directors.length > 0 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-faint)', letterSpacing: '0.1em', marginBottom: 2 }}>PELÍCULAS</div>
                  <div className="display" style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>{watchedCount}</div>
                </div>
                {includeWatchlist && watchlistCount > 0 && (
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-faint)', letterSpacing: '0.1em', marginBottom: 2 }}>WATCHLIST</div>
                    <div className="display" style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-dim)' }}>{watchlistCount}</div>
                  </div>
                )}
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-faint)', letterSpacing: '0.1em', marginBottom: 2 }}>NOTAS PRIVADAS</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: includePrivateNotes ? 'var(--accent)' : 'var(--text-ghost)' }}>
                    {includePrivateNotes ? 'Incluidas' : 'Excluidas'}
                  </div>
                </div>
              </div>
            </div>

            {/* Taste profile chips */}
            {(genres.length > 0 || directors.length > 0) && (
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {genres.length > 0 && (
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.15em', color: 'var(--text-faint)', marginBottom: 6 }}>GÉNEROS FAVORITOS</div>
                    <Chips items={genres} />
                  </div>
                )}
                {directors.length > 0 && (
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.15em', color: 'var(--text-faint)', marginBottom: 6 }}>DIRECTORES FAVORITOS</div>
                    <Chips items={directors} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Privacy warning (if any) */}
        {loaded && data.privacy.warning && (
          <div style={{ padding: '10px 14px', background: 'rgba(232,185,116,0.05)', border: '1px solid var(--line-amber)', borderRadius: 12, marginBottom: 14, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.55 }}>
            {data.privacy.warning}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {/* Primary — copy prompt */}
          <button
            onClick={handleCopy}
            disabled={!loaded}
            style={{
              width: '100%', padding: '15px 16px', borderRadius: 16,
              background: loaded
                ? (copyStatus === 'copied' ? 'rgba(96,200,128,0.12)' : copyStatus === 'error' ? 'rgba(184,73,63,0.1)' : 'linear-gradient(150deg, var(--accent), var(--accent-deep))')
                : 'var(--ink-820)',
              border: loaded && copyStatus !== 'idle' ? `1px solid ${copyStatus === 'copied' ? 'rgba(96,200,128,0.4)' : 'rgba(184,73,63,0.3)'}` : 'none',
              color: loaded ? (copyColor ?? '#1a1206') : 'var(--text-faint)',
              fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600,
              cursor: loaded ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: loaded ? 1 : 0.45,
              transition: 'all 200ms ease',
            }}
          >
            <Icon name="film" size={16} color="currentColor" />
            {copyLabel}
          </button>

          {/* Secondary — open ChatGPT */}
          <button
            onClick={handleOpenChatGPT}
            disabled={!loaded}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 16,
              background: 'var(--ink-820)', border: '1px solid var(--line)',
              color: loaded ? 'var(--text-dim)' : 'var(--text-faint)',
              fontFamily: 'var(--font-sans)', fontSize: 14.5, fontWeight: 600,
              cursor: loaded ? 'pointer' : 'not-allowed', opacity: loaded ? 1 : 0.45,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <Icon name="arrow" size={16} color="currentColor" />
            Abrir ChatGPT
          </button>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-ghost)', letterSpacing: '0.04em', lineHeight: 1.7 }}>
          No se llama a la API de OpenAI.<br />
          El prompt se copia. Pégalo en ChatGPT manualmente.
        </div>
      </div>
    </div>
  );
}
