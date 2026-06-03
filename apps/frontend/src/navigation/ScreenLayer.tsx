import { useState, useEffect, type ReactNode } from 'react';

interface ScreenLayerProps<T> {
  content: T | null;
  render: (content: T) => ReactNode;
  anim: 'push' | 'sheet';
  zIndex: number;
}

/**
 * Animated overlay layer. Mounts when content is set, unmounts after exit animation.
 * push: slides in from right. sheet: slides up from bottom.
 */
function ScreenLayer<T>({ content, render, anim, zIndex }: ScreenLayerProps<T>) {
  const [mounted, setMounted] = useState<T | null>(content);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (content) {
      setMounted(content);
      const r = setTimeout(() => setOpen(true), 20);
      return () => clearTimeout(r);
    }
    setOpen(false);
    const t = setTimeout(() => setMounted(null), 380);
    return () => clearTimeout(t);
  }, [content]);

  if (!mounted) return null;

  const transform = anim === 'sheet'
    ? (open ? 'translateY(0)' : 'translateY(100%)')
    : (open ? 'translateX(0)' : 'translateX(100%)');

  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex,
        background: 'var(--ink-900)',
        willChange: 'transform',
        transform,
        transition: `transform ${anim === 'sheet' ? 380 : 360}ms var(--ease-out)`,
        boxShadow: anim === 'push' ? '-12px 0 40px -12px rgba(0,0,0,0.6)' : 'none',
      }}
    >
      {render(mounted)}
    </div>
  );
}

export default ScreenLayer;
