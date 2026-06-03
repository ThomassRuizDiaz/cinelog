import MoviePoster from './MoviePoster';
import Stars from './Stars';
import { fmt, fmt1, roundHalf } from '../lib/scoring';
import type { MockMovie } from '../types/movie';

interface SecondaryScore {
  label: string;
  value: number;
}

interface RankingListItemProps {
  movie: MockMovie;
  rank: number;
  score: number;
  secondaryScores?: SecondaryScore[];
  onOpen: () => void;
  delay?: number;
}

export default function RankingListItem({ movie, rank, score, secondaryScores, onOpen, delay = 0 }: RankingListItemProps) {
  return (
    <button
      className="pressable cl-tap"
      onClick={onOpen}
      style={{
        width: '100%', border: 'none', background: 'none', textAlign: 'left', color: 'var(--text)',
        display: 'flex', alignItems: 'center', gap: 14, padding: '12px 6px 12px 0',
        borderTop: '1px solid var(--line)',
        animation: `fadeUp 500ms var(--ease-out) ${delay}ms both`,
      }}
    >
      {/* monolith numeral */}
      <span
        className="display tnum"
        style={{
          width: 58, flexShrink: 0, textAlign: 'center',
          fontSize: 50, fontWeight: 800, lineHeight: 1,
          color: 'transparent',
          WebkitTextStroke: '1.4px var(--rank-stroke)',
        } as React.CSSProperties}
      >
        {rank}
      </span>

      <MoviePoster
        title={movie.title} year={movie.year}
        genres={movie.genres} director={movie.director}
        palette={movie.poster} posterUrl={movie.posterUrl}
        width={50} rounded={9}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="display" style={{ fontSize: 16.5, fontWeight: 600, lineHeight: 1.05, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {movie.title}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-faint)', marginTop: 3 }}>
          {movie.year} · {movie.director}
        </div>
        {secondaryScores && secondaryScores.length > 0 && (
          <div style={{ display: 'flex', gap: 12, marginTop: 7 }}>
            {secondaryScores.map((s, i) => (
              <span key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
                {s.label} <span className="tnum" style={{ color: 'var(--text)', fontWeight: 600 }}>{fmt1(s.value)}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0, paddingRight: 2 }}>
        <div className="display tnum" style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>{fmt(score)}</div>
        <div style={{ marginTop: 4 }}><Stars value={roundHalf(score)} size={9.5} /></div>
      </div>
    </button>
  );
}
