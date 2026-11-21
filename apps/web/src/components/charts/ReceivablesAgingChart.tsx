import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const mockAgingData = [
  { bucket: 'Current', amount: 84200, color: '#10b981' },
  { bucket: '1-30 Days', amount: 32500, color: '#38bdf8' },
  { bucket: '31-60 Days', amount: 16800, color: '#f59e0b' },
  { bucket: '61-90 Days', amount: 9400, color: '#f97316' },
  { bucket: '90+ Days', amount: 6400, color: '#ef4444' },
];

export const ReceivablesAgingChart: React.FC<{ height?: number }> = ({ height = 240 }) => {
  return (
    <div className="w-full bg-[#07090e]/80 rounded-2xl p-4 border border-white/10 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              RECEIVABLES AGING HORIZON
            </h4>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
              Chart #3 Receivables Aging
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Aging brackets mapped to liquidity decay profiles</p>
        </div>
        <span className="text-xs font-mono font-bold text-cyan-300">Total: $149,300</span>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <BarChart data={mockAgingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="bucket" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#07090e',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontFamily: 'monospace',
                fontSize: '11px',
                color: '#fff'
              }}
            />
            <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
              {mockAgingData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
