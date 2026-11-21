import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockRevenueTrend = [
  { month: 'Q1 M1', actual: 82000, target: 75000 },
  { month: 'Q1 M2', actual: 91000, target: 80000 },
  { month: 'Q1 M3', actual: 114000, target: 90000 },
  { month: 'Q2 M1', actual: 105000, target: 95000 },
  { month: 'Q2 M2', actual: 132000, target: 110000 },
  { month: 'Q2 M3', actual: 154000, target: 125000 },
];

export const RevenueTrendLine: React.FC<{ height?: number }> = ({ height = 240 }) => {
  return (
    <div className="w-full bg-[#07090e]/80 rounded-2xl p-4 border border-white/10 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              FIBONACCI REVENUE TRAJECTORY
            </h4>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-yellow-950 text-yellow-300 border border-yellow-500/30">
              Chart #2 Revenue Trend Line
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Actual ARR velocity vs Golden Ratio expansion projection</p>
        </div>
        <span className="text-xs font-mono font-bold text-yellow-400">+23.2% vs Target</span>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <LineChart data={mockRevenueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
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
            <Line type="monotone" dataKey="actual" stroke="#facc15" strokeWidth={3} dot={{ r: 4, fill: '#facc15' }} />
            <Line type="monotone" dataKey="target" stroke="#64748b" strokeWidth={2} strokeDasharray="4 4" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
