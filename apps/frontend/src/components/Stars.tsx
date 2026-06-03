import Icon from './Icon';

interface StarsProps {
  value: number;
  size?: number;
  gap?: number;
  color?: string;
}

export default function Stars({ value, size = 15, gap = 2.5, color = 'var(--star)' }: StarsProps) {
  const star = (fillPct: number, key: number) => (
    <span key={key} style={{ position: 'relative', width: size, height: size, display: 'inline-block', flexShrink: 0 }}>
      <span style={{ position: 'absolute', inset: 0, color: 'rgba(255,255,255,0.14)' }}>
        <Icon name="star" size={size} color="currentColor" />
      </span>
      <span style={{ position: 'absolute', inset: 0, overflow: 'hidden', width: `${fillPct * 100}%`, color }}>
        <span style={{ display: 'block', width: size, color }}>
          <Icon name="star" size={size} color="currentColor" />
        </span>
      </span>
    </span>
  );
  return (
    <span style={{ display: 'inline-flex', gap, alignItems: 'center' }}>
      {[0, 1, 2, 3, 4].map(i => star(Math.max(0, Math.min(1, value - i)), i))}
    </span>
  );
}
