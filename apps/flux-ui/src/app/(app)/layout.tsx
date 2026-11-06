import { redirect } from 'next/navigation';
import { getCurrentUser, getUiPreferences } from '@/server/session';
import { Providers } from '@/components/providers';
import { AppShell } from '@/components/app-shell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const { theme, lang } = await getUiPreferences();
  return (
    <Providers user={user} initialTheme={theme} initialLang={lang}>
      <AppShell>{children}</AppShell>
    </Providers>
  );
}
