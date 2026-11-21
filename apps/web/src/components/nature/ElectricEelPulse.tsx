import React, { useState } from 'react';
import { Invoice } from '../../data/mockData';
import { IconCheck } from '../common/Icons';
import { formatRupees } from '../../utils/formatters';

export interface ElectricEelPulseProps {
  invoice: Invoice;
  onSendReminder?: (id: string) => void;
}

export const ElectricEelPulse: React.FC<ElectricEelPulseProps> = ({ invoice, onSendReminder }) => {
  const [pulsing, setPulsing] = useState(false);
  const [sent, setSent] = useState(false);

  const handlePulseDischarge = () => {
    setPulsing(true);
    setTimeout(() => {
      setPulsing(false);
      setSent(true);
      if (onSendReminder) onSendReminder(invoice.id);
    }, 1200);
  };

  return (
    <div className={`relative p-3.5 rounded-2xl border transition-all ${
      pulsing
        ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_25px_#00f2fe]'
        : 'border-amber-500/30 bg-[#080c14]/90 hover:border-amber-400/50'
    }`}>
      {pulsing && (
        <span className="absolute inset-0 rounded-2xl bg-cyan-400/10 anim-eel-pulse pointer-events-none" />
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-numeric font-bold text-xs">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-numeric font-bold text-white">{invoice.invoice_number}</span>
              <span className="type-label px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
                Ref #9 Electric Eel
              </span>
            </div>
            <p className="type-body-sm text-slate-400 text-xs">
              {invoice.customer_name} · Balance <span className="type-financial text-amber-300">{formatRupees(invoice.balance)}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePulseDischarge}
          disabled={pulsing || sent}
          className={`px-3 py-1.5 rounded-xl type-button text-[11px] font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
            sent
              ? 'bg-sky-950 text-sky-400 border border-sky-500/40'
              : pulsing
              ? 'bg-cyan-500 text-black shadow-[0_0_15px_#00f2fe]'
              : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
          }`}
          aria-label="Discharge electric eel reminder"
        >
          {sent ? (
            <>
              <IconCheck size={12} state="success" />
              <span>DISCHARGED</span>
            </>
          ) : pulsing ? (
            <span>600V PULSE...</span>
          ) : (
            <span>DISCHARGE REMINDER</span>
          )}
        </button>
      </div>
    </div>
  );
};
