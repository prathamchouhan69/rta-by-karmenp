import React from 'react';

interface CompactStatusDotProps {
  status: 'optimal' | 'warning' | 'critical' | 'idle' | 'active' | 'pending' | 'success' | 'error';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  label?: string | undefined;
  showPulse?: boolean;
  className?: string;
  tooltip?: string | undefined;
}

const SIZE_CLASSES = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

const STATUS_STYLES = {
  optimal: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]',
  warning: 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
  critical: 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,113,0.6)]',
  idle: 'bg-slate-500',
  active: 'bg-cyan-400 shadow-[0_0_8px_rgba(0,242,254,0.6)]',
  pending: 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]',
  success: 'bg-sky-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]',
  error: 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.6)]',
};

const STATUS_LABELS: Record<string, string> = {
  optimal: 'Optimal',
  warning: 'Warning',
  critical: 'Critical',
  idle: 'Idle',
  active: 'Active',
  pending: 'Pending',
  success: 'Success',
  error: 'Error',
};

export const CompactStatusDot: React.FC<CompactStatusDotProps> = ({
  status,
  size = 'sm',
  label,
  showPulse = false,
  className = '',
  tooltip,
}) => {
  const isInteractive = ['active', 'pending', 'optimal'].includes(status);

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${className}`}
      role="status"
      aria-label={tooltip || label || STATUS_LABELS[status]}
      title={tooltip}
    >
      <div className="relative flex items-center justify-center">
        <span
          className={`
            rounded-full ${SIZE_CLASSES[size]} ${STATUS_STYLES[status]}
            transition-all duration-200
            ${showPulse && isInteractive ? 'animate-ping' : ''}
          `}
          aria-hidden="true"
        />
        {showPulse && isInteractive && (
          <span
            className={`
              absolute inset-0 rounded-full ${STATUS_STYLES[status].replace('bg-', 'bg-').replace('shadow-', 'shadow-')} opacity-75 animate-ping
            `}
            aria-hidden="true"
          />
        )}
      </div>
      {label && (
        <span className="text-xs font-medium text-slate-300 whitespace-nowrap">
          {label}
        </span>
      )}
    </div>
  );
};

export const CompactStatusDots: React.FC<{
  items: { status: CompactStatusDotProps['status']; label?: string; tooltip?: string }[];
  size?: CompactStatusDotProps['size'];
  className?: string;
}> = ({ items, size = 'sm', className = '' }) => (
  <div className={`flex items-center gap-2 flex-wrap ${className}`} role="group" aria-label="Status indicators">
    {items.map((item, index) => (
      <CompactStatusDot
        key={index}
        status={item.status}
        size={size}
        label={item.label}
        tooltip={item.tooltip}
        showPulse={['active', 'pending'].includes(item.status)}
      />
    ))}
  </div>
);

export default CompactStatusDot;