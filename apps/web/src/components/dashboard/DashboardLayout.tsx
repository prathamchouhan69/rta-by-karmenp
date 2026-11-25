import React, { useState, useEffect } from 'react';
import { useApp, ScreenType } from '../../context/AppContext';
import { DynamicIslandTicker } from './DynamicIslandTicker';
import { MetricCard } from './MetricCard';
import { ThroughputChart } from './ThroughputChart';
import { WorkloadDistribution } from './WorkloadDistribution';
import { FluxAIAssistant } from './FluxAIAssistant';
import { LiveDataMatrices } from './LiveDataMatrices';
import { 
  IconDashboard, IconAnalytics, IconFlux, IconGrid, IconDns, IconSettings, 
  IconPerson, IconPower, IconSearch, IconNotifications, IconTerminal, 
  IconBolt, IconTrendingUp, IconPsychology, IconVerifiedUser, 
  IconArrowUpward, IconMoreVert, IconArrowForward 
} from '../common/Icons';

const NAV_ITEMS = [
  { path: 'dashboard', label: 'Dashboard', icon: IconDashboard },
  { path: 'ledger', label: 'Analytics', icon: IconAnalytics },
  { path: 'flux-ai', label: 'Flux AI', icon: IconFlux },
  { path: 'ledger', label: 'Data Matrices', icon: IconGrid },
  { path: 'ledger', label: 'Systems', icon: IconDns },
  { path: 'settings', label: 'Settings', icon: IconSettings },
];

export const DashboardLayout: React.FC = () => {
  const { navigateTo } = useApp();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        input?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex">
      <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-low z-50 flex flex-col pt-10 pb-10 border-r border-outline-variant/20">
        <div className="px-6 mb-10 flex items-center gap-3">
          <img
            alt="RTA Logo"
            className="h-8 w-auto object-contain"
            src="/karm-symbol-white.png"
          />
          <div className="flex flex-col">
            <span className="text-headline-sm font-headline text-primary">RTA</span>
            <span className="text-body-sm text-on-surface-variant font-numeric-data">KARM OS</span>
          </div>
        </div>
        <nav className="flex-1 px-4 flex flex-col gap-1" data-active-classes="bg-primary-container text-on-primary-container font-bold rounded-xl">
          {NAV_ITEMS.map(item => (
            <button
              key={item.path}
              onClick={() => { setActiveNav(item.path); navigateTo(item.path as ScreenType); }}
              className={`flex items-center px-4 py-2 transition-all rounded-xl ${
                activeNav === item.path
                  ? 'bg-primary-container text-on-primary-container font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
              data-path={item.path}
            >
              <item.icon size={20} className="mr-3" color={activeNav === item.path ? 'currentColor' : '#22d3ee'} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="px-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <IconPerson size={18} color="#00363e" />
            </div>
            <div className="flex flex-col">
              <span className="text-body-sm font-bold text-on-surface">Operator Alpha</span>
              <span className="text-label text-primary font-numeric-data">ONLINE</span>
            </div>
          </div>
          <IconPower size={24} className="text-on-surface-variant cursor-pointer hover:text-on-surface" />
        </div>
      </aside>

      <div className="pl-72 flex-1">
        <header className="fixed top-0 left-72 right-0 h-20 bg-surface/80 backdrop-blur-xl z-40 flex items-center justify-between px-6 border-b border-outline-variant/20">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <IconSearch size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Search command palette... (Ctrl+K)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-surface-container-low text-on-surface pl-10 pr-4 py-2 rounded-xl text-body-md focus:outline-none focus:ring-1 focus:ring-primary border border-outline-variant/30"
              />
            </div>
          </div>
          <div className="flex items-center bg-surface-container-low px-4 py-1 rounded-full border border-outline-variant/20 gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-numeric-data text-body-sm text-on-surface-variant">SYS_LOAD: <strong className="text-primary">14.2%</strong></span>
            </div>
            <div className="h-4 w-[1px] bg-outline-variant/40" />
            <div className="flex items-center gap-2">
              <span className="text-numeric-data text-body-sm text-on-surface-variant">FLUX_LATENCY: <strong className="text-tertiary">4.1ms</strong></span>
            </div>
            <div className="h-4 w-[1px] bg-outline-variant/40" />
            <div className="flex items-center gap-2">
              <span className="text-numeric-data text-body-sm text-on-surface-variant">NODES: <strong className="text-secondary">128/128</strong></span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors" aria-label="Notifications">
              <IconNotifications size={20} />
            </button>
            <button className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors" aria-label="Terminal">
              <IconTerminal size={20} />
            </button>
          </div>
        </header>

        <main className="relative pt-20 bg-surface min-h-screen">
          <div className="flex flex-col w-full pb-10">
            <DynamicIslandTicker onDeployClick={() => navigateTo('ledger')} />

            <div className="px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <MetricCard
                label="Total Throughput"
                value="$1.42B"
                trend="+14.2%"
                trendLabel="vs last epoch"
                icon={IconTrendingUp}
                iconColor="primary"
                accentColor="primary"
              />
              <MetricCard
                label="Active Nodes"
                value="1,248"
                trend="99.9% UPTIME"
                trendLabel="stable"
                icon={IconDns}
                iconColor="primary"
                accentColor="primary"
              />
              <MetricCard
                label="AI Inference Rate"
                value="48.2k"
                trend="REQ/SEC"
                trendLabel="optimized"
                icon={IconPsychology}
                iconColor="tertiary"
                accentColor="tertiary"
              />
              <MetricCard
                label="Security Index"
                value="99.8%"
                badge="CRISP SKY"
                badgeColor="primary"
                trend="secure"
                icon={IconVerifiedUser}
                iconColor="primary"
                accentColor="primary"
              />
            </div>

            <div className="px-6 grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
              <ThroughputChart />
              <WorkloadDistribution />
            </div>

            <div className="px-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              <FluxAIAssistant />
              <LiveDataMatrices />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;