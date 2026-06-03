/**
 * DEV-only layout debug utilities shared between PwaDiagnosticPanel and main.tsx startup restore.
 * These functions are safe to call in any environment but produce no visible effect in production
 * because the panel that calls them is never mounted in production.
 */

export const DBG_LS = {
  navOffset:    'cl-dbg-nav-offset',
  contentExtra: 'cl-dbg-content-extra',
  safeBottom:   'cl-dbg-safe-bottom',
  rootHeight:   'cl-dbg-root-height',
} as const;

export type SafeOpt    = 'off' | '0px' | '8px' | '16px' | '24px' | '34px';
export type HeightMode = 'current' | '100dvh' | '100svh' | '-webkit-fill-available';

export const SAFE_OPTS: SafeOpt[]      = ['off', '0px', '8px', '16px', '24px', '34px'];
export const HEIGHT_MODES: HeightMode[] = ['current', '100dvh', '100svh', '-webkit-fill-available'];

export const HEIGHT_CLASSES: Record<HeightMode, string> = {
  'current':                '',
  '100dvh':                 'cl-debug-h-dvh',
  '100svh':                 'cl-debug-h-svh',
  '-webkit-fill-available': 'cl-debug-h-fill',
};

export function applyNavOffset(px: number) {
  document.documentElement.style.setProperty('--debug-nav-bottom-offset', `${px}px`);
}

export function applyContentExtra(px: number) {
  document.documentElement.style.setProperty('--debug-content-bottom-extra', `${px}px`);
}

export function applySafeBottom(val: SafeOpt) {
  if (val === 'off') {
    document.documentElement.style.removeProperty('--safe-bottom');
  } else {
    document.documentElement.style.setProperty('--safe-bottom', val);
  }
}

export function applyHeightMode(mode: HeightMode) {
  Object.values(HEIGHT_CLASSES).filter(Boolean).forEach(cls =>
    document.documentElement.classList.remove(cls),
  );
  const cls = HEIGHT_CLASSES[mode];
  if (cls) document.documentElement.classList.add(cls);
}

/** Restore all saved debug values — call before first React render. */
export function restoreDebugLayout() {
  const nav = localStorage.getItem(DBG_LS.navOffset);
  const cnt = localStorage.getItem(DBG_LS.contentExtra);
  const sb  = localStorage.getItem(DBG_LS.safeBottom) as SafeOpt | null;
  const rh  = localStorage.getItem(DBG_LS.rootHeight) as HeightMode | null;
  if (nav) applyNavOffset(parseInt(nav, 10) || 0);
  if (cnt) applyContentExtra(parseInt(cnt, 10) || 0);
  if (sb  && sb  !== 'off')     applySafeBottom(sb);
  if (rh  && rh  !== 'current') applyHeightMode(rh);
}
