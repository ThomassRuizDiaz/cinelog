import { useState, useEffect } from 'react';
import { TopBar, Icon } from '../components';
import type { AuthStatus } from '../api/auth';
import { getDashboard } from '../api/movies';
import type { DashboardStats } from '../api/movies';
import PwaDiagnosticPanel from '../components/PwaDiagnosticPanel';

interface SettingsScreenProps {
  onBack: () => void;
  currentUser?: AuthStatus;
  onLogout?: () => void;
  onOpenGptExport?: () => void;
}

interface RowProps {
  label: string;
  value?: string | number;
  last?: boolean;
  onPress?: () => void;
}

function Row({ label, value, last, onPress }: RowProps) {
  const inner = (
    <>
      <span style={{ fontSize: 14.5 }}>{label}</span>
      {value != null && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
          {value}
        </span>
      )}
      {onPress && <Icon name="chevron" size={15} color="var(--text-ghost)" stroke={2} />}
    </>
  );

  const base: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '15px 16px',
    borderBottom: last ? 'none' : '1px solid var(--line)',
    gap: 8,
  };

  if (onPress) {
    return (
      <button
        className="pressable cl-tap"
        onClick={onPress}
        style={{ ...base, width: '100%', background: 'none', border: 'none', borderBottom: last ? 'none' : '1px solid var(--line)', color: 'var(--text)', textAlign: 'left', cursor: 'pointer' }}
      >
        {inner}
      </button>
    );
  }
  return <div style={base}>{inner}</div>;
}

interface GroupProps {
  header: string;
  children: React.ReactNode;
}

function Group({ header, children }: GroupProps) {
  return (
    <div style={{ padding: '0 16px', marginTop: 22 }}>
      <div className="eyebrow" style={{ marginBottom: 10, paddingLeft: 4 }}>{header}</div>
      <div style={{ background: 'var(--ink-820)', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

function fmt1(n: number | null | undefined): string {
  if (n == null) return '—';
  return n.toFixed(1);
}

export default function SettingsScreen({ onBack, currentUser, onLogout, onOpenGptExport }: SettingsScreenProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topTitle, setTopTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);

  useEffect(() => {
    getDashboard()
      .then(d => {
        setStats(d.stats);
        setTopTitle(d.topPersonal[0]?.title ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const displayName = currentUser?.displayName ?? currentUser?.username ?? null;
  const dash = (v: string | number) => loading ? '…' : v;

  return (
    <div className="cl-scroll" style={{ paddingBottom: 'calc(var(--safe-bottom) + 30px)', position: 'absolute', inset: 0 }}>
      <TopBar onBack={onBack} eyebrow="Cinelog" title="Settings" />

      {/* identity block */}
      <div style={{ padding: '4px 20px 0', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 56, height: 56, borderRadius: 17, display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at 40% 30%, rgba(232,185,116,0.2), var(--ink-760))', border: '1px solid var(--line-amber)' }}>
          <Icon name="film" size={26} color="var(--accent)" stroke={1.4} />
        </div>
        <div>
          <div className="display" style={{ fontSize: 22, fontWeight: 700 }}>Cine<span style={{ fontStyle: 'italic', fontWeight: 500 }}>log</span></div>
          {displayName ? (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', marginTop: 3, letterSpacing: '0.05em' }}>
              {displayName}
            </div>
          ) : (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-faint)', marginTop: 2, letterSpacing: '0.06em' }}>Archivo cinematográfico privado</div>
          )}
        </div>
      </div>

      <Group header="Archivo">
        <Row label="Películas registradas" value={dash(stats?.totalMovies ?? 0)} />
        <Row label="Total visionados"       value={dash(stats?.totalWatchEntries ?? 0)} />
        <Row label="Revisionados"           value={dash(stats?.totalRewatches ?? 0)} />
        <Row label="Media personal"         value={dash(`${fmt1(stats?.averagePersonalScore)}★`)} />
        <Row label="Media técnica"          value={dash(`${fmt1(stats?.averageTechnicalScore)}★`)} />
        <Row label="Top personal"           value={dash(topTitle ?? '—')} last />
      </Group>

      <Group header="Recomendaciones">
        <Row
          label="Exportar para ChatGPT"
          onPress={onOpenGptExport}
          last
        />
      </Group>

      <Group header="App">
        <Row label="Versión" value="0.1.0" />
        <Row label="PWA"     value="Manifest · SW" last />
      </Group>

      <Group header="Datos">
        <Row label="Metadatos" value="TMDb · English" />
        <Row label="Auth"      value="Sesión · HttpOnly" last />
      </Group>

      {/* DEV-only: PWA diagnostics */}
      {import.meta.env.DEV && (
        <Group header="Diagnóstico PWA">
          <div style={{ padding: '14px 16px' }}>
            <button
              className="pressable cl-tap"
              onClick={() => setDebugPanelOpen(true)}
              style={{
                width: '100%', border: '1px solid rgba(232,185,116,0.22)',
                borderRadius: 12, padding: '12px 14px',
                background: 'rgba(232,185,116,0.05)',
                color: 'var(--accent)', fontFamily: 'var(--font-mono)',
                fontSize: 12, fontWeight: 500, cursor: 'pointer', letterSpacing: '0.05em',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <span>Abrir panel de diagnóstico</span>
              <Icon name="add" size={14} color="currentColor" stroke={2} />
            </button>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-faint)', marginTop: 8, lineHeight: 1.5 }}>
              Solo visible en modo DEV.
            </div>
          </div>
        </Group>
      )}

      {/* sign out */}
      {onLogout && (
        <div style={{ padding: '0 16px', marginTop: 22 }}>
          <button
            className="pressable cl-tap"
            onClick={onLogout}
            style={{
              width: '100%', border: '1px solid rgba(184,73,63,0.28)',
              borderRadius: 16, padding: '15px 16px',
              background: 'rgba(184,73,63,0.06)',
              color: '#c07070', fontFamily: 'var(--font-sans)',
              fontSize: 14.5, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <Icon name="back" size={16} color="currentColor" />
            Cerrar sesión
          </button>
        </div>
      )}

      {/* DEV-only panel overlay */}
      {import.meta.env.DEV && debugPanelOpen && (
        <PwaDiagnosticPanel onClose={() => setDebugPanelOpen(false)} />
      )}
    </div>
  );
}
