import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupees } from '../../utils/formatters';
import {
  IconCheck,
  IconAlert,
  IconAccounting,
  IconProjects,
  IconFleet,
  IconTeslaCoil,
  IconFlux,
  IconChevronRight
} from '../common/Icons';
import { CalculusCard } from '../common/CalculusCard';
import { ConnectedIntelligenceNode } from '../common/ConnectedIntelligenceNode';
import { RearrangeableMetricCard } from '../common/RearrangeableMetricCard';

export const NowScreen: React.FC = () => {
  const { navigateTo, invoices, updateInvoiceStatus, triggerZohoLiveScan, zohoScanState } = useApp();

  // Action cards dismissal state
  const [approvedActionIds, setApprovedActionIds] = useState<string[]>([]);
  const [isBriefingExpanded, setIsBriefingExpanded] = useState<boolean>(true);

  // Rearrangeable metrics state (Video 07)
  const [metrics, setMetrics] = useState([
    { id: 'cash', label: 'TOTAL CASH BALANCE', value: '₹42,30,500.00', trend: '+₹1.24 L/day', trendDirection: 'up' as const, color: '#00f2fe', status: 'optimal' as const },
    { id: 'overdue', label: 'OVERDUE RECEIVABLES', value: '₹28,40,000.00', trend: '3 Past Grace', trendDirection: 'down' as const, color: '#f43f5e', status: 'critical' as const },
    { id: 'revenue', label: 'MONTH REVENUE (INVOICED)', value: '₹1,45,60,000.00', trend: '+23.2% vs Target', trendDirection: 'up' as const, color: '#facc15', status: 'optimal' as const },
    { id: 'gst', label: 'Q3 GST TAX LIABILITY', value: '₹14,80,000.00', trend: 'Due 20 Dec', trendDirection: 'neutral' as const, color: '#a855f7', status: 'warning' as const },
  ]);

  const handleMetricMove = (fromIndex: number, toIndex: number) => {
    setMetrics(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const markActionApproved = (id: string) => {
    setApprovedActionIds(prev => [...prev, id]);
  };

  // 13-Section Structured Operational Briefing Data
  const briefingSections = [
    { num: 1, title: 'Cash Position & Available Liquidity', detail: 'HDFC Current A/c balance sits at ₹42,30,500.00 verbatim string from Zoho.', cite: 'L14-22' },
    { num: 2, title: 'Overdue Collections Ranking', detail: '3 critical overdue accounts totaling ₹28,40,000.00 require follow-up.', cite: 'L24-38' },
    { num: 3, title: 'Today Site Dispatches (Haulage)', detail: '4 transit loads scheduled: 64MT precast piers to Site Gamma & Delhi Corridor.', cite: 'L40-52' },
    { num: 4, title: 'Diesel Burn & Fuel Variance', detail: 'Fleet fuel burn tracking at 3.4 km/L within 2.1% expected boundary.', cite: 'L54-66' },
    { num: 5, title: 'Milestone Accretion (Harvest)', detail: 'Pier Cap placement at Site Gamma reached 88% calcification verification.', cite: 'L68-79' },
    { num: 6, title: 'TMT Steel Inventory Threshold', detail: '16mm rebar stock at 42 tonnes. Automated replenishment trigger on standby.', cite: 'L81-93' },
    { num: 7, title: 'GST Compliance & Filing Gate', detail: 'Q3 Advance Tax provisional liability verified at ₹14,80,000.00.', cite: 'L95-104' },
    { num: 8, title: 'Biometric Attendance & Labor Swarm', detail: '84 personnel on duty across 3 active construction hubs. Cohesion 98%.', cite: 'L106-118' },
    { num: 9, title: 'Client Health Score Index', detail: 'UltraTech Infrastructure health score stable at 94/100.', cite: 'L120-131' },
    { num: 10, title: 'Subcontractor Bill Verification', detail: 'Earthmoving contractor bill #BILL-2026-042 awaiting engineer sign-off.', cite: 'L133-145' },
    { num: 11, title: 'Safety & Geotechnical Telemetry', detail: 'Zero soil displacement alerts registered at Site Alpha excavation pit.', cite: 'L147-158' },
    { num: 12, title: 'Cryptographic Merkle Audit Hash', detail: 'Previous state block #aud-104 anchored with hash e3b0c442... confirmed.', cite: 'L160-172' },
    { num: 13, title: 'Advisory Board Consensus Radar', detail: 'Chair synthesized guidance: Prioritize concrete pier settlement before rainfall.', cite: 'L174-188' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Screen Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="type-label text-cyan-400">MAILY ACTION INBOX</span>
            <span className="text-[10px] text-slate-500 font-mono">/</span>
            <span className="text-[10px] text-slate-400 font-mono">GEN-Z OPERATING COCKPIT</span>
          </div>
          <h1 className="type-h1 text-white mt-1">Now · Daily Command Stack</h1>
          <p className="type-body-sm text-slate-400">
            Real-time actionable decisions for Karm Enterprises. Single source of truth: Zoho Books API.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => triggerZohoLiveScan()}
            disabled={zohoScanState === 'scanning' || zohoScanState === 'syncing'}
            className="type-button px-4 py-2.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <IconTeslaCoil size={14} color="#00f2fe" />
            <span>Sync Live Zoho Books</span>
          </button>
        </div>
      </div>

      {/* Rearrangeable Metric Cards (Video 07) - Replaces static KPI grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="type-h3 text-white">Live Treasury Metrics</h3>
          <span className="type-label text-slate-500 text-[10px]">Drag grip ⋮⋮ to reorder · Keyboard: Tab + Arrows</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" role="list" aria-label="Rearrangeable treasury metrics">
          {metrics.map((metric, index) => (
            <RearrangeableMetricCard
              key={metric.id}
              data={metric}
              index={index}
              onMove={handleMetricMove}
              actionLabel="Details"
              onAction={() => navigateTo('ledger')}
            />
          ))}
        </div>
      </div>

      {/* Universal Calculus ELI5 Card Embedded on Cash Inflow */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#090e18] via-[#06080d] to-[#04060a] border border-cyan-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <IconAccounting size={20} />
            </div>
            <div>
              <span className="type-label text-cyan-400 text-[10px] block">THE KARM LAW · ZOHO BOOKS VERBATIM</span>
              <h2 className="type-h3 text-white">Live Enterprise Treasury State</h2>
            </div>
          </div>
          <span className="type-label px-2.5 py-1 rounded-lg bg-sky-950/70 border border-sky-500/30 text-sky-400 flex items-center gap-1.5 self-start md:self-auto">
            <IconCheck size={12} state="success" /> Zero App Arithmetic
          </span>
        </div>

        <div className="pt-5 mt-5 border-t border-white/5">
          <CalculusCard
            title="Cash Inflow Velocity & Acceleration"
            metricLabel="Treasury Dynamics"
            rateOfChange="+₹1.24 L / day"
            plainStory="Think of your bank balance like water filling up a large bucket with a garden hose. How high the water is right now is your total cash balance. How fast the water is squirting out of the hose is the first derivative, and whether someone is opening the tap wider is the acceleration!"
            formalDerivative="d(Cash)/dt = Inflow(t) - Outflow(t) = +₹1,24,000 / day"
            trend="accelerating"
          />
        </div>
      </div>

      {/* Connected Command Center Neural Mesh Node */}
      <ConnectedIntelligenceNode
        id="intel-neuralmesh"
        referenceNumber={76}
        videoFilename="2026-10-20 15-39-05.mp4"
        title="Command Center Neural Mesh & Ingestion"
        conceptName="Multi-Node Operational Synthesis (Ref #76 / Ref #1)"
        businessContext="Synthesizes live telemetry across quarry weighbridges, 14 transit vehicles, Zoho Books invoices, and biometric site attendance into a singular executive decision matrix."
        impactMetrics={[
          { label: 'DECISION VELOCITY', value: '< 60 Sec', trend: 'Ultra-fast' },
          { label: 'INGESTION LATENCY', value: 'Instant', trend: 'Real-time' },
          { label: 'ACTION FOCUS', value: '3 Priorities', trend: 'Focused' }
        ]}
        calculusDeriv="d(Action Efficiency)/dt = ∇ · (Telemetry Synthesis Vector)"
        calculusEli5="Like having a smart cockpit in a spaceship. Instead of running around twenty different rooms to check fuel, engines, and cargo, all the dials talk to each other and only ring a bell when you need to make a quick decision."
        actionButtonText="Discharge Morning Operational Directives"
        actionBadge="Neural Mesh"
        interactiveType="teslacoil"
        onAction={() => {
          console.log('Discharged morning operational directives across all sites');
        }}
      />

      {/* Daily 8:00 AM Operational Briefing (13 Structured Sections with Line Citations) */}
      <div className="p-6 rounded-3xl bg-[#070a10]/95 border border-white/10 space-y-4 shadow-xl">
        <div 
          onClick={() => setIsBriefingExpanded(!isBriefingExpanded)}
          className="flex items-center justify-between cursor-pointer select-none border-b border-white/10 pb-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <IconFlux size={17} color="#c084fc" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="type-label text-purple-400 text-[10px]">DAILY 8:00 AM BRIEFING</span>
                <span className="type-timestamp text-slate-500">· 13 Operational Sections</span>
              </div>
              <h3 className="type-h3 text-white">Automated Morning Executive Dispatch</h3>
            </div>
          </div>

          <button className="type-button text-xs text-cyan-400 hover:underline flex items-center gap-1">
            <span>{isBriefingExpanded ? 'Collapse' : 'Expand All (13)'}</span>
            <IconChevronRight size={14} className={`transition-transform ${isBriefingExpanded ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {isBriefingExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {briefingSections.map((sec) => (
              <div
                key={sec.num}
                className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1 hover:border-purple-500/30 transition-all"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="type-label text-purple-300 font-bold">
                    {sec.num}. {sec.title}
                  </span>
                  <span className="type-timestamp text-slate-500 font-mono text-[9px] px-1.5 py-0.5 rounded bg-white/5">
                    Citation: {sec.cite}
                  </span>
                </div>
                <p className="type-body-sm text-slate-300 text-xs leading-relaxed">
                  {sec.detail}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* The Top 3 High-Priority Maily Action Cards */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="type-h3 text-white">Critical Pending Actions (Under 1 Minute)</h3>
          <span className="type-label text-slate-500 text-[10px]">TAP TO APPROVE OR INSPECT</span>
        </div>

        {/* Action 1: Overdue Inward Payment Approval */}
        {!approvedActionIds.includes('action-1') && (
          <div className="p-5 rounded-3xl bg-[#090d16] border border-rose-500/30 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="type-label px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30">
                  ACTION 1 · OVERDUE INWARD PAYMENT
                </span>
                <span className="type-flux-id text-white font-bold">INV-KE-270031</span>
              </div>
              <h4 className="type-h4 text-white">UltraTech Infrastructure Ltd · Outstanding Recovery</h4>
              <p className="type-body-sm text-slate-300">
                Zoho Books records payment advice for <strong className="text-white">₹64,944.84</strong>. Awaiting final officer approval to mark invoice reconciled.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => {
                  updateInvoiceStatus('inv-1', 'paid');
                  markActionApproved('action-1');
                }}
                className="type-button px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 to-cyan-400 hover:from-sky-300 hover:to-cyan-300 text-black font-bold text-xs transition-all active:scale-95 shadow-[0_0_15px_rgba(56,189,248,0.3)]"
              >
                Approve Payment (₹64,944.84)
              </button>
              <button
                onClick={() => navigateTo('ledger')}
                className="type-button px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs"
              >
                View Ledger →
              </button>
            </div>
          </div>
        )}

        {/* Action 2: Ready-Mix Pier Dispatch Clearance */}
        {!approvedActionIds.includes('action-2') && (
          <div className="p-5 rounded-3xl bg-[#090d16] border border-amber-500/30 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="type-label px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
                  ACTION 2 · HAULAGE DISPATCH CLEARANCE
                </span>
                <span className="type-flux-id text-white font-bold">TRIP-MH12-9410</span>
              </div>
              <h4 className="type-h4 text-white">Vehicle MH-12-QZ-9410 · 32MT Precast Pier Dispatch</h4>
              <p className="type-body-sm text-slate-300">
                Slime Mold autonomous route calculated: 480km to Site Gamma. Fuel trip margin approved at <strong className="text-white">₹18,420.00</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => markActionApproved('action-2')}
                className="type-button px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-bold text-xs transition-all active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
              >
                Authorize Dispatch Gate Pass
              </button>
              <button
                onClick={() => navigateTo('routes')}
                className="type-button px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs"
              >
                Route Map →
              </button>
            </div>
          </div>
        )}

        {/* Action 3: Material Shortage Reorder */}
        {!approvedActionIds.includes('action-3') && (
          <div className="p-5 rounded-3xl bg-[#090d16] border border-purple-500/30 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="type-label px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
                  ACTION 3 · REORDER REPLENISHMENT
                </span>
                <span className="type-flux-id text-white font-bold">STOCK-TMT-16MM</span>
              </div>
              <h4 className="type-h4 text-white">High-Yield TMT Steel Bars · Site Alpha Warehouse</h4>
              <p className="type-body-sm text-slate-300">
                Current inventory at 42 tonnes (safety buffer: 50 tonnes). Reorder voucher drafted for Jindal Steel.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => markActionApproved('action-3')}
                className="type-button px-4 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 font-bold text-xs transition-all active:scale-95"
              >
                Sign Reorder Voucher
              </button>
              <button
                onClick={() => navigateTo('terrain')}
                className="type-button px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs"
              >
                Stockyard →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NowScreen;