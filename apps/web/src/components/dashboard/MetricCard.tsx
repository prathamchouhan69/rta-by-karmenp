import React from 'react';
import { KarmIconProps } from '../common/Icons';

interface MetricCardProps {
  label: string;
  value: string;
  trend?: string;
  trendLabel?: string;
  badge?: string;
  badgeColor?: 'primary' | 'secondary' | 'tertiary';
  icon: React.FC<KarmIconProps>;
  iconColor: 'primary' | 'secondary' | 'tertiary';
  accentColor: 'primary' | 'secondary' | 'tertiary';
}

const ICON_COLORS = {
  primary: '#22d3ee',
  secondary: '#818cf8',
  tertiary: '#f59e0b',
};

const ACCENT_BG = {
  primary: 'bg-primary/5',
  secondary: 'bg-secondary/5',
  tertiary: 'bg-tertiary/5',
};

const ACCENT_HOVER = {
  primary: 'group-hover:bg-primary/10',
  secondary: 'group-hover:bg-secondary/10',
  tertiary: 'group-hover:bg-tertiary/10',
};

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  trend,
  trendLabel,
  badge,
  badgeColor = 'primary',
  icon: Icon,
  iconColor,
  accentColor,
}) => {
  return (
    <div className={`bg-surface-container-low p-6 rounded-xl shadow-md flex flex-col justify-between relative overflow-hidden group hover:bg-surface-container transition-all ${ACCENT_BG[accentColor]} ${ACCENT_HOVER[accentColor]}`}>
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full blur-xl group-hover:bg-primary/10 transition-all" style={{ backgroundColor: `${ICON_COLORS[accentColor]}10` }} />
      <div className="flex items-center justify-between mb-5">
        <span className="text-label text-on-surface-variant font-numeric-data uppercase">{label}</span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${ICON_COLORS[iconColor]}33` }}>
          <Icon size={18} color={ICON_COLORS[iconColor]} />
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-headline-lg font-headline text-on-surface font-numeric-data">{value}</span>
        <div className="flex items-center gap-2 mt-2">
          {trend && (
            <span className="text-label font-numeric-data" style={{ color: ICON_COLORS[iconColor] }}>
              {trend}
            </span>
          )}
          {trendLabel && (
            <span className="text-body-sm text-on-surface-variant">{trendLabel}</span>
          )}
        </div>
        {badge && (
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-0.5" style={{ backgroundColor: `${ICON_COLORS[badgeColor]}33`, color: ICON_COLORS[badgeColor] }}>
              {badge}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;