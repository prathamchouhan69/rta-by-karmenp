import React from 'react';
import { useApp } from '../../context/AppContext';
import { IconHR, IconCheck } from '../common/Icons';
import { formatRupees, formatDateUK } from '../../utils/formatters';

export const EmployeeDetail: React.FC = () => {
  const { activeEntityId, employees, tasks, navigateTo, goBack } = useApp();
  const emp = employees.find(e => e.id === activeEntityId) || employees[0];

  const assignedTasks = tasks.filter(t => t.assignee.name === emp.name);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <button
          onClick={() => goBack()}
          className="type-button text-xs text-purple-400 hover:underline flex items-center gap-1.5"
          aria-label="Return to Human Resources"
        >
          <span>← Back to Human Resources</span>
        </button>
        <span className="type-label text-slate-400">EMPLOYEE ID: {emp.id.toUpperCase()}</span>
      </div>

      <div className="p-6 md:p-8 rounded-3xl bg-[#06080d]/90 border border-white/10 space-y-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-purple-950/70 border border-purple-500/30 text-purple-400">
              <IconHR size={28} color="#7000ff" />
            </div>
            <div>
              <span className="type-label text-purple-400 block mb-1">ENTERPRISE TALENT PROFILE</span>
              <h2 className="type-display text-2xl md:text-3xl text-white">{emp.name}</h2>
              <p className="type-body-sm text-slate-400 mt-0.5">{emp.role} · Department: {emp.department}</p>
            </div>
          </div>
          <span className="type-label px-3 py-1.5 rounded-full bg-purple-950 text-purple-300 border border-purple-500/30 self-start">
            {emp.status.toUpperCase()}
          </span>
        </div>

        {/* Workforce Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-black/40 border border-white/5 font-numeric text-xs">
          <div>
            <span className="type-label text-slate-400 block mb-1">MONTHLY COMPENSATION</span>
            <span className="type-financial text-xl text-white">{formatRupees(emp.monthly_payroll)}</span>
          </div>
          <div>
            <span className="type-label text-slate-400 block mb-1">PRODUCTIVITY INDEX</span>
            <span className="type-financial text-xl text-sky-400 flex items-center gap-1">
              <IconCheck size={14} state="success" />
              <span>{emp.productivity_score}/100</span>
            </span>
          </div>
          <div>
            <span className="type-label text-slate-400 block mb-1">ACTIVE WORKLOAD</span>
            <span className="type-financial text-xl text-cyan-300">{emp.active_tasks} Tasks</span>
          </div>
          <div>
            <span className="type-label text-slate-400 block mb-1">TENURE START</span>
            <span className="type-financial text-xl text-slate-300">{formatDateUK(emp.join_date)}</span>
          </div>
        </div>

        {/* Contact & Verification Credentials */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 text-xs font-interface">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Enterprise Email:</span>
            <span className="text-white font-numeric">{emp.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Flock Coordination Status:</span>
            <span className="text-purple-300 font-numeric">Ref #5 Starling Murmuration Swarm Active</span>
          </div>
        </div>

        {/* Assigned Tasks Stream */}
        {assignedTasks.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="type-label text-slate-300">ASSIGNED OPERATIONAL TASKS ({assignedTasks.length})</h3>
              <span className="text-xs font-mono text-cyan-400">ACTIVE QUEUE</span>
            </div>
            <div className="space-y-2">
              {assignedTasks.map(t => (
                <div
                  key={t.id}
                  onClick={() => navigateTo('task_detail', t.id)}
                  className="p-3.5 rounded-2xl bg-black/40 border border-white/5 hover:border-purple-400/40 cursor-pointer transition-all flex items-center justify-between text-xs group"
                >
                  <span className="text-white font-interface font-medium group-hover:text-purple-300 transition-colors">
                    {t.title}
                  </span>
                  <span className="type-timestamp text-slate-400">{formatDateUK(t.due_date)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
