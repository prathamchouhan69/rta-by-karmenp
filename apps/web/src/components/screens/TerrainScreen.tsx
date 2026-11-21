import React, { useState } from 'react';
import { formatRupees } from '../../utils/formatters';
import { IconInventory, IconCheck, IconAlert } from '../common/Icons';
import { ConnectedIntelligenceNode } from '../common/ConnectedIntelligenceNode';
import { RearrangeableMetricCard } from '../common/RearrangeableMetricCard';

export interface MaterialItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  minBuffer: number;
  location: string;
  valuation: number;
  status: 'optimal' | 'low' | 'critical';
}

const INITIAL_MATERIALS: MaterialItem[] = [
  { id: 'mat-1', name: 'High-Yield TMT Rebars (16mm)', category: 'Reinforcement Steel', stock: 42, unit: 'Tonnes', minBuffer: 50, location: 'Site Alpha Yard A', valuation: 2730000, status: 'low' },
  { id: 'mat-2', name: 'Portland Pozzolana Cement (53 Grade)', category: 'Binding Matrix', stock: 1250, unit: 'Bags', minBuffer: 800, location: 'Central Warehouse Pune', valuation: 487500, status: 'optimal' },
  { id: 'mat-3', name: 'Crushed Basalt Aggregate (20mm)', category: 'Aggregates', stock: 320, unit: 'MT', minBuffer: 150, location: 'Site Gamma Quarry', valuation: 384000, status: 'optimal' },
  { id: 'mat-4', name: 'Precast Pier Caps (32MT M45)', category: 'Precast Structural', stock: 8, unit: 'Units', minBuffer: 10, location: 'Precast Facility JNPT', valuation: 2880000, status: 'low' },
  { id: 'mat-5', name: 'Fly Ash (Grade 1 Pulverized)', category: 'Pozzolanic Admixture', stock: 85, unit: 'MT', minBuffer: 40, location: 'Central Warehouse Pune', valuation: 127500, status: 'optimal' },
  { id: 'mat-6', name: 'Polycarboxylate Ether Superplasticizer', category: 'Chemical Admixtures', stock: 18, unit: 'Barrels', minBuffer: 25, location: 'JNPT Chemical Storage', valuation: 324000, status: 'low' },
];

