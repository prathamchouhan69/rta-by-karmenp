import React, { useState } from 'react';
import { IconCheck, IconFlux, IconAlert, IconChevronRight } from '../common/Icons';

export interface AdvisorItem {
  id: string;
  name: string;
  role: string;
  domain: string;
  position: 'positive' | 'caution' | 'critical';
  quote: string;
  rationale: string;
}

const ADVISORY_COUNCIL: AdvisorItem[] = [
  {
    id: 'adv-1',
    name: 'Dr. Vikramaditya Joshi',
    role: 'Chief Structural Engineer',
    domain: 'Engineering & Pier Integrity',
    position: 'positive',
    quote: 'Precast Pier Cap 32MT concrete achieves 94% tensile cure. Site Gamma load testing ready.',
    rationale: 'Core strength exceeds M45 standard by 3.2 MPa.',
  },
  {
    id: 'adv-2',
    name: 'Harpreet Singh',
    role: 'Fleet & Heavy Haulage Director',
    domain: 'Transit & Route Efficiency',
    position: 'caution',
    quote: 'Slime mold bypasses Mumbai-Pune expressway toll bottlenecks. Diesel consumption within 3.4 km/L.',
    rationale: 'Monsoon drainage work near Panvel requires 15 km detour; budget +₹1,400 diesel.',
  },
  {
    id: 'adv-3',
    name: 'Advocate Radhika Menon',
    role: 'Statutory GST & Corporate Counsel',
    domain: 'Tax Compliance & HSN Gates',
    position: 'positive',
    quote: 'HSN 6810 and 9954 verified with GSTN. Q3 tax liability calculation matches Zoho Books strings exactly.',
    rationale: 'Inter-state IGST place-of-supply clean with zero disputed input tax credits.',
  },
  {
    id: 'adv-4',
    name: 'Ananya Deshmukh, CFA',
    role: 'Working Capital Strategist',
    domain: 'Cash Flow & Liquidity',
    position: 'critical',
    quote: 'Accelerate recovery of ₹28.40 L overdue debt before approving new CAPEX purchases.',
    rationale: 'Working capital days stretched to 42 days; prompt collection recovers ₹12 L within 7 days.',
  },
  {
    id: 'adv-5',
    name: 'Captain Suresh Nair',
    role: 'Site Safety & Environmental Auditor',
    domain: 'HSE & Ground Safety',
    position: 'positive',
    quote: 'Zero incident days across 12 active sites. Safety induction completed for 84 workers.',
    rationale: 'Biometric shift records verified against OSHA compliance standards.',
  },
  {
    id: 'adv-6',
    name: 'Mohit Agarwal',
    role: 'Raw Materials Procurement Lead',
    domain: 'TMT Steel & Cement Sourcing',
    position: 'caution',
    quote: 'Lock in 16mm TMT rebar pricing now before anticipated 4% regional price hike.',
    rationale: 'Jindal Steel quotation valid for next 48 hours; order 45 MT buffer stock.',
  },
  {
    id: 'adv-7',
    name: 'Devika Sharma',
    role: 'Labor Relations & Swarm Coordinator',
    domain: 'Workforce Allocation',
    position: 'positive',
    quote: 'Starling murmuration algorithm rebalanced 14 steel fixers to Site Beta without overtime cost.',
    rationale: 'Productivity index up 8.4% week-on-week.',
  },
  {
    id: 'adv-8',
    name: 'Rajeshwar Patil',
    role: 'Contracts & Tender Arbitrator',
    domain: 'Tender SLAs & Penalties',
    position: 'positive',
    quote: 'Highway Tender contract clauses protect against rain delays via Section 14 force majeure.',
    rationale: 'No liquidity damages risk on Phase 2 handover.',
  },
  {
    id: 'adv-9',
    name: 'K. S. Narayanan',
    role: 'Fleet Mechanical & Telemetry Lead',
    domain: 'Engine Health & Maintenance',
    position: 'positive',
    quote: '18 vehicles reporting live CAN-bus metrics. Scheduled oil analysis clear for all prime movers.',
    rationale: 'Mean Time Between Failures (MTBF) tracking at 480 operating hours.',
  },
  {
    id: 'adv-10',
    name: 'Dr. Meera Sen',
    role: 'Geotechnical Soil Engineer',
    domain: 'Subsurface Ground Mechanics',
    position: 'positive',
    quote: 'Bearing capacity at Site Alpha pier foundations exceeds 350 kN/m².',
    rationale: 'Pore pressure sensors indicate stable ground consolidation.',
  },
  {
    id: 'adv-11',
    name: 'Gaurav Kulkarni',
    role: 'Quality Assurance & Lab Auditor',
    domain: 'NDT Concrete Testing',
    position: 'positive',
    quote: 'Ultrasonic pulse velocity testing on precast blocks confirms zero voids.',
    rationale: 'Compressive test certificates generated and filed to Cloud Drive.',
  },
  {
    id: 'adv-12',
    name: 'Pradeep Verma',
    role: 'Enterprise Risk & Claims Arbitrator',
    domain: 'Asset Coverage & Contingencies',
    position: 'positive',
    quote: 'Comprehensive transit insurance covers ₹4.5 Cr in-transit precast components.',
    rationale: 'Deductible threshold set at standard ₹50,000.',
  },
];

