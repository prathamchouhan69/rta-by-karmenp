import React, { useState, useMemo, useRef, useEffect } from 'react';
import { cx } from '../format';
import { Panel, Chip } from '../ui';
import { useWorkspace } from '../workspace';

interface SeveritySegment {
  id: string;
  label: string;
  value: number;
  color: string;
  tone: 'cyan' | 'violet' | 'amber' | 'rose' | 'sage' | 'neutral';
  description?: string;
}

interface SeverityDonutProps {
  segments: SeveritySegment[];
  timeFilters?: { label: string; value: string }[];
  initialTimeFilter?: string;
  onSegmentClick?: (segment: SeveritySegment, filteredItems: any[]) => void;
  onTimeFilterChange?: (filter: string) => void;
  fallbackText?: string;
  title?: string;
  className?: string;
}

export const SeverityDonut: React.FC<SeverityDonutProps> = ({
  segments,
  timeFilters,
  initialTimeFilter,
  onSegmentClick,
  onTimeFilterChange,
  fallbackText = 'No severity data available',
  title = 'Severity Breakdown',
  className,
}) => {
  const { snapshot } = useWorkspace();
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState(initialTimeFilter || timeFilters?.[0]?.value || '');
  const donutRef = useRef<SVGSVGElement>(null);

  const total = useMemo(() => segments.reduce((sum, s) => sum + s.value, 0), [segments]);

  const handleSegmentClick = (segment: SeveritySegment) => {
    if (selectedSegment === segment.id) {
      setSelectedSegment(null);
      onSegmentClick?.(segment, []);
    } else {
      setSelectedSegment(segment.id);
      onSegmentClick?.(segment, [segment]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, segment: SeveritySegment) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSegmentClick(segment);
    }
  };

  const filteredItems = useMemo(() => {
    if (!selectedSegment) return [];
    const selected = segments.find(s => s.id === selectedSegment);
    return selected ? [selected] : [];
  }, [selectedSegment, segments]);

  return (
    <Panel className={cx('relative', className)}>
      {segments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="text-[var(--k-t3)] k-mono text-[11px]">{fallbackText}</div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="k-title text-[16px]">{title}</h3>
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
            <svg ref={donutRef} viewBox="0 0 200 200" className="w-full h-full" role="img" aria-label={`Severity donut chart showing ${segments.map(s => `${s.label} ${s.value}`).join(', ')}`}>
              <defs>
                <linearGradient id="severity-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--k-rose)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="var(--k-amber)" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              <circle
                cx="100"
                cy="100"
                r="78"
                fill="none"
                stroke="var(--k-line)"
                strokeWidth="16"
                strokeDasharray="0.5 6"
                strokeLinecap="round"
              />
              {segments.map((segment, index) => {
                const percentage = total > 0 ? segment.value / total : 0;
                const circumference = 2 * Math.PI * 78;
                const dashLength = circumference * percentage;
                const startAngle = -90 + segments.slice(0, index).reduce((acc, s) => acc + (total > 0 ? s.value / total : 0) * 360, 0);

                return (
                  <g key={segment.id}>
                    <circle
                      cx="100"
                      cy="100"
                      r="78"
                      fill="none"
                      stroke={segment.color}
                      strokeWidth={16}
                      strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                      strokeLinecap="round"
                      transform={`rotate(${startAngle} 100 100)`}
                      style={{
                        filter: selectedSegment === segment.id ? 'drop-shadow(0 0 10px currentColor)' : 'none',
                        transition: 'filter 200ms ease, stroke-dashoffset 400ms ease',
                        opacity: selectedSegment && selectedSegment !== segment.id ? 0.35 : 1,
                      }}
                    />
                  </g>
                );
              })}
            </svg>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="k-number-hero text-[28px] text-[var(--k-t1)] k-mono">{total > 0 ? total : '—'}</div>
                <div className="k-label mt-1">{selectedSegment ? segments.find(s => s.id === selectedSegment)?.label : 'Total'}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-4" role="list" aria-label="Severity segments">
            {segments.map(segment => (
              <button
                key={segment.id}
                onClick={() => handleSegmentClick(segment)}
                onKeyDown={e => handleKeyDown(e, segment)}
                className={cx(
                  'flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-all k-mono text-[10px] font-semibold',
                  'border',
                  selectedSegment === segment.id
                    ? `bg-[${segment.color}] text-white border-[${segment.color}] shadow-[0_0_12px_${segment.color}]`
                    : 'bg-[var(--k-inset)] text-[var(--k-t2)] border-[var(--k-line)] hover:border-[var(--k-line-strong)] hover:text-[var(--k-t1)]'
                )}
                role="listitem"
                aria-pressed={selectedSegment === segment.id}
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

          <div className="mt-4 grid grid-cols-2 gap-2 text-center" role="list" aria-label="Severity counts">
            {segments.map(segment => (
              <div
                key={segment.id}
                className={cx(
                  'rounded-xl p-3 transition-all',
                  selectedSegment === segment.id
                    ? `bg-[${segment.color}]/15 border border-[${segment.color}]`
                    : 'bg-[var(--k-inset)]/50 hover:bg-[var(--k-inset)]'
                )}
                role="listitem"
              >
                <div className="k-number-hero text-[20px] text-[var(--k-t1)] k-mono">{segment.value}</div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: segment.color }} />
                  <span className="k-label text-[9px] uppercase tracking-[0.1em]">{segment.label}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
};

export default SeverityDonut;