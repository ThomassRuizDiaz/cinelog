interface SafeAreaScreenProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Add bottom padding for the bottom navigation bar */
  withBottomNav?: boolean;
  /** Extra bottom padding on top of safe area / nav */
  extraBottomPadding?: number;
}

/**
 * Scrollable screen container with correct iOS safe-area padding.
 * Use `withBottomNav` on tab screens so content doesn't hide behind BottomNavigation.
 */
export default function SafeAreaScreen({
  children,
  className = '',
  style,
  withBottomNav = false,
  extraBottomPadding = 0,
}: SafeAreaScreenProps) {
  const bottomPad = withBottomNav
    ? `calc(var(--nav-h) + var(--nav-bottom-gap) + ${extraBottomPadding + 10}px + var(--debug-content-bottom-extra, 0px))`
    : `calc(var(--safe-bottom) + ${extraBottomPadding}px + var(--debug-content-bottom-extra, 0px))`;

  return (
    <div
      className={`cl-scroll ${className}`}
      style={{ paddingBottom: bottomPad, ...style }}
    >
      {children}
    </div>
  );
}
