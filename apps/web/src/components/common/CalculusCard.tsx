import React, { useState } from 'react';
import { IconFlux, IconChevronRight } from './Icons';

interface CalculusCardProps {
  title: string;
  metricLabel: string;
  rateOfChange: string; // e.g. "+₹1.24 L / day" or "-0.4 L / 100km"
  plainStory: string; // 5-year-old child explanation
  formalDerivative: string; // e.g. "d(Cash)/dt = Inflow(t) - Outflow(t)"
  trend?: 'accelerating' | 'decelerating' | 'steady';
  className?: string;
}

export const CalculusCard: React.FC<CalculusCardProps> = ({
  title,
  metricLabel,
  rateOfChange,
  plainStory,
  formalDerivative,
  trend = 'accelerating',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`rounded-2xl border border-white/10 bg-[#080c14]/90 overflow-hidden shadow-lg transition-all ${className}`}>
      {/* Header / Summary Bar */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <IconFlux size={14} color="#00f2fe" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="type-label text-cyan-400 text-[10px]">CALCULUS INSIGHT (ELI5)</span>
              <span className="type-timestamp text-slate-500">· {metricLabel}</span>
            </div>
            <h4 className="text-xs font-interface font-semibold text-white mt-0.5">{title}</h4>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="type-label text-slate-500 text-[9px] block">RATE OF CHANGE (SLOPE)</span>
            <span className="type-financial font-bold text-xs text-cyan-300">{rateOfChange}</span>
          </div>
          <span className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
            <IconChevronRight size={14} />
          </span>
        </div>
      </div>

      {/* Expandable Dual-Layer Drawer */}
      {isOpen && (
        <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-3 bg-black/40">
          {/* Layer 1: 5-Year-Old Playground Story */}
          <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-cyan-300 font-bold uppercase tracking-wider">
                Explained Like You Are 5:
              </span>
            </div>
            <p className="text-xs text-slate-200 font-interface leading-relaxed">
              {plainStory}
            </p>
          </div>

          {/* Layer 2: Mathematical Rate of Change & Derivative */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-numeric">
            <div>
              <span className="type-label text-slate-400 text-[9px] block">MATHEMATICAL RATE FORMULATION</span>
              <span className="text-white font-mono text-xs font-semibold">{formalDerivative}</span>
            </div>
            <div className="text-right">
              <span className="type-label text-slate-400 text-[9px] block">ACCELERATION STATUS</span>
              <span className="text-sky-400 font-mono text-xs uppercase font-bold">{trend}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
