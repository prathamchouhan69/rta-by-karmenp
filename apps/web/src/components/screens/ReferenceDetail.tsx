import React from 'react';
import { useApp } from '../../context/AppContext';
import { REFERENCES } from '../../data/references';
import { IconCheck, IconNature } from '../common/Icons';
import { ReferenceVideoPlayer } from '../common/ReferenceVideoPlayer';

export const ReferenceDetail: React.FC = () => {
  const { activeEntityId, notes, setNote, savingStatus, goBack } = useApp();
  const refNum = parseInt(activeEntityId || '1', 10);
  const refItem = REFERENCES.find(r => r.num === refNum) || REFERENCES[0];

  const noteKey = `ref_note_${refItem.num}`;
  const noteValue = notes[noteKey] || '';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <button
          onClick={() => goBack()}
          className="type-button text-xs text-cyan-400 hover:underline flex items-center gap-1.5"
          aria-label="Return to Nature Library"
        >
          <span>← Back to Nature Library</span>
        </button>
        <span className="type-label text-slate-400">BIOMIMICRY SPECIFICATION</span>
      </div>

      <div className="p-6 md:p-8 rounded-3xl bg-[#06080d]/90 border border-white/10 space-y-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-cyan-950/70 border border-cyan-500/30 text-cyan-400">
            <IconNature size={28} color="#00f2fe" />
          </div>
          <div>
            <span className="type-label text-cyan-400 block mb-1">REFERENCE #{refItem.num} · {refItem.category.toUpperCase()}</span>
            <h1 className="type-display text-2xl md:text-3xl text-white">{refItem.name}</h1>
            <p className="type-body-sm text-slate-400 mt-0.5">Workflow Target: {refItem.workflow} · Connected Chart: #{refItem.connected_chart}</p>
          </div>
        </div>

        {/* Dual Meaning Quadrant */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-interface">
          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1.5">
            <span className="type-label text-cyan-400 block">SCIENTIFIC PRINCIPLE</span>
            <p className="text-white leading-relaxed">{refItem.scientific}</p>
          </div>
          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1.5">
            <span className="type-label text-purple-400 block">NATURAL PHENOMENON</span>
            <p className="text-white leading-relaxed">{refItem.nature}</p>
          </div>
        </div>

        {/* Exact Business OS Workflow */}
        <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-xs font-interface space-y-1.5">
          <span className="type-label text-cyan-300 block">EXACT RTA BY KARM BUSINESS OS WORKFLOW</span>
          <p className="text-white font-medium leading-relaxed">{refItem.business}</p>
        </div>

        {/* Behavioral Specifications */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5 type-timestamp font-numeric">
          <div>
            <span className="type-label text-slate-500 block mb-1">SCREEN PLACEMENT</span>
            <span className="text-white font-medium">{refItem.screen}</span>
          </div>
          <div>
            <span className="type-label text-slate-500 block mb-1">USER ACTION</span>
            <span className="text-white font-medium">{refItem.user_action}</span>
          </div>
          <div>
            <span className="type-label text-slate-500 block mb-1">MOTION BEHAVIOUR</span>
            <span className="text-cyan-300 font-medium">{refItem.motion}</span>
          </div>
        </div>

        {/* Embedded Reference Motion Video Player */}
        <ReferenceVideoPlayer currentRefNum={refItem.num} />

        {/* Operator Notes with 800ms Autosave */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <div className="flex justify-between items-center text-xs font-numeric">
            <span className="type-label text-slate-400">OPERATOR ARCHITECTURAL NOTES</span>
            <span className="type-timestamp text-cyan-400 flex items-center gap-1">
              <IconCheck size={11} state="success" /> Autosave (800ms): {savingStatus.toUpperCase()}
            </span>
          </div>
          <textarea
            rows={4}
            value={noteValue}
            onChange={(e) => setNote(noteKey, e.target.value)}
            placeholder="Document implementation insights, edge cases, calibration parameters or site deployment notes..."
            className="w-full p-4 rounded-2xl bg-black/60 border border-white/10 focus:border-cyan-400 text-xs font-interface text-white outline-none leading-relaxed transition-colors"
            aria-label="Operator notes for this reference"
          />
        </div>
      </div>
    </div>
  );
};
