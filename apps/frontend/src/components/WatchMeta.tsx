import Icon from './Icon';
import { WATCH_LOCATION_LABELS, WATCH_TYPE_LABELS } from '../types/watch';
import type { WatchLocation, WatchType } from '../types/watch';

interface WatchMetaProps {
  location: WatchLocation;
  watchType: WatchType;
  color?: string;
}

export default function WatchMeta({ location, watchType, color = 'var(--text-dim)' }: WatchMetaProps) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <Icon name={location === 'CINEMA' ? 'cinema' : 'home-loc'} size={13} stroke={1.8} color="currentColor" />
        {WATCH_LOCATION_LABELS[location]}
      </span>
      <span style={{ opacity: 0.4 }}>·</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <Icon name={watchType === 'REWATCH' ? 'rewatch' : 'first'} size={12} stroke={1.8} color="currentColor" />
        {WATCH_TYPE_LABELS[watchType]}
      </span>
    </div>
  );
}
