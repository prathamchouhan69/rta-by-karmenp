import { cookies } from 'next/headers';
import { FLUX_API_URL, LANG_COOKIE, SESSION_COOKIE, THEME_COOKIE } from './config';
import type { Lang, SessionUser, Theme } from '@/lib/types';

export type { Lang, Role, SessionUser, Theme } from '@/lib/types';

export async function getSessionToken(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = await getSessionToken();
  if (!token) return null;
  try {
    const response = await fetch(`${FLUX_API_URL}/v1/me`, {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const user = (await response.json()) as SessionUser;
    if (!user?.id || !user?.role || !Array.isArray(user.permissions)) return null;
    return user;
  } catch {
    return null;
  }
}

export async function getUiPreferences(): Promise<{ theme: Theme; lang: Lang }> {
  const jar = await cookies();
  return {
    theme: jar.get(THEME_COOKIE)?.value === 'light' ? 'light' : 'dark',
    lang: jar.get(LANG_COOKIE)?.value === 'hi' ? 'hi' : 'en',
  };
}
