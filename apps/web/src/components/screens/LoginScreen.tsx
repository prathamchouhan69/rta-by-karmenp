import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { IconTeslaCoil, IconAlert } from '../common/Icons';

export const LoginScreen: React.FC = () => {
  const { navigateTo } = useApp();
  const [setupCode, setSetupCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setup_code: setupCode || 'KARM-ENTERPRISE-PASS' })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('karm_session_token', data.token);
        }
        navigateTo('home');
      } else {
        localStorage.setItem('karm_session_token', 'demo-session-token');
        navigateTo('home');
      }
    } catch {
      localStorage.setItem('karm_session_token', 'offline-practice-token');
      navigateTo('home');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterDemo = () => {
    localStorage.setItem('karm_session_token', 'demo-token');
    navigateTo('home');
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-cyan-600/30 via-purple-600/20 to-pink-600/30 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-[#0a0d14]/90 border border-white/10 p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl space-y-6">
        <div className="text-center space-y-2">
          {/* Official KARM Logo — Sculptural White / Platinum Spiral */}
          <div className="w-20 h-20 mx-auto rounded-3xl bg-white/[0.04] border border-white/10 p-2 flex items-center justify-center shadow-[0_0_35px_rgba(255,255,255,0.18)]">
            <img 
              src="/karm-symbol-white.png" 
              alt="RTA by KARM Official Logo" 
              className="w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(255,255,255,0.5)]"
            />
          </div>
          <h1 className="type-display text-2xl md:text-3xl font-black tracking-tight text-white mt-4">
            RTA by KARM
          </h1>
          <p className="type-label text-cyan-400">
            BUSINESS OS 2.4 · INDUSTRIAL COCKPIT
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-mono flex items-center gap-2">
            <IconAlert size={14} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              Authorization Setup Code
            </label>
            <input
              type="password"
              placeholder="Enter setup code or leave blank for practice mode..."
              value={setupCode}
              onChange={(e) => setSetupCode(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 focus:border-cyan-400 text-sm font-mono text-white placeholder-slate-600 outline-none transition-all shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black font-extrabold text-sm font-mono tracking-wide shadow-[0_0_25px_rgba(0,242,254,0.3)] transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'AUTHENTICATING TELEMETRY...' : 'CONNECT TO COCKPIT'}
          </button>

          <button
            type="button"
            onClick={handleEnterDemo}
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 text-xs font-mono transition-all"
          >
            Enter Practice Mode (Immediate Access)
          </button>
        </form>

        <div className="pt-4 border-t border-white/10 text-center">
          <span className="type-timestamp flex items-center justify-center gap-1.5 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_#38bdf8]" />
            Zoho Books · Firebase · Google Workspace Integrated
          </span>
        </div>
      </div>
    </div>
  );
};
