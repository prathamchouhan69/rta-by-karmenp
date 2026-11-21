import React from 'react';
import { AdvisoryBoardPanel } from '../operations/AdvisoryBoardPanel';
import { StarlingMurmuration } from '../nature/StarlingMurmuration';
import { ConnectedIntelligenceNode } from '../common/ConnectedIntelligenceNode';
import { useApp } from '../../context/AppContext';

export const AuraScreen: React.FC = () => {
  const { employees, navigateTo } = useApp();

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-white/10 pb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="type-label text-purple-400">CANONICAL SECTION 7</span>
          <span className="text-[10px] text-slate-500 font-mono">/</span>
          <span className="text-[10px] text-slate-400 font-mono">ADVISORY COUNCIL & WORKFORCE SWARM</span>
        </div>
        <h1 className="type-h1 text-white">Aura · Health, Advisors & Team Swarm</h1>
        <p className="type-body-sm text-slate-400 mt-1 max-w-3xl">
          Multi-disciplinary council trade-off analysis, biometric attendance, and Starling murmuration collective fluid labor allocation.
        </p>
      </div>

      {/* 12-Member Advisory Board Panel & Chair Synthesis */}
      <AdvisoryBoardPanel />

      {/* Connected Starling Murmuration Intelligence Node */}
      <ConnectedIntelligenceNode
        id="intel-starling"
        referenceNumber={10}
        videoFilename="2026-10-20 15-51-11.mp4"
        title="Starling Murmuration & Team Swarm Dynamics"
        conceptName="Sturnus Vulgaris Flocking Heuristic (Ref #10)"
        businessContext="Models autonomous worker reallocation across 3 construction sites. Site crews self-adjust their movement vectors based on the 7 nearest co-workers, preventing site delays during concrete batch arrivals."
        impactMetrics={[
          { label: 'LABOUR COHESION', value: '98.4%', trend: 'Synchronized' },
          { label: 'IDLE LATENCY', value: '-28%', trend: 'Productive' },
          { label: 'ACTIVE PERSONNEL', value: '84 Online', trend: 'Full Crew' }
        ]}
        calculusDeriv="d(v_i)/dt = α(v_neighbors - v_i) + β(x_center - x_i)"
        calculusEli5="When you see hundreds of birds flying together in the sky like a giant moving cloud, nobody is in charge giving orders. Each bird simply pays attention to the seven birds right next to it. That is how our site crews shift to where concrete needs pouring."
        actionButtonText="Trigger Murmuration Workforce Rebalance"
        actionBadge="Swarm Flocking"
        interactiveType="starling"
        onAction={() => {
          console.log('Synchronized workforce murmuration distribution vectors');
        }}
      />

      {/* Starling Murmuration Live Workforce Swarm */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="type-label text-purple-400 block mb-0.5">REF #10 STURNUS VULGARIS</span>
            <h3 className="type-h3 text-white">Starling Murmuration Labor Coordination</h3>
          </div>
          <span className="type-label px-2.5 py-1 rounded-lg bg-purple-950 text-purple-300 border border-purple-500/30">
            84 Personnel Online
          </span>
        </div>

        <StarlingMurmuration />
      </div>

      {/* Workforce Roster */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {employees.map(emp => (
          <div
            key={emp.id}
            onClick={() => navigateTo('employee_detail', emp.id)}
            className="p-4 rounded-2xl bg-[#06080d]/90 border border-white/10 hover:border-purple-400/50 cursor-pointer transition-all space-y-2.5 shadow-lg group select-none"
            role="button"
            tabIndex={0}
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="type-h4 text-white text-xs font-semibold group-hover:text-purple-300 transition-colors">
                  {emp.name}
                </h4>
                <p className="type-timestamp text-slate-400">{emp.role}</p>
              </div>
              <span className={`w-2 h-2 rounded-full ${
                emp.status === 'active' ? 'bg-sky-400 shadow-[0_0_6px_#38bdf8]' : 'bg-amber-400'
              }`} />
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>{emp.department}</span>
              <span className="text-purple-300 font-bold">{emp.productivity_score}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
