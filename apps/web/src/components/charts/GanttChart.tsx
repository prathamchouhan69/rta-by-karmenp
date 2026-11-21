import React from 'react';

const mockGanttTasks = [
  { name: 'Autonomous EV Fleet Integration', start: 5, span: 45, color: 'from-cyan-500 to-blue-600', status: 'In Progress' },
  { name: 'KARM OS Architecture v2.4 Rebuild', start: 10, span: 60, color: 'from-purple-500 to-pink-600', status: 'In Progress' },
  { name: 'Zoho Books Double-Entry Live Sync', start: 30, span: 35, color: 'from-sky-500 to-indigo-600', status: 'Pending Review' },
  { name: 'Q4 Financial Close & Audit Preparation', start: 65, span: 30, color: 'from-amber-500 to-orange-600', status: 'Planned' },
];

export const GanttChart: React.FC = () => {
  return (
    <div className="w-full bg-[#07090e]/80 rounded-2xl p-4 border border-white/10 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              PROJECT TIMELINE GANTT & CRITICAL PATH
            </h4>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/30">
              Chart #5 Gantt Chart
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Slime-mold optimized dependencies & timeline horizons</p>
        </div>
        <span className="text-[10px] font-mono text-cyan-400">Slime Mold Pruned</span>
      </div>

      {/* Gantt Timeline Bar Canvas */}
      <div className="space-y-3 pt-2">
        {/* Timeline Header Months */}
        <div className="flex justify-between text-[10px] font-mono text-slate-400 border-b border-white/10 pb-1 px-1">
          <span>MONTH 1</span>
          <span>MONTH 2</span>
          <span>MONTH 3</span>
          <span>MONTH 4</span>
        </div>

        {mockGanttTasks.map((t, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-200 font-semibold">{t.name}</span>
              <span className="text-[10px] text-slate-400">{t.status}</span>
            </div>
            <div className="relative h-4 bg-black/60 rounded-full border border-white/5 overflow-hidden">
              <div
                className={`absolute top-0 bottom-0 rounded-full bg-gradient-to-r ${t.color}`}
                style={{ left: `${t.start}%`, width: `${t.span}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
