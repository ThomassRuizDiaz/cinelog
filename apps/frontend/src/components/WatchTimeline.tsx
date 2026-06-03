import WatchEntryCard from './WatchEntryCard';
import type { MockMovie } from '../types/movie';

interface WatchTimelineProps {
  movie: MockMovie;
}

export default function WatchTimeline({ movie }: WatchTimelineProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {movie.watches.map((w, i) => {
        const active = i === 0;
        const isLast = i === movie.watches.length - 1;
        return (
          <div key={`${w.watchedAt}-${i}`} style={{ display: 'flex', gap: 0, alignItems: 'stretch' }}>
            {/* sprocket rail */}
            <div
              style={{
                width: 26, flexShrink: 0, position: 'relative',
                background: 'repeating-linear-gradient(180deg, transparent 0 7px, var(--ink-720) 7px 15px, transparent 15px 22px)',
              }}
            >
              <div style={{ position: 'absolute', inset: '0 8px', background: 'repeating-linear-gradient(180deg, transparent 0 9px, rgba(255,255,255,0.07) 9px 13px, transparent 13px 22px)' }} />
              {/* glowing dot */}
              <div
                style={{
                  position: 'absolute', left: '50%', top: 22, transform: 'translateX(-50%)',
                  width: 9, height: 9, borderRadius: '50%',
                  background: active ? 'var(--accent)' : 'var(--text-ghost)',
                  boxShadow: active ? '0 0 12px 2px var(--accent)' : 'none',
                  zIndex: 2,
                }}
              />
              {!isLast && (
                <div style={{ position: 'absolute', left: '50%', top: 30, bottom: -2, width: 1.5, transform: 'translateX(-50%)', background: 'var(--line-strong)' }} />
              )}
            </div>
            {/* entry frame */}
            <WatchEntryCard
              entry={w}
              isActive={active}
              displayScore={active && w.scored ? movie.personal : 0}
            />
          </div>
        );
      })}
    </div>
  );
}
