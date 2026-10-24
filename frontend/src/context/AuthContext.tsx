import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as authApi from '../api/auth';
import { setUnauthorizedHandler, TOKEN_KEY, USER_KEY } from '../api/client';
import type { AuthResponse, CurrentUser } from '../types';

interface AuthContextValue {
  user: CurrentUser | null;
  /** true quando a sessão terminou por expiração do token (e não por logout manual). */
  sessionExpired: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/** Lê o `exp` (em ms) do payload do JWT; null se o token for inválido. */
function tokenExpiresAt(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const { exp } = JSON.parse(json) as { exp?: number };
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

function readStoredSession(): { user: CurrentUser | null; expired: boolean } {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const stored = localStorage.getItem(USER_KEY);
    if (!token || !stored) {
      clearSession();
      return { user: null, expired: false };
    }
    const expiresAt = tokenExpiresAt(token);
    if (expiresAt === null || expiresAt <= Date.now()) {
      clearSession();
      return { user: null, expired: true };
    }
    return { user: JSON.parse(stored) as CurrentUser, expired: false };
  } catch {
    clearSession();
    return { user: null, expired: false };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(readStoredSession);
  const [user, setUser] = useState<CurrentUser | null>(initial.user);
  const [sessionExpired, setSessionExpired] = useState(initial.expired);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setSessionExpired(false);
  }, []);

  const expireSession = useCallback(() => {
    clearSession();
    setUser(null);
    setSessionExpired(true);
  }, []);

  const persist = useCallback((res: AuthResponse) => {
    const currentUser: CurrentUser = {
      userId: res.userId,
      username: res.username,
      email: res.email,
      role: res.role,
    };
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
    setSessionExpired(false);
    setUser(currentUser);
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      persist(await authApi.login(username, password));
    },
    [persist]
  );

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      persist(await authApi.register(username, email, password));
    },
    [persist]
  );

  // 401 vindo do backend -> volta para o login sem recarregar a página
  useEffect(() => {
    setUnauthorizedHandler(expireSession);
    return () => setUnauthorizedHandler(null);
  }, [expireSession]);

  // Encerra a sessão automaticamente quando o token expira
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem(TOKEN_KEY);
    const expiresAt = token ? tokenExpiresAt(token) : null;
    if (expiresAt === null) return;
    const delay = Math.min(Math.max(expiresAt - Date.now(), 0), 2_000_000_000);
    const timer = window.setTimeout(expireSession, delay);
    return () => window.clearTimeout(timer);
  }, [user, expireSession]);

  const value = useMemo(
    () => ({ user, sessionExpired, login, register, logout }),
    [user, sessionExpired, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
