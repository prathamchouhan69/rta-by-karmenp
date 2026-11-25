import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { KarmLogoParticle } from '../../app/components/KarmLogoParticle';
import { FluxLoadingParticle } from '../../app/components/FluxLoadingParticle';

const CollapsedView = () => (
  <div className="flex items-center gap-3.5">
    <div className="flex items-center gap-2">
      <KarmLogoParticle size={28} onInteraction={true} />
      <span className="type-label text-cyan-300 font-bold tracking-wider">FLUX</span>
    </div>
    <div className="w-[1px] h-3 bg-white/20" />
    <div className="flex items-center gap-2">
      <div className="relative flex items-center gap-1">
        {[0, 1, 2].map((pole) => (
          <span key={pole} className="w-1.5 h-1.5 rounded-full transition-all duration-300 bg-slate-700" />
        ))}
      </div>
      <span className="type-label text-slate-300 text-[10px]">LIFE SCAN</span>
    </div>
  </div>
);

const FluxIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    <path d="M19.5 12.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5.67 1.5 1.5 1.5 1.5-.67 1.5-1.5z" />
    <path d="M12 19.5c-2.48 0-4.5-2.02-4.5-4.5S9.52 3.5 12 3.5s4.5 2.02 4.5 4.5S14.5 12.5 12 12.5z" />
  </svg>
);

const ExpandedView = ({ lastZohoScanTime, isScanning }: { lastZohoScanTime: string; isScanning: boolean }) => (
  <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
    <div className="flex items-center justify-between border-b border-white/10 pb-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
          <FluxIcon />
        </div>
        <div>
          <h4 className="type-h4 text-white font-bold">FLUX AI ASSISTANT</h4>
          <p className="type-timestamp text-cyan-400">Autonomous Neural Core Active</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-xl border border-white/10">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((pole) => (
            <span key={pole} className="w-1.5 h-1.5 rounded-full bg-slate-700" />
          ))}
        </div>
        <span className="type-label text-[9px] text-slate-300">Tesla Rotating Field</span>
      </div>
    </div>

    <div className="p-2 rounded-2xl bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 border border-white/5">
      <div className="flex items-center justify-center h-24 relative">
        <KarmLogoParticle size={72} onInteraction={true} />
      </div>
      <p className="text-center text-[10px] font-mono text-slate-500 mt-1">KARM logo particle field · Responds to touch/tilt · Still at rest</p>
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

    <div className="space-y-2 pt-1">
      <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-black/60 border border-white/10 focus-within:border-cyan-400/50 transition-colors">
        <FluxLoadingParticle isActive={isScanning} size={24} variant="cyan" />
        <input type="text" placeholder="Ask Flux: 'cash balance', 'fleet status', 'pier caps'..." className="w-full bg-transparent text-xs text-white outline-none placeholder-slate-500 font-interface" />
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-mono text-slate-400">
        <button className="px-2 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/10 hover:text-cyan-300 border border-white/5 whitespace-nowrap transition-colors">Cash Liquidity?</button>
        <button className="px-2 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/10 hover:text-cyan-300 border border-white/5 whitespace-nowrap transition-colors">Fleet Locations?</button>
        <button className="px-2 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/10 hover:text-cyan-300 border border-white/5 whitespace-nowrap transition-colors">Overdue Debt?</button>
      </div>

      <div className="flex items-center justify-between pt-1">
        <button className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            <path d="M19.5 12.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5.67 1.5 1.5 1.5 1.5-.67 1.5-1.5z" />
            <path d="M12 19.5c-2.48 0-4.5-2.02-4.5-4.5S9.52 3.5 12 3.5s4.5 2.02 4.5 4.5S14.5 12.5 12 12.5z" />
          </svg>
          <span>Trigger Live Tesla Arc Scan</span>
        </button>

        <button className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-400 hover:text-white">Collapse</button>
      </div>
    </div>
  </div>
);

const ToastNotification = ({ toast, onDismiss }: { toast: { message: string; type: 'info' | 'success' | 'error' }; onDismiss: () => void }) => {
  if (!toast) return null;
  const toastClassName = toast.type === 'success'
    ? 'bg-sky-500/90 text-white border-sky-500/30'
    : toast.type === 'error'
      ? 'bg-rose-500/90 text-white border-rose-500/30'
      : 'bg-cyan-500/90 text-white border-cyan-500/30';
  return (
    <div className="fixed bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-bottom-2 duration-300" role="alert" aria-live="polite">
      <div className={`px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 shadow-lg backdrop-blur-xl border ${toast.type === 'success' ? 'bg-sky-500/90 text-white border-sky-500/30' : toast.type === 'error' ? 'bg-rose-500/90 text-white border-rose-500/30' : 'bg-cyan-500/90 text-white border-cyan-500/30'}`}>
        <span className="flex-1 text-sm">{toast.message}</span>
        <button onClick={() => {}} className="p-1 rounded hover:bg-white/10 transition-colors" aria-label="Dismiss">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export const DynamicIsland = () => {
  const { zohoScanState, lastZohoScanTime, triggerZohoLiveScan, isIslandExpanded, setIsIslandExpanded, isOnline, reducedMotion } = useApp();

  const isScanning = zohoScanState === 'scanning' || zohoScanState === 'syncing';
  const [inputValue, setInputValue] = useState('');
  const [activePole, setActivePole] = useState<number>(0);
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (reducedMotion || !isOnline) return;
    const interval = setInterval(() => { setActivePole(prev => (prev + 1) % 3); }, 450);
    return () => clearInterval(interval);
  }, [reducedMotion, isOnline]);

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      const val = e.currentTarget.value.trim();
      setInputValue('');
      showToast(`Flux Co-pilot: Ingested telemetry for "${val}". All data matches live Zoho Books and IoT beacons.`, 'success');
    }
  }, []);

  const handleQuickQuery = useCallback((query: string) => { showToast(`Flux: ${query}`, 'info'); }, []);

  return (
    <aside aria-label="Dynamic Island Cockpit Controls" className="fixed top-2 md:top-3 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out" style={{ width: isIslandExpanded ? 'min(94vw, 440px)' : 'auto' }}>
      <div onClick={() => setIsIslandExpanded(!isIslandExpanded)} className={`bg-[#06080d]/95 text-white backdrop-blur-2xl border transition-all duration-300 cursor-pointer shadow-2xl select-none ${isIslandExpanded ? 'p-4 rounded-3xl border-cyan-500/40 shadow-[0_10px_35px_rgba(0,242,254,0.25)]' : 'px-4 py-2 rounded-full border-white/10 hover:border-cyan-400/50 shadow-[0_4px_20px_rgba(0,0,0,0.8)]' }`}>
        {isIslandExpanded ? (
          <ExpandedView lastZohoScanTime={lastZohoScanTime} isScanning={isScanning} />
        ) : (
          <CollapsedView />
        )}
      </div>

      {toast && <ToastNotification toast={toast} onDismiss={() => setToast(null)} />}
    </aside>
  );
};

export default DynamicIsland;