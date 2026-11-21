import React from 'react';
import { useApp } from '../../context/AppContext';
import { StarlingMurmuration } from '../nature/StarlingMurmuration';
import { formatRupees } from '../../utils/formatters';

export const HRScreen: React.FC = () => {
  const { employees, navigateTo } = useApp();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <h1 className="type-h1 tracking-tight text-white">
            HUMAN RESOURCES & WORKFORCE
          </h1>
          <span className="type-label px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/40">
            MURMURATION DYNAMICS
          </span>
        </div>
        <p className="type-body-sm text-slate-400 mt-1">
          Starling murmuration swarm coordination, biometric rosters & team cohesion index
        </p>
      </div>

      <StarlingMurmuration />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {employees.map(emp => (
          <div
            key={emp.id}
            onClick={() => navigateTo('employee_detail', emp.id)}
            className="p-4 rounded-2xl bg-[#06080d]/90 border border-white/10 hover:border-purple-400/50 cursor-pointer transition-all space-y-2.5 shadow-lg group"
            role="button"
            tabIndex={0}
            aria-label={`Employee profile ${emp.name}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs font-interface font-semibold text-white group-hover:text-purple-300 transition-colors">
                  {emp.name}
                </div>
                <div className="type-caption text-purple-300 font-interface mt-0.5">{emp.role}</div>
              </div>
              <span className="type-label px-1.5 py-0.5 rounded bg-white/5 text-slate-300">
                {emp.status.toUpperCase()}
              </span>
            </div>
            <div className="type-timestamp text-slate-400 pt-1 border-t border-white/5 flex justify-between items-center">
              <span>{emp.department}</span>
              <span className="type-financial text-slate-300">{formatRupees(emp.monthly_payroll, true)}/mo</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
