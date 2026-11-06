'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icon, type IconName } from './icons';
import { useSession, useUi, can } from './providers';
import { api } from '@/lib/api';
import type { TranslationKey } from '@/lib/i18n';

interface NavItem {
  href: string;
  key: TranslationKey;
  icon: IconName;
}

const PRIMARY: NavItem[] = [
  { href: '/', key: 'nav.home', icon: 'home' },
  { href: '/chat', key: 'nav.chat', icon: 'chat' },
  { href: '/money', key: 'nav.money', icon: 'money' },
  { href: '/wealth', key: 'nav.wealth', icon: 'wealth' },
  { href: '/startup', key: 'nav.startup', icon: 'startup' },
  { href: '/construction', key: 'nav.construction', icon: 'construction' },
];

const SECONDARY: NavItem[] = [
  { href: '/health', key: 'nav.health', icon: 'health' },
  { href: '/knowledge', key: 'nav.knowledge', icon: 'knowledge' },
  { href: '/jugaad', key: 'nav.jugaad', icon: 'jugaad' },
  { href: '/approvals', key: 'nav.approvals', icon: 'approvals' },
  { href: '/settings', key: 'nav.settings', icon: 'settings' },
];

const TITLES: Array<[string, TranslationKey]> = [
  ['/chat', 'nav.chat'], ['/money', 'nav.money'], ['/wealth', 'nav.wealth'],
  ['/startup', 'nav.startup'], ['/construction', 'nav.construction'],
  ['/health', 'nav.health'], ['/knowledge', 'nav.knowledge'],
  ['/jugaad', 'nav.jugaad'], ['/approvals', 'nav.approvals'], ['/settings', 'nav.settings'],
  ['/', 'nav.home'],
];

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const user = useSession();
  const { t, theme, lang, setTheme, setLang } = useUi();
  const pathname = usePathname();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState<number | null>(null);
  const [liveOff, setLiveOff] = useState<boolean | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const titleKey = TITLES.find(([prefix]) => isActive(pathname, prefix))?.[1] ?? 'nav.home';

  useEffect(() => {
    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawer(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [drawer]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  const refreshCapsule = useCallback(async () => {
    if (can(user, 'proposals:read')) {
      try {
        const data = await api<{ proposals: unknown[] }>('v1/proposals?status=pending');
        setPending(Array.isArray(data.proposals) ? data.proposals.length : 0);
      } catch {
        setPending(null);
      }
    }
    if (can(user, 'live:read')) {
      try {
        const data = await api<{ liveDataAvailable?: boolean }>('v1/live/status');
        setLiveOff(data.liveDataAvailable !== true);
      } catch {
        setLiveOff(null);
      }
    }
  }, [user]);

  useEffect(() => {
    void refreshCapsule();
    const timer = window.setInterval(() => void refreshCapsule(), 60000);
    const onRefresh = () => void refreshCapsule();
    window.addEventListener('flux:refresh', onRefresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('flux:refresh', onRefresh);
    };
  }, [refreshCapsule]);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.replace('/login');
      router.refresh();
    }
  }

  const navLink = (item: NavItem, bottom = false) => {
    const active = isActive(pathname, item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={bottom ? `bottom-link${active ? ' active' : ''}` : `side-link${active ? ' active' : ''}`}
        aria-current={active ? 'page' : undefined}
        onClick={() => setDrawer(false)}
      >
        <Icon name={item.icon} size={bottom ? 21 : 18} />
        <span>{t(item.key)}</span>
      </Link>
    );
  };

  const sidebar = (
    <div className="sidebar-inner">
      <div className="sidebar-brand">
        <span className="brand-mark" aria-hidden="true">F</span>
        <span className="brand-text">
          <strong>Flux</strong>
          <span>RTA · KARM</span>
        </span>
        {drawer ? (
          <button className="icon-button" type="button" onClick={() => setDrawer(false)} aria-label={t('common.close')} style={{ marginLeft: 'auto' }}>
            <Icon name="close" size={18} />
          </button>
        ) : null}
      </div>

      <nav aria-label="Main navigation" className="stack">
        <p className="nav-group-label">Operate</p>
        <div className="side-nav">{PRIMARY.map((item) => navLink(item))}</div>
        <p className="nav-group-label" style={{ marginTop: '0.55rem' }}>Personal &amp; knowledge</p>
        <div className="side-nav">{SECONDARY.map((item) => navLink(item))}</div>
      </nav>

      <div className="sidebar-foot">
        {liveOff ? (
          <Link href="/settings#live" className="notice warn" style={{ textDecoration: 'none', display: 'block' }}>
            <strong>Live feeds not configured.</strong> Flux will say so rather than invent data.
          </Link>
        ) : null}
        <div className="user-chip">
          <span className="user-avatar" aria-hidden="true">{user.name ? user.name.charAt(0) : user.id.charAt(0)}</span>
          <span className="user-meta">
            <strong>{user.name || user.id}</strong>
            <span>{user.role}</span>
          </span>
        </div>
        <button className="button ghost small" type="button" onClick={signOut} disabled={signingOut}>
          <Icon name="logout" size={16} />
          {signingOut ? 'Signing out…' : t('common.signOut')}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <a className="skip-link" href="#main">Skip to main content</a>
      <div className="app-frame">
        <aside className="app-sidebar" aria-label="Sidebar">{sidebar}</aside>

        <div className="app-main">
          {!online ? (
            <div className="offline-bar" role="status">
              <Icon name="wifi-off" size={15} />
              Offline. Cached pages still work; queued chat messages will send when the connection returns.
            </div>
          ) : null}

          <header className="app-header">
            <button className="icon-button mobile-menu-button" type="button" onClick={() => setDrawer(true)} aria-label="Open navigation" aria-expanded={drawer}>
              <Icon name="menu" size={20} />
            </button>
            <span className="header-title">{t(titleKey)}</span>
            <span className="header-spacer" />
            {can(user, 'live:read') ? (
              <Link href={pending ? '/approvals' : '/settings#live'} className="live-capsule" aria-label={pending ? `${pending} pending approvals` : 'Live data status'}>
                <span className={`dot${pending ? ' live' : ''}`} style={{ color: pending ? 'var(--accent)' : 'var(--warning)' }} />
                <span>{pending != null && pending > 0 ? `${pending} ${t('shell.pendingApprovals').toLowerCase()}` : liveOff ? t('shell.liveOffline') : t('shell.liveActivity')}</span>
              </Link>
            ) : null}
            <button className="icon-button" type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
            </button>
            <button className="icon-button" type="button" onClick={() => setLang(lang === 'en' ? 'hi' : 'en')} aria-label={lang === 'en' ? 'Switch to Hindi' : 'Switch to English'} title={lang === 'en' ? 'हिन्दी' : 'English'}>
              <Icon name="globe" size={18} />
            </button>
          </header>

          <main id="main" className="app-content" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>

      <nav className="bottom-nav" aria-label="Bottom navigation">
        {navLink(PRIMARY[0] as NavItem, true)}
        {navLink(PRIMARY[1] as NavItem, true)}
        {navLink(PRIMARY[2] as NavItem, true)}
        {navLink(SECONDARY[0] as NavItem, true)}
        <button className="bottom-link" type="button" onClick={() => setDrawer(true)} aria-label="Open all sections">
          <Icon name="menu" size={21} />
          <span>More</span>
        </button>
      </nav>

      {drawer ? (
        <div className="mobile-drawer" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="drawer-panel">{sidebar}</div>
          <button className="drawer-scrim" type="button" onClick={() => setDrawer(false)} aria-label="Close navigation" />
        </div>
      ) : null}
    </>
  );
}
