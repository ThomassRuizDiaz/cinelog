import { useState, useRef } from 'react';
import { Icon } from '../components';
import { login } from '../api/auth';
import { ApiError } from '../api/errors';
import type { AuthStatus, LoginRequest } from '../api/auth';

interface LoginScreenProps {
  onLogin: (user: AuthStatus) => void;
}

const inputBase: React.CSSProperties = {
  width: '100%',
  background: 'var(--ink-820)',
  border: '1px solid var(--line-strong)',
  borderRadius: 14,
  padding: '16px 18px',
  color: 'var(--text)',
  fontFamily: 'var(--font-sans)',
  fontSize: 16,
  lineHeight: 1,
  outline: 'none',
  boxSizing: 'border-box',
  WebkitAppearance: 'none',
  transition: 'border-color 180ms var(--ease-out)',
};

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const canSubmit = !loading && username.trim().length > 0 && password.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const req: LoginRequest = { username: username.trim(), password, rememberMe };
      const user = await login(req);
      onLogin(user);
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthorized) {
        setError('Credenciales incorrectas. Verifica usuario y contraseña.');
      } else if (err instanceof ApiError && err.isForbidden) {
        setError('Error de sesión. Inténtalo de nuevo.');
      } else {
        setError('No se puede conectar al servidor.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="cl-grain"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--ink-900)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `max(env(safe-area-inset-top), 44px) 28px max(env(safe-area-inset-bottom), 44px)`,
        isolation: 'isolate',
      }}
    >
      {/* wordmark */}
      <div style={{ marginBottom: 48, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <div style={{
            width: 66, height: 66, borderRadius: 21,
            display: 'grid', placeItems: 'center',
            background: 'radial-gradient(circle at 38% 28%, rgba(232,185,116,0.22), var(--ink-760))',
            border: '1px solid var(--line-amber)',
            boxShadow: '0 16px 40px -20px rgba(232,185,116,0.18)',
          }}>
            <Icon name="film" size={28} color="var(--accent)" stroke={1.3} />
          </div>
        </div>
        <div
          className="display"
          style={{ fontSize: 40, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.01em' }}
        >
          Cine<span style={{ fontStyle: 'italic', fontWeight: 500 }}>log</span>
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-faint)',
          marginTop: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
        }}>
          Archivo cinematográfico privado
        </div>
      </div>

      {/* form */}
      <form
        onSubmit={handleSubmit}
        style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 11 }}
        autoComplete="on"
        noValidate
      >
        <input
          type="text"
          name="username"
          autoComplete="username"
          placeholder="Username"
          aria-label="Username"
          value={username}
          onChange={e => { setUsername(e.target.value); setError(null); }}
          onKeyDown={e => { if (e.key === 'Enter') passwordRef.current?.focus(); }}
          disabled={loading}
          style={inputBase}
          required
        />
        <input
          ref={passwordRef}
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Password"
          aria-label="Password"
          value={password}
          onChange={e => { setPassword(e.target.value); setError(null); }}
          disabled={loading}
          style={inputBase}
          required
        />

        {/* remember me */}
        <button
          type="button"
          className="cl-tap"
          onClick={() => setRememberMe(v => !v)}
          disabled={loading}
          style={{
            border: 'none', background: 'none', padding: '6px 2px',
            display: 'flex', alignItems: 'center', gap: 11,
            cursor: 'pointer', textAlign: 'left',
            fontFamily: 'var(--font-sans)', fontSize: 13.5,
            color: rememberMe ? 'var(--text)' : 'var(--text-dim)',
            transition: 'color 150ms',
          }}
          aria-pressed={rememberMe}
        >
          <div style={{
            width: 22, height: 22, borderRadius: 7, flexShrink: 0,
            border: `1px solid ${rememberMe ? 'var(--accent)' : 'var(--line-strong)'}`,
            background: rememberMe ? 'var(--accent)' : 'transparent',
            display: 'grid', placeItems: 'center',
            transition: 'background 150ms, border-color 150ms',
          }}>
            {rememberMe && (
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2 6l3 3 5-5" stroke="#1a1206" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          Mantener sesión iniciada
        </button>

        {/* error */}
        {error && (
          <div
            role="alert"
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, color: '#d07070',
              letterSpacing: '0.02em', lineHeight: 1.5,
              padding: '11px 14px',
              background: 'rgba(184,73,63,0.09)', borderRadius: 11,
              border: '1px solid rgba(184,73,63,0.22)',
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          className="pressable cl-tap"
          disabled={!canSubmit}
          style={{
            marginTop: 5,
            border: 'none', borderRadius: 16, padding: '17px',
            background: canSubmit
              ? 'linear-gradient(150deg, var(--accent), var(--accent-deep))'
              : 'var(--ink-720)',
            color: canSubmit ? '#1a1206' : 'var(--text-ghost)',
            fontFamily: 'var(--font-sans)', fontSize: 15.5, fontWeight: 700,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            boxShadow: canSubmit ? '0 8px 24px -10px rgba(232,185,116,0.35)' : 'none',
            transition: 'background 200ms, color 200ms, box-shadow 200ms',
          }}
        >
          {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
        </button>
      </form>

      <div style={{
        position: 'absolute',
        bottom: 'max(env(safe-area-inset-bottom), 26px)',
        fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-ghost)',
        letterSpacing: '0.06em', textTransform: 'uppercase',
      }}>
        Autoalojado · Usuario único
      </div>
    </div>
  );
}
