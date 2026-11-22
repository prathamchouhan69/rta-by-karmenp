import React, { useState, useRef, useEffect } from 'react';
import { Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DottedDonutChartProps {
  data: { name: string; value: number; color: string }[];
  title: string;
  subtitle?: string;
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
  timeRanges?: string[];
  height?: number;
  innerRadius?: number;
}

export const DottedDonutChart: React.FC<DottedDonutChartProps> = ({
  data,
  title,
  subtitle,
  timeRange = '30d',
  onTimeRangeChange,
  timeRanges = ['7d', '30d', '90d', '1y'],
  height = 280,
  innerRadius = 80,
}) => {
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const chartRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  const handleSegmentClick = (name: string) => {
    setActiveSegment(activeSegment === name ? null : name);
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { value: number; name: string; color: string; payload: { value: number } }[] }) => {
    if (!active || !payload) return null;
    const item = payload[0];
    const percentage = ((item.value / total) * 100).toFixed(1);
    return (
      <div className="bg-[#07090e] border border-white/10 rounded-xl p-3 shadow-xl min-w-[180px]">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-white font-bold text-sm">{item.name}</span>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          {formatValue(item.value)} ({percentage}%)
        </div>
      </div>
    );
  };

  const formatValue = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="w-full bg-[#07090e]/80 rounded-2xl p-4 border border-white/10 space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {title}
            </h4>
          </div>
          {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => onTimeRangeChange?.(e.target.value)}
            className="bg-[#05070a] border border-white/10 text-white text-[11px] font-mono px-3 py-1.5 rounded-xl focus:outline-none focus:border-cyan-500/50"
            aria-label="Time range filter"
          >
            {timeRanges.map((range) => (
              <option key={range} value={range}>{range}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <svg viewBox="0 0 300 300" width="100%" height="100%" ref={chartRef}>
            <Pie
              data={data}
              cx="150"
              cy="150"
              innerRadius={innerRadius}
              outerRadius={Math.min(140, height / 2 - 20)}
              paddingAngle={3}
              startAngle={-90}
              endAngle={270}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke="#05070a"
                  strokeWidth={2}
                />
              ))}
              <Tooltip content={<CustomTooltip />} />
              {data.map((entry, index) => (
                <path
                  key={`arc-${index}`}
                  fill={entry.color}
                  stroke="#05070a"
                  strokeWidth={2}
                  onClick={() => handleSegmentClick(entry.name)}
                  onMouseEnter={() => setActiveSegment(entry.name)}
                  onMouseLeave={() => setActiveSegment(null)}
                  style={{
                    cursor: 'pointer',
                    filter: activeSegment && activeSegment !== entry.name ? 'opacity(0.3)' : 'none',
                    transition: 'filter 150ms ease',
                  }}
                />
              ))}
            </Pie>
          </svg>
        </ResponsiveContainer>

        <div className="flex flex-wrap gap-2 justify-center" role="list" aria-label="Legend">
          {data.map((entry, index) => (
            <button
              key={`legend-${index}`}
              onClick={() => handleSegmentClick(entry.name)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all ${
                activeSegment === entry.name
                  ? 'bg-white/10 shadow-[0_0_12px_rgba(255,255,255,0.1)]'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
              aria-pressed={activeSegment === entry.name}
              aria-label={`${entry.name}: ${formatValue(entry.value)}`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-white font-medium">{entry.name}</span>
              <span className="text-slate-400">{((entry.value / total) * 100).toFixed(1)}%</span>
            </button>
          ))}
        </div>

        {activeSegment && (
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center text-xs text-slate-300" role="status" aria-live="polite">
            Filtering by <span className="font-bold text-white">{activeSegment}</span>{' '}
            <button
              onClick={() => setActiveSegment(null)}
              className="ml-2 text-cyan-400 hover:underline font-mono"
              aria-label="Clear filter"
            >
              Clear filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DottedDonutChart;