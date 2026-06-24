import MoviePoster from './MoviePoster';
import Stars from './Stars';
import Icon from './Icon';
import { fmt1, roundHalf } from '../lib/scoring';
import type { MockMovie } from '../types/movie';

interface MovieCardProps {
  movie: MockMovie;
  onOpen: () => void;
  score?: number;
  scoreLabel?: string;
  delay?: number;
}

export default function MovieCard({ movie, onOpen, score, scoreLabel, delay = 0 }: MovieCardProps) {
  const sval = score != null ? score : movie.personal;
  const isRated = movie.rated || sval > 0;
  const lastWatch = movie.watches[0];
  const rewatched = movie.watches.length > 1;

  return (
    <button
      className="pressable cl-tap"
      onClick={onOpen}
      style={{
        width: '100%', textAlign: 'left', border: 'none',
        display: 'flex', gap: 13, padding: 11, borderRadius: 18,
        background: 'linear-gradient(150deg, var(--ink-800), var(--ink-820))',
        boxShadow: 'var(--shadow-card)',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        animation: `fadeUp 460ms var(--ease-out) ${delay}ms both`,
        alignItems: 'stretch', color: 'var(--text)',
      }}
    >
      <MoviePoster
        title={movie.title} year={movie.year}
        genres={movie.genres} director={movie.director}
        palette={movie.poster} posterUrl={movie.posterUrl}
        width={62} rounded={10}
      />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingTop: 1 }}>
        <div>
          <div style={{ display: 'flex' }}>
            <span className="display" style={{ fontSize: 16.5, fontWeight: 600, lineHeight: 1.08, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>
              {movie.title}{movie.year ? ` (${movie.year})` : ''}
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.04em', color: 'var(--text-dim)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {movie.director} · {movie.genres.slice(0, 2).join(', ')}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 8 }}>
          {isRated ? (
            <>
              <Stars value={roundHalf(sval)} size={13} />
              <span className="tnum" style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{fmt1(sval)}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-faint)', letterSpacing: '0.06em' }}>
                {scoreLabel ?? 'PERSONAL'}
              </span>
            </>
          ) : (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-ghost)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Sin puntuar</span>
          )}
          {rewatched && lastWatch && (
            <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: 'var(--font-mono)', fontSize: 8.5, color: 'var(--text-faint)', letterSpacing: '0.06em' }}>
              <Icon name="rewatch" size={11} stroke={1.8} color="currentColor" />×{movie.watches.length}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
