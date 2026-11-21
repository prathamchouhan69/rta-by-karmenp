import React from 'react';

export interface CoralGrowthProgressProps {
  progress: number; // 0 to 100
  title: string;
  subtitle?: string;
  nodes?: { name: string; completed: boolean }[];
}

export const CoralGrowthProgress: React.FC<CoralGrowthProgressProps> = ({
  progress,
  title,
  subtitle,
  nodes = []
}) => {
  return (
    <div className="p-4 rounded-xl border border-cyan-500/20 bg-[#0a0d14]/90 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-white">{title}</h4>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              Ref #6 Coral Calcification
            </span>
          </div>
          {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        <span className="text-sm font-mono font-extrabold text-cyan-300">{progress}%</span>
      </div>

      {/* Organic Coral Branch SVG Progress Track */}
      <div className="relative h-4 rounded-full bg-black/60 border border-white/10 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-teal-500 via-cyan-400 to-indigo-500 transition-all duration-700 relative"
          style={{ width: `${progress}%` }}
        >
          {/* Polyp Nodes along the growth line */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_8px_#00f2fe]" />
        </div>
      </div>

      {/* Milestone Polyps */}
      {nodes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {nodes.map((node, idx) => (
            <div 
              key={idx}
              className={`p-2 rounded-lg border text-[10px] font-mono flex items-center gap-1.5 ${
                node.completed 
                  ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300' 
                  : 'bg-white/5 border-white/5 text-slate-400'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${node.completed ? 'bg-cyan-400 shadow-[0_0_6px_#00f2fe]' : 'bg-slate-600'}`} />
              <span className="truncate">{node.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
