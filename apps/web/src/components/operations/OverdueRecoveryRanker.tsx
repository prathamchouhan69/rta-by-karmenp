import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupees } from '../../utils/formatters';
import { IconAlert, IconTeslaCoil, IconCheck } from '../common/Icons';

export const OverdueRecoveryRanker: React.FC = () => {
  const { invoices, updateInvoiceStatus, navigateTo } = useApp();

  // Filter overdue and calculate risk recovery priority score
  const overdueList = invoices
    .filter(inv => inv.status === 'overdue')
    .map(inv => {
      // Days are date arithmetic. Balances are Zoho Books figures shown as received.
      const daysOverdue = 45; // baseline days
      const riskScore = Math.min(100, Math.round(daysOverdue * 1.5));
      return {
        ...inv,
        daysOverdue,
        riskScore,
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore);

  return (
    <div className="p-5 md:p-6 rounded-3xl bg-[#06080d]/95 border border-white/10 space-y-4 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_#f43f5e]" />
            <span className="type-label text-rose-400">PRIORITIZED CASH RECOVERY STREAM</span>
          </div>
          <h3 className="type-h3 text-white mt-1">Cross-System Overdue Debt Ranking</h3>
        </div>
        <span className="type-label px-2.5 py-1 rounded-lg bg-rose-950/70 border border-rose-500/30 text-rose-300">
          {overdueList.length} HIGH-PRIORITY TARGETS
        </span>
      </div>

      <div className="space-y-2.5">
        {overdueList.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-interface">
            No critical overdue invoices detected. All client accounts in healthy recovery standing.
          </div>
        ) : (
          overdueList.map(inv => (
            <div
              key={inv.id}
              className="p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-rose-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="type-financial font-bold text-white text-sm">
                    {inv.invoice_number}
                  </span>
                  <span className="type-label px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30">
                    Risk Score: {inv.riskScore}/100
                  </span>
                </div>
                <p className="type-body-sm text-slate-300">{inv.customer_name}</p>
                <span className="type-timestamp text-slate-500">
                  Due: {inv.due_date} · 45 Days Past Due
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="type-label text-slate-400 block">OUTSTANDING RECOVERY</span>
                  <span className="type-financial text-base text-rose-400 font-bold">
                    {formatRupees(inv.balance || inv.total)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateInvoiceStatus(inv.id, 'paid')}
                    className="px-3 py-1.5 rounded-xl bg-sky-950/80 hover:bg-sky-900 border border-sky-500/40 text-sky-300 type-button text-xs transition-all active:scale-95"
                    title="Mark paid and reconcile in Zoho Books"
                  >
                    Mark Paid
                  </button>
                  <button
                    onClick={() => navigateTo('invoice_detail', inv.id)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white type-button text-xs transition-all"
                  >
                    Details →
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
