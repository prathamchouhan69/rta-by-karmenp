import React from 'react';
import { cx } from '../../app/format';

interface StatusDotProps {
  status: 'optimal' | 'warning' | 'critical' | 'idle' | 'active' | 'pending' | 'success' | 'error' | 'syncing' | 'offline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  label?: string;
  showPulse?: boolean;
  className?: string;
  tooltip?: string;
  variant?: 'dot' | 'pill' | 'ring';
}

const SIZE_CLASSES = {
  xs: { dot: 'w-1.5 h-1.5', pill: 'h-1.5 px-2', ring: 'w-4 h-4' },
  sm: { dot: 'w-2 h-2', pill: 'h-2 px-2.5', ring: 'w-5 h-5' },
  md: { dot: 'w-3 h-3', pill: 'h-3 px-3', ring: 'w-7 h-7' },
  lg: { dot: 'w-4 h-4', pill: 'h-4 px-4', ring: 'w-9 h-9' },
};

const STATUS_CONFIG: Record<StatusDotProps['status'], { color: string; glow: string; label: string }> = {
  optimal: { color: 'var(--k-cyan)', glow: 'rgba(34, 211, 238, 0.6)', label: 'Optimal' },
  warning: { color: 'var(--k-amber)', glow: 'rgba(251, 191, 36, 0.6)', label: 'Warning' },
  critical: { color: 'var(--k-rose)', glow: 'rgba(251, 113, 133, 0.6)', label: 'Critical' },
  idle: { color: 'var(--k-t3)', glow: 'transparent', label: 'Idle' },
  active: { color: 'var(--k-cyan)', glow: 'rgba(34, 211, 238, 0.6)', label: 'Active' },
  pending: { color: 'var(--k-violet)', glow: 'rgba(129, 140, 248, 0.6)', label: 'Pending' },
  success: { color: 'var(--k-cyan)', glow: 'rgba(34, 211, 238, 0.6)', label: 'Success' },
  error: { color: 'var(--k-rose)', glow: 'rgba(251, 113, 133, 0.6)', label: 'Error' },
  syncing: { color: 'var(--k-violet)', glow: 'rgba(129, 140, 248, 0.6)', label: 'Syncing' },
  offline: { color: 'var(--k-t3)', glow: 'transparent', label: 'Offline' },
};

export const StatusDot: React.FC<StatusDotProps> = ({
  status,
  size = 'sm',
  label,
  showPulse = false,
  className = '',
  tooltip,
  variant = 'dot',
}) => {
  const config = STATUS_CONFIG[status];
  const isInteractive = ['active', 'pending', 'optimal', 'syncing'].includes(status);
  const shouldPulse = showPulse && isInteractive;

  const dotStyle = {
    backgroundColor: config.color,
    boxShadow: `0 0 8px ${config.glow}`,
    transition: 'all 200ms cubic-bezier(0.2, 1, 0.3, 1)',
  };

  const pillStyle = {
    backgroundColor: `${config.color}15`,
    borderColor: `${config.color}40`,
    color: config.color,
  };

  return (
    <div
      className={cx('inline-flex items-center gap-1.5', className)}
      role="status"
      aria-label={tooltip || label || config.label}
      title={tooltip}
    >
      <div className="relative flex items-center justify-center">
        {variant === 'dot' && (
          <span
            className={cx(
              'rounded-full transition-all duration-200',
              SIZE_CLASSES[size].dot,
              shouldPulse && 'animate-ping'
            )}
            style={dotStyle}
            aria-hidden="true"
          />
        )}
        {variant === 'pill' && (
          <span
            className={cx(
              'rounded-full px-2.5 text-[10px] font-semibold k-mono transition-all duration-200',
              SIZE_CLASSES[size].pill,
              shouldPulse && 'animate-pulse'
            )}
            style={pillStyle}
          >
            {label || STATUS_CONFIG[status].label.toUpperCase()}
          </span>
        )}
        {variant === 'ring' && (
          <div className={cx('relative', SIZE_CLASSES[size].ring, 'flex-shrink-0')}>
            <svg viewBox="0 0 32 32" className="w-full h-full transform -rotate-90">
              <circle
                cx="16"
                cy="16"
                r="14"
                fill="none"
                stroke="var(--k-line)"
                strokeWidth="3"
              />
              <circle
                cx="16"
                cy="16"
                r="14"
                fill="none"
                stroke={config.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${status === 'syncing' ? '20 20' : '88 0'}`}
                strokeDashoffset={status === 'syncing' ? '0' : '0'}
                className={cx(
                  'transition-all duration-500',
                  status === 'syncing' && 'animate-spin'
                )}
                style={{
                  filter: `drop-shadow(0 0 6px ${config.glow})`,
                }}
              />
            </svg>
            {shouldPulse && (
              <div
                className="absolute inset-0 rounded-full animate-ping opacity-75"
                style={{ backgroundColor: config.color, borderRadius: '999px' }}
                aria-hidden="true"
              />
            )}
          </div>
        )}
      </div>
      {label && (
        <span className="text-xs font-medium text-[var(--k-t2)] whitespace-nowrap">
          {label}
        </span>
      )}
    </div>
  );
};

export const StatusDots: React.FC<{
  items: { status: StatusDotProps['status']; label?: string; tooltip?: string }[];
  size?: StatusDotProps['size'];
  variant?: StatusDotProps['variant'];
  className?: string;
}> = ({ items, size = 'sm', variant = 'dot', className = '' }) => (
  <div className={cx('flex items-center gap-2 flex-wrap', className)} role="group" aria-label="Status indicators">
    {items.map((item, index) => (
      <StatusDot
        key={index}
        status={item.status}
        size={size}
        variant={variant}
        label={item.label ?? ''}
        tooltip={item.tooltip ?? ''}
        showPulse={['active', 'pending', 'syncing'].includes(item.status)}
      />
    ))}
  </div>
);

export default StatusDot;