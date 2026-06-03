import Icon from './Icon';
import type { IconName } from './Icon';

interface SecondaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: IconName;
  fullWidth?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
}

export default function SecondaryButton({
  children,
  onClick,
  icon,
  fullWidth = false,
  disabled = false,
  type = 'button',
}: SecondaryButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="pressable cl-tap"
      style={{
        width: fullWidth ? '100%' : undefined,
        border: '1px solid var(--line-strong)',
        borderRadius: 16,
        padding: '15px 24px',
        background: 'var(--ink-800)',
        color: disabled ? 'var(--text-faint)' : 'var(--text)',
        fontFamily: 'var(--font-sans)',
        fontSize: 14,
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {icon && <Icon name={icon} size={16} color="currentColor" />}
      {children}
    </button>
  );
}
