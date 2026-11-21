import React from 'react';
import { useApp } from '../../context/AppContext';
import { CoralGrowthProgress } from '../nature/CoralGrowthProgress';
import { SlimeMoldNetwork } from '../nature/SlimeMoldNetwork';
import { BlackHoleVortex } from '../nature/BlackHoleVortex';
import { GanttChart } from '../charts/GanttChart';
import { formatDateUK, formatRupees } from '../../utils/formatters';
import { ConnectedIntelligenceNode } from '../common/ConnectedIntelligenceNode';

export const ProjectsScreen: React.FC = () => {
  const { projects, invoices, navigateTo } = useApp();

  const overdueInvoices = invoices.filter(i => i.status === 'overdue');
  const delayedProjects = projects.filter(p => p.progress < 60);

  const slimeNodes = [
    { id: '1', label: 'Arch', x: 50, y: 70, active: true },
    { id: '2', label: 'Core', x: 140, y: 30, active: true },
    { id: '3', label: 'Zoho Sync', x: 230, y: 110, active: true },
    { id: '4', label: 'Fleet API', x: 320, y: 50, active: true },
    { id: '5', label: 'Deploy', x: 380, y: 90, active: false },
  ];
  const slimeConns: [string, string][] = [
    ['1', '2'], ['2', '3'], ['2', '4'], ['3', '5'], ['4', '5']
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="type-h1 tracking-tight text-white">
              PROJECTS & WORKFLOW COCKPIT
            </h1>
            <span className="type-label px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/40">
              PRIORITY 2 · LIVING WORK COCKPIT
            </span>
          </div>
          <p className="type-body-sm text-slate-400 mt-1">
            Coral calcification progress, Slime Mold task dependencies & Black Hole delayed project alerts
          </p>
        </div>

        <button
          onClick={() => navigateTo('tasks')}
          className="px-4 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 type-button text-xs transition-all flex items-center gap-1.5"
          aria-label="Navigate to Tasks Kanban"
        >
          <span>VIEW TASK KANBAN</span>
          <span>→</span>
        </button>
      </div>

      {/* Gantt Timeline */}
      <GanttChart />

      {/* Slime Mold Network Topology */}
      <SlimeMoldNetwork
        nodes={slimeNodes}
        connections={slimeConns}
        title="Slime Mold Inter-Project Dependency Web (Ref #76)"
      />

      {/* Connected Coral Calcification Intelligence Node */}
      <ConnectedIntelligenceNode
        id="intel-coral"
        referenceNumber={6}
        videoFilename="2026-10-20 15-50-16.mp4"
        title="Coral Calcification & Project Milestone Accretion"
        conceptName="Hexacorallia Aragonite Accretion (Ref #6)"
        businessContext="Tracks concrete compressive strength gain and structural pier placements. Each physical milestone accretes verified capital progress in Zoho Books, preventing premature client invoicing before NABL test reports."
        impactMetrics={[
          { label: 'CURING ACCRETION', value: '94.2% M45', trend: 'Day 28 Gate' },
          { label: 'LOCKED CAPITAL', value: '₹48,50,000', trend: 'Verified' },
          { label: 'RISK TOLERANCE', value: 'Zero Slump Error', trend: 'Certified' }
        ]}
        calculusDeriv="d(Structural Strength)/dt = k · (1 - e^(-t / τ_cure))"
        calculusEli5="Like tiny sea corals building a solid stone castle under the sea drop by drop. You cannot rush the stone or it falls apart; once each layer is rock-hard, we lock in the milestone payment."
        actionButtonText="Verify Accretion & Release Client Milestone Invoicing"
        actionBadge="Accretion Lock"
        interactiveType="antcolony"
        onAction={() => {
          console.log('Verified milestone accretion and unlocked milestone invoicing gate');
        }}
      />

      {/* Living Calcification Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="type-label text-slate-400">
            CORAL CALCIFICATION PROGRESS (REF #6)
          </h3>
          <span className="text-[10px] font-mono text-cyan-400">STRUCTURAL GROWTH</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map(proj => (
            <div 
              key={proj.id}
              onClick={() => navigateTo('project_detail', proj.id)}
              className="cursor-pointer group"
              role="button"
              tabIndex={0}
              aria-label={`Open project ${proj.name}`}
            >
              <CoralGrowthProgress
                progress={proj.progress}
                title={proj.name}
                subtitle={`Budget: ${formatRupees(proj.budget, true)} · Target: ${formatDateUK(proj.end_date)} · Status: ${proj.status.toUpperCase()}`}
                nodes={proj.milestones.map(m => ({ name: m.title, completed: m.completed }))}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Delay Risk Horizons */}
      <BlackHoleVortex
        overdueInvoices={overdueInvoices}
        delayedProjects={delayedProjects}
        onSelectEntity={(type, id) => {
          if (type === 'project') navigateTo('project_detail', id);
        }}
      />
    </div>
  );
};
