import { useState } from 'react';
import type { PosterPalette } from '../types/movie';

interface MoviePosterProps {
  title: string;
  year: number;
  genres: string[];
  director: string;
  palette: PosterPalette;
  /** Real poster image URL from backend. When set and loaded, shown over the gradient. */
  posterUrl?: string | null;
  width?: number;
  rounded?: number;
  glow?: boolean;
  frame?: boolean;
  flat?: boolean;
}

export default function MoviePoster({
  title, year, genres, director,
  palette: pal,
  posterUrl,
  width: w = 120, rounded = 14, glow = false, frame = true, flat = false,
}: MoviePosterProps) {
  const h = Math.round(w * 1.48);
  const titleSize = Math.max(11, Math.round(w * 0.135));
  const showMeta = w >= 92;
  const [imgError, setImgError] = useState(false);
  const useRealPoster = !!posterUrl && !imgError;

  return (
    <div
      style={{
        position: 'relative', width: w, height: h, borderRadius: rounded, flexShrink: 0,
        background: `linear-gradient(158deg, ${pal.from} 0%, ${pal.to} 92%)`,
        boxShadow: flat ? 'none' : glow
          ? `var(--shadow-poster), 0 0 60px -14px ${pal.accent}66`
          : 'var(--shadow-poster)',
        overflow: 'hidden', color: pal.ink, isolation: 'isolate',
      }}
    >
      {useRealPoster ? (
        /* Real poster image */
        <>
          <img
            src={posterUrl}
            alt=""
            aria-hidden
            loading="lazy"
            onError={() => setImgError(true)}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', display: 'block',
            }}
          />
          {/* Subtle bottom shadow so score badges on top are readable */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.55) 100%)' }} />
        </>
      ) : (
        /* Gradient placeholder with title/director overlay */
        <>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(120% 80% at 22% 8%, ${pal.accent}26, transparent 55%)` }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 38%, rgba(0,0,0,0.55) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, opacity: 0.07, backgroundImage: 'repeating-linear-gradient(135deg, #fff 0 1px, transparent 1px 9px)' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${pal.accent}, transparent)`, opacity: 0.7 }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: w >= 92 ? '12px 12px 13px' : '7px 8px 8px' }}>
            {showMeta && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: Math.max(7.5, w * 0.052), letterSpacing: '0.12em', color: pal.ink, opacity: 0.72, textTransform: 'uppercase' }}>
                {year} · {genres[0]}
              </div>
            )}
            <div>
              <div className="display" style={{ fontSize: titleSize, lineHeight: 0.98, fontWeight: 700, textShadow: '0 2px 18px rgba(0,0,0,0.6)', letterSpacing: '-0.01em' }}>
                {title}
              </div>
              {showMeta && (
                <>
                  <div style={{ height: 1, width: 26, background: pal.accent, opacity: 0.85, margin: '7px 0 6px' }} />
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: Math.max(7, w * 0.046), letterSpacing: '0.08em', color: pal.ink, opacity: 0.66, textTransform: 'uppercase' }}>
                    {director}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
      {frame && (
        <div style={{ position: 'absolute', inset: 0, borderRadius: rounded, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
      )}
    </div>
  );
}
