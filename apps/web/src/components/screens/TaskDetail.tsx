import React from 'react';
import { useApp } from '../../context/AppContext';
import { IconCalendar, IconCheck } from '../common/Icons';
import { formatDateUK } from '../../utils/formatters';

export const TaskDetail: React.FC = () => {
  const { activeEntityId, tasks, updateTaskStatus, syncWithGoogleCalendar, goBack } = useApp();
  const task = tasks.find(t => t.id === activeEntityId) || tasks[0];

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <button
          onClick={() => goBack()}
          className="type-button text-xs text-cyan-400 hover:underline flex items-center gap-1.5"
          aria-label="Return to Tasks Kanban"
        >
          <span>← Back to Tasks</span>
        </button>
        <button
          onClick={() => syncWithGoogleCalendar(task.id)}
          className="px-3.5 py-1.5 rounded-xl bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-xs type-button flex items-center gap-1.5 active:scale-95 transition-all shadow-md"
          aria-label="Synchronise Task with Google Calendar"
        >
          <IconCalendar size={13} color="#00f2fe" />
          <span>SYNC TO GOOGLE CALENDAR</span>
        </button>
      </div>

      <div className="p-6 md:p-8 rounded-3xl bg-[#06080d]/90 border border-white/10 space-y-5 shadow-2xl">
        <div>
          <span className="type-label text-cyan-400 block mb-1">PROJECT: {task.project_name.toUpperCase()}</span>
          <h2 className="type-h2 text-white">{task.title}</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-2xl bg-black/40 border border-white/5 font-numeric text-xs">
          <div>
            <span className="type-label text-slate-400 block mb-1">ASSIGNEE</span>
            <span className="text-white font-bold font-interface">{task.assignee.name}</span>
          </div>
          <div>
            <span className="type-label text-slate-400 block mb-1">DUE DATE</span>
            <span className="text-white font-bold">{formatDateUK(task.due_date)}</span>
          </div>
          <div>
            <span className="type-label text-slate-400 block mb-1">PRIORITY</span>
            <span className="text-amber-400 font-bold uppercase">{task.priority}</span>
          </div>
          <div>
            <span className="type-label text-slate-400 block mb-1">STATUS</span>
            <span className="text-sky-400 font-bold uppercase flex items-center gap-1">
              {task.status === 'done' && <IconCheck size={11} state="success" />}
              {task.status}
            </span>
          </div>
        </div>

        {task.status !== 'done' && (
          <div className="pt-2">
            <button
              onClick={() => updateTaskStatus(task.id, 'done')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-black font-semibold type-button text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
              aria-label="Confirm task completion"
            >
              <IconCheck size={14} color="#000" />
              <span>CONFIRM TASK COMPLETION</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
