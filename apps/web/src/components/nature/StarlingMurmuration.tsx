import React from 'react';

export const StarlingMurmuration: React.FC = () => {
  return (
    <div className="p-4 rounded-xl border border-indigo-500/30 bg-[#0a0a16]/90 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-bold text-white">STARLING MURMURATION SWARM</h4>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
            Ref #12 Flocking Vectors
          </span>
        </div>
        <span className="text-[10px] font-mono text-indigo-400">Team Cohesion: 98.4%</span>
      </div>

      {/* Murmuration Particle Canvas */}
      <div className="relative h-28 bg-black/60 rounded-lg border border-white/5 overflow-hidden flex items-center justify-center">
        <svg className="w-full h-full" viewBox="0 0 300 100">
          <defs>
            <radialGradient id="starlingGrad">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </radialGradient>
          </defs>
          {[...Array(25)].map((_, i) => {
            const cx = 50 + (i * 9) + Math.sin(i) * 15;
            const cy = 50 + Math.cos(i * 1.5) * 20;
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r="2.5"
                fill="#a5b4fc"
                className="anim-pulse-subtle"
                style={{ animationDelay: `${i * 0.05}s` }}
              />
            );
          })}
        </svg>
        <span className="absolute bottom-2 right-2 text-[9px] font-mono text-slate-400">
          Scale-free behavioral correlations (N=7 neighbors)
        </span>
      </div>
    </div>
  );
};
