import Icon from './Icon';

interface HalfStepRatingControlProps {
  value: number;
  onChange: (value: number) => void;
  size?: number;
  gap?: number;
}

export default function HalfStepRatingControl({ value, onChange, size = 30, gap = 7 }: HalfStepRatingControlProps) {
  return (
    <div style={{ display: 'flex', gap }}>
      {[0, 1, 2, 3, 4].map(i => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <div key={i} style={{ position: 'relative', width: size, height: size }}>
            {/* empty star */}
            <span style={{ position: 'absolute', inset: 0, color: 'rgba(255,255,255,0.13)' }}>
              <Icon name="star" size={size} color="currentColor" />
            </span>
            {/* filled portion */}
            <span
              style={{
                position: 'absolute', inset: 0, overflow: 'hidden',
                width: `${fill * 100}%`,
                color: 'var(--star)',
                filter: fill > 0 ? 'drop-shadow(0 0 5px rgba(232,185,116,0.5))' : 'none',
                transition: 'width 160ms var(--ease-out)',
              }}
            >
              <span style={{ display: 'block', width: size }}>
                <Icon name="star" size={size} color="currentColor" />
              </span>
            </span>
            {/* left half — 0.5 step */}
            <button
              className="cl-tap"
              aria-label={`${i + 0.5} stars`}
              onClick={() => onChange(i + 0.5)}
              style={{ position: 'absolute', left: 0, top: 0, width: '50%', height: '100%', border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
            />
            {/* right half — full step */}
            <button
              className="cl-tap"
              aria-label={`${i + 1} stars`}
              onClick={() => onChange(i + 1)}
              style={{ position: 'absolute', right: 0, top: 0, width: '50%', height: '100%', border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
            />
          </div>
        );
      })}
    </div>
  );
}
