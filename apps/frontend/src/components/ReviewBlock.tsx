interface ReviewBlockProps {
  text: string;
}

export default function ReviewBlock({ text }: ReviewBlockProps) {
  return (
    <div style={{ position: 'relative', paddingLeft: 18 }}>
      <span
        className="display"
        style={{
          position: 'absolute', left: -4, top: -14,
          fontSize: 56, color: 'var(--line-amber)', fontWeight: 700, lineHeight: 1,
        }}
      >
        &ldquo;
      </span>
      <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 17, lineHeight: 1.5, color: 'var(--text)' }}>
        {text}
      </div>
    </div>
  );
}