export const AdvisoryBoardPanel: React.FC = () => {
  const [activeAdvisor, setActiveAdvisor] = useState<AdvisorItem>(ADVISORY_COUNCIL[0]);
  const [filterDomain, setFilterDomain] = useState<string>('all');

  const filteredAdvisors = ADVISORY_COUNCIL.filter(a => {
    if (filterDomain === 'all') return true;
    return a.position === filterDomain;
  });

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-[#06080d]/95 border border-white/10 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc]" />
            <span className="type-label text-purple-400">12-MEMBER MULTI-DISCIPLINARY COUNCIL</span>
          </div>
          <h2 className="type-h2 text-white mt-1">Karm Advisory Board & Chair Synthesis</h2>
          <p className="type-body-sm text-slate-400">
            Multi-perspective evaluation across Civil Engineering, Statutory Law, Transport & Cash Recovery.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10 self-start md:self-auto text-xs font-mono">
          <button
            onClick={() => setFilterDomain('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterDomain === 'all' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            All (12)
          </button>
          <button
            onClick={() => setFilterDomain('critical')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterDomain === 'critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Critical
          </button>
          <button
            onClick={() => setFilterDomain('caution')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterDomain === 'caution' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Caution
          </button>
        </div>
      </div>

      {/* Chair Synthesis Directive Box */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-cyan-950/30 to-black/60 border border-purple-500/30 space-y-2.5 shadow-inner">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <IconFlux size={14} />
            </div>
            <span className="type-label text-purple-300">CHAIR SYNTHESIS · CONFLICTS & RANKED RECOMMENDATIONS</span>
          </div>
          <span className="type-label px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-500/30">
            Unanimous Quorum
          </span>
        </div>

        <p className="type-body text-white font-medium text-xs md:text-sm leading-relaxed">
          "Reconciling Working Capital with Procurement: While Engineering confirms concrete curing is ready, Procurement should lock in the 45 MT TMT steel rebar buffer today before regional hikes. Simultaneously, activate Electric Eel debtor notifications to recover ₹28.40 L in overdue balances to fund the steel purchase without drawing working capital credit."
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2 text-[11px] font-mono text-slate-400 border-t border-white/5">
          <span>Priority 1: Recover Overdue Debt</span>
          <span>·</span>
          <span>Priority 2: Rebar Order Sign-off</span>
          <span>·</span>
          <span>Priority 3: Pier Cap Site Gamma Dispatch</span>
        </div>
      </div>

      {/* 12 Advisors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredAdvisors.map(adv => (
          <div
            key={adv.id}
            onClick={() => setActiveAdvisor(adv)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 select-none ${
              activeAdvisor.id === adv.id
                ? 'bg-purple-950/30 border-purple-400 shadow-[0_0_15px_rgba(192,132,252,0.2)]'
                : 'bg-black/40 border-white/5 hover:border-white/15'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="type-h4 text-white font-semibold text-xs">{adv.name}</h4>
                <p className="type-timestamp text-purple-300/80">{adv.role}</p>
              </div>

              <span className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase border ${
                adv.position === 'critical'
                  ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                  : adv.position === 'caution'
                  ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                  : 'bg-sky-950/80 text-sky-300 border-sky-500/40'
              }`}>
                {adv.position}
              </span>
            </div>

            <p className="type-body-sm text-slate-300 text-xs italic line-clamp-2">
              "{adv.quote}"
            </p>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>{adv.domain}</span>
              <span className="text-cyan-400 flex items-center gap-0.5">
                Inspect <IconChevronRight size={10} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
