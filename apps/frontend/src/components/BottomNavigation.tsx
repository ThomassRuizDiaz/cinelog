import Icon from './Icon';

export type TabId = 'home' | 'library' | 'rankings' | 'add';

interface NavItem {
  id: TabId;
  icon: 'home' | 'library' | 'rankings' | 'add';
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home',     icon: 'home',     label: 'Home' },
  { id: 'library',  icon: 'library',  label: 'Library' },
  { id: 'rankings', icon: 'rankings', label: 'Rankings' },
  { id: 'add',      icon: 'add',      label: 'Add' },
];

interface BottomNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <div
      data-layout-nav
      style={{
        /* fixed to viewport — independent of containing block; more robust in PWA standalone */
        /* Pill floats above viewport bottom by --nav-bottom-gap (≈16px on iPhone, 8px on desktop).
         No paddingBottom — the gap IS the clearance above the home indicator. */
        position: 'fixed', left: 0, right: 0,
        bottom: 'calc(var(--nav-bottom-gap) + var(--debug-nav-bottom-offset, 0px))',
        zIndex: 30,
        paddingTop: 9,
        background: 'linear-gradient(180deg, rgba(8,8,11,0) 0%, rgba(8,8,11,0.86) 34%, var(--ink-900) 100%)',
      }}
    >
      <div
        style={{
          margin: '0 14px', height: 60, borderRadius: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          background: 'var(--nav-surface)',
          backdropFilter: 'blur(22px) saturate(160%)',
          WebkitBackdropFilter: 'blur(22px) saturate(160%)',
          border: '1px solid var(--line-strong)',
          boxShadow: '0 16px 40px -16px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        {NAV_ITEMS.map(it => {
          const active = activeTab === it.id;
          if (it.id === 'add') {
            return (
              <button
                key={it.id}
                className="pressable cl-tap"
                onClick={() => onTabChange(it.id)}
                style={{ border: 'none', background: 'none', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1 }}
              >
                <span
                  style={{
                    width: 38, height: 38, borderRadius: 13, display: 'grid', placeItems: 'center',
                    background: active ? 'linear-gradient(155deg, var(--accent), var(--accent-deep))' : 'var(--ink-680)',
                    color: active ? '#1a1206' : 'var(--text)',
                    boxShadow: active ? '0 8px 20px -6px var(--accent)' : 'none',
                    transition: 'all var(--dur) var(--ease-out)',
                  }}
                >
                  <Icon name="add" size={22} stroke={2.4} color="currentColor" />
                </span>
              </button>
            );
          }
          return (
            <button
              key={it.id}
              className="pressable cl-tap"
              onClick={() => onTabChange(it.id)}
              style={{
                border: 'none', background: 'none', padding: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1,
                color: active ? 'var(--accent)' : 'var(--text-faint)',
                transition: 'color var(--dur) var(--ease-out)',
              }}
            >
              <Icon name={it.icon} size={22} stroke={active ? 2.2 : 1.9} color="currentColor" />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: active ? 1 : 0.8 }}>
                {it.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
