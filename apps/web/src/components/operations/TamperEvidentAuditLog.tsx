import React from 'react';
import { IconCheck, IconSync } from '../common/Icons';

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  hash: string;
  prevHash: string;
}

const MOCK_AUDIT_LOG: AuditEntry[] = [
  {
    id: 'aud-104',
    timestamp: '21 Nov 2026, 15:35:12 IST',
    actor: 'Autonomous Tesla Scanner',
    action: 'INVOICE_SYNC_COMPLETED',
    resource: 'Zoho Books / Inv #INV-2026-089',
    hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    prevHash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
  },
  {
    id: 'aud-103',
    timestamp: '21 Nov 2026, 14:18:44 IST',
    actor: 'Operator / Finance Lead',
    action: 'BANK_TRANSACTION_RECONCILED',
    resource: 'HDFC Current A/c #9410 · ₹1,250,000',
    hash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
    prevHash: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
  },
  {
    id: 'aud-102',
    timestamp: '21 Nov 2026, 12:45:00 IST',
    actor: 'Stigmergy Ant Engine',
    action: 'CREW_WORKLOAD_REBALANCED',
    resource: 'Site Gamma · Precast Pier Placement',
    hash: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
    prevHash: '3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d',
  },
  {
    id: 'aud-101',
    timestamp: '21 Nov 2026, 10:10:22 IST',
    actor: 'Jellyfish Recovery Agent',
    action: 'CONTRACT_FILE_RESTORED',
    resource: 'Highway_Expansion_Tender_v3.pdf',
    hash: '3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d',
    prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
  },
];

export const TamperEvidentAuditLog: React.FC = () => {
  return (
    <div className="p-5 md:p-6 rounded-3xl bg-[#06080d]/95 border border-white/10 space-y-4 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f2fe]" />
            <span className="type-label text-cyan-400">IMMUTABLE GOVERNANCE CHAIN</span>
          </div>
          <h3 className="type-h3 text-white mt-1">Tamper-Evident Operational Audit Log</h3>
        </div>
        <span className="type-label px-2.5 py-1 rounded-lg bg-sky-950/80 border border-sky-500/30 text-sky-400 flex items-center gap-1.5 self-start sm:self-auto">
          <IconCheck size={12} state="success" /> Merkle Tree Verified
        </span>
      </div>

      <div className="space-y-3 font-numeric text-xs">
        {MOCK_AUDIT_LOG.map(entry => (
          <div
            key={entry.id}
            className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2 hover:border-cyan-500/30 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-300">
              <div className="flex items-center gap-2">
                <span className="type-flux-id text-cyan-400">{entry.id}</span>
                <span className="font-semibold text-white">{entry.action}</span>
              </div>
              <span className="type-timestamp text-slate-400">{entry.timestamp}</span>
            </div>

            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Actor: <strong className="text-white">{entry.actor}</strong></span>
              <span className="text-slate-300">{entry.resource}</span>
            </div>

            <div className="pt-2 border-t border-white/5 flex flex-col gap-0.5 text-[9px] text-slate-500 truncate">
              <div><span className="text-slate-400 font-bold">STATE HASH:</span> {entry.hash}</div>
              <div><span className="text-slate-400 font-bold">PARENT HASH:</span> {entry.prevHash}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
