import React from 'react';
import { useApp } from '../../context/AppContext';
import { TeslaCoilScanner } from '../nature/TeslaCoilScanner';
import { BlackHoleVortex } from '../nature/BlackHoleVortex';
import { CashFlowChart } from '../charts/CashFlowChart';
import { RevenueTrendLine } from '../charts/RevenueTrendLine';
import { IconAccounting, IconProjects, IconFleet, IconCheck } from '../common/Icons';
import { formatRupees } from '../../utils/formatters';

export const HomeCommandCenter: React.FC = () => {
  const { invoices, projects, tasks, vehicles, navigateTo } = useApp();

  const overdueInvoices = invoices.filter(inv => inv.status === 'overdue');
  const delayedProjects = projects.filter(p => p.progress < 50);

  // Indian enterprise figures (₹ in Lakhs & Crores)
  const annualRunRate = 48500000; // ₹4.85 Cr
  const netLiquidity = 19420000;  // ₹1.94 Cr
  const openTasksCount = tasks.filter(t => t.status !== 'done').length;
  const activeFleet = vehicles.filter(v => v.status === 'in_transit').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Cockpit Top Telemetry Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="type-h1 tracking-tight text-white">
              KARM COMMAND CENTER
            </h1>
            <span className="type-label px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              COCKPIT ACTIVE
            </span>
          </div>
          <p className="type-body-sm text-slate-400 mt-1">
            Global Real-time Business OS · Unified telemetry across Finance, Projects, Logistics & Workforce
          </p>
        </div>

        {/* OS Health Index (Non-green Sky & Platinum Seal) */}
        <div className="flex items-center gap-3 bg-[#0a0d14]/90 px-4 py-2.5 rounded-2xl border border-white/10 shadow-lg">
          <div className="w-10 h-10 rounded-full border-2 border-sky-400 flex items-center justify-center font-numeric font-bold text-sm text-sky-300 shadow-[0_0_14px_rgba(56,189,248,0.35)]">
            94
          </div>
          <div className="text-left font-numeric">
            <span className="type-label text-slate-400 block">OS HEALTH INDEX</span>
            <span className="text-xs font-bold text-white flex items-center gap-1">
              <IconCheck size={13} state="success" />
              <span>OPTIMAL FLOW</span>
            </span>
          </div>
        </div>
      </div>

      {/* KPI Metric Quadrant */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Metric 1: Annual Run-Rate */}
        <div 
          onClick={() => navigateTo('accounting')} 
          className="p-4 rounded-2xl bg-[#090d14]/90 border border-white/10 hover:border-cyan-400/50 cursor-pointer transition-all space-y-2 group shadow-md"
          role="button"
          tabIndex={0}
          aria-label="Annual Run-rate details"
        >
          <div className="flex justify-between items-center type-label text-slate-400">
            <span>ANNUAL RUN-RATE</span>
            <IconAccounting size={16} className="text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="type-financial text-xl md:text-2xl text-white">
            {formatRupees(annualRunRate, true)}
          </div>
          <div className="type-timestamp text-sky-400 flex items-center gap-1 font-numeric">
            <span>↑ +18.4%</span>
            <span className="text-slate-400">vs target</span>
          </div>
        </div>

        {/* Metric 2: Net Liquidity (Cash Flow) */}
        <div 
          onClick={() => navigateTo('accounting')} 
          className="p-4 rounded-2xl bg-[#090d14]/90 border border-white/10 hover:border-cyan-400/50 cursor-pointer transition-all space-y-2 group shadow-md"
          role="button"
          tabIndex={0}
          aria-label="Net liquidity details"
        >
          <div className="flex justify-between items-center type-label text-slate-400">
            <span>NET LIQUIDITY (CASH)</span>
            <span className="text-sky-400 type-label text-[9px] flex items-center gap-1">
              <IconCheck size={11} state="success" /> ZOHO SYNCED
            </span>
          </div>
          <div className="type-financial text-xl md:text-2xl text-cyan-300">
            {formatRupees(netLiquidity, true)}
          </div>
          <div className="type-timestamp text-slate-400">
            Bank Feeds Reconciled 97.6%
          </div>
        </div>

        {/* Metric 3: Active Projects */}
        <div 
          onClick={() => navigateTo('projects')} 
          className="p-4 rounded-2xl bg-[#090d14]/90 border border-white/10 hover:border-purple-400/50 cursor-pointer transition-all space-y-2 group shadow-md"
          role="button"
          tabIndex={0}
          aria-label="Active projects details"
        >
          <div className="flex justify-between items-center type-label text-slate-400">
            <span>ACTIVE PROJECTS</span>
            <IconProjects size={16} className="text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="type-financial text-xl md:text-2xl text-white">
            {projects.length} Active
          </div>
          <div className="type-timestamp text-purple-300">
            {openTasksCount} pending tasks
          </div>
        </div>

        {/* Metric 4: Fleet Utilization */}
        <div 
          onClick={() => navigateTo('transportation')} 
          className="p-4 rounded-2xl bg-[#090d14]/90 border border-white/10 hover:border-amber-400/50 cursor-pointer transition-all space-y-2 group shadow-md"
          role="button"
          tabIndex={0}
          aria-label="Fleet utilization details"
        >
          <div className="flex justify-between items-center type-label text-slate-400">
            <span>FLEET UTILIZATION</span>
            <IconFleet size={16} className="text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="type-financial text-xl md:text-2xl text-white">
            {activeFleet} in Transit
          </div>
          <div className="type-timestamp text-amber-300">
            Slime Mold Routes Active
          </div>
        </div>
      </div>

      {/* Tesla Coil Live Zoho Scanner */}
      <TeslaCoilScanner onScanComplete={() => {}} />

      {/* Primary Analytics Waves */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CashFlowChart height={240} />
        <RevenueTrendLine height={240} />
      </div>

      {/* Singularity Risk Horizon */}
      <BlackHoleVortex
        overdueInvoices={overdueInvoices}
        delayedProjects={delayedProjects}
        onSelectEntity={(type, id) => {
          if (type === 'invoice') navigateTo('invoice_detail', id);
          if (type === 'project') navigateTo('project_detail', id);
        }}
      />
    </div>
  );
};
