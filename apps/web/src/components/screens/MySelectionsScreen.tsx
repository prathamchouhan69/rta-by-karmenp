import React from 'react';
import { useApp } from '../../context/AppContext';
import { REFERENCES } from '../../data/references';
import { IconNature, IconCharts, IconChevronRight, IconCheck } from '../common/Icons';

export const MySelectionsScreen: React.FC = () => {
  const { savedSelections, navigateTo } = useApp();

  const savedRefs = REFERENCES.filter(r => savedSelections.references.includes(r.num));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="type-flux-technical text-cyan-400">OPERATOR PINNED ASSETS</span>
            <span className="text-[10px] text-slate-500 font-mono">/</span>
            <span className="text-[10px] text-slate-400 font-mono">{savedRefs.length} ACTIVE</span>
          </div>
          <h1 className="type-h2 text-white">My Selections & Operator Workbench</h1>
          <p className="type-body-sm text-slate-400 mt-1">
            Curated biomimetic models, mathematical formulations, and critical operational instruments.
          </p>
        </div>

        <button
          onClick={() => navigateTo('nature_library')}
          className="type-button px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-black font-semibold flex items-center gap-2 self-start md:self-auto transition-all shadow-[0_0_20px_rgba(0,242,254,0.15)]"
        >
          <IconNature className="w-4 h-4" />
          Browse 169 Biomimetic References
        </button>
      </div>

      {/* Saved References Grid */}
      {savedRefs.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-[#07090e]/80 border border-white/[0.08] space-y-4 max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto text-cyan-400">
            <IconNature className="w-7 h-7" />
          </div>
          <h3 className="type-h3 text-white">No Pinned Principles Yet</h3>
          <p className="type-body-sm text-slate-400">
            Pin nature principles or financial charts to keep them readily accessible in your personal executive workbench.
          </p>
          <button
            onClick={() => navigateTo('nature_library')}
            className="type-button px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition-all"
          >
            Explore Nature Library →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedRefs.map(r => (
            <div
              key={r.num}
              onClick={() => navigateTo('reference_detail', String(r.num))}
              className="p-5 rounded-2xl bg-[#070a0e]/95 border border-white/[0.08] hover:border-cyan-500/50 hover:bg-[#090e15] transition-all cursor-pointer group flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="type-flux-id text-cyan-400">REF #{String(r.num).padStart(3, '0')}</span>
                  <span className="flex items-center gap-1 text-[10px] font-mono text-sky-400 bg-sky-950/40 border border-sky-800/40 px-2 py-0.5 rounded-md">
                    <IconCheck className="w-3 h-3" /> Pinned
                  </span>
                </div>
                <h3 className="type-h4 text-white group-hover:text-cyan-300 transition-colors">
                  {r.name}
                </h3>
                <p className="type-caption text-slate-400 line-clamp-3 mt-2 leading-relaxed">
                  {r.business}
                </p>
              </div>

              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <span className="type-flux-technical text-slate-400">{r.workflow}</span>
                <span className="text-cyan-400 group-hover:translate-x-1 transition-transform">
                  <IconChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
