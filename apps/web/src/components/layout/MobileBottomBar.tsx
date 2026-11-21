import React from 'react';
import { useApp, ScreenType } from '../../context/AppContext';
import {
  IconHome,
  IconAccounting,
  IconProjects,
  IconFleet,
  IconFlux
} from '../common/Icons';

export const MobileBottomBar: React.FC = () => {
  const { currentScreen, navigateTo, isStarfishOpen, setIsStarfishOpen } = useApp();

  const tabs: { screen: ScreenType; label: string; icon: React.ReactNode }[] = [
    { screen: 'now', label: 'Now', icon: <IconFlux size={18} /> },
    { screen: 'ledger', label: 'Ledger', icon: <IconAccounting size={18} /> },
    { screen: 'harvest', label: 'Harvest', icon: <IconProjects size={18} /> },
    { screen: 'routes', label: 'Routes', icon: <IconFleet size={18} /> },
  ];

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#06080d]/90 backdrop-blur-2xl border-t border-white/10 px-4 py-2 flex items-center justify-between"
    >
      <div className="flex items-center justify-around flex-1 mr-3">
        {tabs.map((tab) => {
          const isActive = currentScreen === tab.screen;
          return (
            <button
              key={tab.screen}
              onClick={() => navigateTo(tab.screen)}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
                isActive
                  ? 'text-cyan-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="text-[10px] font-interface tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Quick Radial Toggle for other modules */}
      <button
        onClick={() => setIsStarfishOpen(!isStarfishOpen)}
        className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(0,242,254,0.3)] active:scale-95"
        aria-label="Toggle All Operating Modules"
      >
        <span className="font-mono text-xs font-bold">+4</span>
      </button>
    </nav>
  );
};
