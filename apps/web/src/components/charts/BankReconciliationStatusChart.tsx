import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { IconCheck } from '../common/Icons';

const mockReconcileData = [
  { name: 'Reconciled (Matched)', value: 142, color: '#38bdf8' }, // Non-green Crisp Sky
  { name: 'Unmatched / Pending', value: 18, color: '#f59e0b' },  // Amber
  { name: 'Variance / Flagged', value: 4, color: '#ef4444' },   // Crimson
];

export const BankReconciliationStatusChart: React.FC = () => {
  return (
    <div className="w-full bg-[#06080d]/85 rounded-2xl p-4 border border-white/10 space-y-3.5 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="type-label text-white">
              BANK RECONCILIATION INTEGRITY
            </h4>
            <span className="type-label px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              Chart #4 Reconcile
            </span>
          </div>
          <p className="type-body-sm text-slate-400 text-xs">Zoho bank feed vs internal ledger double-entry sync</p>
        </div>
        <span className="type-financial text-xs text-sky-400 flex items-center gap-1">
          <IconCheck size={12} state="success" />
          <span>97.6% Synced</span>
        </span>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div style={{ width: 140, height: 140 }}>
          <ResponsiveContainer>
            <PieChart>
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
              <Pie
                data={mockReconcileData}
                innerRadius={42}
                outerRadius={65}
                paddingAngle={4}
                dataKey="value"
              >
                {mockReconcileData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#06080d" strokeWidth={2} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-2 text-xs font-numeric">
          {mockReconcileData.map(item => (
            <div key={item.name} className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-300 font-interface text-xs">{item.name}</span>
              </div>
              <span className="font-bold text-white type-financial">{item.value} tx</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
