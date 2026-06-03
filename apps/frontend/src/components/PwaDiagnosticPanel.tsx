/**
 * DEV-only in-app PWA layout debugger and live safe-area tuning panel.
 * Opened from Settings → "Diagnóstico PWA". Never rendered in production.
 *
 * Persists tuning values in localStorage so values survive PWA reloads.
 * On startup (main.tsx) saved values are re-applied before first render.
 *
 * CSS variables controlled:
 *   --debug-nav-bottom-offset     bottom-nav vertical offset
 *   --debug-content-bottom-extra  extra bottom padding for SafeAreaScreen
 *   --safe-bottom                 direct override (when not 'off')
 *
 * HTML height classes controlled:
 *   cl-debug-h-dvh / cl-debug-h-svh / cl-debug-h-fill
 */

import { useEffect, useState, useCallback } from 'react';
import {
  DBG_LS, SAFE_OPTS, HEIGHT_MODES,
  applyNavOffset, applyContentExtra, applySafeBottom, applyHeightMode,
} from '../lib/debugLayout';
import type { SafeOpt, HeightMode } from '../lib/debugLayout';

/* ── Diagnostics snap ──────────────────────────────────────────────────────── */

function getCSSVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '—';
}

function snap(): Record<string, string | number | boolean> {
  const nav  = document.querySelector('[data-layout-nav]') as HTMLElement | null;
  const root = document.querySelector('.cl-root') as HTMLElement | null;
  const nr   = nav?.getBoundingClientRect();
  const gap  = nr ? window.innerHeight - nr.bottom : null;
  return {
    'standalone (navigator)':     Boolean((navigator as { standalone?: boolean }).standalone),
    'standalone (display-mode)':  matchMedia('(display-mode: standalone)').matches,
    'window.innerHeight':         window.innerHeight,
    'visualViewport.height':      window.visualViewport?.height ?? 'N/A',
    'screen.height':              screen.height,
    'documentElement.clientHeight': document.documentElement.clientHeight,
    '--safe-top':                 getCSSVar('--safe-top'),
    '--safe-bottom':              getCSSVar('--safe-bottom'),
    '--nav-h':                    getCSSVar('--nav-h'),
    '--nav-bottom-gap':           getCSSVar('--nav-bottom-gap'),
    'nav.top':                    nr ? nr.top.toFixed(1)    : 'not found',
    'nav.bottom':                 nr ? nr.bottom.toFixed(1) : 'not found',
    'nav.height':                 nr ? nr.height.toFixed(1) : 'not found',
    'viewportBottomGap':          gap !== null ? gap.toFixed(1) : 'not found',
    'html.clientHeight':          document.documentElement.clientHeight,
    'body.scrollHeight':          document.body.scrollHeight,
    '#root.height':               (document.getElementById('root')?.getBoundingClientRect().height ?? 0).toFixed(1),
    '.cl-root.height':            (root?.getBoundingClientRect().height ?? 0).toFixed(1),
  };
}

/* ── Component ─────────────────────────────────────────────────────────────── */

interface Props { onClose: () => void; }

const S = {
  overlay: {
    position: 'fixed' as const, inset: 0, zIndex: 9999,
    background: 'rgba(5,5,8,0.98)',
    overflowY: 'auto' as const,
    fontFamily: '"JetBrains Mono", ui-monospace, monospace',
    fontSize: 11,
    color: '#e8b974',
  } as React.CSSProperties,
  header: {
    position: 'sticky' as const, top: 0, zIndex: 1,
    background: '#08080b',
    borderBottom: '1px solid #1e1e28',
    /* paddingTop overridden inline to add env(safe-area-inset-top) clearance */
    padding: '14px 16px 10px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
  } as React.CSSProperties,
  body: { padding: '14px 16px 40px' } as React.CSSProperties,
  sectionLabel: {
    fontSize: 9.5, letterSpacing: '0.2em', textTransform: 'uppercase' as const,
    color: '#444', marginBottom: 10,
  } as React.CSSProperties,
  diagRow: {
    display: 'flex', justifyContent: 'space-between', gap: 8,
    borderBottom: '1px solid #111', paddingBottom: 4, marginBottom: 4,
  } as React.CSSProperties,
  diagKey:   { color: '#555', flex: 1, overflow: 'hidden' as const, textOverflow: 'ellipsis' as const, whiteSpace: 'nowrap' as const } as React.CSSProperties,
  diagVal:   { fontWeight: 600, flexShrink: 0 } as React.CSSProperties,
  controlRow: { marginBottom: 18 } as React.CSSProperties,
  controlLabel: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 } as React.CSSProperties,
  btn: (active?: boolean): React.CSSProperties => ({
    background: active ? 'rgba(232,185,116,0.12)' : '#0e0e15',
    color:      active ? '#e8b974' : '#555',
    border:     active ? '1px solid rgba(232,185,116,0.5)' : '1px solid #1e1e28',
    borderRadius: 8, padding: '6px 12px',
    cursor: 'pointer',
    fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
    transition: 'all 150ms ease',
  }),
  resetBtn: {
    width: '100%',
    background: 'rgba(184,73,63,0.07)',
    border: '1px solid rgba(184,73,63,0.28)',
    borderRadius: 12, padding: '13px 16px',
    color: '#c07070',
    fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
    cursor: 'pointer', letterSpacing: '0.05em', marginTop: 8,
  } as React.CSSProperties,
};

