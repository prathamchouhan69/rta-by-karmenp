import React, { useState } from 'react';
import { useApp, ScreenType } from '../../context/AppContext';
import {
  IconHome,
  IconAccounting,
  IconProjects,
  IconFleet,
  IconInventory,
  IconCheck,
  IconHR,
  IconCRM,
  IconNature,
  IconFlux
} from '../common/Icons';

export const StarfishRadialFan: React.FC = () => {
  const { currentScreen, navigateTo, isStarfishOpen, setIsStarfishOpen } = useApp();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // The 8 Pure Operating Business Modules in thumb-reach arc
  const sections: {
    screen: ScreenType;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    { screen: 'now', label: 'Now', sublabel: 'Action Inbox', icon: <IconHome size={16} />, color: '#00f2fe' },
    { screen: 'ledger', label: 'Ledger', sublabel: 'Zoho Books & Cash', icon: <IconAccounting size={16} />, color: '#38bdf8' },
    { screen: 'harvest', label: 'Harvest', sublabel: 'Projects & Sites', icon: <IconProjects size={16} />, color: '#a855f7' },
    { screen: 'routes', label: 'Routes', sublabel: 'Fleet & Logistics', icon: <IconFleet size={16} />, color: '#f59e0b' },
    { screen: 'terrain', label: 'Terrain', sublabel: 'Materials & Stock', icon: <IconInventory size={16} />, color: '#38bdf8' },
    { screen: 'gates', label: 'Gates', sublabel: 'Statutory & Approvals', icon: <IconCheck size={16} />, color: '#818cf8' },
    { screen: 'aura', label: 'Aura', sublabel: 'Advisors & Team', icon: <IconHR size={16} />, color: '#c084fc' },
    { screen: 'ecosystems', label: 'Ecosystems', sublabel: 'Clients & Network', icon: <IconCRM size={16} />, color: '#22d3ee' },
  ];

  // Radial fan angles: from 180° (west) up to 270° (north) and around
  // Radius: 120px on mobile, 150px on desktop
  const radius = 135;
  const totalCount = sections.length;
  // Span an arc of ~120 degrees from 150 deg to 270 deg
  const startAngle = 140; // in degrees
  const angleSpan = 140;
  const step = angleSpan / (totalCount - 1);

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none">
      {/* Expanded Radial Arc of 9 Canonical Sections */}
      {isStarfishOpen && (
        <div className="absolute bottom-4 right-4 pointer-events-none">
          {sections.map((item, idx) => {
            const angleDeg = startAngle + idx * step;
            const angleRad = (angleDeg * Math.PI) / 180;
            const x = Math.cos(angleRad) * radius;
            const y = Math.sin(angleRad) * radius;

            const isHovered = hoveredIndex === idx;
            const isActive = currentScreen === item.screen;

            return (
              <div
                key={item.screen}
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                  transition: `all 300ms cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 25}ms`,
                }}
                className="absolute bottom-0 right-0 pointer-events-auto"
              >
                <button
                  onClick={() => {
                    navigateTo(item.screen);
                    setIsStarfishOpen(false);
                  }}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`relative flex items-center justify-center rounded-2xl transition-all shadow-xl group ${
                    isActive
                      ? 'w-11 h-11 p-2.5 bg-cyan-950 border-2 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,242,254,0.35)]'
                      : 'w-11 h-11 p-2.5 bg-[#090d15]/95 border border-white/15 text-slate-300 hover:text-white hover:border-cyan-400 hover:scale-110'
                  }`}
                  aria-label={`${item.label} (${item.sublabel})`}
                >
                  <span className="shrink-0">{item.icon}</span>

                  {/* Flyout Label on Hover or Active */}
                  {(isHovered || isActive) && (
                    <div className="absolute right-13 whitespace-nowrap px-3 py-1.5 rounded-xl bg-[#090d15]/95 border border-white/10 shadow-2xl backdrop-blur-xl pointer-events-none">
                      <span className="type-h4 text-xs font-bold text-white block">{item.label}</span>
                      <span className="text-[10px] font-mono text-cyan-400 block">{item.sublabel}</span>
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        onClick={() => setIsStarfishOpen(!isStarfishOpen)}
        className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-95 shadow-[0_0_25px_rgba(0,242,254,0.25)] ${
          isStarfishOpen
            ? 'bg-gradient-to-tr from-rose-500 to-amber-500 border border-white/20 text-white rotate-45'
            : 'bg-gradient-to-tr from-cyan-500 to-purple-600 border border-white/10 text-black hover:scale-105'
        }`}
        title="Starfish Radial Navigation (N-2)"
        aria-label="Toggle Starfish Radial Navigation"
      >
        {isStarfishOpen ? (
          <span className="text-xl font-bold leading-none">✕</span>
        ) : (
          <div className="w-8 h-8 flex items-center justify-center">
            <img 
              src="/karm-symbol-white.png" 
              alt="Starfish Menu" 
              className="w-full h-full object-contain filter invert contrast-200" 
            />
          </div>
        )}
      </button>
    </div>
  );
};
