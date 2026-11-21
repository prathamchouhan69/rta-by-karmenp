import React from 'react';
import { useApp } from '../../context/AppContext';
import { ElectricEelPulse } from '../nature/ElectricEelPulse';
import { IconSheets, IconCheck } from '../common/Icons';
import { formatRupees, formatDateUK } from '../../utils/formatters';

export const InvoiceDetail: React.FC = () => {
  const { activeEntityId, invoices, updateInvoiceStatus, exportToGoogleSheets, goBack } = useApp();

  const invoice = invoices.find(inv => inv.id === activeEntityId) || invoices[0];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Actions */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <button
          onClick={() => goBack()}
          className="type-button text-xs text-cyan-400 hover:underline flex items-center gap-1.5"
          aria-label="Return to Accounting Cockpit"
        >
          <span>← Back to Accounting Cockpit</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToGoogleSheets(`Invoice-${invoice.invoice_number}`, [invoice])}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 text-xs type-button flex items-center gap-1.5 active:scale-95 transition-all shadow-md"
            aria-label="Export Invoice to Google Sheets"
          >
            <IconSheets size={13} color="#00f2fe" />
            <span>EXPORT SHEETS</span>
          </button>
          {invoice.status !== 'paid' && (
            <button
              onClick={() => updateInvoiceStatus(invoice.id, 'paid')}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-black text-xs type-button transition-all shadow-lg active:scale-95 flex items-center gap-1"
              aria-label="Record payment for invoice"
            >
              <IconCheck size={13} color="#000" />
              <span>RECORD PAYMENT</span>
            </button>
          )}
        </div>
      </div>

      {/* Invoice Card */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#06080d]/90 border border-white/10 space-y-6 shadow-2xl">
        <div className="flex justify-between items-start">
          <div>
            <span className="type-label text-cyan-400 block mb-1">ZOHO BOOKS SYNCHRONISED</span>
            <h2 className="type-display text-2xl md:text-3xl text-white">{invoice.invoice_number}</h2>
            <p className="type-body-sm text-slate-400 mt-1">Issued to {invoice.customer_name}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-numeric font-bold border flex items-center gap-1.5 ${
            invoice.status === 'paid'
              ? 'bg-sky-950 text-sky-400 border-sky-500/40'
              : invoice.status === 'overdue'
              ? 'bg-red-950 text-red-400 border-red-500/40'
              : 'bg-amber-950 text-amber-400 border-amber-500/40'
          }`}>
            {invoice.status === 'paid' && <IconCheck size={12} state="success" />}
            <span>{invoice.status.toUpperCase()}</span>
          </span>
        </div>

        {/* Financial Details Matrix */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-black/40 border border-white/5 font-numeric text-xs">
          <div>
            <span className="type-label text-slate-400 block mb-1">ISSUE DATE</span>
            <span className="text-white font-bold">{formatDateUK(invoice.date)}</span>
          </div>
          <div>
            <span className="type-label text-slate-400 block mb-1">DUE DATE</span>
            <span className="text-white font-bold">{formatDateUK(invoice.due_date)}</span>
          </div>
          <div>
            <span className="type-label text-slate-400 block mb-1">TOTAL AMOUNT</span>
            <span className="text-white font-bold type-financial">{formatRupees(invoice.total)}</span>
          </div>
          <div>
            <span className="type-label text-slate-400 block mb-1">BALANCE DUE</span>
            <span className="text-cyan-300 font-bold type-financial">{formatRupees(invoice.balance)}</span>
          </div>
        </div>

        {/* GST & Regulatory Compliance Context */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5 type-table text-slate-400">
          <div>
            <span className="type-label block text-slate-500">GST TREATMENT</span>
            <span className="text-slate-300 font-interface">{invoice.gst_treatment.toUpperCase()}</span>
          </div>
          <div>
            <span className="type-label block text-slate-500">PLACE OF SUPPLY</span>
            <span className="text-slate-300 font-interface">{invoice.place_of_supply}</span>
          </div>
        </div>

        {invoice.status === 'overdue' && (
          <ElectricEelPulse invoice={invoice} />
        )}
      </div>
    </div>
  );
};
