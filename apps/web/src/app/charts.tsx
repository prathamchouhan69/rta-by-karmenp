import React, { useId, useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Tone } from './types';
import { cx, inrCompact } from './format';
import { toneVar } from './ui';

interface ChartTooltipEntry {
  name?: string | number;
  value?: string | number;
  color?: string;
  dataKey?: string | number;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: ChartTooltipEntry[];
  label?: string | number;
}

const CashTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[var(--k-line-strong)] bg-[var(--k-panel-solid)] px-3 py-2 shadow-xl">
      <div className="k-mono mb-1 text-[8px] uppercase tracking-[0.14em] text-[var(--k-t3)]">{label} 2026</div>
      {payload.map((entry, index) => (
        <div key={`${String(entry.name)}-${index}`} className="flex items-center justify-between gap-4 text-[10px]">
          <span className="flex items-center gap-1.5 text-[var(--k-t2)]">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: entry.color }} />
            {entry.name === 'inflow' ? 'Inflow' : entry.name === 'outflow' ? 'Outflow' : 'Net'}
          </span>
          <span className="k-num font-semibold text-[var(--k-t1)]">₹{entry.value}L</span>
        </div>
      ))}
    </div>
  );
};

const RevenueTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[var(--k-line-strong)] bg-[var(--k-panel-solid)] px-3 py-2 shadow-xl">
      <div className="k-mono mb-1 text-[8px] uppercase tracking-[0.14em] text-[var(--k-t3)]">{label}</div>
      {payload.map((entry, index) => (
        <div key={`${String(entry.name)}-${index}`} className="flex items-center justify-between gap-4 text-[10px]">
          <span className="text-[var(--k-t2)]">{entry.name === 'revenue' ? 'Billed' : 'Target'}</span>
          <span className="k-num font-semibold text-[var(--k-t1)]">₹{entry.value}L</span>
        </div>
      ))}
    </div>
  );
};

const SCurveTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[var(--k-line-strong)] bg-[var(--k-panel-solid)] px-3 py-2 shadow-xl">
      <div className="k-mono mb-1 text-[8px] uppercase tracking-[0.14em] text-[var(--k-t3)]">{label}</div>
      {payload.map((entry, index) => (
        <div key={`${String(entry.name)}-${index}`} className="flex items-center justify-between gap-4 text-[10px]">
          <span className="text-[var(--k-t2)]">{entry.name === 'planned' ? 'Planned' : 'Earned'}</span>
          <span className="k-num font-semibold text-[var(--k-t1)]">{entry.value}%</span>
        </div>
      ))}
    </div>
  );
};


