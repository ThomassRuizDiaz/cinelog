interface GenreChipsProps {
  genres: string[];
}

export default function GenreChips({ genres }: GenreChipsProps) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {genres.map(g => (
        <span
          key={g}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--text-dim)', padding: '4px 9px',
            borderRadius: 7, background: 'var(--ink-760)', border: '1px solid var(--line)',
          }}
        >
          {g}
        </span>
      ))}
    </div>
  );
}
