/**
 * Cinelog API client — same-origin /api base path, HttpOnly cookie auth, CSRF.
 *
 * CSRF strategy (docs/backend/security.md + api-contract.md):
 *   1. GET /api/auth/csrf → { headerName: "X-CSRF-TOKEN", token: "..." }
 *   2. Token kept in memory only — never localStorage, never a cookie read.
 *   3. Send token as X-CSRF-TOKEN on every POST, PUT, DELETE.
 *   4. Token is auto-fetched before the first mutation if not cached.
 *   5. Token is invalidated on logout and on 403 (stale token auto-retry on next mutation).
 *
 * Auth model:
 *   - Session cookies + HttpOnly cookies — never JWT in localStorage.
 *   - credentials: "include" on every request so session/remember-me cookies are sent.
 *   - GET /api/auth/me is public — returns { authenticated: false } when not logged in.
 *
 * Backend endpoints:
 *   GET /api/status, GET /api/auth/csrf, POST /api/auth/login,
 *   POST /api/auth/logout, GET /api/auth/me,
 *   GET /api/external/movies/search, GET /api/external/movies/tmdb/{id},
 *   GET /api/movies, GET /api/movies/{id}, POST /api/movies, POST /api/movies/import,
 *   GET/POST/PUT/DELETE /api/movies/{id}/watch-entries,
 *   GET/PUT/DELETE /api/watch-entries/{id}/rating,
 *   GET /api/rankings, GET /api/dashboard
 */

import { parseApiError } from './errors';

export const API_BASE = '/api';

/* ── In-memory CSRF state ─────────────────────────────────────────────────── */

let _csrfToken: string | null = null;
let _csrfHeaderName = 'X-CSRF-TOKEN';

async function refreshCsrfToken(): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/csrf`, { credentials: 'include' });
  if (res.ok) {
    const data: { headerName: string; token: string } = await res.json();
    _csrfToken = data.token;
    _csrfHeaderName = data.headerName ?? 'X-CSRF-TOKEN';
  }
}

export async function ensureCsrfToken(): Promise<void> {
  if (!_csrfToken) await refreshCsrfToken();
}

export function invalidateCsrfToken(): void {
  _csrfToken = null;
}

/* ── Base fetch helper ────────────────────────────────────────────────────── */

async function apiFetch<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const isMutation = method !== 'GET';
  const headers: Record<string, string> = { Accept: 'application/json' };

  if (isMutation) {
    await ensureCsrfToken();
    headers['Content-Type'] = 'application/json';
    if (_csrfToken) headers[_csrfHeaderName] = _csrfToken;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include',
    headers,
    body: isMutation && body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await parseApiError(res);
    if (err.isForbidden) invalidateCsrfToken();
    throw err;
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export const apiGet    = <T>(path: string)                 => apiFetch<T>('GET',    path);
export const apiPost   = <T>(path: string, body?: unknown) => apiFetch<T>('POST',   path, body);
export const apiPut    = <T>(path: string, body?: unknown) => apiFetch<T>('PUT',    path, body);
export const apiDelete = <T = void>(path: string)          => apiFetch<T>('DELETE', path);

/* ── Status check (public endpoint) ─────────────────────────────────────── */

export async function checkApiStatus(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/status`, { credentials: 'include' });
    return res.ok;
  } catch {
    return false;
  }
}
