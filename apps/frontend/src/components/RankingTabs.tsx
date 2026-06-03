import { useRef } from 'react';

interface TabOption {
  id: string;
  label: string;
  tag?: string;
}

interface RankingTabsProps {
  options: TabOption[];
  value: string;
  onChange: (id: string) => void;
}

export default function RankingTabs({ options, value, onChange }: RankingTabsProps) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className="cl-scroll"
      style={{ position: 'static', display: 'flex', gap: 8, overflowX: 'auto', padding: '2px 16px 2px', scrollbarWidth: 'none' }}
    >
      {options.map(o => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            className="pressable cl-tap"
            onClick={() => onChange(o.id)}
            style={{
              flexShrink: 0,
              border: active ? '1px solid var(--line-amber)' : '1px solid var(--line)',
              background: active ? 'linear-gradient(150deg, rgba(232,185,116,0.18), rgba(232,185,116,0.06))' : 'var(--ink-800)',
              color: active ? 'var(--accent-bright)' : 'var(--text-dim)',
              borderRadius: 12,
              padding: o.tag ? '8px 14px' : '9px 15px',
              display: 'flex', flexDirection: 'column', gap: 1,
              transition: 'all var(--dur) var(--ease-out)', textAlign: 'left',
            }}
          >
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: active ? 600 : 500, whiteSpace: 'nowrap' }}>{o.label}</span>
            {o.tag && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>
                {o.tag}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