export const CashFlowArea: React.FC<{
  data: { month: string; inflow: number; outflow: number; net: number }[];
  height?: number;
}> = ({ data, height = 230 }) => {
  const id = useId().replace(/:/g, '');
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id={`in-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--k-cyan)" stopOpacity={0.32} />
              <stop offset="100%" stopColor="var(--k-cyan)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id={`out-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--k-violet)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="var(--k-violet)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="month" axisLine={false} tickLine={false} dy={6} />
          <YAxis axisLine={false} tickLine={false} width={52} tickFormatter={(value: number) => `₹${value}L`} />
          <Tooltip
            cursor={{ stroke: 'var(--k-line-strong)', strokeDasharray: '4 4' }}
            content={<CashTooltip />}
          />
          <Area type="monotone" dataKey="inflow" stroke="var(--k-cyan)" strokeWidth={2} fill={`url(#in-${id})`} />
          <Area type="monotone" dataKey="outflow" stroke="var(--k-violet)" strokeWidth={1.6} fill={`url(#out-${id})`} />
          <Line type="monotone" dataKey="net" stroke="var(--k-amber)" strokeWidth={1.2} dot={false} strokeDasharray="3 3" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const RevenueBars: React.FC<{
  data: { month: string; revenue: number; target: number }[];
  height?: number;
}> = ({ data, height = 190 }) => (
  <div style={{ width: '100%', height }}>
    <ResponsiveContainer>
      <BarChart data={data} margin={{ top: 8, right: 0, left: -24, bottom: 0 }} barGap={4}>
        <CartesianGrid strokeDasharray="2 4" vertical={false} />
        <XAxis dataKey="month" axisLine={false} tickLine={false} dy={6} />
        <YAxis axisLine={false} tickLine={false} width={48} tickFormatter={(value: number) => `${value}L`} />
        <Tooltip
          cursor={{ fill: 'var(--k-inset)' }}
          content={<RevenueTooltip />}
        />
        <Bar dataKey="target" fill="var(--k-inset)" radius={[4, 4, 0, 0]} maxBarSize={18} />
        <Bar dataKey="revenue" fill="var(--k-violet)" radius={[4, 4, 0, 0]} maxBarSize={18}>
          {data.map((entry, index) => (
            <Cell key={entry.month} fill={index === data.length - 1 ? 'var(--k-cyan)' : 'var(--k-violet)'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export const SCurve: React.FC<{
  data: { month: string; planned: number; earned: number }[];
  height?: number;
}> = ({ data, height = 200 }) => (
  <div style={{ width: '100%', height }}>
    <ResponsiveContainer>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
        <CartesianGrid strokeDasharray="2 4" vertical={false} />
        <XAxis dataKey="month" axisLine={false} tickLine={false} dy={6} />
        <YAxis axisLine={false} tickLine={false} width={44} tickFormatter={(value: number) => `${value}%`} domain={[0, 100]} />
        <Tooltip
          content={<SCurveTooltip />}
        />
        <Line type="monotone" dataKey="planned" stroke="var(--k-t3)" strokeWidth={1.4} strokeDasharray="4 4" dot={false} />
        <Line type="monotone" dataKey="earned" stroke="var(--k-cyan)" strokeWidth={2.2} dot={{ r: 2.5, fill: 'var(--k-cyan)' }} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export const DottedArcDonut: React.FC<{
  data: { name: string; value: number; color: string }[];
  total: string;
  caption: string;
  height?: number;
  tone?: Tone;
}> = ({ data, total, caption, height = 200 }) => {
  const size = 200;
  const radius = 76;
  const center = size / 2;
  const sum = data.reduce((acc, item) => acc + item.value, 0) || 1;
  const dots: Array<{ x: number; y: number; color: string; opacity: number }> = [];

  let angle = -90;
  for (const segment of data) {
    const sweep = (segment.value / sum) * 360;
    const steps = Math.max(1, Math.floor(sweep / 3.1));
    for (let index = 0; index < steps; index += 1) {
      const degrees = angle + (index / steps) * sweep;
      const radians = (degrees * Math.PI) / 180;
      dots.push({
        x: center + Math.cos(radians) * radius,
        y: center + Math.sin(radians) * radius,
        color: segment.color,
        opacity: 0.9,
      });
    }
    angle += sweep;
  }

  return (
    <div className="flex flex-col items-center gap-4 md:flex-row md:items-center md:justify-between">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Receivables ageing: ${data.map((item) => `${item.name} ${inrCompact(item.value)}`).join(', ')}`}>
          {dots.map((dot, index) => (
            <circle
              key={index}
              cx={dot.x}
              cy={dot.y}
              r={2.1}
              fill={dot.color}
              opacity={dot.opacity}
              className={cx('k-draw')}
              style={{ animationDelay: `${index * 2.5}ms` }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="k-eyebrow !text-[8px]">open AR</div>
          <div className="k-number-hero mt-1 text-[25px] text-[var(--k-t1)]">{total}</div>
          <div className="mt-1 text-[9px] text-[var(--k-t3)]">{caption}</div>
        </div>
      </div>
      <div className="w-full space-y-2.5">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-[10.5px] text-[var(--k-t2)]">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: item.color }} />
              {item.name}
            </span>
            <span className="k-num text-[10.5px] font-semibold text-[var(--k-t1)]">{inrCompact(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const DispatchMap: React.FC<{ className?: string; height?: number }> = ({ className, height = 240 }) => (
  <div className={cx('relative overflow-hidden rounded-2xl border border-[var(--k-line)] bg-[#05070b]', className)} style={{ height }}>
    <svg viewBox="0 0 520 260" className="h-full w-full" role="img" aria-label="Stylised map of the Kolar quarry, NH-46 site and Bhopal Metro dispatch corridor">
      <defs>
        <radialGradient id="map-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </radialGradient>
        <pattern id="map-grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(255,255,255,0.045)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="520" height="260" fill="#05070b" />
      <rect width="520" height="260" fill="url(#map-grid)" />
      <path d="M-20 186 C 80 170, 120 128, 210 142 S 350 200, 540 118" fill="none" stroke="rgba(34,211,238,0.10)" strokeWidth="34" strokeLinecap="round" />
      <path d="M-20 186 C 80 170, 120 128, 210 142 S 350 200, 540 118" fill="none" stroke="rgba(34,211,238,0.35)" strokeWidth="1" strokeDasharray="5 6" />
      <path d="M 58 218 C 120 208, 160 178, 238 180 S 380 212, 480 168" fill="none" stroke="rgba(167,139,250,0.22)" strokeWidth="1.5" strokeDasharray="4 5" />
      <circle cx="86" cy="164" r="48" fill="url(#map-glow)" />
      <circle cx="86" cy="164" r="6" fill="#22d3ee" />
      <circle cx="86" cy="164" r="13" fill="none" stroke="#22d3ee" strokeOpacity="0.4" />
      <circle cx="86" cy="164" r="22" fill="none" stroke="#22d3ee" strokeOpacity="0.18" />
      <text x="86" y="199" textAnchor="middle" fill="#8b93a7" fontSize="8" fontFamily="JetBrains Mono">KOLAR QUARRY</text>
      <circle cx="284" cy="150" r="5" fill="#a78bfa" />
      <circle cx="284" cy="150" r="11" fill="none" stroke="#a78bfa" strokeOpacity="0.42" />
      <text x="284" y="128" textAnchor="middle" fill="#8b93a7" fontSize="8" fontFamily="JetBrains Mono">NH-46 · PIER 11</text>
      <circle cx="434" cy="170" r="5" fill="#fbbf68" />
      <circle cx="434" cy="170" r="11" fill="none" stroke="#fbbf68" strokeOpacity="0.38" />
      <text x="434" y="196" textAnchor="middle" fill="#8b93a7" fontSize="8" fontFamily="JetBrains Mono">METRO V4</text>
      <circle cx="182" cy="190" r="3.5" fill="#22d3ee" />
      <circle cx="360" cy="178" r="3.5" fill="#22d3ee" />
      <g className="animate-karm-route">
        <path d="M 92 162 C 140 150, 210 136, 278 148" fill="none" stroke="#22d3ee" strokeWidth="1.6" strokeDasharray="6 6" strokeOpacity="0.85" />
      </g>
      <g className="animate-karm-route" style={{ animationDelay: '-1.2s' }}>
        <path d="M 292 150 C 340 148, 380 160, 428 168" fill="none" stroke="#a78bfa" strokeWidth="1.6" strokeDasharray="6 6" strokeOpacity="0.75" />
      </g>
      <text x="16" y="24" fill="#4d4a59" fontSize="7" fontFamily="JetBrains Mono">BHOPAL OPERATING CORRIDOR · 23.2599° N 77.4126° E</text>
      <text x="16" y="244" fill="#4d4a59" fontSize="7" fontFamily="JetBrains Mono">SCHEMATIC · NOT TO SCALE</text>
      <g opacity="0.7">
        <circle cx="472" cy="34" r="3" fill="#22d3ee" />
        <circle cx="488" cy="34" r="3" fill="#a78bfa" />
        <circle cx="504" cy="34" r="3" fill="#fbbf68" />
      </g>
    </svg>
    <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/45 px-2 py-1 backdrop-blur">
      <span className="h-1.5 w-1.5 rounded-full bg-[#22d3ee] shadow-[0_0_8px_#22d3ee]" />
      <span className="k-mono text-[8px] uppercase tracking-[0.14em] text-[#a7a4b4]">live corridor</span>
    </div>
  </div>
);

export const SparkBars: React.FC<{ data: number[]; tone?: Tone; height?: number }> = ({ data, tone = 'cyan', height = 32 }) => {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[2px]" style={{ height }} aria-hidden="true">
      {data.map((value, index) => (
        <span
          key={index}
          className="flex-1 rounded-sm"
          style={{
            height: `${Math.max(10, (value / max) * 100)}%`,
            background: index === data.length - 1 ? toneVar(tone) : `color-mix(in srgb, ${toneVar(tone)} 38%, transparent)`,
          }}
        />
      ))}
    </div>
  );
};
