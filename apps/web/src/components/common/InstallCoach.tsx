import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export const InstallCoach: React.FC = () => {
  const { isStandalone } = useApp();
  const [showCoach, setShowCoach] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('install_coach_dismissed');
    if (saved === 'true') {
      setDismissed(true);
    }

    // Only show in non-standalone mode
    if (!isStandalone && !dismissed) {
      const timer = setTimeout(() => setShowCoach(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isStandalone, dismissed]);

  if (!showCoach || isStandalone || dismissed) return null;

  const handleDismiss = () => {
    setShowCoach(false);
  };

  const handleDismissForever = () => {
    setShowCoach(false);
    setDismissed(true);
    localStorage.setItem('install_coach_dismissed', 'true');
  };

  return (
    <div className="fixed bottom-4 md:bottom-8 left-4 md:left-8 right-4 md:right-8 z-50 animate-in slide-in-from-bottom-4 duration-300" role="dialog" aria-label="Install app coach">
      <div className="bg-[#07090e] border border-white/10 rounded-2xl p-4 md:p-6 shadow-2xl max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Install Ṛta-BY-KARM</h3>
              <p className="text-xs text-slate-400 mt-0.5">Add to Home Screen for instant access</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Dismiss"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-4 text-center">
          Tap the Share button <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /></svg> then <b>Add to Home Screen</b>
        </p>

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={handleDismissForever}
            className="flex-1 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium transition-colors"
          >
            Don't show again
          </button>
          <button
            onClick={handleDismiss}
            className="flex-1 px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallCoach;