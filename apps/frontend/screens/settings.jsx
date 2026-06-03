/* ───────────────────────── CineLog — Settings ───────────────────────── */
function SettingsScreen({ onBack, stats }) {
  const Row = ({ label, value, last }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 16px',
      borderBottom: last ? 'none' : '1px solid var(--line)' }}>
      <span style={{ fontSize: 14.5 }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)', letterSpacing: '0.04em' }}>{value}</span>
    </div>
  );
  const Group = ({ header, children }) => (
    <div style={{ padding: '0 16px', marginTop: 22 }}>
      <div className="eyebrow" style={{ marginBottom: 10, paddingLeft: 4 }}>{header}</div>
      <div style={{ background: 'var(--ink-820)', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden' }}>{children}</div>
    </div>
  );
  return (
    <div className="cl-scroll" style={{ paddingBottom: 'calc(var(--safe-bottom) + 30px)' }}>
      <TopBar onBack={onBack} eyebrow="Cinelog" title="Settings" />
      <div style={{ padding: '4px 20px 0', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 56, height: 56, borderRadius: 17, display: 'grid', placeItems: 'center',
          background: 'radial-gradient(circle at 40% 30%, rgba(232,185,116,0.2), var(--ink-760))', border: '1px solid var(--line-amber)' }}>
          <Icon name="film" size={26} color="var(--accent)" stroke={1.4} />
        </div>
        <div>
          <div className="display" style={{ fontSize: 22, fontWeight: 700 }}>Cine<span style={{ fontStyle: 'italic', fontWeight: 500 }}>log</span></div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-faint)', marginTop: 2, letterSpacing: '0.06em' }}>A private cinematic archive</div>
        </div>
      </div>

      <Group header="Account">
        <Row label="Session" value="Private · this device" />
        <Row label="Sync" value="iCloud · on" last />
      </Group>
      <Group header="Archive">
        <Row label="Films logged" value={stats.films} />
        <Row label="Total watches" value={stats.watchCount} />
        <Row label="Rating profile" value="v2.0 · 9 categories" last />
      </Group>
      <Group header="Data">
        <Row label="Metadata source" value="Movie DB · English" />
        <Row label="Export / backup" value="JSON →" />
        <Row label="Install as app" value="Add to Home Screen" last />
      </Group>
      <Group header="About">
        <Row label="Version" value="1.0 (build 26)" />
        <Row label="Sign out" value="→" last />
      </Group>
      <div style={{ textAlign: 'center', padding: '26px 20px 0', fontFamily: 'var(--font-display)', fontStyle: 'italic',
        fontSize: 13, color: 'var(--text-faint)', lineHeight: 1.5 }}>
        &ldquo;Every watched film has weight, memory, and meaning.&rdquo;
      </div>
    </div>
  );
}
window.SettingsScreen = SettingsScreen;
