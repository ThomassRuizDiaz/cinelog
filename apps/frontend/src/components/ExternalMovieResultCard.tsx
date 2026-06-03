import MoviePoster from './MoviePoster';
import Icon from './Icon';
import type { ExternalMovieResult, PosterPalette } from '../types/movie';

interface ExternalMovieResultCardProps {
  result: ExternalMovieResult;
  onSelect: () => void;
  isInLibrary?: boolean;
  delay?: number;
  /** Placeholder palette for mock data — used when posterUrl is null */
  placeholderPalette?: PosterPalette;
}

const FALLBACK_PALETTE: PosterPalette = {
  from: '#1a1a22', to: '#0a0a0e', accent: '#e8b974', ink: '#ece4d4',
};

export default function ExternalMovieResultCard({
  result, onSelect, isInLibrary = false, delay = 0, placeholderPalette,
}: ExternalMovieResultCardProps) {
  const palette = placeholderPalette ?? FALLBACK_PALETTE;
  const director = result.directors[0] ?? '—';

  return (
    <button
      className="pressable cl-tap"
      onClick={onSelect}
      style={{
        display: 'flex', gap: 13, alignItems: 'center', padding: 11,
        border: 'none', borderRadius: 16,
        background: 'var(--ink-820)', color: 'var(--text)', textAlign: 'left',
        animation: `fadeUp 380ms var(--ease-out) ${delay}ms both`,
      }}
    >
      <MoviePoster
        title={result.title} year={result.releaseYear}
        genres={result.genres} director={director}
        palette={palette} width={48} rounded={9}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="display" style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.05 }}>{result.title}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-dim)', marginTop: 4 }}>
          {result.releaseYear} · {director}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-faint)', marginTop: 3 }}>
          {result.genres.join(' · ')}
        </div>
      </div>
      {isInLibrary ? (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--accent)', border: '1px solid var(--line-amber)', borderRadius: 6, padding: '3px 6px', letterSpacing: '0.08em', flexShrink: 0 }}>
          IN LIBRARY
        </span>
      ) : (
        <Icon name="add" size={20} color="var(--text-faint)" />
      )}
    </button>
  );
}
