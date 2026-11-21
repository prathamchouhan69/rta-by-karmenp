import React from 'react';
import { useApp } from '../../context/AppContext';
import { IconFleet, IconCheck } from '../common/Icons';

export const FleetDetail: React.FC = () => {
  const { activeEntityId, vehicles, goBack } = useApp();
  const v = vehicles.find(veh => veh.id === activeEntityId) || vehicles[0];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <button
          onClick={() => goBack()}
          className="type-button text-xs text-amber-400 hover:underline flex items-center gap-1.5"
          aria-label="Return to Fleet Logistics"
        >
          <span>← Back to Fleet Logistics</span>
        </button>
        <span className="type-label text-slate-400">PLATE: {v.plate}</span>
      </div>

      <div className="p-6 md:p-8 rounded-3xl bg-[#06080d]/90 border border-white/10 space-y-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-amber-950/70 border border-amber-500/30 text-amber-400">
              <IconFleet size={28} color="#f59e0b" />
            </div>
            <div>
              <span className="type-label text-amber-400 block mb-1">INDUSTRIAL TRANSIT TELEMETRY</span>
              <h2 className="type-display text-2xl md:text-3xl text-white">{v.model}</h2>
              <p className="type-body-sm text-slate-400 mt-0.5">Assigned Driver: {v.driver} · Route: {v.current_location} → {v.destination}</p>
            </div>
          </div>
          <span className="type-label px-3 py-1.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/30 self-start">
            {v.status.toUpperCase()}
          </span>
        </div>

        {/* Telemetry Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-black/40 border border-white/5 font-numeric text-xs">
          <div>
            <span className="type-label text-slate-400 block mb-1">BATTERY LEVEL (SOC)</span>
            <span className="type-financial text-xl text-sky-400">{v.battery_level}%</span>
          </div>
          <div>
            <span className="type-label text-slate-400 block mb-1">ON-TIME RATE</span>
            <span className="type-financial text-xl text-white flex items-center gap-1">
              <IconCheck size={14} state="success" />
              <span>{v.on_time_rate}%</span>
            </span>
          </div>
          <div>
            <span className="type-label text-slate-400 block mb-1">SLIME MOLD EFFICIENCY</span>
            <span className="type-financial text-xl text-cyan-300">{v.efficiency_score}/100</span>
          </div>
          <div>
            <span className="type-label text-slate-400 block mb-1">ESTIMATED ARRIVAL (ETA)</span>
            <span className="type-financial text-xl text-amber-300">{v.eta}</span>
          </div>
        </div>

        {/* Spatial Route & Checkpoint Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="type-label text-slate-300">ROUTE WAYPOINTS & GEODETIC CHECKPOINTS</h3>
            <span className="text-xs font-mono text-cyan-400">OPTIMISED PATH</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3 text-xs font-interface">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Current Position:</span>
              <span className="text-white font-medium">{v.current_location}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Destination Facility:</span>
              <span className="text-white font-medium">{v.destination}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Route Optimisation Protocol:</span>
              <span className="text-cyan-300 font-numeric">Ref #76 Physarum Polycephalum (Slime Mold)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
