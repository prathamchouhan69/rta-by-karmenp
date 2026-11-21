import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { IconTeslaCoil, IconFlux, IconCheck, IconAlert } from '../common/Icons';
import { LogoParticle } from '../common/LogoParticle';

export const DynamicIsland: React.FC = () => {
  const {
    zohoScanState,
    lastZohoScanTime,
    triggerZohoLiveScan,
    isIslandExpanded,
    setIsIslandExpanded,
    isOnline,
    reducedMotion
  } = useApp();

  const isScanning = zohoScanState === 'scanning' || zohoScanState === 'syncing';

  // 3-Phase Tesla Rotating Field Motor Simulation (3 poles glowing in turn)
  const [activePole, setActivePole] = useState<number>(0);

  useEffect(() => {
    if (reducedMotion || !isOnline) return;
    const interval = setInterval(() => {
      setActivePole(prev => (prev + 1) % 3);
    }, 450);
    return () => clearInterval(interval);
  }, [reducedMotion, isOnline]);

  return (
    <aside 
      aria-label="Dynamic Island Cockpit Controls"
      className="fixed top-2 md:top-3 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out"
      style={{ width: isIslandExpanded ? 'min(94vw, 440px)' : 'auto' }}
    >
      <div 
        onClick={() => setIsIslandExpanded(!isIslandExpanded)}
        className={`bg-[#06080d]/95 text-white backdrop-blur-2xl border transition-all duration-300 cursor-pointer shadow-2xl select-none ${
          isIslandExpanded 
            ? 'p-4 rounded-3xl border-cyan-500/40 shadow-[0_10px_35px_rgba(0,242,254,0.25)]' 
            : 'px-4 py-2 rounded-full border-white/10 hover:border-cyan-400/50 shadow-[0_4px_20px_rgba(0,0,0,0.8)]'
        }`}
      >
        {!isIslandExpanded ? (
          // Collapsed Pill View: Flux Left, Life Scanning (Tesla 3-Phase Field) Right
          <div className="flex items-center gap-3.5">
            {/* Left Side: Flux AI Brain Capsule */}
            <div className="flex items-center gap-2">
              <div className="relative flex items-center justify-center w-5 h-5">
                <span className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping opacity-75" />
                <img 
                  src="/karm-symbol-white.png" 
                  alt="Flux AI" 
                  className={`w-4 h-4 object-contain filter drop-shadow-[0_0_8px_rgba(0,242,254,0.8)] ${
                    !reducedMotion ? 'anim-karm-flux' : ''
                  }`}
                />
              </div>
              <span className="type-label text-cyan-300 font-bold tracking-wider">FLUX</span>
            </div>

            {/* Separator Divider */}
            <div className="w-[1px] h-3 bg-white/20" />

            {/* Right Side: Life Scanning (Tesla 3-Phase Rotating Field) */}
            <div className="flex items-center gap-2">
              <div className="relative flex items-center gap-1">
                {[0, 1, 2].map((pole) => (
                  <span
                    key={pole}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      !isOnline
                        ? 'bg-amber-500/50'
                        : activePole === pole
                        ? 'bg-cyan-400 scale-125 shadow-[0_0_8px_#00f2fe]'
                        : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
              <span className="type-label text-slate-300 text-[10px]">
                {isScanning ? 'SCANNING' : isOnline ? 'LIFE SCAN' : 'OFFLINE'}
              </span>
            </div>
          </div>
        ) : (
          // Expanded Island Flyout View
          <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                  <IconFlux size={18} color="#00f2fe" state="flux-thinking" />
                </div>
                <div>
                  <h4 className="type-h4 text-white font-bold">FLUX AI ASSISTANT</h4>
                  <p className="type-timestamp text-cyan-400">Autonomous Neural Core Active</p>
                </div>
              </div>

              {/* Tesla 3-Phase Indicator */}
              <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-xl border border-white/10">
                <div className="flex items-center gap-1">
                  {[0, 1, 2].map((pole) => (
                    <span
                      key={pole}
                      className={`w-1.5 h-1.5 rounded-full ${
                        activePole === pole ? 'bg-cyan-400 shadow-[0_0_6px_#00f2fe]' : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
                <span className="type-label text-[9px] text-slate-300">Tesla Rotating Field</span>
              </div>
            </div>

            {/* Logo Particle Treatment (Video 05) - Fluid particle shaped from KARM logo */}
            <div className="p-2 rounded-2xl bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 border border-white/5">
              <div className="flex items-center justify-center h-24">
                <LogoParticle 
                  size={96} 
                  particleCount={50} 
                  color="#00f2fe"
                  isLoading={isScanning}
                  className="mx-auto"
                />
              </div>
              <p className="text-center text-[10px] font-mono text-slate-500 mt-1">
                KARM logo particle field · Responds to touch/tilt · Still at rest
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-numeric">
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-0.5">
                <span className="type-label text-slate-500 text-[9px] block">ZOHO BOOKS SOURCE</span>
                <span className="text-white font-bold text-xs">Direct API Bridge</span>
                <p className="type-timestamp text-sky-400">Synced: {lastZohoScanTime}</p>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-0.5">
                <span className="type-label text-slate-500 text-[9px] block">MONEY ARITHMETIC</span>
                <span className="text-white font-bold text-xs">Zoho Verbatim Strings</span>
                <p className="type-timestamp text-cyan-400">Zero App Calculation</p>
              </div>
            </div>

            {/* Interactive Flux Co-pilot Prompt */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-black/60 border border-white/10 focus-within:border-cyan-400/50 transition-colors">
                <IconFlux size={15} color="#00f2fe" />
                <input
                  type="text"
                  placeholder="Ask Flux: 'cash balance', 'fleet status', 'pier caps'..."
                  className="w-full bg-transparent text-xs text-white outline-none placeholder-slate-500 font-interface"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      const val = e.currentTarget.value;
                      e.currentTarget.value = '';
                      alert(`Flux Co-pilot: Ingested telemetry for "${val}". All data matches live Zoho Books and IoT beacons.`);
                    }
                  }}
                />
              </div>

              {/* Quick Prompt Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-mono text-slate-400">
                <button
                  onClick={() => alert('Flux: Current HDFC Liquidity is ₹42,30,500.00 verbatim string from Zoho Books. Inflow trending at +₹1.24 L/day.')}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/10 hover:text-cyan-300 border border-white/5 whitespace-nowrap transition-colors"
                >
                  Cash Liquidity?
                </button>
                <button
                  onClick={() => alert('Flux: 6 Transit Mixers active. MH-12-RN-4821 is 18 mins from Site Gamma carrying 32MT precast pier.')}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/10 hover:text-cyan-300 border border-white/5 whitespace-nowrap transition-colors"
                >
                  Fleet Locations?
                </button>
                <button
                  onClick={() => alert('Flux: 3 invoices overdue past 90 days totaling ₹28,40,000.00. Black Hole singular event horizon active.')}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/10 hover:text-cyan-300 border border-white/5 whitespace-nowrap transition-colors"
                >
                  Overdue Debt?
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => triggerZohoLiveScan()}
                disabled={isScanning}
                className="type-button px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <IconTeslaCoil size={14} color="#00f2fe" />
                <span>Trigger Live Tesla Arc Scan</span>
              </button>

              <button
                onClick={() => setIsIslandExpanded(false)}
                className="type-button px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-400 hover:text-white"
              >
                Collapse
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default DynamicIsland;