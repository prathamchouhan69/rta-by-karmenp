import React, { useState } from 'react';
import { IconSearch } from '../common/Icons';

interface ThroughputChartProps {}

const CHART_DATA = [
  { time: '00:00', value: 160 },
  { time: '04:00', value: 130 },
  { time: '08:00', value: 110 },
  { time: '12:00', value: 80 },
  { time: '16:00', value: 50 },
  { time: '20:00', value: 30 },
  { time: 'NOW', value: 20 },
];

export const ThroughputChart: React.FC<ThroughputChartProps> = () => {
  const [activePeriod, setActivePeriod] = useState<'1H' | '24H' | '7D'>('1H');

  return (
    <div className="lg:col-span-8 bg-surface-container-low p-8 rounded-xl shadow-md flex flex-col justify-between">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-headline-sm font-headline text-on-surface">Throughput Velocity & Telemetry</h3>
          <p className="text-body-sm text-on-surface-variant font-numeric-data">Real-time vector data streaming across global subnets</p>
        </div>
        <div className="flex items-center gap-2 bg-surface-container p-1 rounded-xl">
          {(['1H', '24H', '7D'] as const).map(period => (
            <button
              key={period}
              onClick={() => setActivePeriod(period)}
              className={`px-4 py-1.5 rounded-lg text-body-sm font-bold transition-all ${
                activePeriod === period
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full h-64 relative flex items-end">
        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 800 200">
          <defs>
            <linearGradient id="chartGlow" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <path
            d="M 0 160 Q 100 130, 200 110 T 400 80 T 600 50 T 800 30 L 800 200 L 0 200 Z"
            fill="url(#chartGlow)"
          />
          <path
            d="M 0 160 Q 100 130, 200 110 T 400 80 T 600 50 T 800 30"
            fill="none"
            stroke="#22d3ee"
            strokeLinecap="round"
            strokeWidth={3}
          />
          {CHART_DATA.map((point, index) => (
            <circle
              key={index}
              className="animate-pulse"
              cx={[0, 133, 266, 400, 533, 666, 800][index]}
              cy={point.value}
              fill="#22d3ee"
              r={4}
            />
          ))}
        </svg>
      </div>
      <div className="flex items-center justify-between pt-4 mt-4 text-label font-numeric-data text-on-surface-variant">
        <span>00:00 UTC</span>
        <span>06:00 UTC</span>
        <span>12:00 UTC</span>
        <span>18:00 UTC</span>
        <span>NOW</span>
      </div>
    </div>
  );
};

export default ThroughputChart;