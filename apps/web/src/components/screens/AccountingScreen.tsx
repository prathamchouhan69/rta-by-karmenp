import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TeslaCoilScanner } from '../nature/TeslaCoilScanner';
import { BlackHoleVortex } from '../nature/BlackHoleVortex';
import { ElectricEelPulse } from '../nature/ElectricEelPulse';
import { CashFlowChart } from '../charts/CashFlowChart';
import { ReceivablesAgingChart } from '../charts/ReceivablesAgingChart';
import { BankReconciliationStatusChart } from '../charts/BankReconciliationStatusChart';
import { DottedDonutChart } from '../charts/DottedDonutChart';
import { IconSheets, IconCheck } from '../common/Icons';
import { formatRupees, formatDateUK } from '../../utils/formatters';
import { HsnVerificationGate } from '../operations/HsnVerificationGate';
import { OverdueRecoveryRanker } from '../operations/OverdueRecoveryRanker';
import { ConnectedIntelligenceNode } from '../common/ConnectedIntelligenceNode';
import { ZohoRawInvoicingModal } from '../operations/ZohoRawInvoicingModal';
import { LivesInZohoBooksTile } from '../common/LivesInZohoBooksTile';
import { SeverityDonut } from '../common/SeverityDonut';

export const AccountingScreen: React.FC = () => {
  const {
    invoices,
    bills,
    bankTransactions,
    updateInvoiceStatus,
    reconcileBankTransaction,
    exportToGoogleSheets,
    navigateTo
  } = useApp();

  const [activeTab, setActiveTab] = useState<'invoices' | 'bills' | 'bank' | 'taxes'>('invoices');
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');

  const overdueInvoices = invoices.filter(inv => inv.status === 'overdue');

  // Dotted Donut data (Video 02)
  const invoiceStatusData = [
    { name: 'Paid', value: invoices.filter(i => i.status === 'paid').length, color: '#10b981' },
    { name: 'Overdue', value: invoices.filter(i => i.status === 'overdue').length, color: '#f43f5e' },
    { name: 'Draft', value: invoices.filter(i => i.status === 'draft').length, color: '#facc15' },
    { name: 'Sent', value: invoices.filter(i => i.status === 'sent').length, color: '#00f2fe' },
  ].filter(d => d.value > 0);

  // Severity Donut data (Video 10)
  const severityData = [
    { id: 'critical', label: 'Critical', value: invoices.filter(i => i.status === 'overdue').length * 2, color: '#f43f5e', severity: 'critical' as const },
    { id: 'high', label: 'High', value: invoices.filter(i => i.status === 'sent').length + 1, color: '#f97316', severity: 'high' as const },
    { id: 'medium', label: 'Medium', value: invoices.filter(i => i.status === 'draft').length, color: '#facc15', severity: 'medium' as const },
    { id: 'low', label: 'Low', value: invoices.filter(i => i.status === 'paid').length, color: '#10b981', severity: 'low' as const },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="type-h1 tracking-tight text-white">
              ACCOUNTING & CASH FLOW COCKPIT
            </h1>
            <span className="type-label px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              PRIORITY 1 · ZOHO BOOKS INTEGRATED
            </span>
          </div>
          <p className="type-body-sm text-slate-400 mt-1">
            Real-time ledger scanning, double-entry reconciliation, overdue risk wells & Google Sheets export
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsInvoiceModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold type-button text-xs transition-all flex items-center gap-2 shadow-[0_0_16px_rgba(0,242,254,0.3)] active:scale-95"
            aria-label="Create Raw Invoice via Zoho Books"
          >
            <span>+ DRAFT ZOHO INVOICE</span>
          </button>

          {/* Non-green Export Button */}
          <button
            onClick={() => exportToGoogleSheets('Invoices-Ledger', invoices)}
            className="px-4 py-2.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-interface type-button text-xs transition-all flex items-center gap-2 shadow-lg active:scale-95"
            aria-label="Export Invoices Ledger to Google Sheets"
          >
            <IconSheets size={15} color="#00f2fe" />
            <span>EXPORT TO SHEETS</span>
          </button>
        </div>
      </div>

      {/* Tesla Coil Scanning Arc */}
      <TeslaCoilScanner />

      {/* Primary Financial Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <CashFlowChart height={250} />
        </div>
        <div>
          <BankReconciliationStatusChart />
        </div>
      </div>

      <ReceivablesAgingChart height={220} />

      {/* Dotted Donut Chart - Invoice Status Breakdown (Video 02) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DottedDonutChart
          data={invoiceStatusData}
          title="Invoice Status Breakdown"
          subtitle="Click segment to filter ledger · Time-range filter available"
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          timeRanges={['7d', '30d', '90d', '1y']}
          height={300}
        />
        
        {/* Severity Donut - Overdue Risk Segmentation (Video 10) */}
        <SeverityDonut
          segments={severityData}
          title="Overdue Risk Severity"
          subtitle="Click segment for detailed recovery actions"
          height={300}
          onSegmentClick={(segment) => {
            console.log('Severity segment selected:', segment.label);
          }}
        />
      </div>

      {/* Singularity Risk Horizon */}
      <BlackHoleVortex
        overdueInvoices={overdueInvoices}
        onSelectEntity={(type, id) => {
          if (type === 'invoice') navigateTo('invoice_detail', id);
        }}
      />

      {overdueInvoices.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="type-label text-slate-400">
              ELECTRIC EEL DIRECT REMINDER DISCHARGE (REF #9)
            </h3>
            <span className="text-[10px] font-mono text-cyan-400">PULSE GENERATOR</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {overdueInvoices.map(inv => (
              <ElectricEelPulse
                key={inv.id}
                invoice={inv}
                onSendReminder={(id) => {
                  console.log(`Discharged reminder pulse for invoice ${id}`);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Cross-System Overdue Debt Ranking Engine with Connected Black Hole Intelligence */}
      <ConnectedIntelligenceNode
        id="intel-blackhole"
        referenceNumber={79}
        videoFilename="2026-10-20 15-55-45.mp4"
        title="Black Hole Gravitational Risk Well"
        conceptName="Singularity Debt Horizon Decay (Ref #79 / Ref #1)"
        businessContext="Actively calculates gravitational decay on 3 overdue receivables totaling ₹28,40,000.00. Employs event-horizon thresholding to halt credit expansion to delinquent accounts."
        impactMetrics={[
          { label: 'DELINQUENT CAPITAL', value: '₹28,40,000', trend: '3 Invoices' },
          { label: 'PULL HORIZON', value: '> 90 Days', trend: 'Critical' },
          { label: 'RECOVERY VELOCITY', value: '-2.4%/wk', trend: 'Accelerating' }
        ]}
        calculusDeriv="d(Recoverable Amount)/dt = -λ · e^(t / 30)"
        calculusEli5="Think of ice melting on a hot summer afternoon. If you grab it right away, you still have an ice cube. But the longer it sits in the heat, the faster it turns to water until nothing is left to save."
        actionButtonText="Discharge Gravitational Legal Notice (Sec 138 NI Act Gate)"
        actionBadge="Event Horizon"
        interactiveType="blackhole"
        onAction={() => {
          console.log('Discharged gravitational legal notice to overdue client roster');
        }}
      />

      <OverdueRecoveryRanker />

      {/* Statutory HSN / SAC & GSTIN Verification Gate */}
      <HsnVerificationGate />

      {/* Operational Ledgers Table Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
          {(['invoices', 'bills', 'bank', 'taxes'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-numeric font-bold uppercase transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,242,254,0.1)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab === 'invoices' ? `Invoices (${invoices.length})` : tab === 'bills' ? `Bills (${bills.length})` : tab === 'bank' ? `Bank Feeds (${bankTransactions.length})` : 'Tax Schedule'}
            </button>
          ))}
        </div>

        {activeTab === 'invoices' && (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#06080d]/90 shadow-xl">
            <table className="w-full text-left type-table">
              <thead className="bg-white/[0.03] text-slate-400 border-b border-white/10 type-label">
                <tr>
                  <th className="p-3.5">INVOICE #</th>
                  <th className="p-3.5">CLIENT / ENTERPRISE</th>
                  <th className="p-3.5">DATE</th>
                  <th className="p-3.5">DUE DATE</th>
                  <th className="p-3.5">TOTAL</th>
                  <th className="p-3.5">BALANCE</th>
                  <th className="p-3.5">STATUS</th>
                  <th className="p-3.5 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/[0.04] transition-colors">
                    <td 
                      onClick={() => navigateTo('invoice_detail', inv.id)}
                      className="p-3.5 font-bold text-cyan-400 cursor-pointer hover:underline"
                    >
                      {inv.invoice_number}
                    </td>
                    <td className="p-3.5 text-white font-interface font-medium">{inv.customer_name}</td>
                    <td className="p-3.5 text-slate-400">{formatDateUK(inv.date)}</td>
                    <td className="p-3.5 text-slate-400">{formatDateUK(inv.due_date)}</td>
                    <td className="p-3.5 font-bold text-white type-financial">{formatRupees(inv.total)}</td>
                    <td className="p-3.5 font-bold text-slate-300 type-financial">{formatRupees(inv.balance)}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 w-max ${
                        inv.status === 'paid'
                          ? 'bg-sky-950 text-sky-400 border-sky-500/40'
                          : inv.status === 'overdue'
                          ? 'bg-red-950 text-red-400 border-red-500/40'
                          : 'bg-amber-950 text-amber-400 border-amber-500/40'
                      }`}>
                        {inv.status === 'paid' && <IconCheck size={11} state="success" />}
                        {inv.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {inv.status !== 'paid' && (
                        <button
                          onClick={() => updateInvoiceStatus(inv.id, 'paid')}
                          className="px-3 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-[10px] font-interface font-bold active:scale-95 transition-all flex items-center gap-1 ml-auto"
                        >
                          <IconCheck size={11} state="success" />
                          <span>MARK PAID</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'bills' && (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#06080d]/90 shadow-xl">
            <table className="w-full text-left type-table">
              <thead className="bg-white/[0.03] text-slate-400 border-b border-white/10 type-label">
                <tr>
                  <th className="p-3.5">BILL #</th>
                  <th className="p-3.5">VENDOR</th>
                  <th className="p-3.5">DATE</th>
                  <th className="p-3.5">DUE DATE</th>
                  <th className="p-3.5">TOTAL</th>
                  <th className="p-3.5">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bills.map((b) => (
                  <tr key={b.id} className="hover:bg-white/[0.04] transition-colors">
                    <td className="p-3.5 font-bold text-purple-400">{b.bill_number}</td>
                    <td className="p-3.5 text-white font-interface font-medium">{b.vendor_name}</td>
                    <td className="p-3.5 text-slate-400">{formatDateUK(b.date)}</td>
                    <td className="p-3.5 text-slate-400">{formatDateUK(b.due_date)}</td>
                    <td className="p-3.5 font-bold text-white type-financial">{formatRupees(b.total)}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-slate-300 border border-white/10">
                        {b.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'bank' && (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#06080d]/90 shadow-xl">
            <table className="w-full text-left type-table">
              <thead className="bg-white/[0.03] text-slate-400 border-b border-white/10 type-label">
                <tr>
                  <th className="p-3.5">DATE</th>
                  <th className="p-3.5">ACCOUNT</th>
                  <th className="p-3.5">PAYEE / REF</th>
                  <th className="p-3.5">AMOUNT</th>
                  <th className="p-3.5">STATUS</th>
                  <th className="p-3.5 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bankTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.04] transition-colors">
                    <td className="p-3.5 text-slate-400">{formatDateUK(tx.date)}</td>
                    <td className="p-3.5 text-white font-interface font-medium">{tx.account_name}</td>
                    <td className="p-3.5 text-slate-300">{tx.payee} <span className="type-timestamp">({tx.reference_no})</span></td>
                    <td className={`p-3.5 font-bold type-financial ${tx.type === 'credit' ? 'text-sky-400' : 'text-red-400'}`}>
                      {tx.type === 'credit' ? '+' : '-'}{formatRupees(tx.amount)}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 w-max ${
                        tx.status === 'reconciled'
                          ? 'bg-sky-950 text-sky-400 border-sky-500/40'
                          : 'bg-amber-950 text-amber-400 border-amber-500/40'
                      }`}>
                        {tx.status === 'reconciled' && <IconCheck size={11} state="success" />}
                        {tx.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {tx.status !== 'reconciled' && (
                        <button
                          onClick={() => reconcileBankTransaction(tx.id)}
                          className="px-3 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[10px] font-interface font-bold active:scale-95 transition-all"
                        >
                          RECONCILE
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'taxes' && (
          <div className="p-6 rounded-2xl border border-white/10 bg-[#06080d]/90 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="type-h3 text-white">Q3/Q4 CORPORATE TAX PROVISIONS (GST & ADVANCE TAX)</h3>
              <span className="text-xs font-mono text-cyan-400">GOODS & SERVICES TAX</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-numeric">
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="type-label text-slate-400 block">ESTIMATED ADVANCE TAX</span>
                <span className="type-financial text-xl text-white">{formatRupees(4230000)}</span>
                <p className="type-timestamp text-slate-500">Due 15 Dec 2026</p>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="type-label text-slate-400 block">GST OUTWARD LIABILITY (COLLECTED)</span>
                <span className="type-financial text-xl text-white">{formatRupees(1480000)}</span>
                <p className="type-timestamp text-sky-400 flex items-center gap-1">
                  <IconCheck size={11} state="success" /> Ready for GSTR-3B filing
                </p>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="type-label text-slate-400 block">INPUT TAX CREDIT (ITC) ACCRUED</span>
                <span className="type-financial text-xl text-sky-400">{formatRupees(2850000)}</span>
                <p className="type-timestamp text-slate-500">Applied to Q4 offset</p>
              </div>
            </div>
          </div>
        )}

        {/* Statutory Reports: Lives in Zoho Books Tile (KARM Law M10) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <LivesInZohoBooksTile
            title="Balance Sheet & Profit & Loss"
            reportName="Balance Sheet & P&L"
            description="KARM OS never invents statutory accounting sums. Balance sheet and profit & loss figures are exclusively governed, balanced and maintained in Zoho Books."
          />
          <LivesInZohoBooksTile
            title="Trial Balance & Audit Trail"
            reportName="Trial Balance & Audit Trail"
            description="Official debit/credit balances, general ledger closures and statutory audit records reside in Zoho Books."
          />
        </div>
      </div>

      {/* Strict Zoho Books Raw Invoicing Modal (KARM Law) */}
      <ZohoRawInvoicingModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
      />
    </div>
  );
};

export default AccountingScreen;