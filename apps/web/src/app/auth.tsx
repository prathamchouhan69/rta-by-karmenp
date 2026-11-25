import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, readToken, writeToken, type Organization } from './api';
import type { SourceMode } from './types';

type AuthStatus = 'booting' | 'anonymous' | 'authenticated';

interface AuthContextValue {
  status: AuthStatus;
  mode: SourceMode;
  organization: Organization | null;
  error: string | null;
  busy: boolean;
  login: (setupCode: string) => Promise<void>;
  enterDemo: () => void;
  exitDemo: () => void;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const DEMO_KEY = 'karm_demo_workspace';

function readDemo(): boolean {
  try {
    return localStorage.getItem(DEMO_KEY) === '1';
  } catch {
    return false;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('booting');
  const [mode, setMode] = useState<SourceMode>('demo');
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      if (readDemo()) {
        if (!cancelled) {
          setMode('demo');
          setOrganization({ name: 'Karm Enterprises', mode: 'demo' });
          setStatus('authenticated');
        }
        return;
      }
      if (!readToken()) {
        if (!cancelled) setStatus('anonymous');
        return;
      }
      try {
        const org = await api.organization();
        if (cancelled) return;
        setMode(org.mode === 'live' ? 'live' : 'practice');
        setOrganization(org);
        setStatus('authenticated');
      } catch {
        writeToken(null);
        if (!cancelled) setStatus('anonymous');
      }
    };
    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (setupCode: string) => {
    setBusy(true);
    setError(null);
    try {
      await api.login(setupCode);
      const org = await api.organization();
      try {
        localStorage.removeItem(DEMO_KEY);
      } catch {
        /* ignore */
      }
      setMode(org.mode === 'live' ? 'live' : 'practice');
      setOrganization(org);
      setStatus('authenticated');
    } catch (err) {
      writeToken(null);
      const message = err instanceof Error ? err.message : 'Could not open the workspace.';
      setError(message);
      throw err;
    } finally {
      setBusy(false);
    }
  }, []);

  const enterDemo = useCallback(() => {
    try {
      localStorage.setItem(DEMO_KEY, '1');
    } catch {
      /* ignore */
    }
    setMode('demo');
    setOrganization({ name: 'Karm Enterprises', mode: 'demo' });
    setError(null);
    setStatus('authenticated');
  }, []);

  const exitDemo = useCallback(() => {
    try {
      localStorage.removeItem(DEMO_KEY);
    } catch {
      /* ignore */
    }
    setMode('practice');
    setOrganization(null);
    setStatus('anonymous');
  }, []);

  const signOut = useCallback(async () => {
    await api.logout();
    try {
      localStorage.removeItem(DEMO_KEY);
    } catch {
      /* ignore */
    }
    setOrganization(null);
    setMode('demo');
    setStatus('anonymous');
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      mode,
      organization,
      error,
      busy,
      login,
      enterDemo,
      exitDemo,
      signOut,
      clearError,
    }),
    [status, mode, organization, error, busy, login, enterDemo, exitDemo, signOut, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
