import Icon from './Icon';

interface SectionHeadProps {
  eyebrow?: string;
  title: string;
  action?: string;
  onAction?: () => void;
}

export default function SectionHead({ eyebrow, title, action, onAction }: SectionHeadProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 13 }}>
      <div>
        {eyebrow && <div className="eyebrow" style={{ marginBottom: 4 }}>{eyebrow}</div>}
        <div className="display" style={{ fontSize: 21, fontWeight: 600, lineHeight: 1, whiteSpace: 'nowrap' }}>{title}</div>
      </div>
      {action && (
        <button
          className="pressable cl-tap"
          onClick={onAction}
          style={{ border: 'none', background: 'none', color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 4, padding: 0 }}
        >
          {action} <Icon name="arrow" size={13} color="currentColor" />
        </button>
      )}
    </div>
  );
}
