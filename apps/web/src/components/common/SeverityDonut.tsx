import React, { useState, useRef, useEffect } from 'react';
import { Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface SeveritySegment {
  id: string;
  label: string;
  value: number;
  color: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  onClick?: () => void;
}

interface SeverityDonutProps {
  segments: SeveritySegment[];
  title: string;
  subtitle?: string;
  height?: number;
  innerRadius?: number;
  onSegmentClick?: (segment: SeveritySegment) => void;
  showLegend?: boolean;
  className?: string;
}

const SEVERITY_ICONS = {
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🟢',
  info: '🔵',
};

export const SeverityDonut: React.FC<SeverityDonutProps> = ({
  segments,
  title,
  subtitle,
  height = 280,
  innerRadius = 70,
  onSegmentClick,
  showLegend = true,
  className = '',
}) => {
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const total = segments.reduce((sum, s) => sum + s.value, 0);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { value: number; name: string; color: string; payload: { value: number; severity: string } }[] }) => {
    if (!active || !payload) return null;
    const item = payload[0];
    const percentage = ((item.value / total) * 100).toFixed(1);
    return (
      <div className="bg-[#07090e] border border-white/10 rounded-xl p-3 shadow-xl min-w-[200px]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{SEVERITY_ICONS[item.payload.severity as keyof typeof SEVERITY_ICONS] || '●'}</span>
          <span className="text-white font-bold text-sm">{item.name}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono">{formatValue(item.value)}</span>
          <span className="text-white font-bold">{percentage}%</span>
        </div>
        <div className="mt-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-white/10 text-slate-300">
          Severity: {item.payload.severity.toUpperCase()}
        </div>
      </div>
    );
  };

  const formatValue = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return val.toString();
  };

  const handleSegmentClick = (segment: SeveritySegment) => {
    setActiveSegment(activeSegment === segment.id ? null : segment.id);
    onSegmentClick?.(segment);
  };

  return (
    <div className={`w-full bg-[#07090e]/80 rounded-2xl p-4 border border-white/10 space-y-3 ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">{title}</h4>
          {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
          <span className="px-2 py-0.5 rounded bg-white/5">Total: {formatValue(total)}</span>
        </div>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <Pie
            data={segments.map((s) => ({ ...s, name: s.label }))}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={Math.min(140, height / 2 - 20)}
            paddingAngle={2}
            startAngle={-90}
            endAngle={270}
          >
            {segments.map((segment, index) => (
              <Cell
                key={`cell-${index}`}
                fill={segment.color}
                stroke="#05070a"
                strokeWidth={2}
              />
            ))}
            <Tooltip content={<CustomTooltip />} />
          </Pie>
        </ResponsiveContainer>
      </div>

      {showLegend && (
        <div className="flex flex-wrap gap-2 justify-center" role="list" aria-label="Severity legend">
          {segments.map((segment, index) => (
            <button
              key={segment.id}
              onClick={() => handleSegmentClick(segment)}
              disabled={!onSegmentClick && !segment.onClick}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all
                ${activeSegment === segment.id
                  ? 'bg-white/10 shadow-[0_0_12px_rgba(255,255,255,0.1)] ring-1 ring-white/20'
                  : 'bg-white/5 hover:bg-white/10'
                }
                ${!onSegmentClick && !segment.onClick ? 'opacity-60 cursor-default' : ''}
              `}
              aria-pressed={activeSegment === segment.id}
              aria-label={`${segment.label}: ${formatValue(segment.value)} (${((segment.value / total) * 100).toFixed(1)}%)`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-white font-medium">{segment.label}</span>
              <span className="text-slate-400">{((segment.value / total) * 100).toFixed(1)}%</span>
            </button>
          ))}
        </div>
      )}

      {activeSegment && (
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center text-xs text-slate-300" role="status" aria-live="polite">
          Selected: <span className="font-bold text-white">
            {segments.find(s => s.id === activeSegment)?.label}
          </span>{' '}
          <button
            onClick={() => setActiveSegment(null)}
            className="ml-2 text-cyan-400 hover:underline font-mono"
            aria-label="Clear selection"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

export default SeverityDonut;