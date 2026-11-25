/* Formatting helpers. Display-only; monetary arithmetic stays with Zoho Books. */

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function inr(value: string | number, decimals = 2): string {
  const numeric = typeof value === 'number' ? value : Number.parseFloat(value || '0');
  if (!Number.isFinite(numeric)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numeric);
}

export function inrCompact(value: string | number): string {
  const numeric = typeof value === 'number' ? value : Number.parseFloat(value || '0');
  if (!Number.isFinite(numeric)) return '₹0';
  const abs = Math.abs(numeric);
  if (abs >= 10000000) return `₹${(numeric / 10000000).toFixed(2)} Cr`;
  if (abs >= 100000) return `₹${(numeric / 100000).toFixed(1)} L`;
  if (abs >= 1000) return `₹${(numeric / 1000).toFixed(0)}k`;
  return `₹${numeric.toFixed(0)}`;
}

export function numberString(value: string | number): string {
  const numeric = typeof value === 'number' ? value : Number.parseFloat(value || '0');
  if (!Number.isFinite(numeric)) return '0';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(numeric);
}

export function shortDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export function longDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function dueLabel(value: string, now = new Date()): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.round((end.getTime() - start.getTime()) / 86400000);
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days === -1) return '1 day overdue';
  if (days < 0) return `${Math.abs(days)} days overdue`;
  return `Due in ${days} days`;
}

export function dayGreeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 5) return 'Late shift';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function timeStamp(date = new Date()): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata',
  });
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

export const TONE_TEXT: Record<string, string> = {
  cyan: 'text-cyan-300',
  violet: 'text-violet-300',
  amber: 'text-amber-300',
  rose: 'text-rose-300',
  sage: 'text-teal-300',
  neutral: 'text-slate-300',
};

export const TONE_BG: Record<string, string> = {
  cyan: 'bg-cyan-400',
  violet: 'bg-violet-400',
  amber: 'bg-amber-400',
  rose: 'bg-rose-400',
  sage: 'bg-teal-400',
  neutral: 'bg-slate-400',
};

export const TONE_RING: Record<string, string> = {
  cyan: 'border-cyan-400/30',
  violet: 'border-violet-400/30',
  amber: 'border-amber-400/30',
  rose: 'border-rose-400/30',
  sage: 'border-teal-400/30',
  neutral: 'border-white/15',
};