export default function PwaDiagnosticPanel({ onClose }: Props) {
  const [rows, setRows] = useState<Record<string, string | number | boolean>>({});
  const [navOffset,    setNavOffset]    = useState(() => parseInt(localStorage.getItem(DBG_LS.navOffset)    ?? '0', 10) || 0);
  const [contentExtra, setContentExtra] = useState(() => parseInt(localStorage.getItem(DBG_LS.contentExtra) ?? '0', 10) || 0);
  const [safeBottom,   setSafeBottom]   = useState<SafeOpt>(() => (localStorage.getItem(DBG_LS.safeBottom) as SafeOpt) || 'off');
  const [rootHeight,   setRootHeight]   = useState<HeightMode>(() => (localStorage.getItem(DBG_LS.rootHeight) as HeightMode) || 'current');
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(() => setRows(snap()), []);

  useEffect(() => {
    refresh();
    applyNavOffset(navOffset);
    applyContentExtra(contentExtra);
    applySafeBottom(safeBottom);
    applyHeightMode(rootHeight);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onNavOffset = (v: number) => {
    setNavOffset(v); applyNavOffset(v);
    localStorage.setItem(DBG_LS.navOffset, String(v));
  };
  const onContentExtra = (v: number) => {
    setContentExtra(v); applyContentExtra(v);
    localStorage.setItem(DBG_LS.contentExtra, String(v));
  };
  const onSafeBottom = (v: SafeOpt) => {
    setSafeBottom(v); applySafeBottom(v);
    localStorage.setItem(DBG_LS.safeBottom, v);
  };
  const onRootHeight = (v: HeightMode) => {
    setRootHeight(v); applyHeightMode(v);
    localStorage.setItem(DBG_LS.rootHeight, v);
  };

  const handleCopy = () => {
    const payload = { diagnostics: rows, tuning: { navOffset, contentExtra, safeBottom, rootHeight } };
    navigator.clipboard?.writeText(JSON.stringify(payload, null, 2)).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleReset = () => {
    setNavOffset(0);    applyNavOffset(0);    localStorage.removeItem(DBG_LS.navOffset);
    setContentExtra(0); applyContentExtra(0); localStorage.removeItem(DBG_LS.contentExtra);
    setSafeBottom('off');   applySafeBottom('off');   localStorage.removeItem(DBG_LS.safeBottom);
    setRootHeight('current'); applyHeightMode('current'); localStorage.removeItem(DBG_LS.rootHeight);
    setTimeout(refresh, 50);
  };

  const gap        = parseFloat(String(rows['viewportBottomGap'] ?? 'NaN'));
  const navBGap    = parseFloat(String(rows['--nav-bottom-gap'] ?? 'NaN'));
  /* Intentional gap: pill floats above bottom by --nav-bottom-gap (≈16px on iPhone).
     Green = gap within 8px of --nav-bottom-gap (expected floating position).
     Red   = gap much larger than expected (nav unintentionally high). */
  const gapOk  = !isNaN(gap) && !isNaN(navBGap) && Math.abs(gap - navBGap) <= 8;
  const gapBad = !isNaN(gap) && !isNaN(navBGap) && gap > navBGap + 20;

  const headerBtn = (label: string, onClick: () => void, color?: string): React.ReactNode => (
    <button onClick={onClick} style={{ ...S.btn(), color: color ?? '#aaa' }}>{label}</button>
  );

  return (
    <div style={S.overlay}>
      {/* ── Sticky header — padded for iPhone status bar ── */}
      <div style={{ ...S.header, paddingTop: 'calc(env(safe-area-inset-top, 0px) + 14px)' }}>
        <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', flex: 1, minWidth: 0 }}>
          Diagnóstico PWA · DEV
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          {headerBtn('Refresh', refresh)}
          {headerBtn(copied ? '✓ Copiado' : 'Copy', handleCopy, copied ? '#60c880' : '#aaa')}
          {/* 44×44px close button — reliable touch target in PWA */}
          <button
            onClick={onClose}
            aria-label="Cerrar diagnóstico"
            style={{
              minWidth: 44, minHeight: 44,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: '#1e1e2a', border: '1px solid #333',
              borderRadius: 10, color: '#aaa',
              fontSize: 16, cursor: 'pointer', flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      <div style={S.body}>
        {/* ── Section: Diagnostics ── */}
        <div style={{ marginBottom: 22 }}>
          <div style={S.sectionLabel}>Diagnósticos</div>

          {Object.entries(rows).map(([k, v]) => {
            const isGap = k === 'viewportBottomGap';
            const valColor = isGap && gapBad ? '#e05060' : isGap && gapOk ? '#60c880' : '#f7d6a0';
            return (
              <div key={k} style={S.diagRow}>
                <span style={S.diagKey}>{k}</span>
                <span style={{ ...S.diagVal, color: valColor }}>{String(v)}</span>
              </div>
            );
          })}

          <div style={{ marginTop: 8, fontSize: 9, color: '#333', textAlign: 'center' }}>
            viewportBottomGap — verde ≈ --nav-bottom-gap (flotante esperado) · rojo = nav demasiado alto
          </div>

          {/* Interpretation note */}
          {gapOk && (
            <div style={{
              marginTop: 10, padding: '9px 11px',
              background: 'rgba(96,200,128,0.05)',
              border: '1px solid rgba(96,200,128,0.18)',
              borderRadius: 8, fontSize: 9.5, color: '#60c880', lineHeight: 1.55,
            }}>
              ✓ gap ≈ --nav-bottom-gap ({String(rows['--nav-bottom-gap'] ?? '?')}) — pill compacto
              en posición correcta. iPhone esperado: ~6px. El mínimo negro bajo el pill es
              la home indicator zone — correcto.
            </div>
          )}
        </div>

        {/* ── Section: Live tuning ── */}
        <div style={{ borderTop: '1px solid #1a1a22', paddingTop: 18 }}>
          <div style={S.sectionLabel}>Ajuste en vivo</div>

          {/* 1. Nav bottom offset */}
          <div style={S.controlRow}>
            <div style={S.controlLabel}>
              <span style={{ color: '#777' }}>--debug-nav-bottom-offset</span>
              <span style={{ color: '#f7d6a0', fontWeight: 600 }}>{navOffset}px</span>
            </div>
            <input
              type="range" min="-40" max="40" step="1" value={navOffset}
              onChange={e => onNavOffset(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#e8b974', display: 'block' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#333', marginTop: 3 }}>
              <span>-40px (nav lower)</span><span>0</span><span>+40px (nav higher)</span>
            </div>
          </div>

          {/* 2. Content bottom extra */}
          <div style={S.controlRow}>
            <div style={S.controlLabel}>
              <span style={{ color: '#777' }}>--debug-content-bottom-extra</span>
              <span style={{ color: '#f7d6a0', fontWeight: 600 }}>{contentExtra}px</span>
            </div>
            <input
              type="range" min="-40" max="80" step="1" value={contentExtra}
              onChange={e => onContentExtra(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#e8b974', display: 'block' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#333', marginTop: 3 }}>
              <span>-40px</span><span>0</span><span>+80px</span>
            </div>
          </div>

          {/* 3. Safe bottom override */}
          <div style={S.controlRow}>
            <div style={{ color: '#777', marginBottom: 8 }}>--safe-bottom override</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SAFE_OPTS.map(opt => (
                <button key={opt} onClick={() => onSafeBottom(opt)} style={S.btn(safeBottom === opt)}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Root height mode */}
          <div style={S.controlRow}>
            <div style={{ color: '#777', marginBottom: 8 }}>html height mode</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {HEIGHT_MODES.map(mode => (
                <button key={mode} onClick={() => onRootHeight(mode)} style={S.btn(rootHeight === mode)}>
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Reset */}
          <button onClick={handleReset} style={S.resetBtn}>
            Reset todo · limpiar localStorage
          </button>

          {/* Bottom close button — large touch target for PWA use */}
          <button
            onClick={onClose}
            style={{
              width: '100%', minHeight: 52,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: '#131320',
              border: '1px solid #2a2a3a',
              borderRadius: 14,
              color: '#888',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 13, letterSpacing: '0.08em',
              cursor: 'pointer', marginTop: 12,
            }}
          >
            ✕ Cerrar panel
          </button>
        </div>
      </div>
    </div>
  );
}
