import React from 'react';
import { useApp } from '../../context/AppContext';
import { AntColonyDistribution } from '../nature/AntColonyDistribution';
import { HoneybeeWaggle } from '../nature/HoneybeeWaggle';
import { TaskDistributionChart } from '../charts/TaskDistributionChart';
import { IconCalendar, IconCheck } from '../common/Icons';
import { formatDateUK } from '../../utils/formatters';

export const TasksScreen: React.FC = () => {
  const { tasks, updateTaskStatus, syncWithGoogleCalendar, navigateTo } = useApp();

  const columns = [
    { key: 'backlog', label: 'FORAGING BACKLOG' },
    { key: 'in_progress', label: 'ACTIVE TRAIL' },
    { key: 'in_review', label: 'NEST VERIFICATION' },
    { key: 'done', label: 'NUTRIENT STORED' },
  ] as const;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="type-h1 tracking-tight text-white">
              TASKS & TEAM INTELLIGENCE
            </h1>
            <span className="type-label px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              PRIORITY 2 · ANT COLONY & HONEYBEE
            </span>
          </div>
          <p className="type-body-sm text-slate-400 mt-1">
            Pheromone trail load balancing, Honeybee waggle priority vector & Google Calendar scheduling
          </p>
        </div>
      </div>

      {/* Honeybee Waggle Compass */}
      <HoneybeeWaggle
        urgentTaskTitle="Execute Q3 Corporate Tax Filing with Zoho Books"
        priorityScore={96}
        directionDegrees={62}
      />

      {/* Ant Colony Stigmergy Allocator */}
      <AntColonyDistribution />

      {/* Task Workload Distribution Wave */}
      <TaskDistributionChart height={220} />

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key);
          return (
            <div key={col.key} className="p-3.5 rounded-2xl bg-[#06080d]/90 border border-white/10 space-y-3 shadow-md">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="type-label text-slate-300">{col.label}</span>
                <span className="type-label px-1.5 py-0.5 rounded bg-white/5 text-cyan-400 font-numeric">{colTasks.length}</span>
              </div>

              <div className="space-y-2.5">
                {colTasks.map(t => (
                  <div
                    key={t.id}
                    onClick={() => navigateTo('task_detail', t.id)}
                    className="p-3.5 rounded-xl bg-black/60 border border-white/5 hover:border-cyan-400/50 cursor-pointer transition-all space-y-2 group"
                    role="button"
                    tabIndex={0}
                    aria-label={`Task: ${t.title}`}
                  >
                    <div className="text-xs font-interface font-semibold text-white group-hover:text-cyan-300 transition-colors">
                      {t.title}
                    </div>
                    <div className="flex items-center justify-between type-timestamp">
                      <span className="text-slate-300 font-interface">{t.assignee.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-numeric font-bold ${
                        t.priority === 'urgent'
                          ? 'bg-red-950 text-red-300 border border-red-500/40'
                          : 'bg-white/5 text-slate-400'
                      }`}>
                        {t.priority.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-white/5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          syncWithGoogleCalendar(t.id);
                        }}
                        className="type-timestamp text-cyan-400 hover:underline flex items-center gap-1"
                        aria-label="Synchronise with Google Calendar"
                      >
                        <IconCalendar size={12} color="#00f2fe" />
                        <span>Cal Sync</span>
                      </button>

                      {col.key !== 'done' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTaskStatus(t.id, 'done');
                          }}
                          className="type-timestamp text-sky-400 hover:underline flex items-center gap-1"
                          aria-label="Mark task complete"
                        >
                          <IconCheck size={12} state="success" />
                          <span>Mark Done →</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
