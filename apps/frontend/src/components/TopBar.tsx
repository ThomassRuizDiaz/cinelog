import type { ReactNode } from 'react';
import Icon from './Icon';

interface TopBarProps {
  onBack?: () => void;
  eyebrow?: string;
  title?: string;
  trailing?: ReactNode;
  transparent?: boolean;
}

export default function TopBar({ onBack, eyebrow, title, trailing, transparent = false }: TopBarProps) {
  return (
    <div
      style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: transparent
          ? 'transparent'
          : 'linear-gradient(180deg, var(--ink-900) 60%, rgba(8,8,11,0))',
        display: 'flex', alignItems: 'center', gap: 12,
        padding: 'var(--safe-top) 16px 10px',
      }}
    >
      {onBack && (
        <button
          className="pressable cl-tap"
          onClick={onBack}
          style={{
            border: '1px solid var(--line-strong)',
            background: 'rgba(20,20,26,0.6)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            width: 38, height: 38, borderRadius: 12,
            display: 'grid', placeItems: 'center',
            color: 'var(--text)', flexShrink: 0,
          }}
        >
          <Icon name="back" size={20} color="currentColor" />
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {eyebrow && <div className="eyebrow" style={{ marginBottom: 1 }}>{eyebrow}</div>}
        {title && (
          <div className="display" style={{ fontSize: 19, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title}
          </div>
        )}
      </div>
      {trailing}
    </div>
  );
}
