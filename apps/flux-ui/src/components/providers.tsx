'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { translate, type TranslationKey } from '@/lib/i18n';
import type { Lang, SessionUser, Theme } from '@/lib/types';

interface UiContextValue {
  lang: Lang;
  theme: Theme;
  setLang: (lang: Lang) => void;
  setTheme: (theme: Theme) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const SessionContext = createContext<SessionUser | null>(null);
const UiContext = createContext<UiContextValue | null>(null);

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
}

export function Providers({ user, initialTheme, initialLang, children }: { user: SessionUser; initialTheme: Theme; initialLang: Lang; children: ReactNode }) {
  const router = useRouter();
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const unauthorized = () => router.replace('/login');
    window.addEventListener('flux:unauthorized', unauthorized);
    return () => window.removeEventListener('flux:unauthorized', unauthorized);
  }, [router]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    setCookie('flux_theme', next);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    setCookie('flux_lang', next);
  }, []);

  const value = useMemo<UiContextValue>(() => ({
    lang, theme, setLang, setTheme,
    t: (key, vars) => translate(lang, key, vars),
  }), [lang, theme, setLang, setTheme]);

  return (
    <SessionContext.Provider value={user}>
      <UiContext.Provider value={value}>{children}</UiContext.Provider>
    </SessionContext.Provider>
  );
}

export function useSession(): SessionUser {
  const user = useContext(SessionContext);
  if (!user) throw new Error('Session context is missing');
  return user;
}

export function useUi(): UiContextValue {
  const value = useContext(UiContext);
  if (!value) throw new Error('UI context is missing');
  return value;
}

export function can(user: SessionUser, permission: string): boolean {
  return user.permissions.includes('*') || user.permissions.includes(permission);
}
