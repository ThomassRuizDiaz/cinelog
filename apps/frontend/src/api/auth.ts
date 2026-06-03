/**
 * Auth endpoints — /api/auth/*
 *
 * CSRF: login and logout are mutations. The client (client.ts) auto-fetches
 * GET /api/auth/csrf → { headerName, token } before each mutation if not cached.
 * Token is invalidated on logout so the next session starts fresh.
 *
 * Usage:
 *   1. Call getAuthStatus() on app mount — returns { authenticated: false } (not 401)
 *      when the session is absent. Never throws for unauthenticated state.
 *   2. If not authenticated, show login UI.
 *   3. On 401 from any private API call, call getAuthStatus() and re-show login if needed.
 */

import { apiGet, apiPost, invalidateCsrfToken } from './client';

export interface AuthStatus {
  authenticated: boolean;
  username: string | null;
  displayName: string | null;
}

export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

/** GET /api/auth/me — public; returns { authenticated: false } when not logged in. */
export async function getAuthStatus(): Promise<AuthStatus> {
  return apiGet<AuthStatus>('/auth/me');
}

/** POST /api/auth/login — sets HttpOnly session cookie on success. Throws ApiError on 401. */
export async function login(req: LoginRequest): Promise<AuthStatus> {
  return apiPost<AuthStatus>('/auth/login', req);
}

/** POST /api/auth/logout — clears session. Invalidates the in-memory CSRF token. */
export async function logout(): Promise<void> {
  await apiPost<void>('/auth/logout');
  invalidateCsrfToken();
}
