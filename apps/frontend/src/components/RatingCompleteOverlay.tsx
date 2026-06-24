import type { CSSProperties } from 'react';
import Icon from './Icon';
import { CATEGORIES } from '../data/categories';
import { fmtScore } from '../lib/scoring';

interface RatingCompleteOverlayProps {
  finalScore: number;
  /** When true, plays the full category-glyph burst (first save of the session). */
  celebrate?: boolean;
}

/**
 * Cinematic save-complete moment: a golden rating seal lands with an expanding
 * ring; on the first save of a session the nine category glyphs burst outward
 * like a constellation. ~1.4s, then settles. Honors prefers-reduced-motion via
 * the global rule in global.css (animations collapse to a static seal).
 */
export default function RatingCompleteOverlay({ finalScore, celebrate = false }: RatingCompleteOverlayProps) {
  return (
    <div
      /*
       * position: fixed — the rating screen lives inside a scrollable container
       * (`cl-scroll`); an absolutely-positioned overlay would pin to the top of
       * the scrolled content and sit off-screen after the user scrolls down to
       * Save. `fixed` pins it to the nearest transformed/backdrop-filtered
       * ancestor (the ScreenLayer on mobile, the modal backdrop on desktop),
       * i.e. the full visible screen, so the moment is always centered in view.
       */
      style={{
        position: 'fixed', inset: 0, zIndex: 120, display: 'grid', placeItems: 'center',
        background: 'radial-gradient(circle at 50% 42%, rgba(28,22,10,0.78), rgba(8,8,11,0.9))',
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        animation: 'fadeIn 260ms ease both', overflow: 'hidden',
      }}
    >
      <div style={{ position: 'relative', width: 320, height: 320, display: 'grid', placeItems: 'center' }}>
        {/* glow flash */}
        <span style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, var(--accent-glow), transparent 68%)', animation: 'sealRing 1000ms var(--ease-out) both', pointerEvents: 'none' }} />

        {/* category-glyph burst (two waves on first save) */}
        {celebrate && [0, 1].map(wave => CATEGORIES.map((c, i) => {
          const spin = wave === 1 ? (360 / CATEGORIES.length) / 2 : 0;
          const ang = (-90 + i * (360 / CATEGORIES.length) + spin) * Math.PI / 180;
          const dist = wave === 1 ? 150 : 132;
          const bx = `${Math.round(Math.cos(ang) * dist)}px`;
          const by = `${Math.round(Math.sin(ang) * dist)}px`;
          const br = `${(i % 2 === 0 ? 1 : -1) * 50}deg`;
          return (
            <span
              key={`${wave}-${c.key}`}
              style={{
                position: 'absolute', left: '50%', top: '50%', marginLeft: -11, marginTop: -11,
                '--bx': bx, '--by': by, '--br': br,
                animation: `glyphBurst 1150ms var(--ease-out) ${120 + i * 32 + wave * 90}ms both`,
                pointerEvents: 'none', filter: 'drop-shadow(0 0 7px rgba(232,185,116,0.55))',
              } as CSSProperties}
            >
              <Icon name={c.icon} size={wave === 1 ? 18 : 22} color={c.color} stroke={1.9} />
            </span>
          );
        }))}

        {/* expanding rings */}
        <span style={{ position: 'absolute', width: 122, height: 122, borderRadius: '50%', border: '2px solid var(--accent)', animation: 'sealRing 1200ms var(--ease-out) both', pointerEvents: 'none' }} />
        <span style={{ position: 'absolute', width: 122, height: 122, borderRadius: '50%', border: '1.5px solid var(--accent-bright)', animation: 'sealRing 1200ms var(--ease-out) 200ms both', pointerEvents: 'none' }} />
        <span style={{ position: 'absolute', width: 122, height: 122, borderRadius: '50%', border: '1px solid var(--accent)', animation: 'sealRing 1200ms var(--ease-out) 400ms both', pointerEvents: 'none' }} />

        {/* the seal */}
        <div style={{ position: 'relative', animation: 'sealIn 820ms var(--ease-spring) both' }}>
          <div style={{ width: 122, height: 122, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at 42% 32%, var(--accent-bright), var(--accent) 46%, var(--accent-deep) 100%)', boxShadow: '0 0 60px -4px var(--accent), inset 0 2px 8px rgba(255,255,255,0.4), inset 0 -8px 18px rgba(120,80,20,0.55)', border: '1px solid rgba(255,236,200,0.6)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Icon name="star" size={34} color="#2a1d08" />
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <span className="display tnum" style={{ fontSize: 21, fontWeight: 800, color: '#2a1d08', lineHeight: 1 }}>{fmtScore(finalScore)}</span>
                <span className="tnum" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: 'rgba(42,29,8,0.7)' }}>/10</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 'calc(34% - 44px)', left: 0, right: 0, textAlign: 'center', animation: 'sealLabelIn 540ms var(--ease-out) 420ms both' }}>
        <div className="display" style={{ fontSize: 24, fontWeight: 700 }}>Puntuación guardada</div>
        <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, color: 'var(--text-dim)', marginTop: 7 }}>
          Archivada con {fmtScore(finalScore)} estrellas.
        </div>
      </div>
    </div>
  );
}
