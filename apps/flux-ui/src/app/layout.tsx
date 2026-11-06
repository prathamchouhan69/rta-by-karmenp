import type { Metadata, Viewport } from 'next';
import './globals.css';
import { getUiPreferences } from '@/server/session';

export const metadata: Metadata = {
  title: { default: 'Flux · RTA by KARM', template: '%s · Flux' },
  description: 'Flux is the AI operating system for business, money, health, construction and practical decisions inside RTA by KARM.',
  applicationName: 'Flux',
  manifest: '/manifest.webmanifest',
  icons: [{ rel: 'icon', url: '/icon.svg', type: 'image/svg+xml' }],
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0b0f14' },
    { media: '(prefers-color-scheme: light)', color: '#f4f7fb' },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { theme, lang } = await getUiPreferences();
  return (
    <html lang={lang} data-theme={theme} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
