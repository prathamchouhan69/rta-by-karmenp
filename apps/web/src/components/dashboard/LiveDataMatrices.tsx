import React from 'react';
import { IconMoreVert, IconArrowForward } from '../common/Icons';

interface LiveDataMatricesProps {}

interface NodeData {
  id: string;
  cluster: string;
  status: 'OPTIMAL' | 'REBALANCING' | 'HIGH-LOAD';
  telemetry: string;
  telemetryColor: 'primary' | 'secondary' | 'tertiary';
}

const NODE_DATA: NodeData[] = [
  { id: '#NX-9042', cluster: 'US-EAST-ALPHA', status: 'OPTIMAL', telemetry: '0.9ms / 99.4%', telemetryColor: 'primary' },
  { id: '#NX-9043', cluster: 'EU-CENTRAL-1', status: 'REBALANCING', telemetry: '2.4ms / 98.1%', telemetryColor: 'secondary' },
  { id: '#NX-9044', cluster: 'AP-NORTHEAST', status: 'OPTIMAL', telemetry: '1.1ms / 99.9%', telemetryColor: 'primary' },
  { id: '#NX-9045', cluster: 'SA-EAST-1', status: 'HIGH-LOAD', telemetry: '4.8ms / 95.2%', telemetryColor: 'tertiary' },
];

const STATUS_COLORS = {
  OPTIMAL: { bg: 'bg-primary/20', text: 'text-primary' },
  REBALANCING: { bg: 'bg-secondary/20', text: 'text-secondary' },
  'HIGH-LOAD': { bg: 'bg-tertiary/20', text: 'text-tertiary' },
};

const TELEMETRY_COLORS = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  tertiary: 'text-tertiary',
};

export const LiveDataMatrices: React.FC<LiveDataMatricesProps> = () => {
  return (
    <div className="lg:col-span-8 bg-surface-container-low p-8 rounded-xl shadow-md flex flex-col justify-between">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-headline-sm font-headline text-on-surface">Live Data Matrices</h3>
          <p className="text-body-sm text-on-surface-variant font-numeric-data">Recent cluster deployments & active telemetry states</p>
        </div>
        <button className="text-primary text-body-sm font-bold hover:underline flex items-center gap-1">
          <span>View All Matrices</span>
          <IconArrowForward size={16} />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-label text-on-surface-variant font-numeric-data border-b border-outline-variant/20">
              <th className="py-3 px-5">NODE ID</th>
              <th className="py-3 px-5">CLUSTER</th>
              <th className="py-3 px-5">STATUS</th>
              <th className="py-3 px-5 text-right">TELEMETRY</th>
              <th className="py-3 px-5 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10 text-body-md font-numeric-data">
            {NODE_DATA.map((node, index) => {
              const statusColors = STATUS_COLORS[node.status];
              return (
                <tr key={index} className="hover:bg-surface-container/50 transition-colors">
                  <td className="py-4 px-5 font-bold text-on-surface">{node.id}</td>
                  <td className="py-4 px-5 text-on-surface-variant">{node.cluster}</td>
                  <td className="py-4 px-5">
                    <span className={`px-2 py-0.5 ${statusColors.bg} ${statusColors.text} text-label rounded`}>
                      {node.status}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right" style={{ color: TELEMETRY_COLORS[node.telemetryColor] }}>
                    {node.telemetry}
                  </td>
                  <td className="py-4 px-5 text-right">
                    <button className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface" aria-label="More actions">
                      <IconMoreVert size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between pt-6 mt-6 border-t border-outline-variant/20 text-body-sm text-on-surface-variant font-numeric-data">
        <span>Showing 4 of 1,248 active clusters</span>
        <div className="flex items-center gap-2">
          <button className="px-4 py-1.5 bg-surface-container text-on-surface rounded-lg hover:bg-surface-bright transition-colors">Prev</button>
          <button className="px-4 py-1.5 bg-surface-container text-on-surface rounded-lg hover:bg-surface-bright transition-colors">Next</button>
        </div>
      </div>
    </div>
  );
};

export default LiveDataMatrices;