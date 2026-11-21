import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { REFERENCES } from '../../data/references';
import { IconNature, IconSearch } from '../common/Icons';

export const NatureLibraryScreen: React.FC = () => {
  const { savedSelections, toggleSaveReference, navigateTo } = useApp();
  const [query, setQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('All');

  const filtered = REFERENCES.filter(r => {
    const matchesQ = r.name.toLowerCase().includes(query.toLowerCase()) ||
                     r.business.toLowerCase().includes(query.toLowerCase()) ||
                     r.workflow.toLowerCase().includes(query.toLowerCase());
    const matchesCat = selectedCat === 'All' || r.category === selectedCat;
    return matchesQ && matchesCat;
  });

  const categories = [
    'All',
    'Survivors & resilience',
    'Swarm & distribution',
    'Camouflage & detection',
    'Mathematics & constants',
    'Cosmos & physics'
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <h1 className="type-h1 tracking-tight text-white">
            IMPOSSIBLE NATURE & BIOMIMICRY LIBRARY
          </h1>
          <span className="type-label px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
            169 PRINCIPLES
          </span>
        </div>
        <p className="type-body-sm text-slate-400 mt-1">
          Catalog of all 169 biomimetic, Tesla energy, and quantum principles powering the RTA by KARM Business OS
        </p>
      </div>

      {/* Search & Categories Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <IconSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search 169 references by name, principle, or business workflow..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs font-interface text-white placeholder-slate-600 outline-none focus:border-cyan-400 transition-colors"
            aria-label="Search nature references"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setSelectedCat(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-numeric whitespace-nowrap type-button transition-all ${
                selectedCat === c
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(0,242,254,0.15)]'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of References */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(r => {
          const isSaved = savedSelections.references.includes(r.num);
          return (
            <div
              key={r.num}
              onClick={() => navigateTo('reference_detail', String(r.num))}
              className="p-4 rounded-2xl bg-[#06080d]/90 border border-white/10 hover:border-cyan-400/50 cursor-pointer transition-all space-y-3 group shadow-lg"
              role="button"
              tabIndex={0}
              aria-label={`Reference ${r.num}: ${r.name}`}
            >
              <div className="flex items-center justify-between">
                <span className="type-label px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  Ref #{r.num}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSaveReference(r.num);
                  }}
                  className={`text-sm transition-transform active:scale-125 ${isSaved ? 'text-amber-400' : 'text-slate-600 hover:text-white'}`}
                  aria-label={isSaved ? 'Remove from saved selections' : 'Save reference selection'}
                >
                  ★
                </button>
              </div>

              <h3 className="type-h3 text-white group-hover:text-cyan-300 transition-colors">
                {r.name}
              </h3>
              <p className="type-body-sm text-slate-400 line-clamp-2 text-xs">
                {r.business}
              </p>
              <div className="type-timestamp text-cyan-400/80 pt-2 border-t border-white/5 font-numeric flex items-center justify-between">
                <span>Workflow: {r.workflow}</span>
                <span className="text-slate-500">{r.category}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
