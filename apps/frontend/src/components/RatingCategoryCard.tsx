import { useState } from 'react';
import HalfStepRatingControl from './HalfStepRatingControl';
import Icon from './Icon';
import { fmt1 } from '../lib/scoring';
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

  return (
    <div
      style={{
        borderRadius: 16, background: 'var(--ink-820)',
        border: isOpen ? '1px solid var(--line-amber)' : '1px solid var(--line)',
        overflow: 'hidden',
        transition: 'border-color var(--dur) var(--ease-out)',
      }}
    >
      <div style={{ padding: '14px 15px 13px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 15.5, fontWeight: 600, lineHeight: 1.15 }}>{c.label}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-faint)', border: '1px solid var(--line)', borderRadius: 5, padding: '2px 5px', letterSpacing: '0.06em' }}>
                {c.weight}%
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 3 }}>{c.desc}</div>
          </div>
          <span className="display tnum" style={{ fontSize: 22, fontWeight: 700, color: value > 0 ? 'var(--accent)' : 'var(--text-ghost)', lineHeight: 1 }}>
            {fmt1(value)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 13 }}>
          <HalfStepRatingControl value={value} onChange={onChange} size={30} />
          <button
            className="cl-tap"
            onClick={onToggleNote}
            style={{ border: 'none', background: 'none', color: isOpen ? 'var(--accent)' : 'var(--text-faint)', display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            Note <Icon name={isOpen ? 'close' : 'edit'} size={13} color="currentColor" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div style={{ padding: '0 15px 14px', animation: 'fadeIn 220ms ease both' }}>
          <textarea
            autoFocus
            value={note}
            onChange={e => handleNoteChange(e.target.value)}
            rows={2}
            placeholder={`A note on ${c.short.toLowerCase()}…`}
            style={{
              width: '100%', resize: 'none',
              border: '1px solid var(--line-strong)', background: 'var(--ink-850)',
              borderRadius: 11, padding: '10px 12px',
              color: 'var(--text)', fontFamily: 'var(--font-display)', fontSize: 13.5, lineHeight: 1.5,
              outline: 'none', fontStyle: 'italic',
            }}
          />
        </div>
      )}
    </div>
  );
}
