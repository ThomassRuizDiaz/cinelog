import { useState, useEffect } from 'react';
import { TopBar, MoviePoster, Stars, ActorAvatar } from '../components';
import type { MockMovie } from '../types/movie';
import type { ActorDetail, ActorPerformance } from '../types/actor';
import { getActorDetail } from '../api/actors';
import { ApiError } from '../api/errors';
import { useAuth } from '../contexts/AuthContext';
import { fmtScore } from '../lib/scoring';
import { derivePalette } from '../lib/posterPalette';
import { adaptActorPerformance } from '../lib/movieAdapter';

interface ActorDetailScreenProps {
  actorId: number;
  onBack: () => void;
  onOpenMovie: (movie: MockMovie) => void;
}

type LoadState = 'loading' | 'loaded' | 'error';

function PerformanceRow({ p, onOpen }: { p: ActorPerformance; onOpen: () => void }) {
  const rating = p.activeRating;
  return (
    <button
      className="pressable cl-tap"
      onClick={onOpen}
      style={{
        width: '100%', textAlign: 'left', display: 'flex', gap: 13, padding: 11,
        borderRadius: 16, border: '1px solid var(--line)',
        background: 'linear-gradient(150deg, var(--ink-800), var(--ink-820))',
        color: 'var(--text)', alignItems: 'stretch',
      }}
    >
      <MoviePoster
        title={p.title} year={p.releaseYear} genres={[]} director="Unknown"
        palette={derivePalette(p.title, p.releaseYear)} posterUrl={p.posterUrl}
        width={54} rounded={9}
      />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingTop: 1 }}>
        <div>
          <div className="display" style={{ fontSize: 15.5, fontWeight: 600, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {p.title}{p.releaseYear ? ` (${p.releaseYear})` : ''}
          </div>
          {p.characterName && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.04em', color: 'var(--text-dim)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <span style={{ color: 'var(--text-faint)' }}>Personaje · </span>{p.characterName}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          {rating ? (
            <>
              <Stars value={rating.displayScore} size={12} />
              <span className="tnum" style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                {fmtScore(rating.displayScore)}
              </span>
            </>
          ) : (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-ghost)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Sin puntuar</span>
          )}
        </div>
      </div>
    </button>
  );
}

export default function ActorDetailScreen({ actorId, onBack, onOpenMovie }: ActorDetailScreenProps) {
  const { signOut } = useAuth();
  const [actor, setActor] = useState<ActorDetail | null>(null);
  const [state, setState] = useState<LoadState>('loading');

  useEffect(() => {
    setState('loading');
    getActorDetail(actorId)
      .then(res => { setActor(res); setState('loaded'); })
      .catch(err => {
        if (err instanceof ApiError && err.isUnauthorized) { void signOut(); return; }
        setState('error');
      });
  }, [actorId, signOut]);

  const performances = [...(actor?.performances ?? [])].sort((a, b) => a.castOrder - b.castOrder);

  return (
    <div className="cl-scroll" style={{ paddingBottom: 'calc(var(--safe-bottom) + 40px)', position: 'absolute', inset: 0 }}>
      <TopBar onBack={onBack} eyebrow="Actor" title={actor?.name ?? 'Actor'} />

      {state === 'loading' && (
        <div style={{ padding: '8px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 90, borderRadius: 16, background: 'var(--ink-820)', animation: `glowPulse 1.8s ease ${i * 100}ms infinite` }} />
          ))}
        </div>
      )}

      {state === 'error' && (
        <div style={{ padding: '40px 32px 0', textAlign: 'center' }}>
          <div className="display" style={{ fontSize: 18, color: 'var(--text-dim)' }}>No se pudo cargar</div>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, color: 'var(--text-faint)', marginTop: 10 }}>
            Inténtalo de nuevo.
          </div>
        </div>
      )}

      {state === 'loaded' && actor && (
        <div style={{ animation: 'fadeIn 300ms var(--ease-out) both' }}>
          {/* hero */}
          <div style={{ padding: '6px 20px 0', display: 'flex', alignItems: 'flex-end', gap: 16 }}>
            <ActorAvatar name={actor.name} profileUrl={actor.profileUrl} shape="portrait" size={92} rounded={16} />
            <div style={{ minWidth: 0, paddingBottom: 6 }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Contextos de actuación</div>
              <div className="display" style={{ fontSize: 25, fontWeight: 700, lineHeight: 1.05 }}>{actor.name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-faint)', letterSpacing: '0.04em', marginTop: 8 }}>
                {performances.length} {performances.length === 1 ? 'película en tu archivo' : 'películas en tu archivo'}
              </div>
            </div>
          </div>

          {/* performances */}
          <div style={{ padding: '24px 16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12, paddingLeft: 2 }}>
              <span className="eyebrow">Películas en tu archivo</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-faint)' }}>{performances.length}</span>
            </div>

            {performances.length === 0 ? (
              <div style={{ padding: '20px 16px', borderRadius: 16, background: 'var(--ink-820)', border: '1px solid var(--line)', textAlign: 'center', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, color: 'var(--text-faint)' }}>
                Sin películas registradas para este actor.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {performances.map(p => (
                  <PerformanceRow key={`${p.movieId}-${p.castOrder}`} p={p} onOpen={() => onOpenMovie(adaptActorPerformance(p))} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
