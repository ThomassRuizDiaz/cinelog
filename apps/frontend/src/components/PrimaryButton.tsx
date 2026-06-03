import Icon from './Icon';
import type { IconName } from './Icon';

interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: IconName;
  fullWidth?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
}

export default function PrimaryButton({
  children,
  onClick,
  icon,
  fullWidth = false,
  disabled = false,
  type = 'button',
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="pressable cl-tap"
      style={{
        width: fullWidth ? '100%' : undefined,
        border: 'none',
        borderRadius: 16,
        padding: '17px 24px',
        background: disabled
          ? 'var(--ink-680)'
          : 'linear-gradient(150deg, var(--accent), var(--accent-deep))',
        color: disabled ? 'var(--text-faint)' : '#1a1206',
        fontFamily: 'var(--font-sans)',
        fontSize: 15.5,
        fontWeight: 700,
        boxShadow: disabled ? 'none' : '0 12px 30px -10px var(--accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {icon && <Icon name={icon} size={17} color="currentColor" />}
      {children}
    </button>
  );
}
