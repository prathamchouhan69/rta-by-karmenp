import React, { useEffect, useId, useMemo, useRef } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus, X } from 'lucide-react';
import type { Kpi, Tone } from './types';
import { cx, inrCompact, initials } from './format';

export const TONE_VAR: Record<Tone, string> = {
  cyan: 'var(--k-cyan)',
  violet: 'var(--k-violet)',
  amber: 'var(--k-amber)',
  rose: 'var(--k-rose)',
  sage: 'var(--k-positive)',
  neutral: 'var(--k-t2)',
};

export const TONE_SOFT: Record<Tone, string> = {
  cyan: 'var(--k-cyan-soft)',
  violet: 'var(--k-violet-soft)',
  amber: 'var(--k-amber-soft)',
  rose: 'var(--k-rose-soft)',
  sage: 'var(--k-positive-soft)',
  neutral: 'var(--k-inset)',
};

export function toneVar(tone: Tone | string): string {
  return TONE_VAR[(tone as Tone) in TONE_VAR ? (tone as Tone) : 'neutral'];
}

export const Panel: React.FC<React.HTMLAttributes<HTMLDivElement> & { flat?: boolean }> = ({
  className,
  flat,
  children,
  ...rest
}) => (
  <div className={cx(flat ? 'k-panel-flat' : 'k-panel', className)} {...rest}>
    {children}
  </div>
);

export const PageHeader: React.FC<{
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}> = ({ eyebrow, title, description, actions, meta, className }) => (
  <div className={cx('k-reveal flex flex-col gap-5 md:flex-row md:items-end md:justify-between', className)}>
    <div className="min-w-0">
      {eyebrow ? (
        <div className="mb-3 flex items-center gap-2.5">
          <span className="h-px w-7" style={{ background: 'var(--k-cyan)' }} />
          <span className="k-eyebrow !text-[9px]">{eyebrow}</span>
        </div>
      ) : null}
      <h1 className="k-page-title k-display text-[30px] leading-[1.02] text-[var(--k-t1)] sm:text-[36px] xl:text-[42px]">
        {title}
      </h1>
      {description ? (
        <p className="mt-2.5 max-w-[680px] text-[12.5px] leading-relaxed k-muted">{description}</p>
      ) : null}
      {meta ? <div className="mt-3.5 flex flex-wrap items-center gap-2">{meta}</div> : null}
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
  </div>
);

export const SectionHead: React.FC<{
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ eyebrow, title, subtitle, action, className }) => (
  <div className={cx('flex items-end justify-between gap-4', className)}>
    <div className="min-w-0">
      {eyebrow ? <div className="k-eyebrow mb-2">{eyebrow}</div> : null}
      <h2 className="k-title text-[19px] md:text-[21px] leading-tight">{title}</h2>
      {subtitle ? <p className="mt-1 text-[12px] leading-relaxed k-muted max-w-2xl">{subtitle}</p> : null}
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);

export const Chip: React.FC<{
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  dot?: boolean;
}> = ({ children, tone = 'neutral', className, dot }) => (
  <span
    className={cx('k-chip', className)}
    style={{
      color: toneVar(tone),
      borderColor: `color-mix(in srgb, ${toneVar(tone)} 30%, transparent)`,
      background: TONE_SOFT[tone],
    }}
  >
    {dot ? <span className="k-dot" /> : null}
    {children}
  </span>
);

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'default' | 'primary' | 'violet' | 'ghost';
    size?: 'sm' | 'md';
  }
> = ({ variant = 'default', size = 'md', className, children, ...rest }) => (
  <button
    className={cx(
      'k-btn',
      variant === 'primary' && 'k-btn-primary',
      variant === 'violet' && 'k-btn-violet',
      variant === 'ghost' && 'k-btn-ghost',
      size === 'sm' && '!min-h-[32px] !px-2.5 !text-[11px] !rounded-[9px]',
      className,
    )}
    {...rest}
  >
    {children}
  </button>
);

export const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  className,
  children,
  ...rest
}) => (
  <button className={cx('k-icon-btn', className)} {...rest}>
    {children}
  </button>
);

