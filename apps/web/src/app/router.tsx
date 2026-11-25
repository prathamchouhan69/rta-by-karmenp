import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { RouteKey } from './nav';

export interface RouteState {
  key: RouteKey;
  sub: string | null;
  id: string | null;
  raw: string;
}

interface RouteContextValue {
  route: RouteState;
  navigate: (key: RouteKey, options?: { sub?: string; id?: string }) => void;
  setSub: (sub: string | null) => void;
  closeDetail: () => void;
}

const VALID: RouteKey[] = [
  'dashboard',
  'today',
  'money',
  'projects',
  'fleet',
  'materials',
  'gates',
  'people',
  'clients',
  'documents',
  'flux',
  'settings',
  'login',
];

function parseHash(hash: string): RouteState {
  const raw = hash.replace(/^#\/?/, '');
  const segments = raw.split('/').filter(Boolean);
  const key = (segments[0] as RouteKey) || 'today';
  const resolved: RouteKey = VALID.includes(key) ? key : 'today';
  return {
    key: resolved,
    sub: segments[1] ?? null,
    id: segments[2] ?? null,
    raw,
  };
}

function setHash(route: RouteState): void {
  const parts = [route.key, route.sub, route.id].filter(Boolean);
  const next = `#/${parts.join('/')}`;
  if (window.location.hash !== next) window.location.hash = next;
}

const RouterContext = createContext<RouteContextValue | null>(null);

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [route, setRoute] = useState<RouteState>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    if (!window.location.hash) {
      window.location.hash = '#/today';
    }
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((key: RouteKey, options?: { sub?: string; id?: string }) => {
    const next: RouteState = {
      key,
      sub: options?.sub ?? null,
      id: options?.id ?? null,
      raw: '',
    };
    next.raw = [key, next.sub, next.id].filter(Boolean).join('/');
    setRoute(next);
    setHash(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const setSub = useCallback((sub: string | null) => {
    setRoute((previous) => {
      const next = { ...previous, sub, id: null, raw: [previous.key, sub].filter(Boolean).join('/') };
      setHash(next);
      return next;
    });
  }, []);

  const closeDetail = useCallback(() => {
    setRoute((previous) => {
      const next = { ...previous, sub: null, id: null, raw: previous.key };
      setHash(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ route, navigate, setSub, closeDetail }), [route, navigate, setSub, closeDetail]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
};

export function useRouter(): RouteContextValue {
  const value = useContext(RouterContext);
  if (!value) throw new Error('useRouter must be used inside RouterProvider');
  return value;
}