export const TerrainScreen: React.FC = () => {
  const [materials, setMaterials] = useState<MaterialItem[]>(INITIAL_MATERIALS);
  const [filterCat, setFilterCat] = useState<string>('all');

  // Rearrangeable metrics for inventory overview (Video 07)
  const [metrics, setMetrics] = useState([
    { id: 'total-value', label: 'TOTAL INVENTORY VALUE', value: formatRupees(6933000), trend: 'Active Stock Assets', trendDirection: 'neutral' as const, color: '#00f2fe', status: 'optimal' as const },
    { id: 'low-buffer', label: 'LOW BUFFER WARNINGS', value: '3 Items', trend: 'Reorder vouchers staged', trendDirection: 'down' as const, color: '#f43f5e', status: 'critical' as const },
    { id: 'facilities', label: 'STOCKYARD FACILITIES', value: '3 Nodes', trend: 'Pune, JNPT, Site Gamma', trendDirection: 'neutral' as const, color: '#a855f7', status: 'optimal' as const },
    { id: 'turnover', label: 'TURNOVER VELOCITY', value: '18.4 Days', trend: 'Mean consumption cycle', trendDirection: 'up' as const, color: '#facc15', status: 'warning' as const },
  ]);

  const handleMetricMove = (fromIndex: number, toIndex: number) => {
    setMetrics(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const filtered = materials.filter(m => filterCat === 'all' || m.category === filterCat);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="type-label text-emerald-400">CANONICAL SECTION 5</span>
            <span className="text-[10px] text-slate-500 font-mono">/</span>
            <span className="text-[10px] text-slate-400 font-mono">RAW MATERIALS & STOCKYARD</span>
          </div>
          <h1 className="type-h1 text-white mt-1">Terrain · Materials & Inventory</h1>
          <p className="type-body-sm text-slate-400">
            Real-time stock levels, precast curing logs, quarry aggregate telemetry & automated replenishment triggers.
          </p>
        </div>

        <button
          onClick={() => {}}
          className="type-button px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-semibold text-xs transition-all active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.3)] self-start md:self-auto"
        >
          + Draft Material Indent
        </button>
      </div>

      {/* Rearrangeable KPI Overview (Video 07) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="type-h3 text-white">Inventory Health Metrics</h3>
          <span className="type-label text-slate-500 text-[10px]">Drag grip ⋮⋮ to reorder</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" role="list" aria-label="Rearrangeable inventory metrics">
          {metrics.map((metric, index) => (
            <RearrangeableMetricCard
              key={metric.id}
              data={metric}
              index={index}
              onMove={handleMetricMove}
            />
          ))}
        </div>
      </div>

      {/* Connected Biomimetic Hexagonal Packing Intelligence Node */}
      <ConnectedIntelligenceNode
        id="intel-phyllotaxis"
        referenceNumber={3}
        videoFilename="2026-10-20 15-45-18.mp4"
        title="Biomimetic Spiral & Hexagonal Packing Stacking"
        conceptName="Logarithmic Nautilus & Phyllotaxis Stacking (Ref #3)"
        businessContext="Calculates space-saving stacking configurations for 42T TMT rebar bundles and precast pier segments in Site Alpha Yard A, maximizing storage density without exceeding gantry crane lift radii."
        impactMetrics={[
          { label: 'YARD DENSITY', value: '88.4%', trend: '+24% Capacity' },
          { label: 'CORROSION EXPOSURE', value: '0.8%', trend: 'Minimal' },
          { label: 'CRANE HOIST PATH', value: '100% Clear', trend: 'Verified' }
        ]}
        calculusDeriv="d(Storage Efficiency)/dt = ∇ · (Hexagonal Lattice Compaction)"
        calculusEli5="Like honeybees building their honeycomb with six-sided cells to hold the most honey with the least wax. We stack heavy steel rods in tight honeycomb shapes so they take up less space on site and stay off wet ground."
        actionButtonText="Recalculate Hexagonal Yard Stacking Geometry"
        actionBadge="Hexagonal Lattice"
        interactiveType="slimemold"
        onAction={() => {
          console.log('Recalculated yard stacking geometry for Site Alpha Yard A');
        }}
      />

      {/* Materials Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#06080d]/90 shadow-xl">
        <table className="w-full text-left type-table">
          <thead className="bg-white/[0.03] text-slate-400 border-b border-white/10 type-label">
            <tr>
              <th className="p-3.5">MATERIAL SPECIFICATION</th>
              <th className="p-3.5">CATEGORY</th>
              <th className="p-3.5">CURRENT STOCK</th>
              <th className="p-3.5">MIN BUFFER</th>
              <th className="p-3.5">LOCATION</th>
              <th className="p-3.5">BOOK VALUATION</th>
              <th className="p-3.5">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((mat) => (
              <tr key={mat.id} className="hover:bg-white/[0.04] transition-colors">
                <td className="p-3.5 font-bold text-white font-interface">
                  {mat.name}
                </td>
                <td className="p-3.5 text-slate-300 font-interface text-xs">
                  {mat.category}
                </td>
                <td className="p-3.5 text-white font-bold">
                  {mat.stock} <span className="text-[11px] font-normal text-slate-500">{mat.unit}</span>
                </td>
                <td className="p-3.5 text-slate-400">
                  {mat.minBuffer} {mat.unit}
                </td>
                <td className="p-3.5 text-slate-300 text-xs">
                  {mat.location}
                </td>
                <td className="p-3.5 font-bold text-cyan-300">
                  {formatRupees(mat.valuation)}
                </td>
                <td className="p-3.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                    mat.status === 'optimal'
                      ? 'bg-sky-950 text-sky-400 border-sky-500/30'
                      : 'bg-amber-950 text-amber-300 border-amber-500/30'
                  }`}>
                    {mat.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TerrainScreen;