export const Sparkline: React.FC<{
  values: number[];
  tone?: Tone;
  height?: number;
  fill?: boolean;
  className?: string;
}> = ({ values, tone = 'cyan', height = 42, fill = true, className }) => {
  const id = useId().replace(/:/g, '');
  const color = toneVar(tone);
  const path = useMemo(() => {
    if (!values.length) return { line: '', area: '' };
    const max = Math.max(...values);
    const min = Math.min(...values);
    const span = max - min || 1;
    const points = values.map((value, index) => {
      const x = (index / (values.length - 1 || 1)) * 100;
      const y = 36 - ((value - min) / span) * 30;
      return [x, y] as const;
    });
    const line = points
      .map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
      .join(' ');
    const area = `${line} L100,40 L0,40 Z`;
    return { line, area };
  }, [values]);

  return (
    <svg
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
      className={className}
      style={{ width: '100%', height }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill ? <path d={path.area} fill={`url(#spark-${id})`} /> : null}
      <path d={path.line} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

export const KpiCard: React.FC<{ kpi: Kpi; index?: number; onClick?: () => void }> = ({ kpi, index = 0, onClick }) => {
  const color = toneVar(kpi.tone);
  const TrendIcon = kpi.direction === 'up' ? ArrowUpRight : kpi.direction === 'down' ? ArrowDownRight : Minus;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'k-panel group relative overflow-hidden p-4 text-left transition-transform duration-300 hover:-translate-y-0.5',
        `k-reveal k-reveal-${Math.min(index + 1, 5)}`,
        onClick ? 'cursor-pointer' : 'cursor-default',
      )}
      aria-label={`${kpi.label}: ${kpi.value}. ${kpi.delta}`}
    >
      <div
        className="absolute inset-x-0 top-0 h-px opacity-70"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />
      <div className="flex items-start justify-between gap-2">
        <span className="k-label text-[11px]">{kpi.label}</span>
        <span
          className="k-mono rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.12em]"
          style={{ color, background: TONE_SOFT[kpi.tone] }}
        >
          {kpi.id === 'gst' ? 'due' : kpi.id === 'receivables' ? 'watch' : 'live'}
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="k-number-hero text-[27px] md:text-[29px] text-[var(--k-t1)]">{kpi.value}</span>
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-[11px]" style={{ color }}>
        <TrendIcon size={12} strokeWidth={2.2} />
        <span className="font-semibold">{kpi.delta}</span>
      </div>
      <div className="mt-1 text-[10.5px] k-faint truncate">{kpi.caption}</div>
      <div className="pointer-events-none absolute -bottom-1 -right-2 left-8 opacity-70 transition-opacity duration-300 group-hover:opacity-100">
        <Sparkline values={kpi.spark} tone={kpi.tone} height={40} />
      </div>
    </button>
  );
};

export const Ring: React.FC<{
  value: number;
  size?: number;
  stroke?: number;
  tone?: Tone;
  label?: string;
  sublabel?: string;
}> = ({ value, size = 84, stroke = 6, tone = 'cyan', label, sublabel }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--k-inset)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={toneVar(tone)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.19,1,0.22,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="k-num font-semibold text-[15px] leading-none">{label ?? `${Math.round(value)}`}</span>
        {sublabel ? <span className="k-mono mt-1 text-[7px] uppercase tracking-[0.12em] k-faint">{sublabel}</span> : null}
      </div>
    </div>
  );
};

export const Progress: React.FC<{ value: number; tone?: Tone; className?: string }> = ({
  value,
  tone = 'cyan',
  className,
}) => (
  <div className={cx('k-progress', className)}>
    <span
      style={{
        width: `${Math.min(100, Math.max(0, value))}%`,
        background: `linear-gradient(90deg, ${toneVar(tone)}, color-mix(in srgb, ${toneVar(tone)} 45%, var(--k-violet)))`,
      }}
    />
  </div>
);

export const Avatar: React.FC<{ name: string; size?: number; tone?: Tone; className?: string }> = ({
  name,
  size = 32,
  tone = 'cyan',
  className,
}) => (
  <span
    className={cx('inline-flex shrink-0 items-center justify-center rounded-full border font-semibold', className)}
    style={{
      width: size,
      height: size,
      fontSize: size * 0.33,
      color: toneVar(tone),
      background: TONE_SOFT[tone],
      borderColor: `color-mix(in srgb, ${toneVar(tone)} 28%, transparent)`,
    }}
    aria-label={name}
  >
    {initials(name)}
  </span>
);

