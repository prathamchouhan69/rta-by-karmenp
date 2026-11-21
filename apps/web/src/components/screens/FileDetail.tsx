import React from 'react';
import { useApp } from '../../context/AppContext';
import { ImmortalJellyfishRecovery } from '../nature/ImmortalJellyfishRecovery';
import { IconFiles } from '../common/Icons';
import { formatDateUK } from '../../utils/formatters';

export const FileDetail: React.FC = () => {
  const { activeEntityId, files, goBack } = useApp();
  const file = files.find(f => f.id === activeEntityId) || files[0];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <button
          onClick={() => goBack()}
          className="type-button text-xs text-pink-400 hover:underline flex items-center gap-1.5"
          aria-label="Return to Files & Documents"
        >
          <span>← Back to Files & Documents</span>
        </button>
        <span className="type-label text-slate-400">FILE ID: {file.id.toUpperCase()}</span>
      </div>

      <div className="p-6 md:p-8 rounded-3xl bg-[#06080d]/90 border border-white/10 space-y-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-pink-950/70 border border-pink-500/30 text-pink-400">
            <IconFiles size={28} color="#ff007f" />
          </div>
          <div>
            <span className="type-label text-pink-400 block mb-1">GOOGLE DRIVE & CLOUD STORAGE</span>
            <h2 className="type-display text-2xl md:text-3xl text-white break-all">{file.name}</h2>
            <p className="type-body-sm text-slate-400 mt-0.5">
              Size: {file.size} · Uploaded: {formatDateUK(file.uploaded_at)} · Last Updated: {file.updated_at}
            </p>
          </div>
        </div>

        {/* Immortal Jellyfish Cellular Rollback */}
        <ImmortalJellyfishRecovery
          fileId={file.id}
          fileName={file.name}
          versions={file.versions}
        />

        {/* Security & Sync Hash */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-xs font-numeric">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-interface">Drive Storage Status:</span>
            <span className="text-cyan-300">Synchronised & Encrypted</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-interface">Immortal Rollback Protocol:</span>
            <span className="text-pink-300">Ref #1 Turritopsis Dohrnii (Jellyfish)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
