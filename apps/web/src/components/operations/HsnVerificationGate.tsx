import React, { useState } from 'react';
import { IconCheck, IconAlert } from '../common/Icons';

export interface HsnItem {
  code: string;
  description: string;
  gstRate: number; // e.g. 18
  type: 'goods' | 'services';
}

const COMMON_HSN_CODES: HsnItem[] = [
  { code: '6810', description: 'Precast concrete slabs, pipes & structural blocks', gstRate: 18, type: 'goods' },
  { code: '7214', description: 'High-yield TMT steel bars & reinforced rods', gstRate: 18, type: 'goods' },
  { code: '2523', description: 'Portland cement, aluminous cement & slag cement', gstRate: 28, type: 'goods' },
  { code: '9954', description: 'Composite works contract & civil infrastructure construction', gstRate: 18, type: 'services' },
  { code: '9965', description: 'Freight transport by road & fleet haulage services', gstRate: 5, type: 'services' },
  { code: '9983', description: 'Civil engineering consulting & structural architectural services', gstRate: 18, type: 'services' },
];

export const HsnVerificationGate: React.FC = () => {
  const [gstin, setGstin] = useState('27AAACK1234F1Z5');
  const [selectedHsn, setSelectedHsn] = useState<HsnItem>(COMMON_HSN_CODES[0]);
  const [customHsn, setCustomHsn] = useState('');
  const [isVerified, setIsVerified] = useState(true);

  // Validate 15-character Indian GSTIN format
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  const isGstinValid = gstinRegex.test(gstin.trim());

  const handleVerify = () => {
    setIsVerified(true);
  };

  return (
    <div className="p-5 md:p-6 rounded-3xl bg-[#06080d]/95 border border-white/10 space-y-5 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f2fe]" />
            <span className="type-label text-cyan-400">STATUTORY COMPLIANCE GATEWAY</span>
          </div>
          <h3 className="type-h3 text-white mt-1">HSN / SAC & GSTIN Verification Gate</h3>
        </div>
        <span className="type-label px-2.5 py-1 rounded-lg bg-sky-950/80 text-sky-400 border border-sky-500/30 flex items-center gap-1.5 self-start sm:self-auto">
          <IconCheck size={12} state="success" /> Verified for Zoho Books API
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* GSTIN Field */}
        <div className="space-y-1.5">
          <label className="type-label text-slate-400 block">
            CUSTOMER GSTIN (15-DIGIT STATUTORY IDENTIFIER)
          </label>
          <div className="relative">
            <input
              type="text"
              value={gstin}
              onChange={(e) => {
                setGstin(e.target.value.toUpperCase());
                setIsVerified(false);
              }}
              placeholder="e.g. 27AAACK1234F1Z5"
              className="w-full bg-black/60 border border-white/10 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 font-numeric text-xs text-white uppercase outline-none"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-numeric">
              {isGstinValid ? (
                <span className="text-sky-400 flex items-center gap-1">
                  <IconCheck size={11} state="success" /> Valid Format
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1">
                  <IconAlert size={11} state="error" /> Invalid GSTIN
                </span>
              )}
            </span>
          </div>
          <p className="type-timestamp text-slate-500">
            State Code: {gstin.slice(0, 2) || 'None'} · PAN: {gstin.slice(2, 12) || 'None'}
          </p>
        </div>

        {/* HSN Code Selector */}
        <div className="space-y-1.5">
          <label className="type-label text-slate-400 block">
            HSN / SAC CLASSIFICATION CODE & STATUTORY RATE
          </label>
          <select
            value={selectedHsn.code}
            onChange={(e) => {
              const item = COMMON_HSN_CODES.find(h => h.code === e.target.value);
              if (item) {
                setSelectedHsn(item);
                setIsVerified(false);
              }
            }}
            className="w-full bg-black/60 border border-white/10 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 font-numeric text-xs text-cyan-300 outline-none"
          >
            {COMMON_HSN_CODES.map(h => (
              <option key={h.code} value={h.code} className="bg-[#0b0f17] text-white">
                HSN {h.code} — {h.gstRate}% GST ({h.type.toUpperCase()})
              </option>
            ))}
          </select>
          <p className="type-timestamp text-slate-400">{selectedHsn.description}</p>
        </div>
      </div>

      {/* Verification State Banner */}
      <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <span className="type-label text-white">Tax Rate Schedule Assessment:</span>
          <p className="type-body-sm text-slate-400">
            Applicable CGST ({selectedHsn.gstRate / 2}%) + SGST ({selectedHsn.gstRate / 2}%) or IGST ({selectedHsn.gstRate}%)
          </p>
        </div>

        <button
          onClick={handleVerify}
          className="type-button px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-black font-semibold text-xs transition-all active:scale-95 shadow-[0_0_15px_rgba(0,242,254,0.2)]"
        >
          Confirm HSN & Lock for Invoice
        </button>
      </div>
    </div>
  );
};