type InvoiceLikeStatus = string;

const STATUS_TONE: Record<string, Tone> = {
  paid: 'cyan',
  sent: 'violet',
  overdue: 'rose',
  critical: 'rose',
  draft: 'neutral',
  void: 'neutral',
  open: 'amber',
  action_required: 'rose',
  in_progress: 'amber',
  cleared: 'cyan',
  monitoring: 'violet',
  info: 'cyan',
  warning: 'amber',
  high: 'amber',
  medium: 'violet',
  low: 'cyan',
  in_transit: 'violet',
  loading: 'amber',
  idle: 'neutral',
  maintenance: 'rose',
  delivered: 'cyan',
  hold: 'rose',
  on_track: 'cyan',
  at_risk: 'amber',
  delayed: 'rose',
  closing: 'violet',
  signed: 'cyan',
  filed: 'violet',
  archived: 'neutral',
  active: 'cyan',
  renewal: 'violet',
  prospect: 'neutral',
  watch: 'rose',
  onsite: 'cyan',
  remote: 'violet',
  leave: 'amber',
  reconciled: 'cyan',
  matched: 'violet',
  unreconciled: 'rose',
  inbound: 'violet',
  outbound: 'amber',
  steady: 'neutral',
};

export const StatusChip: React.FC<{ status: InvoiceLikeStatus; label?: string; className?: string }> = ({
  status,
  label,
  className,
}) => {
  const tone = STATUS_TONE[status] ?? 'neutral';
  return (
    <span className={cx('k-chip', className)} style={{ color: toneVar(tone), background: TONE_SOFT[tone], borderColor: `color-mix(in srgb, ${toneVar(tone)} 26%, transparent)` }}>
      <span className="k-dot" />
      {label ?? status.replace(/_/g, ' ')}
    </span>
  );
};

export const Tabs: React.FC<{
  items: Array<{ id: string; label: string; count?: number }>;
  active: string;
  onChange: (id: string) => void;
  className?: string;
}> = ({ items, active, onChange, className }) => (
  <div className={cx('k-inset flex items-center gap-1 overflow-x-auto p-1 k-hide-scroll', className)} role="tablist">
    {items.map((item) => (
      <button
        key={item.id}
        role="tab"
        aria-selected={active === item.id}
        onClick={() => onChange(item.id)}
        className={cx(
          'relative flex min-h-[32px] shrink-0 items-center gap-1.5 rounded-lg px-3 text-[11.5px] font-semibold transition-all',
          active === item.id ? 'text-[var(--k-t1)]' : 'text-[var(--k-t3)] hover:text-[var(--k-t2)]',
        )}
      >
        {active === item.id ? (
          <span
            className="absolute inset-0 rounded-lg border"
            style={{
              background: 'var(--k-panel-solid)',
              borderColor: 'var(--k-line)',
              boxShadow: 'var(--k-shadow-soft)',
            }}
          />
        ) : null}
        <span className="relative">{item.label}</span>
        {typeof item.count === 'number' ? (
          <span className="relative k-mono text-[9px] opacity-70">{item.count}</span>
        ) : null}
      </button>
    ))}
  </div>
);

export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  width?: number;
  side?: boolean;
}> = ({ open, onClose, title, eyebrow, children, width = 520, side }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex" role="dialog" aria-modal="true" aria-label={title}>
      <button
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close dialog"
        tabIndex={-1}
      />
      <div
        className={cx(
          'k-fade relative z-10 flex max-h-full w-full flex-col overflow-hidden border border-[var(--k-line)] bg-[var(--k-panel-solid)] shadow-2xl',
          side
            ? 'ml-auto h-full rounded-l-3xl'
            : 'm-auto max-h-[88vh] rounded-3xl',
        )}
        style={{ maxWidth: width }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--k-line)] px-5 py-4">
          <div>
            {eyebrow ? <div className="k-eyebrow mb-1">{eyebrow}</div> : null}
            <h3 className="k-title text-[17px]">{title}</h3>
          </div>
          <IconButton onClick={onClose} aria-label="Close">
            <X size={16} />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
};

