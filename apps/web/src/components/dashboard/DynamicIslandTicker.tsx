import React from 'react';
import { IconBolt } from '../common/Icons';

interface DynamicIslandTickerProps {
  onDeployClick: () => void;
}

export const DynamicIslandTicker: React.FC<DynamicIslandTickerProps> = ({ onDeployClick }) => {
  return (
    <div className="w-full px-6 pt-4 pb-6 flex items-center justify-between">
      <div className="flex items-center gap-3 bg-surface-container-low px-6 py-2 rounded-full shadow-lg">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary-container animate-pulse" />
          <span className="text-label text-on-surface-variant font-numeric-data uppercase tracking-wider">Telemetry Stream</span>
        </div>
        <div className="h-4 w-[1px] bg-outline-variant/30" />
        <div className="flex items-center gap-4 overflow-hidden">
          <div className="flex items-center gap-1">
            <span className="text-body-sm text-on-surface-variant">CPU:</span>
            <span className="text-numeric-data text-primary font-bold">42.4%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-body-sm text-on-surface-variant">NEURAL_LATENCY:</span>
            <span className="text-numeric-data text-secondary font-bold">1.2ms</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-body-sm text-on-surface-variant">FLUX_STATUS:</span>
            <span className="text-numeric-data text-tertiary font-bold">OPTIMAL</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-label text-on-surface-variant font-numeric-data">CLUSTER_ID: KARM-AP-09</span>
        <button
          onClick={onDeployClick}
          className="px-4 py-1.5 bg-primary text-on-primary font-bold rounded-xl text-body-sm shadow-sm hover:brightness-110 transition-all flex items-center gap-2"
        >
          <IconBolt size={16} />
          <span>Deploy Node</span>
        </button>
      </div>
    </div>
  );
};

export default DynamicIslandTicker;