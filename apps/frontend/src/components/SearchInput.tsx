import Icon from './Icon';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function SearchInput({ value, onChange, onClear, placeholder = 'Search a movie database…', autoFocus = false }: SearchInputProps) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 11, padding: '0 15px', height: 52,
        borderRadius: 16, background: 'var(--ink-820)',
        border: '1px solid var(--line-amber)',
        boxShadow: '0 0 0 4px rgba(232,185,116,0.05)',
      }}
    >
      <Icon name="search" size={19} color="var(--accent)" stroke={2} />
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1, border: 'none', background: 'none', outline: 'none',
          color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: 16,
        }}
      />
      {value && (
        <button
          className="cl-tap"
          onClick={onClear}
          style={{ border: 'none', background: 'none', color: 'var(--text-faint)', display: 'grid', padding: 0 }}
        >
          <Icon name="close" size={17} color="currentColor" />
        </button>
      )}
    </div>
  );
}