export const Toast: React.FC<{ message: string; tone: 'success' | 'warning' | 'info' }> = ({ message, tone }) => (
  <div className="pointer-events-none fixed bottom-24 left-1/2 z-[160] -translate-x-1/2 lg:bottom-8 lg:left-auto lg:right-8 lg:translate-x-0">
    <div
      className="k-glass k-fade flex max-w-[92vw] items-center gap-2.5 rounded-full px-4 py-2.5 text-[12px] shadow-xl"
      style={{
        borderColor:
          tone === 'success'
            ? 'color-mix(in srgb, var(--k-cyan) 38%, transparent)'
            : tone === 'warning'
              ? 'color-mix(in srgb, var(--k-amber) 38%, transparent)'
              : 'var(--k-line)',
      }}
      role="status"
    >
      <span
        className="k-dot"
        style={{ color: tone === 'warning' ? 'var(--k-amber)' : 'var(--k-cyan)' }}
      />
      <span className="text-[var(--k-t1)]">{message}</span>
    </div>
  </div>
);

export const EmptyState: React.FC<{
  title: string;
  detail: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}> = ({ title, detail, action, icon }) => (
  <div className="k-dashed flex flex-col items-center justify-center px-6 py-10 text-center">
    {icon ? <div className="mb-3 text-[var(--k-t3)]">{icon}</div> : null}
    <div className="text-[14px] font-semibold text-[var(--k-t1)]">{title}</div>
    <p className="mt-1 max-w-sm text-[12px] k-muted">{detail}</p>
    {action ? <div className="mt-4">{action}</div> : null}
  </div>
);

export const Amount: React.FC<{ value: string; compact?: boolean; className?: string }> = ({
  value,
  compact,
  className,
}) => (
  <span className={cx('k-num whitespace-nowrap', className)}>
    {compact ? inrCompact(value) : `₹${Number.parseFloat(value || '0').toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
  </span>
);

export const SearchField: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onSubmit?: () => void;
}> = ({ value, onChange, placeholder = 'Search…', className, onSubmit }) => (
  <form
    className={cx('relative', className)}
    onSubmit={(event) => {
      event.preventDefault();
      onSubmit?.();
    }}
    role="search"
  >
    <svg
      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--k-t3)]"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </svg>
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="k-input !pl-9"
      aria-label={placeholder}
    />
  </form>
);

export const DrawerRow: React.FC<{ label: string; children: React.ReactNode; mono?: boolean }> = ({
  label,
  children,
  mono,
}) => (
  <div className="flex items-start justify-between gap-5 border-b border-[var(--k-line)] py-3 last:border-0">
    <span className="text-[11px] k-faint">{label}</span>
    <span className={cx('text-right text-[12px] text-[var(--k-t1)]', mono && 'k-num')}>{children}</span>
  </div>
);

export const MetricInline: React.FC<{ label: string; value: string; tone?: Tone; hint?: string }> = ({
  label,
  value,
  tone = 'cyan',
  hint,
}) => (
  <div>
    <div className="k-eyebrow !text-[8.5px]">{label}</div>
    <div className="mt-1 k-num text-[15px] font-semibold" style={{ color: toneVar(tone) }}>
      {value}
    </div>
    {hint ? <div className="mt-0.5 text-[10px] k-faint">{hint}</div> : null}
  </div>
);

export const ScoreDial: React.FC<{ score: number; risk?: string }> = ({ score, risk }) => (
  <div className="flex items-center gap-4">
    <Ring value={score} size={94} stroke={7} tone={score > 75 ? 'cyan' : score > 50 ? 'amber' : 'rose'} label={`${score}`} sublabel="health" />
    <div>
      <div className="k-eyebrow">flux assessment</div>
      <div className="mt-1 text-[13px] font-semibold capitalize text-[var(--k-t1)]">{risk ?? 'stable'} operating picture</div>
      <div className="mt-1 text-[11px] k-muted">Recomputed from loaded records.</div>
    </div>
  </div>
);

export function useDelayedFlag(delay = 400): boolean {
  const [ready, setReady] = React.useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    timer.current = setTimeout(() => setReady(true), delay);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [delay]);
  return ready;
}
