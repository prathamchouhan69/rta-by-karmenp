import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { REFERENCES } from '../../data/references';
import { CHARTS } from '../../data/charts';
import { ReferenceVideoPlayer } from '../common/ReferenceVideoPlayer';
import { TeslaCoilScanner } from '../nature/TeslaCoilScanner';
import { SlimeMoldNetwork } from '../nature/SlimeMoldNetwork';
import { AntColonyDistribution } from '../nature/AntColonyDistribution';
import { IconNature, IconCharts, IconChevronRight } from '../common/Icons';

export const WorldScreen: React.FC = () => {
  const { navigateTo } = useApp();
  const [selectedDomain, setSelectedDomain] = useState<'all' | 'biology' | 'physics' | 'math' | 'cosmos'>('all');

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="type-label text-pink-400">APEX CROWN · CANONICAL SECTION 9</span>
            <span className="text-[10px] text-slate-500 font-mono">/</span>
            <span className="text-[10px] text-slate-400 font-mono">LIVING BIOMIMETIC UNIVERSE</span>
          </div>
          <h1 className="type-h1 text-white">World · 3D Cosmos & Nature Architecture</h1>
          <p className="type-body-sm text-slate-400 max-w-3xl">
            169 natural principles, 95 mathematical charts, and 14 master motion recordings synthesized into physical industrial operations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo('nature_library')}
            className="type-button px-4 py-2 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40 text-pink-300 text-xs transition-all flex items-center gap-2"
          >
            <IconNature size={14} color="#f472b6" />
            <span>169 Nature Models →</span>
          </button>
          <button
            onClick={() => navigateTo('charts_library')}
            className="type-button px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs transition-all flex items-center gap-2"
          >
            <IconCharts size={14} color="#c084fc" />
            <span>95 Charts Engine →</span>
          </button>
        </div>
      </div>

      {/* Embedded 14 Master Motion Recordings Studio Player */}
      <ReferenceVideoPlayer currentRefNum={1} />

      {/* Living Physics & Mathematical Simulators Grid */}
      <div className="space-y-4">
        <h2 className="type-h2 text-white">Living 3D Biomimetic Simulations</h2>
        <TeslaCoilScanner />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SlimeMoldNetwork title="Slime Mold Physical Network (Ref #76)" />
          <AntColonyDistribution />
        </div>
      </div>

      {/* Quick Launchpad to 169 Principles */}
      <div className="p-6 rounded-3xl bg-[#080d16] border border-white/10 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <span className="type-label text-cyan-400 block mb-0.5">SEARCH & DISCOVERY LAUNCHPAD</span>
            <h3 className="type-h3 text-white">Flagship Biomimetic Models in Production</h3>
          </div>
          <span className="type-timestamp text-slate-400">169 Scientific Principles</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {REFERENCES.slice(0, 8).map(r => (
            <div
              key={r.num}
              onClick={() => navigateTo('reference_detail', String(r.num))}
              className="p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-pink-500/40 cursor-pointer transition-all space-y-1.5 group select-none"
            >
              <div className="flex items-center justify-between">
                <span className="type-flux-id text-pink-400">REF #{String(r.num).padStart(3, '0')}</span>
                <span className="text-[10px] font-mono text-slate-500">{r.category}</span>
              </div>
              <h4 className="type-h4 text-white text-xs font-semibold group-hover:text-pink-300 transition-colors">
                {r.name}
              </h4>
              <p className="type-caption text-slate-400 text-[11px] line-clamp-2">
                {r.business}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
