import { useState } from 'react';
import RatingScaleControl from './RatingScaleControl';
import Icon from './Icon';
import { fmtScore } from '../lib/scoring';
import type { RatingCategory } from '../types/rating';

interface RatingCategoryCardProps {
  category: RatingCategory;
  value: number;
  onChange: (value: number) => void;
  isOpen: boolean;
  onToggleNote: () => void;
  noteValue?: string;
  onNoteChange?: (note: string) => void;
}

export default function RatingCategoryCard({
  category: c, value, onChange,
  isOpen, onToggleNote,
  noteValue = '', onNoteChange,
}: RatingCategoryCardProps) {
  // local note state when no external handler provided
  const [localNote, setLocalNote] = useState('');
  const note = onNoteChange ? noteValue : localNote;
  const handleNoteChange = (n: string) => {
    if (onNoteChange) onNoteChange(n);
    else setLocalNote(n);
  };

  const scored = value > 0;

  return (
    <div
      style={{
        borderRadius: 18,
        background: scored
          ? `linear-gradient(152deg, ${c.color}12, var(--ink-820) 58%)`
          : 'var(--ink-820)',
        border: isOpen ? `1px solid ${c.color}66` : scored ? `1px solid ${c.color}30` : '1px solid var(--line)',
        boxShadow: isOpen ? `0 0 0 1px ${c.color}22, 0 14px 34px -18px ${c.color}` : 'none',
        overflow: 'hidden',
        transition: 'border-color var(--dur) var(--ease-out), box-shadow var(--dur) var(--ease-out), background var(--dur) var(--ease-out)',
      }}
    >
      <div style={{ padding: '15px 16px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0 }}>
            <span style={{
              width: 42, height: 42, borderRadius: 12, display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1,
              background: `linear-gradient(150deg, ${c.color}33, ${c.color}0f)`,
              border: `1px solid ${c.color}55`,
              boxShadow: scored ? `0 0 16px -5px ${c.color}` : 'none',
              transition: 'box-shadow var(--dur) var(--ease-out)',
            }}>
              <Icon name={c.icon} size={22} color={c.color} stroke={1.9} />
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, lineHeight: 1.18 }}>{c.label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 6 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: c.color, border: `1px solid ${c.color}45`, borderRadius: 5, padding: '2px 5px', letterSpacing: '0.06em', flexShrink: 0 }}>
                  {c.weight}%
                </span>
                <span style={{ fontSize: 11.5, color: 'var(--text-faint)', minWidth: 0 }}>{c.desc}</span>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <span className="display tnum" style={{ fontSize: 26, fontWeight: 800, color: scored ? 'var(--accent)' : 'var(--text-ghost)', lineHeight: 1 }}>
              {scored ? fmtScore(value) : '—'}
            </span>
            <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 7.5, color: 'var(--text-faint)', letterSpacing: '0.12em', marginTop: 4 }}>/ 10</span>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <RatingScaleControl value={value} onChange={onChange} icon={c.icon} starSize={28} stacked />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <button
            className="cl-tap"
            onClick={onToggleNote}
            style={{ border: 'none', background: 'none', color: isOpen ? 'var(--accent)' : 'var(--text-faint)', display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}
          >
            {note.trim() ? 'Nota guardada' : 'Nota'} <Icon name={isOpen ? 'close' : 'edit'} size={13} color="currentColor" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div style={{ padding: '0 16px 15px', animation: 'fadeIn 220ms ease both' }}>
          <textarea
            autoFocus
            value={note}
            onChange={e => handleNoteChange(e.target.value)}
            rows={2}
            placeholder={`Una nota sobre ${c.short.toLowerCase()}…`}
            style={{
              width: '100%', resize: 'none',
              border: `1px solid ${c.color}45`, background: 'var(--ink-850)',
              borderRadius: 12, padding: '11px 13px',
              color: 'var(--text)', fontFamily: 'var(--font-display)', fontSize: 13.5, lineHeight: 1.5,
              outline: 'none', fontStyle: 'italic',
            }}
          />
        </div>
      )}
    </div>
  );
}
