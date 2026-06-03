import Stars from './Stars';
import WatchMeta from './WatchMeta';
import { fmtDate } from '../lib/scoring';
import type { MockWatchEntry } from '../types/watch';

interface WatchEntryCardProps {
  entry: MockWatchEntry;
  isActive: boolean;
  /* Score shown on the card — typically the movie's active rating */
  displayScore: number;
}

export default function WatchEntryCard({ entry, isActive, displayScore }: WatchEntryCardProps) {
  return (
    <div
      style={{
        flex: 1,
        margin: '0 0 12px 10px',
        padding: 13,
        borderRadius: 14,
        background: isActive ? 'linear-gradient(150deg, rgba(232,185,116,0.10), var(--ink-820))' : 'var(--ink-820)',
        border: isActive ? '1px solid var(--line-amber)' : '1px solid var(--line)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600 }}>{fmtDate(entry.watchedAt)}</span>
            {isActive && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: '0.14em', color: 'var(--accent)', border: '1px solid var(--line-amber)', borderRadius: 5, padding: '2px 5px' }}>
                ACTIVE
              </span>
            )}
          </div>
          <div style={{ marginTop: 6 }}>
            <WatchMeta location={entry.watchLocation} watchType={entry.watchType} />
          </div>
        </div>
        <Stars value={displayScore} size={11} />
      </div>
      {entry.note && (
        <div style={{ marginTop: 9, fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-dim)', fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>
          &ldquo;{entry.note}&rdquo;
        </div>
      )}
    </div>
  );
}
