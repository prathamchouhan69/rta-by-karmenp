import React from 'react';
import { useApp } from '../../context/AppContext';
import { SlimeMoldNetwork } from '../nature/SlimeMoldNetwork';
import { FuelTripMarginCalculator } from '../operations/FuelTripMarginCalculator';
import { ConnectedIntelligenceNode } from '../common/ConnectedIntelligenceNode';
import { MapTiles } from '../common/MapTiles';
import { CompactStatusDot } from '../common/CompactStatusDot';

export const TransportationScreen: React.FC = () => {
  const { vehicles, navigateTo } = useApp();

  const fleetNodes = [
    { id: 'v1', label: 'Pune Logistics Hub', x: 15, y: 55, active: true, color: '#00f2fe', metadata: [{ label: 'Fleet', value: '6 Vehicles' }, { label: 'Status', value: 'Operational' }] },
    { id: 'v2', label: 'JNPT Port Mumbai', x: 45, y: 35, active: true, color: '#a855f7', metadata: [{ label: 'Throughput', value: '2,400 TEU/day' }, { label: 'Status', value: 'Clear' }] },
    { id: 'v3', label: 'Bengaluru Industrial Node', x: 65, y: 65, active: true, color: '#10b981', metadata: [{ label: 'Inbound', value: '18 loads' }, { label: 'Status', value: 'Processing' }] },
    { id: 'v4', label: 'Delhi NCR Corridor', x: 85, y: 45, active: false, color: '#f43f5e', metadata: [{ label: 'Congestion', value: 'High' }, { label: 'ETA', value: '+4.2 hrs' }] },
    { id: 'v5', label: 'Site Gamma Quarry', x: 30, y: 75, active: true, color: '#facc15', metadata: [{ label: 'Aggregate', value: '320 MT ready' }, { label: 'Status', value: 'Loading' }] },
  ];

  const fleetConns = [
    { from: 'v1', to: 'v2', animated: true },
    { from: 'v2', to: 'v3', animated: true },
    { from: 'v1', to: 'v3', animated: false },
    { from: 'v3', to: 'v4', animated: true },
    { from: 'v1', to: 'v5', animated: false },
    { from: 'v2', to: 'v5', animated: true },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-white/10 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="type-h1 tracking-tight text-white">
                TRANSPORTATION & FLEET LOGISTICS
              </h1>
              <span className="type-label px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40">
                SLIME MOLD ROUTING
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Interactive route map with animated connections · Slime mold autonomous route optimisation · Battery telemetry
            </p>
          </div>
          <div className="flex items-center gap-3">
            <CompactStatusDot status="active" label="Live Routes" size="sm" showPulse />
            <CompactStatusDot status="optimal" label="5 Nodes" size="sm" />
            <CompactStatusDot status="warning" label="1 Congested" size="sm" />
          </div>
        </div>
      </div>

      {/* Interactive Map Tiles (Video 06) */}
      <MapTiles
        nodes={fleetNodes}
        connections={fleetConns}
        title="FLEET LOGISTICS NETWORK"
        subtitle="Real-time transit visualization with slime mold path optimization"
        height={420}
      />

      {/* Connected Ant Colony Routing Intelligence */}
      <ConnectedIntelligenceNode
        id="intel-antcolony"
        referenceNumber={7}
        videoFilename="2026-10-20 15-48-02.mp4"
        title="Ant Colony Stigmergy & Route Optimization"
        conceptName="Pheromone Trail Shortest Path (Ref #7 / Ref #76)"
        businessContext="Calculates real-time transit mixer dispatch across Pune, JNPT, and Site Gamma. Pheromone evaporation heuristics penalise congested highway stretches and reward high-payload clear bypasses."
        impactMetrics={[
          { label: 'DEAD RUN HAUL', value: '-14.2%', trend: 'Optimised' },
          { label: 'DIESEL VARIANCE', value: '3.4 km/L', trend: 'In Target' },
          { label: 'BATCH CONVERGENCE', value: '18 min avg', trend: 'On-time' }
        ]}
        calculusDeriv="d(Pheromone Density)/dt = -ρ · τ + Δτ_batch"
        calculusEli5="Ants leave a smell when they find sugar. If ten ants walk the short route, that smell gets twice as strong and all the other ants follow. We do the exact same thing with our dump trucks to avoid traffic jams."
        actionButtonText="Trigger Ant Colony Fleet Re-route"
        actionBadge="Pheromone Stigmergy"
        interactiveType="antcolony"
        onAction={() => {
          console.log('Dispatched ant colony route updates to active fleet');
        }}
      />

      {/* Fuel & Operational Trip Margin Calculator */}
      <FuelTripMarginCalculator />

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {vehicles.map(v => (
          <div
            key={v.id}
            onClick={() => navigateTo('fleet_detail', v.id)}
            className="p-4 rounded-2xl bg-[#06080d]/90 border border-white/10 hover:border-amber-400/50 cursor-pointer transition-all space-y-2 shadow-lg group"
            role="button"
            tabIndex={0}
            aria-label={`Fleet vehicle ${v.model}`}
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-white font-interface group-hover:text-amber-300 transition-colors">
                {v.model} ({v.plate})
              </span>
              <span className="type-label px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
                {v.status.toUpperCase()}
              </span>
            </div>
            <div className="type-body-sm text-slate-300">Route to {v.destination}</div>
            <div className="flex justify-between type-timestamp pt-2 border-t border-white/5 font-numeric">
              <span>Driver: {v.driver}</span>
              <span className="text-sky-400 font-bold">{v.battery_level}% SOC</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransportationScreen;