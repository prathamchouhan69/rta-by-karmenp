import React from 'react';

export interface MycorrhizalNetworkProps {
  connectionsCount?: number;
  healthScore?: number;
}

export const MycorrhizalNetwork: React.FC<MycorrhizalNetworkProps> = ({
  connectionsCount = 38,
  healthScore = 96
}) => {
  return (
    <div className="p-4 rounded-xl border border-teal-500/30 bg-[#071210]/90 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-bold text-white">MYCORRHIZAL HYPHAE NETWORK</h4>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-500/30">
            Ref #75 Fungal Resource Mesh
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {connectionsCount} inter-enterprise symbiosis channels active · Nitrogen/Carbon trade balanced
        </p>
      </div>

      <div className="text-right">
        <span className="text-[10px] font-mono text-slate-400 block uppercase">Symbiosis Score</span>
        <span className="text-sm font-mono font-extrabold text-teal-300">{healthScore}%</span>
      </div>
    </div>
  );
};
