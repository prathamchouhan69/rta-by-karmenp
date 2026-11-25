import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileCheck2,
  Plus,
  ShieldCheck,
  Siren,
  UserRound,
} from 'lucide-react';
import { useWorkspace } from '../workspace';
import {
  Avatar,
  Button,
  Chip,
  PageHeader,
  Panel,
  Progress,
  SectionHead,
  StatusChip,
  Tabs,
  toneVar,
} from '../ui';
import { cx, longDate } from '../format';
import type { GateItem, Tone } from '../types';

type GateTab = 'all' | 'critical' | 'progress' | 'cleared';

const SEVERITY_TONE: Record<GateItem['severity'], Tone> = {
  critical: 'rose',
  warning: 'amber',
  clear: 'sage',
  info: 'cyan',
};

const SEVERITY_LABEL: Record<GateItem['severity'], string> = {
  critical: 'Critical',
  warning: 'Warning',
  clear: 'Clear',
  info: 'Info',
};

export const GatesScreen: React.FC = () => {
  const { snapshot, setGateStatus, notify } = useWorkspace();
  const [tab, setTab] = useState<GateTab>('all');

  const critical = snapshot.gates.filter((gate) => gate.severity === 'critical');
  const warnings = snapshot.gates.filter((gate) => gate.severity === 'warning');
  const cleared = snapshot.gates.filter((gate) => gate.status === 'cleared');
  const open = snapshot.gates.filter((gate) => gate.status !== 'cleared');

  const filtered = useMemo(
    () =>
      snapshot.gates.filter((gate) => {
        if (tab === 'critical') return gate.severity === 'critical';
        if (tab === 'progress') return gate.status === 'in_progress' || gate.status === 'action_required' || gate.status === 'monitoring';
        if (tab === 'cleared') return gate.status === 'cleared';
        return true;
      }),
    [snapshot.gates, tab],
  );

  return (
    <div className="space-y-5 xl:space-y-6">
      <PageHeader
        eyebrow="Gates · statutory and internal"
        title={
          <>
            The approvals that stop work — <em>or let it move.</em>
          </>
        }
        description="Every gate is a real-world permission: a return, a fitness certificate, a lease, a safety sign-off. Clearing one is a decision with a name and a date attached."
        meta={
          <>
            <Chip tone="rose" dot>{critical.length} critical</Chip>
            <Chip tone="amber">{warnings.length} warnings</Chip>
            <Chip tone="cyan">{cleared.length} cleared this cycle</Chip>
          </>
        }
        actions={
          <>
            <Button onClick={() => notify('Compliance register export queued.', 'info')}>
              <FileCheck2 size={14} /> Export register
            </Button>
            <Button variant="primary" onClick={() => notify('New compliance gate form opened.', 'info')}>
              <Plus size={14} /> Add gate
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: 'Critical gates', value: String(critical.length), hint: 'Blocking work today', tone: 'rose' as const, icon: Siren },
          { label: 'Due this week', value: '3', hint: '25 Nov – 02 Dec', tone: 'amber' as const, icon: CalendarDays },
          { label: 'In progress', value: String(open.length), hint: 'Owner assigned', tone: 'violet' as const, icon: Clock3 },
          { label: 'Cleared', value: String(cleared.length), hint: 'With evidence archived', tone: 'cyan' as const, icon: ShieldCheck },
        ].map((stat) => (
          <Panel key={stat.label} className="k-reveal p-4">
            <div className="flex items-start justify-between">
              <span className="k-label">{stat.label}</span>
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: `color-mix(in srgb, ${toneVar(stat.tone)} 12%, transparent)`, color: toneVar(stat.tone) }}
              >
                <stat.icon size={13} />
              </span>
            </div>
            <div className="mt-2.5 k-number-hero text-[24px] text-[var(--k-t1)]">{stat.value}</div>
            <div className="mt-1.5 text-[10px] k-faint">{stat.hint}</div>
          </Panel>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          active={tab}
          onChange={(id) => setTab(id as GateTab)}
          items={[
            { id: 'all', label: 'All gates', count: snapshot.gates.length },
            { id: 'critical', label: 'Critical', count: critical.length },
            { id: 'progress', label: 'In progress', count: open.length },
            { id: 'cleared', label: 'Cleared', count: cleared.length },
          ]}
        />
        <div className="flex items-center gap-1.5">
          <Chip tone="neutral">MP state · GSTN · Parivahan</Chip>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.55fr_1fr]">
        <div className="space-y-3">
          {filtered.map((gate) => {
            const tone = SEVERITY_TONE[gate.severity];
            return (
              <Panel key={gate.id} className="relative overflow-hidden p-0">
                <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: toneVar(tone) }} />
                <div className="p-4 pl-5 md:p-5 md:pl-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Chip tone={tone}>{SEVERITY_LABEL[gate.severity]}</Chip>
                        <span className="k-mono text-[8.5px] uppercase tracking-[0.12em] k-faint">{gate.reference}</span>
                      </div>
                      <h3 className="mt-2 text-[14px] font-bold leading-snug text-[var(--k-t1)]">{gate.title}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9.5px] k-faint">
                        <span>{gate.authority}</span>
                        <span className="flex items-center gap-1"><CalendarDays size={9} /> {gate.due}</span>
                      </div>
                    </div>
                    <StatusChip status={gate.status} />
                  </div>

                  <p className="mt-3 text-[11px] leading-[1.75] k-muted">{gate.detail}</p>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--k-line)] pt-3">
                    <span className="flex items-center gap-2">
                      <Avatar name={gate.owner} size={22} tone="violet" />
                      <span className="text-[9.5px] k-faint">{gate.owner}</span>
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {gate.status !== 'cleared' ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setGateStatus(gate.id, 'in_progress');
                            }}
                          >
                            Start
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => notify(`Reminder sent to ${gate.owner} for ${gate.reference}.`, 'info')}
                          >
                            Nudge owner
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => setGateStatus(gate.id, 'cleared')}
                          >
                            <CheckCircle2 size={11} /> Clear gate
                          </Button>
                        </>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[10px] text-[var(--k-cyan)]">
                          <CheckCircle2 size={12} /> Cleared with evidence
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Panel>
            );
          })}
          {filtered.length === 0 ? (
            <Panel className="p-8 text-center text-[11px] k-faint">No gates in this view.</Panel>
          ) : null}
        </div>

        <div className="space-y-3">
          <Panel className="p-5">
            <SectionHead eyebrow="Next 14 days" title="The compliance calendar." />
            <div className="mt-4 space-y-3">
              {[
                { date: '25 Nov', title: 'E-way bills expire · 2 consignments', tone: 'rose' as const },
                { date: '27 Nov', title: 'Site safety audit · Metro V4', tone: 'cyan' as const },
                { date: '28 Nov', title: 'Vehicle fitness · MP-09-UC-7781', tone: 'rose' as const },
                { date: '30 Nov', title: 'Labour cess return · October', tone: 'cyan' as const },
                { date: '05 Dec', title: 'PUC renewal · 2 vehicles', tone: 'amber' as const },
                { date: '12 Dec', title: 'Quarry lease renewal · Kolar', tone: 'amber' as const },
                { date: '20 Dec', title: 'GSTR-3B · November', tone: 'violet' as const },
              ].map((item) => (
                <div key={`${item.date}-${item.title}`} className="flex gap-3">
                  <span className="k-mono w-11 shrink-0 text-[8.5px] uppercase tracking-[0.08em]" style={{ color: toneVar(item.tone) }}>
                    {item.date}
                  </span>
                  <span className="border-l border-[var(--k-line)] pl-3 text-[10.5px] leading-snug text-[var(--k-t2)]">
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHead eyebrow="This week" title="Gate health." />
            <div className="mt-4 flex items-center gap-4">
              <div className="relative flex h-[88px] w-[88px] items-center justify-center">
                <svg viewBox="0 0 88 88" className="absolute inset-0 -rotate-90" aria-hidden="true">
                  <circle cx="44" cy="44" r="35" fill="none" stroke="var(--k-inset)" strokeWidth="7" />
                  <circle
                    cx="44"
                    cy="44"
                    r="35"
                    fill="none"
                    stroke="var(--k-cyan)"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 35}
                    strokeDashoffset={2 * Math.PI * 35 * (1 - cleared.length / Math.max(1, snapshot.gates.length))}
                  />
                </svg>
                <div className="text-center">
                  <div className="k-num text-[17px] font-semibold text-[var(--k-t1)]">
                    {Math.round((cleared.length / Math.max(1, snapshot.gates.length)) * 100)}%
                  </div>
                  <div className="k-mono text-[7px] uppercase tracking-[0.1em] k-faint">cleared</div>
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[var(--k-t1)]">Evidence discipline is holding</div>
                <p className="mt-1 text-[10px] leading-relaxed k-muted">
                  {cleared.length} of {snapshot.gates.length} gates carry a signed document. Flux will not clear a gate
                  without an artefact attached.
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {[
                { label: 'GST & returns', value: 72, tone: 'violet' as const },
                { label: 'Fleet & transport', value: 58, tone: 'amber' as const },
                { label: 'Mining & lease', value: 84, tone: 'cyan' as const },
                { label: 'Safety & labour', value: 92, tone: 'sage' as const },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="k-faint">{row.label}</span>
                    <span className="k-mono">{row.value}%</span>
                  </div>
                  <Progress value={row.value} tone={row.tone} className="mt-1" />
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHead eyebrow="Why it matters" title="A gate is a promise." />
            <p className="mt-2.5 text-[10.5px] leading-relaxed k-muted">
              When a statutory gate opens, the cost is never just the fine. It is the truck held at the barrier, the pour
              that misses its window, the client who stops trusting the date.
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-[var(--k-rose)]/20 bg-[var(--k-rose-soft)] px-3 py-2.5">
              <CircleAlert size={13} className="shrink-0 text-[var(--k-rose)]" />
              <span className="text-[9.5px] leading-snug text-[var(--k-t2)]">
                Two expiring e-way bills can stop ₹4.2 L of material before noon.
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-[var(--k-line)] pt-3">
              <span className="flex items-center gap-1.5 text-[9px] k-faint">
                <UserRound size={10} /> Owner: Farhan Sheikh
              </span>
              <button
                onClick={() => notify('Gate escalation sent to Farhan Sheikh.', 'info')}
                className="flex items-center gap-1 text-[9px] font-semibold text-[var(--k-rose)] hover:underline"
              >
                Escalate <ArrowRight size={10} />
              </button>
            </div>
          </Panel>
        </div>
      </div>

      <Panel className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <span className="flex items-center gap-2 text-[9.5px] k-faint">
          <FileCheck2 size={11} /> Register last reconciled {longDate('2026-11-22')} · every clearance has a document
        </span>
        <button
          onClick={() => notify('Statutory calendar subscribed to Google Workspace.', 'success')}
          className="flex items-center gap-1 text-[9.5px] font-semibold text-[var(--k-cyan)] hover:underline"
        >
          Sync calendar <ArrowUpRight size={11} />
        </button>
      </Panel>
    </div>
  );
};

export default GatesScreen;
