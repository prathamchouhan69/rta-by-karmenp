import React from 'react';
import { Invoice, Project } from '../../data/mockData';
import { IconAlert, IconBlackHole } from '../common/Icons';

export interface BlackHoleVortexProps {
  overdueInvoices: Invoice[];
  delayedProjects?: Project[];
  onSelectEntity?: (type: 'invoice' | 'project', id: string) => void;
}

export const BlackHoleVortex: React.FC<BlackHoleVortexProps> = ({
  overdueInvoices,
  delayedProjects = [],
  onSelectEntity
}) => {
  // KARM Law: zero client-side money arithmetic
  const trappedDisplay = overdueInvoices.length === 1
    ? (overdueInvoices[0]?.balance_formatted || `₹${overdueInvoices[0]?.balance}`)
    : `${overdueInvoices.length} Overdue Records`;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-b from-[#120509]/95 via-[#0b080f]/90 to-[#07090e]/95 p-5 shadow-[0_0_40px_rgba(255,0,85,0.1)]">
      {/* Visual Accretion Disk Graphic */}
      <div className="absolute -right-16 -top-16 w-64 h-64 pointer-events-none opacity-40">
        <div className="w-full h-full rounded-full border border-red-500/40 anim-blackhole-vortex" style={{ borderStyle: 'dashed' }} />
        <div className="absolute inset-4 rounded-full border border-purple-500/30 anim-blackhole-vortex" style={{ animationDirection: 'reverse', animationDuration: '10s' }} />
        <div className="absolute inset-12 rounded-full bg-black shadow-[0_0_40px_#ff0055]" />
      </div>

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400 shadow-[0_0_15px_#ff0055]">
              <IconBlackHole size={22} className="anim-blackhole-vortex" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-white tracking-wide">
                  BLACK HOLE GRAVITATIONAL RISK CENTER
                </h3>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-500/40">
                  Ref #140 Event Horizon
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pulls overdue capital and delayed milestones into the high-mass risk singularity
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Trapped Capital Mass</span>
            <span className="text-base font-extrabold font-mono text-red-400 tracking-tight">
              {trappedDisplay}
            </span>
          </div>
        </div>

        {/* Gravitational Item Wells */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>EVENT HORIZON CROSSINGS ({overdueInvoices.length + delayedProjects.length})</span>
            <span className="text-red-400/80">GRAVITATIONAL ACCRETION INTENSITY: CRITICAL</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {overdueInvoices.map((inv) => (
              <div
                key={inv.id}
                onClick={() => onSelectEntity && onSelectEntity('invoice', inv.id)}
                className="group p-3 rounded-xl bg-black/60 border border-red-500/30 hover:border-red-400 hover:bg-red-950/20 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <div>
                    <div className="text-xs font-mono font-bold text-white group-hover:text-red-300 transition-colors">
                      {inv.invoice_number} · {inv.customer_name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Overdue by {inv.due_date} · Aging category 30-60d
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold font-mono text-red-400">
                    {inv.balance_formatted || `₹${inv.balance}`}
                  </div>
                  <span className="text-[9px] font-mono text-red-300/70 group-hover:underline">
                    Remind Pulse →
                  </span>
                </div>
              </div>
            ))}

            {delayedProjects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => onSelectEntity && onSelectEntity('project', proj.id)}
                className="group p-3 rounded-xl bg-black/60 border border-purple-500/30 hover:border-purple-400 hover:bg-purple-950/20 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                      {proj.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {proj.progress}% · Milestone slip detected
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
                    At Risk
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
