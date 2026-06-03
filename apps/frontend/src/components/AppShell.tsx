import type { ReactNode } from 'react';
import BottomNavigation from './BottomNavigation';
import type { TabId } from './BottomNavigation';

interface AppShellProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  children: ReactNode;
  toast?: string | null;
}

/**
 * Root app shell — obsidian background, grain overlay, bottom navigation.
 * Screen content goes in children; use SafeAreaScreen inside for scroll.
 */
export default function AppShell({ activeTab, onTabChange, children, toast }: AppShellProps) {
  return (
    <div className="cl-root cl-grain">
      {/* screen content */}
      <div style={{ position: 'absolute', inset: 0 }}>
        {children}
      </div>

      {/* bottom navigation — positioned above safe area */}
      <BottomNavigation activeTab={activeTab} onTabChange={onTabChange} />

      {/* toast notification */}
      {toast && (
        <div
          style={{
            position: 'absolute', left: 0, right: 0,
            bottom: 'calc(var(--nav-h) + var(--nav-bottom-gap) + 10px)',
            zIndex: 80, display: 'flex', justifyContent: 'center', pointerEvents: 'none',
            animation: 'fadeUp 320ms var(--ease-out) both',
          }}
        >
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 9, padding: '11px 18px',
              borderRadius: 14,
              background: 'rgba(28,28,34,0.92)',
              backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid var(--line-amber)',
              boxShadow: 'var(--shadow-pop)',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 500 }}>{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}
