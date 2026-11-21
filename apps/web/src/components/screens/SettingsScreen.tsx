import React from 'react';
import { useApp } from '../../context/AppContext';
import { IconCheck, IconSettings } from '../common/Icons';

export const SettingsScreen: React.FC = () => {
  const { reducedMotion, setReducedMotion } = useApp();

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <h1 className="type-h1 tracking-tight text-white">
            SYSTEM SETTINGS & INTEGRATIONS
          </h1>
          <span className="type-label px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
            SYSTEM PREFERENCES
          </span>
        </div>
        <p className="type-body-sm text-slate-400 mt-1">
          Telemetry connections, accessibility, motion preferences and offline caching
        </p>
      </div>

      <div className="p-6 md:p-8 rounded-3xl bg-[#06080d]/90 border border-white/10 space-y-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="type-label text-white">CONNECTED ENTERPRISE SERVICES</h3>
          <span className="text-xs font-mono text-cyan-400">STATUS MONITOR</span>
        </div>

        <div className="space-y-3 font-numeric text-xs">
          {/* Zoho Books */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
              <span className="text-white font-interface font-medium">Zoho Books (REST / OAuth2)</span>
            </div>
            <span className="type-label text-sky-400 flex items-center gap-1">
              <IconCheck size={12} state="success" /> CONNECTED & SYNCHRONISED
            </span>
          </div>

          {/* Google Workspace */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
              <span className="text-white font-interface font-medium">Google Workspace (Sheets, Drive, Cal, Gmail)</span>
            </div>
            <span className="type-label text-sky-400 flex items-center gap-1">
              <IconCheck size={12} state="success" /> ACTIVE SESSION
            </span>
          </div>

          {/* Firebase */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f2fe]" />
              <span className="text-white font-interface font-medium">Firebase Realtime / Firestore</span>
            </div>
            <span className="type-label text-cyan-300 flex items-center gap-1">
              <IconCheck size={12} state="success" /> ONLINE
            </span>
          </div>
        </div>

        {/* Accessibility & Motion */}
        <div className="pt-4 border-t border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="type-label text-white">COSMOS & MOTION CALIBRATIONS</h3>
            <span className="text-xs font-mono text-cyan-400">ACCESSIBILITY</span>
          </div>
          <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5">
            <div>
              <span className="text-white font-interface font-semibold text-xs block">Reduce Motion Physics</span>
              <span className="type-timestamp text-slate-400">Overrides Tesla arc, Black Hole vortex, and fluid CSS transitions</span>
            </div>
            <button
              onClick={() => setReducedMotion(!reducedMotion)}
              className={`px-4 py-2 rounded-xl type-button text-xs transition-all active:scale-95 ${
                reducedMotion
                  ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(0,242,254,0.4)]'
                  : 'bg-white/10 text-white hover:bg-white/15'
              }`}
              aria-label="Toggle Reduced Motion"
            >
              {reducedMotion ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
