import { useState, useEffect, useCallback } from 'react';
import { SafeAreaScreen, SearchInput, ActorAvatar, Icon } from '../components';
import type { ActorListItem } from '../types/actor';
import { getActors } from '../api/actors';
import { ApiError } from '../api/errors';
import { useAuth } from '../contexts/AuthContext';

interface ActorsScreenProps {
  onOpenActor: (id: number) => void;
}

type LoadState = 'loading' | 'loaded' | 'error';

function perfLabel(n: number): string {
  return `${n} ${n === 1 ? 'actuación' : 'actuaciones'}`;
}

export default function ActorsScreen({ onOpenActor }: ActorsScreenProps) {
  const { signOut } = useAuth();
  const [actors, setActors] = useState<ActorListItem[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [query, setQuery] = useState('');

  const load = useCallback((q: string) => {
    setState('loading');
    getActors({ query: q.trim() || undefined, size: 100 })
      .then(res => { setActors(res); setState('loaded'); })
      .catch(err => {
        if (err instanceof ApiError && err.isUnauthorized) { void signOut(); return; }
        setState('error');
      });
  }, [signOut]);

  /* initial load */
  useEffect(() => { load(''); }, [load]);

  /* debounced search */
  useEffect(() => {
    const timer = setTimeout(() => load(query), 350);
    return () => clearTimeout(timer);
  }, [query, load]);

  return (
    <SafeAreaScreen withBottomNav>
      <div style={{ padding: 'calc(var(--safe-top) + 4px) 20px 0' }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>
          {state === 'loaded' ? `${actors.length} en tu archivo` : 'Reparto'}
        </div>
        <div className="display" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 0.95 }}>Actores</div>
      </div>

      <div style={{ padding: '16px 16px 12px' }}>
        <SearchInput
          value={query}
          onChange={setQuery}
          onClear={() => setQuery('')}
          placeholder="Buscar un actor…"
        />
      </div>

      {/* ── Loading ── */}
      {state === 'loading' && (
        <div style={{ padding: '4px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{ aspectRatio: '2 / 3', borderRadius: 16, background: 'var(--ink-820)', animation: `glowPulse 1.8s ease ${i * 80}ms infinite` }} />
          ))}
        </div>
      )}

      {/* ── Error ── */}
      {state === 'error' && (
        <div style={{ padding: '40px 32px 0', textAlign: 'center' }}>
          <div className="display" style={{ fontSize: 18, color: 'var(--text-dim)' }}>Sin conexión</div>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, color: 'var(--text-faint)', marginTop: 10, lineHeight: 1.5 }}>
            No se pudieron cargar los actores.
          </div>
          <button className="pressable cl-tap" onClick={() => load(query)} style={{ marginTop: 24, border: '1px solid var(--line-amber)', borderRadius: 14, padding: '13px 28px', background: 'rgba(232,185,116,0.1)', color: 'var(--accent)', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Reintentar
          </button>
        </div>
      )}

      {/* ── Empty ── */}
      {state === 'loaded' && actors.length === 0 && (
        <div style={{ padding: '46px 36px 0', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px', display: 'grid', placeItems: 'center', background: 'var(--ink-820)', border: '1px solid var(--line)' }}>
            <Icon name="actors" size={26} color="var(--text-faint)" stroke={1.6} />
          </div>
          <div className="display" style={{ fontSize: 18, color: 'var(--text-dim)' }}>
            {query.trim() ? 'Sin coincidencias' : 'Aún no hay actores'}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, color: 'var(--text-faint)', marginTop: 8, lineHeight: 1.5 }}>
            {query.trim()
              ? 'Prueba con otro nombre.'
              : 'Aparecerán aquí cuando importes películas con reparto.'}
          </div>
        </div>
      )}

      {/* ── Grid ── */}
      {state === 'loaded' && actors.length > 0 && (
        <div style={{ padding: '4px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {actors.map((a, i) => (
            <button
              key={a.id}
              className="pressable cl-tap"
              onClick={() => onOpenActor(a.id)}
              style={{
                position: 'relative', display: 'block', width: '100%', padding: 0,
                border: 'none', background: 'none', color: 'var(--text)', textAlign: 'left',
                borderRadius: 16, cursor: 'pointer',
                animation: `fadeUp 460ms var(--ease-out) ${Math.min(i, 12) * 34}ms both`,
              }}
            >
              <ActorAvatar name={a.name} profileUrl={a.profileUrl} shape="portrait" fill rounded={16} />
              {/* overlaid identity */}
              <div style={{ position: 'absolute', left: 12, right: 12, bottom: 11, pointerEvents: 'none' }}>
                <div className="display" style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.12, textShadow: '0 1px 6px rgba(0,0,0,0.7)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {a.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent-bright)', letterSpacing: '0.04em', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                    {perfLabel(a.performanceCount)}
                  </span>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'rgba(20,20,26,0.7)', border: '1px solid var(--line-amber)' }}>
                    <Icon name="chevron" size={13} color="var(--accent)" />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </SafeAreaScreen>
  );
}
