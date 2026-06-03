import type { ReactNode } from 'react';
import MoviePoster from './MoviePoster';
import GenreChips from './GenreChips';
import TopBar from './TopBar';
import type { MockMovie } from '../types/movie';

interface PosterHeroProps {
  movie: MockMovie;
  onBack?: () => void;
  trailing?: ReactNode;
}

export default function PosterHero({ movie, onBack, trailing }: PosterHeroProps) {
  return (
    <div style={{ position: 'relative' }}>
      {/* blurred cinematic backdrop */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 420, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, transform: 'scale(1.7)', filter: 'blur(40px) saturate(150%)', opacity: 0.55 }}>
          <MoviePoster
            title={movie.title} year={movie.year}
            genres={movie.genres} director={movie.director}
            palette={movie.poster}
            width={420} rounded={0} frame={false} flat
          />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,8,11,0.45) 0%, rgba(8,8,11,0.2) 24%, rgba(8,8,11,0.82) 70%, var(--ink-900) 100%)' }} />
      </div>

      <TopBar onBack={onBack} transparent trailing={trailing} />

      <div style={{ position: 'relative', padding: '6px 20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <MoviePoster
          title={movie.title} year={movie.year}
          genres={movie.genres} director={movie.director}
          palette={movie.poster}
          width={138} rounded={16} glow
        />
        <div className="display" style={{ fontSize: 28, fontWeight: 700, marginTop: 20, lineHeight: 1, letterSpacing: '-0.01em' }}>
          {movie.title}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginTop: 9, letterSpacing: '0.05em' }}>
          {movie.year} · {movie.director} · {movie.runtime}m
        </div>
        <div style={{ marginTop: 14 }}>
          <GenreChips genres={movie.genres} />
        </div>
      </div>
    </div>
  );
}
