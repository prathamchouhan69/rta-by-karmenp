import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockTaskDistData = [
  { member: 'Karmesh P.', completed: 24, open: 6 },
  { member: 'Arya S.', completed: 18, open: 9 },
  { member: 'Devika R.', completed: 31, open: 4 },
  { member: 'Vikram J.', completed: 15, open: 11 },
];

export const TaskDistributionChart: React.FC<{ height?: number }> = ({ height = 220 }) => {
  return (
    <div className="w-full bg-[#06080d]/85 rounded-2xl p-4 border border-white/10 space-y-3.5 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="type-label text-white">
              ANT COLONY WORKLOAD BALANCE
            </h4>
            <span className="type-label px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              Chart #6 Distribution
            </span>
          </div>
          <p className="type-body-sm text-slate-400 text-xs">Team task allocation & stigmergic throughput</p>
        </div>
        <div className="flex items-center gap-3 text-xs font-numeric">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span className="text-slate-300 font-interface">Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-slate-300 font-interface">In Progress</span>
          </div>
        </div>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <BarChart data={mockTaskDistData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="member" stroke="#64748b" fontSize={11} tickLine={false} fontFamily="var(--font-interface)" />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} fontFamily="var(--font-numeric)" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#06080d',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '12px',
                fontFamily: 'var(--font-numeric)',
                fontSize: '11px',
                color: '#fff'
              }}
            />
            <Bar dataKey="completed" fill="#7000ff" radius={[4, 4, 0, 0]} name="Completed" />
            <Bar dataKey="open" fill="#00f2fe" radius={[4, 4, 0, 0]} name="In Progress" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
