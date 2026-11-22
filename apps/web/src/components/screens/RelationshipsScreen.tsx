import React from 'react';
import { useApp } from '../../context/AppContext';
import { MycorrhizalNetwork } from '../nature/MycorrhizalNetwork';
import { ConnectedIntelligenceNode } from '../common/ConnectedIntelligenceNode';
import { formatRupees } from '../../utils/formatters';
import { IconCRM, IconCheck } from '../common/Icons';

export const RelationshipsScreen: React.FC = () => {
  const { clients, navigateTo } = useApp();

  const totalPipeline = clients.reduce((acc, c) => acc + Number(c.deal_value), 0);
  const avgHealth = Math.round(clients.reduce((acc, c) => acc + c.health_score, 0) / clients.length);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Canonical Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="type-label text-cyan-400">CANONICAL SECTION 8</span>
            <span className="text-[10px] text-slate-500 font-mono">/</span>
            <span className="text-[10px] text-slate-400 font-mono">CLIENT & SUBCONTRACTOR NETWORK</span>
          </div>
          <h1 className="type-h1 text-white">Ecosystems · Clients & Network Symbiosis</h1>
          <p className="type-body-sm text-slate-400 mt-1 max-w-3xl">
            Mycorrhizal fungal mesh modeling reciprocal trade credit, institutional relationship health scores & multi-year infrastructure contract pipelines.
          </p>
        </div>

        <button
          onClick={() => {}}
          className="type-button px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-xs transition-all active:scale-95 shadow-[0_0_15px_rgba(0,242,254,0.3)] self-start md:self-auto"
        >
          + Add Client Account
        </button>
      </div>

      {/* Ecosystem KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#080d16] border border-white/10 space-y-1">
          <span className="type-label text-slate-400 block">TOTAL ACTIVE PIPELINE</span>
          <span className="type-financial text-xl md:text-2xl text-white font-bold block">
            {formatRupees(totalPipeline, true)}
          </span>
          <p className="type-timestamp text-cyan-400">{clients.length} Enterprise Clients</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#080d16] border border-white/10 space-y-1">
          <span className="type-label text-slate-400 block">NETWORK HEALTH INDEX</span>
          <span className="type-financial text-xl md:text-2xl text-sky-400 font-bold block">
            {avgHealth}%
          </span>
          <p className="type-timestamp text-sky-300">Reciprocal Symbiosis High</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#080d16] border border-white/10 space-y-1">
          <span className="type-label text-slate-400 block">RETENTION VELOCITY</span>
          <span className="type-financial text-xl md:text-2xl text-purple-300 font-bold block">
            98.5%
          </span>
          <p className="type-timestamp text-slate-400">Zero Contract Churn</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#080d16] border border-white/10 space-y-1">
          <span className="type-label text-slate-400 block">SETTLEMENT HONOUR RATE</span>
          <span className="type-financial text-xl md:text-2xl text-emerald-400 font-bold block">
            94.1%
          </span>
          <p className="type-timestamp text-emerald-300">Within 45 Days Term</p>
        </div>
      </div>

      {/* Connected Mycorrhizal Symbiosis Intelligence Node */}
      <ConnectedIntelligenceNode
        id="intel-mycorrhizal"
        referenceNumber={77}
        videoFilename="2026-10-20 15-47-07.mp4"
        title="Mycorrhizal Fungal Network & Ecosystem Symbiosis"
        conceptName="Glomeromycota Reciprocal Exchange Model (Ref #77)"
        businessContext="Calculates multi-nodal trade relationships between Karm Enterprises and 5 major infrastructure developers. Just as underground mycelial threads trade soil minerals for plant sugars, this node dynamically optimizes credit limits based on reciprocal payment velocity."
        impactMetrics={[
          { label: 'SYMBIOSIS NODES', value: `${clients.length * 12} Connections`, trend: 'Active' },
          { label: 'HEALTH VELOCITY', value: `${avgHealth}% Index`, trend: 'Healthy' },
          { label: 'PIPELINE FLOW', value: formatRupees(totalPipeline, true), trend: 'Locked' }
        ]}
        calculusDeriv="d(Trust Capital)/dt = α · (P_received) - β · (Overdue Days)"
        calculusEli5="Like trees in an ancient forest sharing nutrients underground through mushroom roots. When one client needs more concrete before their government bill clears, the network balances their credit safely because they always settle reliably."
        actionButtonText="Synchronize Mycelial Credit Limits with Zoho Books"
        actionBadge="Mycelial Mesh"
        interactiveType="slimemold"
        onAction={() => {
          console.log('Synchronized client ecosystem credit terms with Zoho Books');
        }}
      />

      {/* Living Mycorrhizal Canvas */}
      <MycorrhizalNetwork connectionsCount={clients.length * 12} healthScore={avgHealth} />

      {/* Client Portfolio Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="type-h3 text-white">Client Portfolio & Trade Terms</h3>
          <span className="type-timestamp text-slate-400">Sorted by Relationship Health</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map(c => (
            <div
              key={c.id}
              onClick={() => navigateTo('client_detail', c.id)}
              className="p-5 rounded-2xl bg-[#080d16] border border-white/10 hover:border-cyan-400/50 cursor-pointer transition-all space-y-3 shadow-lg group select-none"
              role="button"
              tabIndex={0}
              aria-label={`Client account ${c.name}`}
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h4 className="text-sm font-interface font-semibold text-white group-hover:text-cyan-300 transition-colors">
                    {c.name}
                  </h4>
                  <p className="type-timestamp text-slate-400 mt-0.5">{c.contact_person}</p>
                </div>
                <span className={`type-label px-2 py-0.5 rounded text-[10px] ${
                  c.health_score > 90 
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30' 
                    : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                }`}>
                  {c.health_score}% Health
                </span>
              </div>

              <div className="text-xs font-mono text-slate-300 bg-black/40 rounded-xl p-2.5 border border-white/5 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="text-white truncate max-w-[170px]">{c.email}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-white/5">
                  <span className="text-slate-400">Deal Pipeline:</span>
                  <span className="type-financial text-cyan-300 font-bold">{formatRupees(c.deal_value, true)}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1.5 text-sky-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_#38bdf8]" />
                  Verified Partner
                </span>
                <span className="group-hover:text-cyan-400 transition-colors">Inspect Ledger →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
