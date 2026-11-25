import React from 'react';
import { cx } from '../../app/format';
import { useWorkspace } from '../../app/workspace';
import { IconFlux, IconLightbulb, IconAutoAwesome } from '../../components/common/Icons';

interface ReferenceBadgeProps {
  reference: {
    num: number;
    name: string;
    category: string;
    business: string;
    motion: string;
    visual: string;
    interaction: string;
    states: string;
    why_unique: string;
  };
  chartId?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const ReferenceBadge: React.FC<ReferenceBadgeProps> = ({
  reference,
  chartId,
  size = 'md',
  onClick,
}) => {
  const SIZE_CLASSES = {
    sm: 'w-6 h-6 text-[10px] px-2 py-1',
    md: 'w-8 h-8 text-[11px] px-2.5 py-1.5',
    lg: 'w-10 h-10 text-[12px] px-3 py-2',
  };

  const handleClick = () => {
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      className={cx(
        'relative inline-flex items-center justify-center rounded-xl border transition-all duration-200',
        'bg-[var(--k-violet-soft)] border-[var(--k-violet)] text-[var(--k-violet)]',
        'hover:bg-[var(--k-violet)] hover:text-[var(--k-bg)] hover:border-[var(--k-violet)]',
        'focus-visible:outline-2 focus-visible:outline-[var(--k-cyan)] focus-visible:outline-offset-2',
        'group',
        SIZE_CLASSES[size]
      )}
      aria-label={`Reference ${reference.num}: ${reference.name}`}
      title={`Ref ${reference.num}: ${reference.name}`}
    >
      <span className="font-bold k-mono">{reference.num}</span>
      <span className="sr-only">{reference.name} — {reference.why_unique}</span>
    </button>
  );
};

interface ConnectedIntelligenceNodeProps {
  referenceNum: number;
  className?: string;
  size?: 'compact' | 'full';
  onAction?: (action: string) => void;
}

export const ConnectedIntelligenceNode: React.FC<ConnectedIntelligenceNodeProps> = ({
  referenceNum,
  className,
  size = 'full',
  onAction,
}) => {
  const { snapshot } = useWorkspace();
  const reference = snapshot.references?.find(r => r.num === referenceNum);

  if (!reference) {
    return null;
  }

  const handleAction = (action: string) => {
    onAction?.(action);
  };

  if (size === 'compact') {
    return (
      <div className={cx('flex items-center gap-2 p-3 rounded-xl bg-[var(--k-inset)] border border-[var(--k-line)]', className)}>
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-[var(--k-violet-soft)] border border-[var(--k-violet)] flex items-center justify-center">
          <span className="k-mono text-[11px] font-bold text-[var(--k-violet)]">{reference.num}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="k-title text-[12px] truncate text-[var(--k-t1)]">{reference.name}</p>
          <p className="k-label text-[9px] uppercase tracking-[0.1em] text-[var(--k-t3)]">{reference.category}</p>
        </div>
        <button
          onClick={() => handleAction('view')}
          className="p-1.5 rounded-lg bg-[var(--k-inset)] border border-[var(--k-line)] hover:border-[var(--k-cyan)] text-[var(--k-t3)] hover:text-[var(--k-cyan)]"
          aria-label={`View ${reference.name} details`}
        >
          <IconFlux size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className={cx('rounded-2xl bg-[var(--k-panel)] border border-[var(--k-line)] p-5 shadow-md', className)}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--k-violet-soft)] border border-[var(--k-violet)] flex items-center justify-center flex-shrink-0">
            <span className="k-mono text-[14px] font-bold text-[var(--k-violet)]">{reference.num}</span>
          </div>
          <div>
            <h3 className="k-title text-[15px] text-[var(--k-t1)]">{reference.name}</h3>
            <p className="k-label text-[9px] uppercase tracking-[0.1em] text-[var(--k-t3)]">{reference.category}</p>
          </div>
        </div>
        <button
          onClick={() => handleAction('close')}
          className="p-1.5 rounded-lg bg-[var(--k-inset)] border border-[var(--k-line)] hover:border-[var(--k-cyan)] text-[var(--k-t3)] hover:text-[var(--k-cyan)]"
          aria-label="Close reference panel"
        >
          <IconFlux size={14} />
        </button>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2">
          <IconLightbulb size={14} className="text-[var(--k-amber)]" />
          <span className="text-[12px] text-[var(--k-t2)]"><strong>Business Meaning:</strong> {reference.business}</span>
        </div>
        <div className="flex items-center gap-2">
          <IconAutoAwesome size={14} className="text-[var(--k-cyan)]" />
          <span className="text-[12px] text-[var(--k-t2)]"><strong>Workflow:</strong> {reference.workflow}</span>
        </div>
        <div className="flex items-center gap-2">
          <IconFlux size={14} className="text-[var(--k-violet)]" />
          <span className="text-[12px] text-[var(--k-t2)]"><strong>Screen:</strong> {reference.screen}</span>
        </div>
      </div>

      <div className="space-y-2 mb-4 p-3 rounded-xl bg-[var(--k-inset)] border border-[var(--k-line)]">
        <p className="k-label text-[9px] uppercase tracking-[0.1em] text-[var(--k-t3)] mb-2">Interaction & Visual</p>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="text-[var(--k-t3)]">Motion:</span>
            <span className="ml-1 text-[var(--k-t2)]">{reference.motion}</span>
          </div>
          <div>
            <span className="text-[var(--k-t3)]">Visual:</span>
            <span className="ml-1 text-[var(--k-t2)]">{reference.visual}</span>
          </div>
          <div>
            <span className="text-[var(--k-t3)]">Interaction:</span>
            <span className="ml-1 text-[var(--k-t2)]">{reference.interaction}</span>
          </div>
          <div>
            <span className="text-[var(--k-t3)]">States:</span>
            <span className="ml-1 text-[var(--k-t2)]">{reference.states}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-[var(--k-line)]">
        <button
          onClick={() => handleAction('view-detail')}
          className="flex-1 py-2 rounded-xl bg-[var(--k-violet)] text-[var(--k-bg)] font-bold text-[11px] hover:brightness-110 transition-all"
        >
          View Reference Detail
        </button>
        <button
          onClick={() => handleAction('execute-action')}
          className="flex-1 py-2 rounded-xl bg-[var(--k-cyan)] text-[var(--k-bg)] font-bold text-[11px] hover:brightness-110 transition-all"
        >
          {reference.user_action}
        </button>
      </div>
    </div>
  );
};

export default ConnectedIntelligenceNode;