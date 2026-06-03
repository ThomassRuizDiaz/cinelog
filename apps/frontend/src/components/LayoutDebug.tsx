/**
 * Dev-only layout diagnostic overlay.
 *
 * Activated by:  ?debug=1 in the URL (DEV builds only).
 * Production builds: this component renders null and tree-shakes cleanly.
 *
 * Usage on iPhone PWA:
 *   1. npm run dev:host   (on Mac — serves on LAN)
 *   2. On iPhone: navigate to  http://[LAN-IP]:5173/?debug=1
 *   3. Overlay shows diagnostic values on screen — no Mac/Web Inspector needed.
 *   4. Tap "Refresh" after interaction to re-snap values.
 *   5. "Copy" copies JSON to clipboard for sharing.
 *
 * Interpretation:
 *   - viewportBottomGap ≈ 0  →  nav is flush with screen bottom (correct)
 *   - viewportBottomGap > 0  →  nav floats above screen bottom; investigate why
 *   - --safe-bottom = 0px    →  env() not working; safe-area insets not applied
 *   - --safe-bottom = 34px   →  correct for iPhone with home indicator
 *   - visualViewport.height ≠ innerHeight  →  virtual keyboard or browser chrome offset
 */

import { useEffect, useState } from 'react';

function getCSSVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '—';
}

function snap(): Record<string, string | number | boolean> {
  const nav = document.querySelector('[data-layout-nav]') as HTMLElement | null;
  const root = document.querySelector('.cl-root') as HTMLElement | null;
  const navRect = nav?.getBoundingClientRect();
  return {
    'standalone (navigator)': Boolean((navigator as { standalone?: boolean }).standalone),
    'standalone (display-mode)': matchMedia('(display-mode: standalone)').matches,
    'window.innerHeight': window.innerHeight,
    'visualViewport.height': window.visualViewport?.height ?? 'N/A',
    'screen.height': screen.height,
    'documentElement.clientHeight': document.documentElement.clientHeight,
    '--safe-top': getCSSVar('--safe-top'),
    '--safe-bottom': getCSSVar('--safe-bottom'),
    '--nav-h': getCSSVar('--nav-h'),
    'nav.top': navRect ? navRect.top.toFixed(1) : 'not found',
    'nav.bottom': navRect ? navRect.bottom.toFixed(1) : 'not found',
    'nav.height': navRect ? navRect.height.toFixed(1) : 'not found',
    'viewportBottomGap (innerH - nav.bottom)': navRect
      ? (window.innerHeight - navRect.bottom).toFixed(1)
      : 'not found',
    'html.clientHeight': document.documentElement.clientHeight,
    'body.scrollHeight': document.body.scrollHeight,
    '#root.height': (document.getElementById('root')?.getBoundingClientRect().height ?? 0).toFixed(1),
    '.cl-root.height': (root?.getBoundingClientRect().height ?? 0).toFixed(1),
  };
}

export default function LayoutDebug() {
  const [visible, setVisible] = useState(false);
  const [rows, setRows] = useState<Record<string, string | number | boolean>>({});

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    /* Only activate when ?debug=1 is present — no noisy logging on every mount */
    const isDebug = new URLSearchParams(location.search).get('debug') === '1';
    if (!isDebug) return;
    const data = snap();
    setRows(data);
    setVisible(true);
    console.table(data);
  }, []);

  const refresh = () => {
    const data = snap();
    setRows(data);
    console.table(data);
  };

  const copy = () => {
    navigator.clipboard?.writeText(JSON.stringify(rows, null, 2)).catch(() => {});
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.92)',
        overflowY: 'auto', padding: '16px',
        fontFamily: 'monospace', fontSize: 11, color: '#e8b974',
        display: 'flex', flexDirection: 'column', gap: 5,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>Layout Debug · DEV</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={refresh}
            style={{ background: '#222', color: '#e8b974', border: '1px solid #555', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 11 }}>
            Refresh
          </button>
          <button onClick={copy}
            style={{ background: '#222', color: '#aaa', border: '1px solid #555', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 11 }}>
            Copy
          </button>
          <button onClick={() => setVisible(false)}
            style={{ background: '#222', color: '#888', border: '1px solid #555', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 11 }}>
            ✕
          </button>
        </div>
      </div>

      {Object.entries(rows).map(([k, v]) => {
        const isWarn = k.includes('Gap') && parseFloat(String(v)) > 5;
        const isOk = k.includes('Gap') && parseFloat(String(v)) <= 5;
        return (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, borderBottom: '1px solid #1a1a1a', paddingBottom: 3 }}>
            <span style={{ color: '#888', flex: 1 }}>{k}</span>
            <span style={{ color: isWarn ? '#e05060' : isOk ? '#60c880' : '#f7d6a0', fontWeight: 600, flexShrink: 0 }}>
              {String(v)}
            </span>
          </div>
        );
      })}

      <div style={{ marginTop: 10, fontSize: 9.5, color: '#555', textAlign: 'center' }}>
        viewportBottomGap: red = nav too high · green = nav flush
      </div>
    </div>
  );
}
