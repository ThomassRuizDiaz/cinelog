export type IconName =
  | 'home' | 'library' | 'rankings' | 'add' | 'watchlist' | 'search'
  | 'back' | 'close' | 'home-loc' | 'cinema' | 'rewatch'
  | 'first' | 'play' | 'star' | 'chevron' | 'chevdown'
  | 'edit' | 'cog' | 'calendar' | 'grid2' | 'list'
  | 'sort' | 'film' | 'dot' | 'arrow';

interface IconProps {
  name: IconName;
  size?: number;
  stroke?: number;
  color?: string;
}

export default function Icon({ name, size = 22, stroke = 2, color = 'currentColor' }: IconProps) {
  const p = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth: stroke,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'home':     return <svg {...p}><path d="M3 10.5 12 4l9 6.5"/><path d="M5 9.5V20h14V9.5"/></svg>;
    case 'library':  return <svg {...p}><rect x="3.5" y="3.5" width="7" height="7" rx="1.4"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.4"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.4"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.4"/></svg>;
    case 'rankings': return <svg {...p}><path d="M5 20V11"/><path d="M12 20V4"/><path d="M19 20v-6"/></svg>;
    case 'add':      return <svg {...p}><path d="M12 5v14"/><path d="M5 12h14"/></svg>;
    case 'watchlist': return <svg {...p}><path d="M6 3h12v18l-6-3.6L6 21V3z"/></svg>;
    case 'search':   return <svg {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>;
    case 'back':     return <svg {...p}><path d="M15 5l-7 7 7 7"/></svg>;
    case 'close':    return <svg {...p}><path d="M6 6l12 12M18 6 6 18"/></svg>;
    case 'home-loc': return <svg {...p}><path d="M4 11 12 5l8 6"/><path d="M6 10v9h12v-9"/></svg>;
    case 'cinema':   return <svg {...p}><rect x="3.5" y="6" width="17" height="13" rx="2"/><path d="M3.5 10h17"/><path d="M8 6 6 3M13 6l-1.5-3M18 6l-1.5-3"/></svg>;
    case 'rewatch':  return <svg {...p}><path d="M3 12a9 9 0 1 0 2.6-6.3"/><path d="M3 4v5h5"/></svg>;
    case 'first':    return <svg {...p}><path d="M12 4v16M4 12h16"/></svg>;
    case 'play':     return <svg {...p} fill={color} stroke="none"><path d="M7 4.5v15l13-7.5z"/></svg>;
    case 'star':     return <svg {...p} fill={color} stroke="none"><path d="M12 2l2.9 6.2 6.8.8-5 4.6 1.3 6.7L12 18.3 5.9 20.3l1.3-6.7-5-4.6 6.8-.8z"/></svg>;
    case 'chevron':  return <svg {...p}><path d="M9 5l7 7-7 7"/></svg>;
    case 'chevdown': return <svg {...p}><path d="M5 9l7 7 7-7"/></svg>;
    case 'edit':     return <svg {...p}><path d="M4 20h4l10-10-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>;
    case 'cog':      return <svg {...p}><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v2.6M12 18.9v2.6M21.5 12h-2.6M5.1 12H2.5M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8M18.7 18.7l-1.8-1.8M7.1 7.1 5.3 5.3"/></svg>;
    case 'calendar': return <svg {...p}><rect x="3.5" y="5" width="17" height="16" rx="2.4"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/></svg>;
    case 'grid2':    return <svg {...p}><rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.4"/><rect x="13" y="3.5" width="7.5" height="7.5" rx="1.4"/><rect x="3.5" y="13" width="7.5" height="7.5" rx="1.4"/><rect x="13" y="13" width="7.5" height="7.5" rx="1.4"/></svg>;
    case 'list':     return <svg {...p}><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>;
    case 'sort':     return <svg {...p}><path d="M7 4v16M7 20l-3-3M7 4l3 3"/><path d="M17 20V4M17 4l3 3M17 4l-3 3"/></svg>;
    case 'film':     return <svg {...p}><rect x="3.5" y="4" width="17" height="16" rx="2.2"/><path d="M8 4v16M16 4v16M3.5 8h4.5M16 8h4.5M3.5 12h17M3.5 16h4.5M16 16h4.5"/></svg>;
    case 'dot':      return <svg {...p} fill={color} stroke="none"><circle cx="12" cy="12" r="4"/></svg>;
    case 'arrow':    return <svg {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    default:         return null;
  }
}
