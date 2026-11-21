import React from 'react';
import { useApp } from '../../context/AppContext';
import { IconCRM, IconCheck, IconInvoice } from '../common/Icons';
import { formatRupees } from '../../utils/formatters';

export const ClientDetail: React.FC = () => {
  const { activeEntityId, clients, invoices, navigateTo, goBack } = useApp();
  const c = clients.find(cl => cl.id === activeEntityId) || clients[0];

  const clientInvoices = invoices.filter(inv => inv.customer_name === c.name);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <button
          onClick={() => goBack()}
          className="type-button text-xs text-cyan-400 hover:underline flex items-center gap-1.5"
          aria-label="Return to Relationships & CRM"
        >
          <span>← Back to Relationships & CRM</span>
        </button>
        <span className="type-label text-slate-400">PARTNER STATUS: {c.partner_status.toUpperCase()}</span>
      </div>

      <div className="p-6 md:p-8 rounded-3xl bg-[#06080d]/90 border border-white/10 space-y-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-cyan-950/70 border border-cyan-500/30 text-cyan-400">
              <IconCRM size={28} color="#00f2fe" />
            </div>
            <div>
              <span className="type-label text-cyan-400 block mb-1">CLIENT SYMBIOSIS NEXUS</span>
              <h2 className="type-display text-2xl md:text-3xl text-white">{c.name}</h2>
              <p className="type-body-sm text-slate-400 mt-0.5">Primary Contact: {c.contact_person} ({c.email})</p>
            </div>
          </div>
          <span className="type-label px-3 py-1.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30 self-start">
            STAGE: {c.stage.toUpperCase()}
          </span>
        </div>

        {/* Commercial Pipeline Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-black/40 border border-white/5 font-numeric text-xs">
          <div>
            <span className="type-label text-slate-400 block mb-1">PIPELINE DEAL VALUE</span>
            <span className="type-financial text-xl text-white">{formatRupees(c.deal_value, true)}</span>
          </div>
          <div>
            <span className="type-label text-slate-400 block mb-1">MONTHLY RECURRING (MRR)</span>
            <span className="type-financial text-xl text-slate-300">{formatRupees(c.mrr, true)}</span>
          </div>
          <div>
            <span className="type-label text-slate-400 block mb-1">HEALTH SCORE</span>
            <span className="type-financial text-xl text-sky-400 flex items-center gap-1">
              <IconCheck size={14} state="success" />
              <span>{c.health_score}%</span>
            </span>
          </div>
          <div>
            <span className="type-label text-slate-400 block mb-1">PARTNER TIER</span>
            <span className="type-financial text-xl text-purple-300">{c.partner_status}</span>
          </div>
        </div>

        {/* Linked Invoices */}
        {clientInvoices.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="type-label text-slate-300">LINKED COMMERCIAL INVOICES ({clientInvoices.length})</h3>
              <span className="text-xs font-mono text-cyan-400">LEDGER SYNCED</span>
            </div>
            <div className="space-y-2">
              {clientInvoices.map(inv => (
                <div
                  key={inv.id}
                  onClick={() => navigateTo('invoice_detail', inv.id)}
                  className="p-3.5 rounded-2xl bg-black/40 border border-white/5 hover:border-cyan-400/40 cursor-pointer transition-all flex items-center justify-between text-xs font-numeric group"
                >
                  <div className="flex items-center gap-2.5">
                    <IconInvoice size={15} color="#00f2fe" />
                    <span className="text-white font-bold group-hover:text-cyan-300 transition-colors">
                      {inv.invoice_number}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="type-financial text-white">{formatRupees(inv.total)}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      inv.status === 'paid' ? 'bg-sky-950 text-sky-400 border border-sky-500/30' : 'bg-red-950 text-red-400 border border-red-500/30'
                    }`}>
                      {inv.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
