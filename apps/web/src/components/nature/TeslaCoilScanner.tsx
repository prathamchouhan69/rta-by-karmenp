import React from 'react';
import { useApp } from '../../context/AppContext';
import { IconTeslaCoil, IconSync } from '../common/Icons';

export interface TeslaCoilScannerProps {
  compact?: boolean;
  onScanComplete?: () => void;
}

export const TeslaCoilScanner: React.FC<TeslaCoilScannerProps> = ({ compact = false, onScanComplete }) => {
  const { zohoScanState, lastZohoScanTime, triggerZohoLiveScan, isOnline } = useApp();
  const isScanning = zohoScanState === 'scanning' || zohoScanState === 'syncing';

  return (
    <div className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
      isScanning 
        ? 'border-cyan-400/60 bg-gradient-to-r from-purple-950/40 via-cyan-950/30 to-blue-950/40 shadow-[0_0_30px_rgba(0,242,254,0.15)]' 
        : 'border-white/10 bg-[#0b0e14]/90'
    } ${compact ? 'p-3' : 'p-4 md:p-5'}`}>
      {/* Background Plasma Waves & Lightning Arc Canvas/SVG */}
      <div className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 600 120">
          <defs>
            <linearGradient id="plasmaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7928ca" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#00f2fe" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#4facfe" stopOpacity="0.8" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          {isScanning && (
            <>
              <path 
                d="M 0,60 Q 150,10 300,60 T 600,60" 
                fill="none" 
                stroke="url(#plasmaGrad)" 
                strokeWidth="2.5" 
                filter="url(#glow)"
                className="anim-tesla-arc"
              />
              <path 
                d="M 0,60 Q 150,110 300,60 T 600,60" 
                fill="none" 
                stroke="#00f2fe" 
                strokeWidth="1.5" 
                opacity="0.7"
                filter="url(#glow)"
                className="anim-tesla-arc"
                style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}
              />
            </>
          )}
        </svg>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Indicator & Status */}
        <div className="flex items-center gap-3.5">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${
            isScanning 
              ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_20px_#00f2fe]' 
              : 'bg-white/5 border-white/10 text-cyan-400'
          }`}>
            <IconTeslaCoil size={24} className={isScanning ? 'anim-tesla-arc' : ''} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-white tracking-wide">
                TESLA COIL LIVE SCANNER
              </h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                isScanning
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse'
                  : 'bg-white/5 text-slate-400 border-white/10'
              }`}>
                {isScanning ? (zohoScanState === 'scanning' ? 'ARC PULSING' : 'SYNCING ZOHO') : 'RESONANT STANDBY'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Ref #112 Tesla Coil Arcs · Real-time Zoho Books telemetry & invoice stream
            </p>
          </div>
        </div>

        {/* Center / Stats: Voltage, Frequency, Sync */}
        {!compact && (
          <div className="flex items-center gap-4 text-xs font-mono text-slate-300 bg-black/40 px-3.5 py-2 rounded-xl border border-white/5">
            <div>
              <span className="text-[10px] text-slate-400 block">RESONANCE</span>
              <span className="font-bold text-cyan-400">{isScanning ? '2.44 MHz [PEAK]' : '1.42 MHz [IDLE]'}</span>
            </div>
            <div className="w-[1px] h-6 bg-white/10" />
            <div>
              <span className="text-[10px] text-slate-400 block">ARC POTENTIAL</span>
              <span className="font-bold text-purple-400">{isScanning ? '750 kV [ACTIVE]' : '0 kV [GROUND]'}</span>
            </div>
            <div className="w-[1px] h-6 bg-white/10" />
            <div>
              <span className="text-[10px] text-slate-400 block">LAST SCAN</span>
              <span className="font-bold text-slate-300">{lastZohoScanTime}</span>
            </div>
          </div>
        )}

        {/* Right: Trigger Action */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            onClick={async () => {
              await triggerZohoLiveScan();
              if (onScanComplete) onScanComplete();
            }}
            disabled={isScanning || !isOnline}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wide transition-all flex items-center gap-2 border shadow-lg ${
              isScanning
                ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 cursor-wait'
                : 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-black border-cyan-300/60 shadow-[0_0_20px_rgba(0,242,254,0.3)] active:scale-95'
            }`}
          >
            <IconSync size={14} className={isScanning ? 'animate-spin' : ''} />
            <span>{isScanning ? 'DISCHARGING ARCS...' : 'TRIGGER LIVE ARC SCAN'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
