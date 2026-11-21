import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const mockCashFlowData = [
  { month: 'Jan', inflow: 85000, outflow: 45000, net: 40000 },
  { month: 'Feb', inflow: 92000, outflow: 48000, net: 44000 },
  { month: 'Mar', inflow: 110000, outflow: 52000, net: 58000 },
  { month: 'Apr', inflow: 98000, outflow: 61000, net: 37000 },
  { month: 'May', inflow: 125000, outflow: 58000, net: 67000 },
  { month: 'Jun', inflow: 142000, outflow: 64000, net: 78000 },
  { month: 'Jul', inflow: 138000, outflow: 70000, net: 68000 },
];

export const CashFlowChart: React.FC<{ height?: number }> = ({ height = 260 }) => {
  return (
    <div className="w-full bg-[#07090e]/80 rounded-2xl p-4 border border-white/10 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              CASH FLOW & LIQUIDITY MATRIX
            </h4>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              Chart #1 Cash Flow
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Zoho Books synchronized inflows vs operating expenses</p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-slate-300">Inflows</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span className="text-slate-300">Outflows</span>
          </div>
        </div>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <AreaChart data={mockCashFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#00f2fe" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#07090e',
                border: '1px solid rgba(0,242,254,0.3)',
                borderRadius: '12px',
                fontFamily: 'monospace',
                fontSize: '11px',
                color: '#fff'
              }}
            />
            <Area type="monotone" dataKey="inflow" stroke="#00f2fe" strokeWidth={2} fillOpacity={1} fill="url(#inflowGrad)" />
            <Area type="monotone" dataKey="outflow" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#outflowGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
