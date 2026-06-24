import { useState } from 'react';
import Icon from './Icon';

interface ActorAvatarProps {
  name: string;
  profileUrl?: string | null;
  /** Width in px. Height = width (circle) or width*1.5 (portrait). Ignored when `fill`. */
  size?: number;
  shape?: 'circle' | 'portrait';
  /** Corner radius for portrait shape. */
  rounded?: number;
  /** Fill the parent width with a 2:3 portrait (for grid cells). */
  fill?: boolean;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '·';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Actor portrait. Shows the real TMDb profile image when `profileUrl` is set
 * and loads; otherwise a cinematic amber-tinted fallback (initials for portrait,
 * glyph for circle). Used in the actors grid, actor detail, and movie cast.
 */
export default function ActorAvatar({ name, profileUrl, size = 48, shape = 'circle', rounded = 12, fill = false }: ActorAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const portrait = shape === 'portrait' || fill;
  const w = size;
  const h = portrait ? Math.round(size * 1.5) : size;
  const radius = portrait ? rounded : '50%';
  const useImg = !!profileUrl && !imgError;
  /* size of fallback initials/glyph — derived from a representative width when filling */
  const fbW = fill ? 150 : w;

  return (
    <div
      style={{
        position: 'relative', flexShrink: 0,
        ...(fill
          ? { width: '100%', aspectRatio: '2 / 3' }
          : { width: w, height: h }),
        borderRadius: radius, overflow: 'hidden',
        background: 'radial-gradient(circle at 38% 28%, var(--accent-glow), var(--ink-760) 72%)',
        border: '1px solid var(--line-amber)',
        boxShadow: portrait ? 'var(--shadow-poster)' : 'none',
        isolation: 'isolate',
      }}
    >
      {/* fallback layer (always rendered underneath) */}
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
        {portrait ? (
          <span className="display" style={{ fontSize: Math.max(15, Math.round(fbW * 0.30)), fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.02em', opacity: 0.92 }}>
            {initials(name)}
          </span>
        ) : (
          <Icon name="actors" size={Math.round(w * 0.5)} color="var(--accent)" stroke={1.7} />
        )}
      </div>

      {useImg && (
        <img
          src={profileUrl!}
          alt={name}
          loading="lazy"
          onError={() => setImgError(true)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 18%', display: 'block' }}
        />
      )}

      {/* subtle bottom scrim on portraits for text legibility when overlaid */}
      {portrait && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '46%', background: 'linear-gradient(180deg, transparent, rgba(8,8,11,0.78))', pointerEvents: 'none' }} />
      )}
    </div>
  );
}
