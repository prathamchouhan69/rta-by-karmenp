import React from 'react';
import { useApp, ScreenType, ThemeMode } from '../../context/AppContext';
import {
  IconHome, IconAccounting, IconProjects, IconTasks, IconFiles,
  IconFleet, IconHR, IconCRM, IconNature, IconCharts,
  IconSearch, IconBell, IconSettings, IconTeslaCoil, IconFlux,
  IconApprovals, IconInventory, IconLifeScan, IconDashboard
} from '../common/Icons';

export const AppHeader: React.FC = () => {
  const {
    currentScreen,
    navigateTo,
    notifications,
    setIsSpotlightOpen,
    isOnline,
    triggerZohoLiveScan,
    zohoScanState,
    themeMode,
    setThemeMode
  } = useApp();

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#05080f]/80 backdrop-blur-2xl px-4 lg:px-8 py-3 flex items-center justify-between shadow-[0_1px_0_rgba(255,255,255,0.035),0_18px_45px_rgba(0,0,0,0.32)]">
      {/* Brand & System Status */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigateTo('now')} 
          className="flex items-center gap-3 text-left group transition-transform active:scale-95"
          aria-label="Return to Action Inbox"
        >
          {/* Official KARM Logo — Sculptural White / Platinum Spiral on Dark Cockpit Background */}
          <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-[#d8b26a]/25 p-1 flex items-center justify-center shadow-[0_0_18px_rgba(216,178,106,0.12)] group-hover:border-cyan-400/40 transition-colors">
            <img 
              src="/karm-symbol-white.png" 
              alt="RTA by KARM Official Symbol" 
              className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                RTA by KARM
              </span>
              <span className="karm-chip karm-chip-brass text-[9px]">
                OS 2.4
              </span>
            </div>
            {/* Non-green connection telemetry with clear icon & text */}
            <p className="type-timestamp flex items-center gap-1.5 text-slate-400 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-sky-400 shadow-[0_0_6px_#38bdf8]' : 'bg-amber-400'}`} />
              <span>{isOnline ? 'Systems online · Zoho linked' : 'Offline mode · local data'}</span>
            </p>
          </div>
        </button>
      </div>

      {/* Global Actions Bar */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Visual Theme Mode Switcher (Night / Classic / Day) */}
        <div className="hidden sm:flex items-center bg-black/40 border border-white/10 rounded-xl p-0.5 shadow-inner">
          {(['night', 'classic', 'day'] as ThemeMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setThemeMode(mode)}
              aria-pressed={themeMode === mode}
              className={`px-2.5 py-1 text-[11px] font-interface capitalize rounded-lg transition-all ${
                themeMode === mode
                  ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/15 text-cyan-200 font-semibold shadow-[0_0_10px_rgba(0,242,254,0.16)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Spotlight Command Palette trigger (Cmd+K) */}
        <button
          onClick={() => setIsSpotlightOpen(true)}
          className="karm-sheen flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-cyan-500/40 text-slate-300 text-xs transition-all hover:bg-white/[0.08]"
          aria-label="Open Command Search (Command + K)"
        >
          <IconSearch size={14} className="text-cyan-400" />
          <span className="hidden sm:inline font-interface text-slate-400">Search OS...</span>
          <kbd className="hidden md:inline-block font-numeric text-[10px] bg-black/50 px-1.5 py-0.5 rounded border border-white/10 text-slate-400">
            ⌘K
          </kbd>
        </button>

        {/* Live Tesla Coil Scan trigger */}
        <button
          onClick={() => triggerZohoLiveScan()}
          disabled={zohoScanState === 'scanning' || zohoScanState === 'syncing'}
          className="karm-sheen hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-500/35 text-cyan-200 hover:bg-cyan-900/60 hover:border-cyan-400/60 type-button text-xs transition-all active:scale-95 disabled:opacity-50"
          title="Trigger live Tesla Coil scan of Zoho Books"
          aria-label="Synchronise Zoho Books"
        >
          <IconTeslaCoil size={14} state={zohoScanState === 'scanning' ? 'flux-thinking' : 'default'} color="#00f2fe" />
          <span className="type-label">SCAN ZOHO</span>
        </button>

        {/* Notifications Beacon */}
        <button
          onClick={() => navigateTo('notifications')}
          className={`relative karm-icon-button ${
            currentScreen === 'notifications'
              ? '!border-cyan-500/60 !text-cyan-300 shadow-[0_0_14px_rgba(0,242,254,0.18)]'
              : ''
          }`}
          title="Notifications & Alerts"
          aria-label={`Notifications, ${unreadCount} unread`}
        >
          <IconBell size={18} state={unreadCount > 0 ? 'warning' : 'default'} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-400 text-black font-numeric font-bold text-[9px] flex items-center justify-center shadow-[0_0_10px_#00f2fe]">
              {unreadCount}
            </span>
          )}
        </button>

        {/* System Settings */}
        <button
          onClick={() => navigateTo('settings')}
          className={`karm-icon-button ${
            currentScreen === 'settings'
              ? '!border-cyan-500/60 !text-cyan-300 shadow-[0_0_14px_rgba(0,242,254,0.18)]'
              : ''
          }`}
          title="System Settings & Connections"
          aria-label="Open System Settings"
        >
          <IconSettings size={18} />
        </button>
      </div>
    </header>
  );
};

export const AppNavigation: React.FC = () => {
  const { currentScreen, navigateTo } = useApp();

  // The 8 Pure Operating Business Modules (Zero Distractions / Connected Intelligence Embedded)
  const navItems: { screen: ScreenType; label: string; icon: React.ReactNode; badge?: string }[] = [
    { screen: 'dashboard', label: 'Dashboard · Command Center', icon: <IconDashboard size={17} />, badge: 'P0' },
    { screen: 'now', label: 'Now · Action Inbox', icon: <IconFlux size={17} />, badge: 'Daily' },
    { screen: 'ledger', label: 'Ledger · Zoho Books', icon: <IconAccounting size={17} />, badge: 'P1' },
    { screen: 'harvest', label: 'Harvest · Projects', icon: <IconProjects size={17} />, badge: 'P2' },
    { screen: 'routes', label: 'Routes · Fleet', icon: <IconFleet size={17} /> },
    { screen: 'terrain', label: 'Terrain · Materials', icon: <IconInventory size={17} /> },
    { screen: 'gates', label: 'Gates · Statutory', icon: <IconApprovals size={17} /> },
    { screen: 'aura', label: 'Aura · Advisors & Team', icon: <IconHR size={17} /> },
    { screen: 'ecosystems', label: 'Ecosystems · Clients', icon: <IconCRM size={17} /> },
  ];

  return (
    <nav className="w-full lg:w-64 shrink-0 border-r border-white/10 bg-[#080b12]/90 backdrop-blur-2xl p-3 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
      <div className="hidden lg:flex items-center justify-between px-3 py-2">
        <span className="type-label text-slate-400">OPERATING MODULES</span>
        <span className="text-[10px] font-mono text-cyan-400">8 CORE</span>
      </div>
      {navItems.map((item) => {
        const isActive = currentScreen === item.screen;
        return (
          <button
            key={item.screen}
            onClick={() => navigateTo(item.screen)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-interface font-medium transition-all whitespace-nowrap text-left ${
              isActive
                ? 'bg-gradient-to-r from-cyan-500/15 via-purple-600/10 to-transparent text-cyan-300 border border-cyan-500/40 shadow-[0_0_16px_rgba(0,242,254,0.12)]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className={isActive ? 'text-cyan-400 scale-105 transition-transform' : 'text-slate-400'}>
              {item.icon}
            </span>
            <div className="flex-1 min-w-0">
              <span className="block truncate font-semibold">{item.label}</span>
            </div>
            {item.badge && (
              <span className={`hidden lg:inline-block type-label text-[9px] px-1.5 py-0.5 rounded ${
                item.badge === 'Apex'
                  ? 'bg-purple-950/80 text-purple-300 border border-purple-500/30'
                  : 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/30'
              }`}>
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
