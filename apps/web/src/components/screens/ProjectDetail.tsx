import React from 'react';
import { useApp } from '../../context/AppContext';
import { CoralGrowthProgress } from '../nature/CoralGrowthProgress';
import { IconCheck, IconCalendar } from '../common/Icons';
import { formatRupees, formatDateUK } from '../../utils/formatters';

export const ProjectDetail: React.FC = () => {
  const { activeEntityId, projects, tasks, navigateTo, syncWithGoogleCalendar, goBack } = useApp();
  const project = projects.find(p => p.id === activeEntityId) || projects[0];

  const projectTasks = tasks.filter(t => t.project_id === project.id);
  const spentNum = Number(project.spent);
  const earnedNum = Number(project.earned_value);
  const budgetNum = Number(project.budget);
  const cpi = spentNum > 0 ? (earnedNum / spentNum).toFixed(2) : '1.00';
  const spi = budgetNum > 0 ? (earnedNum / (budgetNum * (project.progress / 100))).toFixed(2) : '1.00';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <button
          onClick={() => goBack()}
          className="type-button text-xs text-purple-400 hover:underline flex items-center gap-1.5"
          aria-label="Return to Projects Cockpit"
        >
          <span>← Back to Projects Cockpit</span>
        </button>
        <span className="type-label text-slate-400">PROJECT ID: {project.id.toUpperCase()}</span>
      </div>

      {/* Main Project Card */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#06080d]/90 border border-white/10 space-y-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <span className="type-label text-purple-400 block mb-1">ENTERPRISE CLIENT: {project.client.toUpperCase()}</span>
            <h2 className="type-display text-2xl md:text-3xl text-white">{project.name}</h2>
            <p className="type-body-sm text-slate-400 mt-1">
              Start: {formatDateUK(project.start_date)} · Target End: {formatDateUK(project.end_date)}
            </p>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-numeric font-bold border flex items-center gap-1.5 self-start ${
            project.status === 'on_track'
              ? 'bg-sky-950 text-sky-400 border-sky-500/40'
              : project.status === 'delayed'
              ? 'bg-red-950 text-red-400 border-red-500/40'
              : 'bg-amber-950 text-amber-400 border-amber-500/40'
          }`}>
            {project.status === 'on_track' && <IconCheck size={12} state="success" />}
            <span>{project.status.toUpperCase()}</span>
          </span>
        </div>

        {/* Earned Value & Financial Matrix */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-black/40 border border-white/5 font-numeric text-xs">
          <div>
            <span className="type-label text-slate-400 block mb-1">TOTAL BUDGET (BAC)</span>
            <span className="type-financial text-xl text-white">{formatRupees(project.budget, true)}</span>
          </div>
          <div>
            <span className="type-label text-slate-400 block mb-1">ACTUAL SPENT (AC)</span>
            <span className="type-financial text-xl text-slate-300">{formatRupees(project.spent, true)}</span>
          </div>
          <div>
            <span className="type-label text-slate-400 block mb-1">EARNED VALUE (EV)</span>
            <span className="type-financial text-xl text-cyan-300">{formatRupees(project.earned_value, true)}</span>
          </div>
          <div>
            <span className="type-label text-slate-400 block mb-1">CPI / SPI INDICES</span>
            <span className="type-financial text-xl text-purple-300">{cpi} / {spi}</span>
          </div>
        </div>

        {/* Coral Growth Branching Milestone Bar */}
        <CoralGrowthProgress
          progress={project.progress}
          title="Coral Branching Milestone Trajectory (Ref #6)"
          nodes={project.milestones.map(m => ({ name: m.title, completed: m.completed }))}
        />

        {/* Milestones Matrix */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="type-label text-slate-300">MILESTONES & ARCHITECTURAL VERIFICATION NODES</h3>
            <span className="text-xs font-mono text-cyan-400">CRITICAL PATH</span>
          </div>
          <div className="space-y-2">
            {project.milestones.map((m) => (
              <div key={m.id} className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between text-xs font-numeric">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                    m.completed ? 'bg-sky-400 text-black shadow-[0_0_8px_#38bdf8]' : 'bg-slate-700'
                  }`}>
                    {m.completed && <IconCheck size={9} color="#000" />}
                  </div>
                  <span className="text-white font-interface font-medium">{m.title}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="type-timestamp text-slate-400">{formatDateUK(m.due_date)}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    m.completed ? 'bg-sky-950 text-sky-400 border border-sky-500/30' : 'bg-white/5 text-slate-400'
                  }`}>
                    {m.completed ? 'VERIFIED' : 'PENDING'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Linked Project Tasks */}
        {projectTasks.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="type-label text-slate-300">LINKED TASKS ({projectTasks.length})</h3>
              <span className="text-xs font-mono text-cyan-400">ASSIGNED CREW</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {projectTasks.map(t => (
                <div
                  key={t.id}
                  onClick={() => navigateTo('task_detail', t.id)}
                  className="p-3.5 rounded-2xl bg-black/40 border border-white/5 hover:border-purple-400/40 cursor-pointer transition-all space-y-2 group"
                >
                  <div className="text-xs font-interface font-semibold text-white group-hover:text-purple-300 transition-colors">
                    {t.title}
                  </div>
                  <div className="flex items-center justify-between type-timestamp">
                    <span className="text-slate-300">{t.assignee.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        syncWithGoogleCalendar(t.id);
                      }}
                      className="text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <IconCalendar size={11} color="#00f2fe" />
                      <span>Cal Sync</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
