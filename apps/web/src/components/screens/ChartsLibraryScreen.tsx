import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CHARTS } from '../../data/charts';
import { IconCharts, IconSearch } from '../common/Icons';

export const ChartsLibraryScreen: React.FC = () => {
  const { navigateTo } = useApp();
  const [query, setQuery] = useState('');

  const filtered = CHARTS.filter(c => 
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.subtitle.toLowerCase().includes(query.toLowerCase()) ||
    c.workflow.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <h1 className="type-h1 tracking-tight text-white">
            CHARTS & VISUALISATION ENGINE (95 CHARTS)
          </h1>
          <span className="type-label px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/40">
            95 CHARTS REPOSITORY
          </span>
        </div>
        <p className="type-body-sm text-slate-400 mt-1">
          Complete repository of 95 interactive financial, operational, and logarithmic telemetry visualisers
        </p>
      </div>

      <div className="relative">
        <IconSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search 95 charts by title, data model, or workflow context..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs font-interface text-white placeholder-slate-600 outline-none focus:border-cyan-400 transition-colors"
          aria-label="Search charts library"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(chart => (
          <div
            key={chart.num}
            onClick={() => navigateTo('chart_detail', String(chart.num))}
            className="p-4 rounded-2xl bg-[#06080d]/90 border border-white/10 hover:border-purple-400/50 cursor-pointer transition-all space-y-2.5 shadow-lg group"
            role="button"
            tabIndex={0}
            aria-label={`Chart ${chart.num}: ${chart.title}`}
          >
            <div className="flex items-center justify-between">
              <span className="type-label px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
                Chart #{chart.num}
              </span>
              <span className="type-timestamp text-cyan-400 font-numeric">
                Ref #{chart.connected_ref}
              </span>
            </div>
            <h3 className="type-h3 text-white group-hover:text-purple-300 transition-colors">
              {chart.title}
            </h3>
            <p className="type-body-sm text-slate-400 line-clamp-2 text-xs">
              {chart.subtitle}
            </p>
            <div className="type-timestamp text-slate-400 pt-2 border-t border-white/5 font-numeric flex justify-between">
              <span>Workflow: {chart.workflow}</span>
              <span>Unit: {chart.units}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
