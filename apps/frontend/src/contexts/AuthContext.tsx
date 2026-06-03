import { createContext, useContext } from 'react';
import type { AuthStatus } from '../api/auth';

interface AuthContextValue {
  currentUser: AuthStatus | null;
  /**
   * Call on explicit sign-out OR when any API call returns 401.
   * Calls POST /api/auth/logout (tolerates failure), invalidates CSRF token,
   * and returns the app to the login screen.
   */
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  signOut: async () => {},
});

export function AuthProvider({ value, children }: {
  value: AuthContextValue;
  children: React.ReactNode;
}) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
