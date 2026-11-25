import React, { useState, useMemo, useRef, useEffect } from 'react';
import { cx, inrCompact } from '../format';
import { Panel, Chip } from '../ui';
import { useWorkspace } from '../workspace';

interface DottedDonutProps {
  data: { label: string; value: number; color: string; tone: 'cyan' | 'violet' | 'amber' | 'rose' | 'sage' | 'neutral' }[];
  timeFilters?: { label: string; value: string }[];
  initialTimeFilter?: string;
  onSegmentClick?: (segment: { label: string; value: number }, filteredData: any[]) => void;
  onTimeFilterChange?: (filter: string) => void;
  fallbackText?: string;
  className?: string;
}

export const DottedDonut: React.FC<DottedDonutProps> = ({
  data,
  timeFilters,
  initialTimeFilter,
  onSegmentClick,
  onTimeFilterChange,
  fallbackText = 'No breakdown data available',
  className,
}) => {
  const { snapshot } = useWorkspace();
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState(initialTimeFilter || timeFilters?.[0]?.value || '');
  const donutRef = useRef<SVGSVGElement>(null);

  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);
  const angleOffset = -90;

  const handleSegmentClick = (index: number) => {
    const segment = data[index];
    if (selectedSegment === segment.label) {
      setSelectedSegment(null);
      onSegmentClick?.(segment, []);
    } else {
      setSelectedSegment(segment.label);
      onSegmentClick?.(segment, [segment]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSegmentClick(index);
    }
  };

  return (
    <Panel className={cx('relative', className)}>
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="text-[var(--k-t3)] k-mono text-[11px]">{fallbackText}</div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="k-title text-[16px]">Breakdown</h3>
            {timeFilters && timeFilters.length > 1 && (
              <select
                value={timeFilter}
                onChange={e => { setTimeFilter(e.target.value); onTimeFilterChange?.(e.target.value); }}
                className="k-input k-mono text-[11px] px-3 py-1.5 rounded-xl"
                aria-label="Time range filter"
              >
                {timeFilters.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            )}
          </div>

          <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
            <svg ref={donutRef} viewBox="0 0 200 200" className="w-full h-full" role="img" aria-label={`Dotted donut chart showing ${data.map(d => `${d.label} ${d.value}`).join(', ')}`}>
              <defs>
                <linearGradient id="donut-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--k-cyan)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="var(--k-violet)" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              <circle
                cx="100"
                cy="100"
                r="78"
                fill="none"
                stroke="var(--k-line)"
                strokeWidth="12"
                strokeDasharray="0.5 6"
                strokeLinecap="round"
              />
              {data.map((segment, index) => {
                const percentage = total > 0 ? segment.value / total : 0;
                const circumference = 2 * Math.PI * 78;
                const dashLength = circumference * percentage;
                const startAngle = angleOffset + data.slice(0, index).reduce((acc, d) => acc + (total > 0 ? d.value / total : 0) * 360, 0);

                return (
                  <g key={segment.label}>
                    <circle
                      cx="100"
                      cy="100"
                      r="78"
                      fill="none"
                      stroke={segment.color}
                      strokeWidth={12}
                      strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                      strokeLinecap="round"
                      transform={`rotate(${startAngle} 100 100)`}
                      style={{
                        filter: selectedSegment === segment.label ? 'drop-shadow(0 0 8px currentColor)' : 'none',
                        transition: 'filter 200ms ease',
                        opacity: selectedSegment && selectedSegment !== segment.label ? 0.4 : 1,
                      }}
                    />
                  </g>
                );
              })}
            </svg>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="k-number-hero text-[28px] text-[var(--k-t1)] k-mono">{total > 0 ? total : '—'}</div>
                <div className="k-label mt-1">{selectedSegment || 'Total'}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-4" role="list" aria-label="Breakdown segments">
            {data.map((segment, index) => (
              <button
                key={segment.label}
                onClick={() => handleSegmentClick(index)}
                onKeyDown={e => handleKeyDown(e, index)}
                className={cx(
                  'flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-all k-mono text-[10px] font-semibold',
                  'border',
                  selectedSegment === segment.label
                    ? `bg-[${segment.color}] text-white border-[${segment.color}] shadow-[0_0_12px_${segment.color}]`
                    : 'bg-[var(--k-inset)] text-[var(--k-t2)] border-[var(--k-line)] hover:border-[var(--k-line-strong)] hover:text-[var(--k-t1)]'
                )}
                role="listitem"
                aria-pressed={selectedSegment === segment.label}
                aria-label={`${segment.label}: ${segment.value} (${total > 0 ? Math.round((segment.value / total) * 100) : 0}%)`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                {segment.label}
              </button>
            ))}
          </div>

          {selectedSegment && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setSelectedSegment(null)}
                className="px-3 py-1.5 rounded-xl bg-[var(--k-cyan)] text-[var(--k-bg)] font-semibold text-[11px] hover:brightness-110 transition-all"
              >
                Clear filter
              </button>
            </div>
          )}
        </>
      )}
    </Panel>
  );
};

export default DottedDonut;