import React, { useState, useRef, useEffect } from 'react';
import { IconGrip, IconArrowUp, IconArrowDown, IconCheck } from '../common/Icons';

interface MetricCardData {
  id: string;
  label: string;
  value: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  color?: string;
  status?: 'optimal' | 'warning' | 'critical';
}

interface RearrangeableMetricCardProps {
  data: MetricCardData;
  index: number;
  onMove: (fromIndex: number, toIndex: number) => void;
  onAction?: () => void;
  actionLabel?: string;
  isDragging?: boolean;
}

export const RearrangeableMetricCard: React.FC<RearrangeableMetricCardProps> = ({
  data,
  index,
  onMove,
  onAction,
  actionLabel,
  isDragging,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDraggingLocal, setIsDraggingLocal] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    setIsDraggingLocal(isDragging ?? false);
  }, [isDragging]);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    setIsDraggingLocal(true);
    cardRef.current?.classList.add('dragging');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const targetRect = cardRef.current?.getBoundingClientRect();
    if (targetRect) {
      const midY = targetRect.top + targetRect.height / 2;
      if (e.clientY < midY) {
        cardRef.current?.classList.add('drag-over-top');
        cardRef.current?.classList.remove('drag-over-bottom');
      } else {
        cardRef.current?.classList.add('drag-over-bottom');
        cardRef.current?.classList.remove('drag-over-top');
      }
    }
  };

  const handleDragLeave = () => {
    cardRef.current?.classList.remove('drag-over-top', 'drag-over-bottom');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    const targetRect = cardRef.current?.getBoundingClientRect();
    let toIndex = index;
    
    if (targetRect) {
      const midY = targetRect.top + targetRect.height / 2;
      toIndex = e.clientY < midY ? index : index + 1;
    }
    
    if (fromIndex !== toIndex) {
      onMove(fromIndex, toIndex);
    }
    
    cardRef.current?.classList.remove('dragging', 'drag-over-top', 'drag-over-bottom');
    setIsDraggingLocal(false);
  };

  const handleDragEnd = () => {
    cardRef.current?.classList.remove('dragging', 'drag-over-top', 'drag-over-bottom');
    setIsDraggingLocal(false);
  };

  const statusColors = {
    optimal: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    critical: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
  };

  const statusIcons = {
    optimal: <IconCheck size={11} state="success" />,
    warning: <IconArrowUp size={11} className="text-amber-400" />,
    critical: <IconArrowDown size={11} className="text-rose-400" />,
  };

  return (
    <div
      ref={cardRef}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
      className={`
        relative rounded-2xl p-4 transition-all cursor-grab
        bg-[#07090e]/90 border-2
        ${statusColors[data.status || 'optimal']}
        ${isDraggingLocal ? 'opacity-50 rotate-1 scale-105 shadow-[0_20px_40px_rgba(0,242,254,0.15)] z-50' : ''}
        ${isHovered && !isDraggingLocal ? 'shadow-[0_12px_24px_rgba(0,0,0,0.4)] border-opacity-50' : ''}
        drag-over-top border-t-4 border-cyan-500
        drag-over-bottom border-b-4 border-cyan-500
        focus-within:ring-2 focus-within:ring-cyan-500/50 focus-within:ring-offset-2 focus-within:ring-offset-[#05070a]
      `}
      style={{
        transform: isReducedMotion ? undefined : (isDraggingLocal ? 'rotate(1deg)' : 'none'),
        transition: isReducedMotion ? 'none' : 'transform 150ms ease, box-shadow 200ms ease, border-color 200ms ease',
      }}
      role="listitem"
      aria-grabbed={isDraggingLocal}
      aria-label={`${data.label}, ${data.value}. Drag to reorder.`}
    >
      {/* Drag Handle */}
      <button
        ref={dragHandleRef}
        className="absolute -top-2 -right-2 w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-slate-500 hover:text-cyan-400 hover:bg-white/10 hover:border-cyan-500/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Drag to reorder"
        onMouseDown={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <IconGrip size={16} />
      </button>

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {data.icon && <span className="text-xl">{data.icon}</span>}
            <span className="type-label text-slate-400 text-[10px] block uppercase tracking-wider">{data.label}</span>
            {data.status && (
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusColors[data.status]}`}>
                {statusIcons[data.status]}
                {data.status.toUpperCase()}
              </span>
            )}
          </div>
          <span className="type-financial text-xl md:text-2xl font-bold text-white block truncate">{data.value}</span>
          {data.trend && (
            <div className="flex items-center gap-1 mt-1">
              <span className={`text-xs font-mono ${data.trendDirection === 'up' ? 'text-sky-400' : data.trendDirection === 'down' ? 'text-rose-400' : 'text-slate-400'}`}>
                {data.trendDirection === 'up' && <IconArrowUp size={10} />}
                {data.trendDirection === 'down' && <IconArrowDown size={10} />}
                {data.trend}
              </span>
            </div>
          )}
        </div>

        {onAction && actionLabel && (
          <button
            onClick={onAction}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold uppercase transition-all active:scale-95"
            aria-label={actionLabel}
          >
            {actionLabel}
          </button>
        )}
      </div>

      {/* Drop indicator */}
      <div className="absolute left-0 right-0 h-1 bg-cyan-500/50 opacity-0 pointer-events-none transition-opacity" />
    </div>
  );
};

export default RearrangeableMetricCard;