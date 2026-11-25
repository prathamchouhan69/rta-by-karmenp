import React, { useState, useRef, useEffect } from 'react';
import { cx } from '../format';
import { Panel, Chip } from '../ui';
import { IconGrip, IconArrowUp, IconArrowDown, IconMoreVert } from '../../components/common/Icons';

interface MetricCardData {
  id: string;
  label: string;
  value: string;
  delta?: string;
  deltaDirection?: 'up' | 'down' | 'flat';
  tone?: 'cyan' | 'violet' | 'amber' | 'rose' | 'sage' | 'neutral';
  spark?: number[];
  icon?: React.ReactNode;
  unit?: string;
  trend?: string;
}

interface RearrangeableMetricsProps {
  metrics: MetricCardData[];
  storageKey?: string;
  onReorder?: (metrics: MetricCardData[]) => void;
  className?: string;
  columns?: { base: number; sm: number; lg: number; xl: number };
}

export const RearrangeableMetrics: React.FC<RearrangeableMetricsProps> = ({
  metrics: initialMetrics,
  storageKey = 'rearrangeable-metrics',
  onReorder,
  className,
  columns = { base: 1, sm: 2, lg: 3, xl: 4 },
}) => {
  const [metrics, setMetrics] = useState<MetricCardData[]>(() => {
    if (typeof window !== 'undefined' && storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length === initialMetrics.length) {
            return parsed;
          }
        }
      } catch {}
    }
    return initialMetrics;
  });

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isKeyboardMoving, setIsKeyboardMoving] = useState(false);
  const metricsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(metrics));
      } catch {}
    }
    onReorder?.(metrics);
  }, [metrics, storageKey, onReorder]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== draggingId) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    if (sourceId && sourceId !== targetId) {
      setMetrics(current => {
        const sourceIndex = current.findIndex(m => m.id === sourceId);
        const targetIndex = current.findIndex(m => m.id === targetId);
        if (sourceIndex === -1 || targetIndex === -1) return current;
        
        const newMetrics = [...current];
        const [removed] = newMetrics.splice(sourceIndex, 1);
        newMetrics.splice(targetIndex, 0, removed);
        return newMetrics;
      });
    }
    setDraggingId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverId(null);
  };

  const moveMetric = (id: string, direction: 'up' | 'down') => {
    setIsKeyboardMoving(true);
    setMetrics(current => {
      const index = current.findIndex(m => m.id === id);
      if (index === -1) return current;
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= current.length) return current;
      
      const newMetrics = [...current];
      [newMetrics[index], newMetrics[newIndex]] = [newMetrics[newIndex], newMetrics[index]];
      return newMetrics;
    });
    setTimeout(() => setIsKeyboardMoving(false), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'ArrowUp' && e.ctrlKey) {
      e.preventDefault();
      moveMetric(id, 'up');
    } else if (e.key === 'ArrowDown' && e.ctrlKey) {
      e.preventDefault();
      moveMetric(id, 'down');
    }
  };

  const TONE_VAR: Record<string, string> = {
    cyan: 'var(--k-cyan)',
    violet: 'var(--k-violet)',
    amber: 'var(--k-amber)',
    rose: 'var(--k-rose)',
    sage: 'var(--k-positive)',
    neutral: 'var(--k-t2)',
  };

  const TONE_SOFT: Record<string, string> = {
    cyan: 'var(--k-cyan-soft)',
    violet: 'var(--k-violet-soft)',
    amber: 'var(--k-amber-soft)',
    rose: 'var(--k-rose-soft)',
    sage: 'var(--k-positive-soft)',
    neutral: 'var(--k-inset)',
  };

  return (
    <div className={cx('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <span className="k-label text-[10px] uppercase tracking-[0.14em] text-[var(--k-t3)]">
          Drag to reorder · Ctrl+↑/↓ to move
        </span>
        <Chip tone="cyan" dot>
          Custom Layout
        </Chip>
      </div>

      <div
        className={cx(
          'grid gap-4 transition-all duration-300',
          `grid-cols-${columns.base} sm:grid-cols-${columns.sm} lg:grid-cols-${columns.lg} xl:grid-cols-${columns.xl}`
        )}
        role="list"
        aria-label="Rearrangeable metrics"
      >
        {metrics.map((metric, index) => (
          <div
            key={metric.id}
            ref={el => { metricsRef.current[index] = el; }}
            draggable={!isKeyboardMoving}
            onDragStart={e => handleDragStart(e, metric.id)}
            onDragOver={e => handleDragOver(e, metric.id)}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, metric.id)}
            onDragEnd={handleDragEnd}
            onKeyDown={e => handleKeyDown(e, metric.id)}
            tabIndex={0}
            role="listitem"
            aria-grabbed={draggingId === metric.id}
            aria-roledescription="draggable metric"
            className={cx(
              'k-reveal relative group',
              draggingId === metric.id && 'opacity-50 rotate-1 scale-105 z-10 shadow-[0_20px_40px_rgba(0,0,0,0.3)]',
              dragOverId === metric.id && 'ring-2 ring-[var(--k-cyan)] ring-offset-2 ring-offset-[var(--k-bg)]',
              isKeyboardMoving && 'transition-transform duration-200'
            )}
          >
            {/* Drag handle */}
            <div
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 dragging:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
              onMouseDown={e => e.stopPropagation()}
            >
              <IconGrip size={14} className="text-[var(--k-t4)] p-1" />
            </div>

            {/* Keyboard move controls */}
            <div className="absolute top-2 left-2 opacity-0 group-focus-within:opacity-100 transition-opacity flex flex-col gap-1">
              <button
                onClick={e => { e.stopPropagation(); moveMetric(metric.id, 'up'); }}
                className="p-1 rounded bg-[var(--k-inset)] border border-[var(--k-line)] hover:border-[var(--k-cyan)] text-[var(--k-t3)] hover:text-[var(--k-cyan)]"
                aria-label="Move up"
              >
                <IconArrowUp size={10} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); moveMetric(metric.id, 'down'); }}
                className="p-1 rounded bg-[var(--k-inset)] border border-[var(--k-line)] hover:border-[var(--k-cyan)] text-[var(--k-t3)] hover:text-[var(--k-cyan)]"
                aria-label="Move down"
              >
                <IconArrowDown size={10} />
              </button>
            </div>

            <Panel className="k-reveal p-5 h-full" style={{ transitionDelay: `${index * 30}ms` }}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  {metric.icon && (
                    <div className="w-10 h-10 rounded-xl bg-[var(--k-inset)] border border-[var(--k-line)] flex items-center justify-center flex-shrink-0" style={{ color: TONE_VAR[metric.tone || 'neutral'] }}>
                      {metric.icon}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="k-title text-[14px] truncate text-[var(--k-t1)]">{metric.label}</h3>
                    {metric.unit && <span className="k-label text-[9px] uppercase tracking-[0.12em]">{metric.unit}</span>}
                  </div>
                </div>
                <button className="p-1.5 rounded-lg bg-[var(--k-inset)] border border-[var(--k-line)] hover:border-[var(--k-cyan)] text-[var(--k-t3)] hover:text-[var(--k-cyan)] opacity-0 group-hover:opacity-100 transition-opacity" aria-label="More options">
                  <IconMoreVert size={14} />
                </button>
              </div>

              <div className="flex items-baseline justify-between gap-4 mb-3">
                <span className="k-number-hero text-[30px] text-[var(--k-t1)] k-mono">{metric.value}</span>
                {metric.delta && (
                  <span className={cx(
                    'flex items-center gap-1 k-label font-semibold',
                    metric.deltaDirection === 'up' ? 'text-[var(--k-positive)]' :
                    metric.deltaDirection === 'down' ? 'text-[var(--k-rose)]' : 'text-[var(--k-t3)]'
                  )}>
                    {metric.deltaDirection === 'up' && <span>↑</span>}
                    {metric.deltaDirection === 'down' && <span>↓</span>}
                    {metric.delta}
                  </span>
                )}
              </div>

              {metric.trend && (
                <span className="k-label text-[9px] text-[var(--k-t3)]">{metric.trend}</span>
              )}

              {metric.spark && metric.spark.length > 1 && (
                <div className="mt-4 h-16 relative">
                  <svg width="100%" height="100%" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id={`spark-${metric.id}`} x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={TONE_VAR[metric.tone || 'neutral']} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={TONE_VAR[metric.tone || 'neutral']} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d={metric.spark.map((v, i) => {
                        const x = (i / (metric.spark!.length - 1)) * 100;
                        const y = 30 - (v / Math.max(...metric.spark!)) * 25;
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke={TONE_VAR[metric.tone || 'neutral']}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {metric.spark.length > 0 && (
                      <path
                        d={metric.spark.map((v, i) => {
                          const x = (i / (metric.spark!.length - 1)) * 100;
                          const y = 30 - (v / Math.max(...metric.spark!)) * 25;
                          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                        }).join(' ') + ' L 100 30 L 0 30 Z'}
                        fill={`url(#spark-${metric.id})`}
                      />
                    )}
                    <circle
                      cx={(metric.spark!.length - 1) / (metric.spark!.length - 1) * 100}
                      cy={30 - (metric.spark![metric.spark!.length - 1] / Math.max(...metric.spark!)) * 25}
                      r={3}
                      fill={TONE_VAR[metric.tone || 'neutral']}
                    />
                  </svg>
                </div>
              )}
            </Panel>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RearrangeableMetrics;