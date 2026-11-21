import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { IconFiles, IconCheck } from '../common/Icons';

export interface ImmortalJellyfishRecoveryProps {
  fileId: string;
  fileName: string;
  versions: { version: number; date: string; author: string }[];
}

export const ImmortalJellyfishRecovery: React.FC<ImmortalJellyfishRecoveryProps> = ({
  fileId,
  fileName,
  versions
}) => {
  const { restoreFileVersionWithJellyfish } = useApp();
  const [restoredVersion, setRestoredVersion] = useState<number | null>(null);

  const handleRestore = (ver: number) => {
    restoreFileVersionWithJellyfish(fileId, ver);
    setRestoredVersion(ver);
  };

  return (
    <div className="p-4 rounded-2xl border border-pink-500/30 bg-[#120610]/90 space-y-3.5 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-pink-950/80 border border-pink-500/40 flex items-center justify-center text-pink-400">
            <IconFiles size={18} color="#ff007f" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-display text-xs font-bold text-white tracking-wide">IMMORTAL JELLYFISH RECOVERY</h4>
              <span className="type-label px-1.5 py-0.5 rounded bg-pink-950 text-pink-300 border border-pink-500/30">
                Ref #1 Turritopsis Dohrnii
              </span>
            </div>
            <p className="type-body-sm text-slate-400 text-xs">
              Transdifferentiation rollbacks: regenerate prior cellular states of {fileName}
            </p>
          </div>
        </div>

        {restoredVersion && (
          <span className="type-timestamp text-sky-400 flex items-center gap-1">
            <IconCheck size={12} state="success" />
            <span>Regenerated to v{restoredVersion}.0</span>
          </span>
        )}
      </div>

      <div className="space-y-2">
        {versions.map((v) => (
          <div
            key={v.version}
            className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5 hover:border-pink-500/30 transition-all text-xs font-numeric"
          >
            <div>
              <span className="font-bold text-white">v{v.version}.0 Snapshot</span>
              <span className="type-timestamp text-slate-400 ml-2">by {v.author} · {v.date}</span>
            </div>
            <button
              type="button"
              onClick={() => handleRestore(v.version)}
              className="px-3 py-1 rounded-lg bg-pink-950/80 text-pink-300 border border-pink-500/30 hover:bg-pink-900/80 type-button text-[10px] font-bold active:scale-95 transition-all"
              aria-label={`Revert file to version ${v.version}`}
            >
              REVERT TO THIS CELL
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
