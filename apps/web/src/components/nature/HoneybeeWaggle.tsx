import React from 'react';

export interface HoneybeeWaggleProps {
  urgentTaskId?: string;
  urgentTaskTitle?: string;
  priorityScore?: number;
  directionDegrees?: number;
}

export const HoneybeeWaggle: React.FC<HoneybeeWaggleProps> = ({
  urgentTaskId,
  urgentTaskTitle = "Execute Q3 Corporate Tax Prep",
  priorityScore = 94,
  directionDegrees = 45
}) => {
  return (
    <div className="p-4 rounded-xl border border-amber-500/20 bg-[#0e0c08]/90 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {/* Waggle Vector Compass Icon */}
        <div className="relative w-12 h-12 rounded-full border border-amber-500/40 bg-black/50 flex items-center justify-center shrink-0">
          <div 
            className="w-1 h-6 bg-gradient-to-t from-transparent to-amber-400 rounded-full transition-transform duration-500"
            style={{ transform: `rotate(${directionDegrees}deg)` }}
          />
          <div className="absolute w-2 h-2 rounded-full bg-amber-300 shadow-[0_0_8px_#f59e0b]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-white">HONEYBEE WAGGLE DANCE</h4>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
              Ref #10 Waggle Vector
            </span>
          </div>
          <p className="text-xs text-amber-200/90 font-mono mt-0.5 font-semibold">
            {urgentTaskTitle}
          </p>
          <span className="text-[10px] text-slate-400">
            Vector angle {directionDegrees}° to Sun · Yield index {priorityScore}/100
          </span>
        </div>
      </div>

      <div className="text-right">
        <span className="text-[9px] font-mono text-slate-400 block uppercase">Hive Urgency</span>
        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/80 px-2 py-1 rounded border border-amber-500/30">
          CRITICAL PRIORITY
        </span>
      </div>
    </div>
  );
};
