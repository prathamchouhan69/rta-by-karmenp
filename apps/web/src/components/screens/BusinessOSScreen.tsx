import React from 'react';
import { CashFlowChart } from '../charts/CashFlowChart';
import { GanttChart } from '../charts/GanttChart';
import { TeslaCoilScanner } from '../nature/TeslaCoilScanner';
import { SlimeMoldNetwork } from '../nature/SlimeMoldNetwork';
import { AntColonyDistribution } from '../nature/AntColonyDistribution';
import { useApp } from '../../context/AppContext';
import { IconAccounting, IconProjects, IconFleet, IconHR, IconFiles, IconNature, IconCheck } from '../common/Icons';
import { TamperEvidentAuditLog } from '../operations/TamperEvidentAuditLog';

export const BusinessOSScreen: React.FC = () => {
  const { navigateTo } = useApp();

  const coreModules = [
    { id: 'accounting', name: 'Accounting & Ledger', icon: IconAccounting, desc: 'Zoho Books double-entry ledger, automated reconciliation & GST computation.', stat: '₹2.45 Cr Volume' },
    { id: 'projects', name: 'Projects & Tasks', icon: IconProjects, desc: 'Critical-path Gantt schedules, site work distribution & milestone velocity.', stat: '12 Active Sites' },
    { id: 'transportation', name: 'Fleet & Transit', icon: IconFleet, desc: 'Telemetry tracking, fuel combustion analytics & turnaround optimization.', stat: '18 Vehicles Online' },
    { id: 'hr', name: 'Workforce & Talent', icon: IconHR, desc: 'Payroll processing, biometric attendance records & labor deployment.', stat: '84 Personnel' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="type-flux-technical text-cyan-400">ORGANIC-TECH ARCHITECTURE</span>
          <span className="text-[10px] text-slate-500 font-mono">/</span>
          <span className="text-[10px] text-slate-400 font-mono">NEURAL CORE ACTIVE</span>
        </div>
        <h1 className="type-h2 text-white">Business Operating System Architecture</h1>
        <p className="type-body-sm text-slate-400 mt-1 max-w-3xl">
          Unified command architecture synthesizing Indian industrial physical operations with living biomimetic intelligence models.
        </p>
      </div>

      {/* Living Core Scanner */}
      <TeslaCoilScanner />

      {/* Core Enterprise Pillars */}
      <div>
        <h2 className="type-h3 text-white mb-4">Core Operational Pillars</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {coreModules.map(m => {
            const IconComponent = m.icon;
            return (
              <div
                key={m.id}
                onClick={() => navigateTo(m.id as any)}
                className="p-5 rounded-2xl bg-[#070a0e]/95 border border-white/[0.08] hover:border-cyan-500/50 hover:bg-[#090e15] transition-all cursor-pointer group flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-105 transition-transform">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <h3 className="type-body font-semibold text-white group-hover:text-cyan-300 transition-colors">
                    {m.name}
                  </h3>
                  <p className="type-caption text-slate-400 mt-1 leading-relaxed">
                    {m.desc}
                  </p>
                </div>
                <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between">
                  <span className="type-flux-technical text-cyan-400">{m.stat}</span>
                  <span className="text-[10px] font-mono text-sky-400 flex items-center gap-1">
                    <IconCheck className="w-3 h-3" /> Live
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dual Telemetry Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CashFlowChart />
        <GanttChart />
      </div>

      {/* Biomimetic Distribution Models */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AntColonyDistribution />
        <SlimeMoldNetwork />
      </div>

      {/* Cryptographic Operational Audit Log */}
      <TamperEvidentAuditLog />
    </div>
  );
};
