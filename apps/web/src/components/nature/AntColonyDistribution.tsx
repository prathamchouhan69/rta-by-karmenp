import React from 'react';
import { useApp } from '../../context/AppContext';
import { IconTasks } from '../common/Icons';

export const AntColonyDistribution: React.FC = () => {
  const { rebalanceTasksWithAntColony, tasks } = useApp();

  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const backlog = tasks.filter(t => t.status === 'backlog').length;
  const inReview = tasks.filter(t => t.status === 'in_review').length;
  const done = tasks.filter(t => t.status === 'done').length;

  return (
    <div className="p-4 rounded-2xl border border-cyan-500/30 bg-[#080c14]/90 space-y-3.5 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <IconTasks size={18} color="#00f2fe" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-display text-xs font-bold text-white tracking-wide">ANT COLONY FORAGING BALANCE</h4>
              <span className="type-label px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                Ref #8 Stigmergy
              </span>
            </div>
            <p className="type-body-sm text-slate-400 text-xs">
              Pheromone-reinforced task distribution across active project teams
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => rebalanceTasksWithAntColony()}
          className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 type-button text-xs transition-all active:scale-95"
          aria-label="Rebalance team workload stigmergically"
        >
          REBALANCE WORKLOAD
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center font-numeric">
        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
          <span className="type-label text-slate-400 block mb-1">FORAGING (BACKLOG)</span>
          <span className="text-sm font-bold text-slate-300">{backlog}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
          <span className="type-label text-slate-400 block mb-1">TRAIL ACTIVE (IN PROG)</span>
          <span className="text-sm font-bold text-cyan-400">{inProgress}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
          <span className="type-label text-slate-400 block mb-1">NEST VERIFY (REVIEW)</span>
          <span className="text-sm font-bold text-amber-400">{inReview}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
          <span className="type-label text-slate-400 block mb-1">STORED (DONE)</span>
          <span className="text-sm font-bold text-sky-400">{done}</span>
        </div>
      </div>
    </div>
  );
};
