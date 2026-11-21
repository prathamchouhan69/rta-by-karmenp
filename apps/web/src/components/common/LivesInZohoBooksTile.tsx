import React from 'react';
import { IconZohoBooks } from './Icons';

interface LivesInZohoBooksTileProps {
  title: string;
  reportName?: string;
  zohoUrl?: string;
  description?: string;
}

export const LivesInZohoBooksTile: React.FC<LivesInZohoBooksTileProps> = ({
  title,
  reportName = 'Statutory Financial Statement',
  zohoUrl = 'https://books.zoho.in',
  description = 'KARM OS never invents statutory accounting sums. Balance sheet, profit & loss, trial balance and audit trails are exclusively governed and maintained inside Zoho Books.'
}) => {
  return (
    <div className="p-5 md:p-6 rounded-2xl bg-[#070b12] border border-cyan-500/30 shadow-[0_0_20px_rgba(0,242,254,0.05)] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <IconZohoBooks size={18} />
          </div>
          <div>
            <span className="type-label text-cyan-400 text-[10px] block">THE KARM LAW</span>
            <h4 className="type-h3 text-white">{title}</h4>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 font-semibold">
          Lives in Zoho Books
        </span>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed font-interface">
        {description}
      </p>

      <div className="pt-2 flex items-center justify-between border-t border-white/5">
        <span className="text-[10px] font-mono text-slate-500">Official statutory records only</span>
        <a
          href={zohoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition-all active:scale-95 shadow-sm"
        >
          Open in Zoho Books →
        </a>
      </div>
    </div>
  );
};
