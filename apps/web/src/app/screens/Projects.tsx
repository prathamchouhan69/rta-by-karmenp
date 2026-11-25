import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Circle,
  ClipboardList,
  HardHat,
  MapPin,
  Plus,
  Users,
} from 'lucide-react';
import { useRouter } from '../router';
import { useWorkspace } from '../workspace';
import {
  Avatar,
  Button,
  Chip,
  MetricInline,
  PageHeader,
  Panel,
  Progress,
  SectionHead,
  StatusChip,
  Tabs,
  toneVar,
} from '../ui';
import { SCurve } from '../charts';
import { cx, inrCompact, longDate, shortDate } from '../format';
import type { ProjectSite } from '../types';
import { ConnectedIntelligenceNode } from '../components/ConnectedIntelligenceNode';

type ProjectTab = 'portfolio' | 'milestones' | 'commercials';

function money(value: string): number {
  return Number.parseFloat(value || '0');
}

const STATUS_COPY: Record<ProjectSite['status'], { label: string; detail: string }> = {
  on_track: { label: 'On track', detail: 'Ahead of the revised programme' },
  at_risk: { label: 'At risk', detail: 'Recovery plan in motion' },
  delayed: { label: 'Delayed', detail: 'Critical path needs intervention' },
  closing: { label: 'Closing', detail: 'Handover within reach' },
};

export const ProjectsScreen: React.FC = () => {
  const { snapshot, notify } = useWorkspace();
  const { route, navigate, closeDetail } = useRouter();
  const [tab, setTab] = useState<ProjectTab>('portfolio');
  const [done, setDone] = useState<Record<string, boolean>>({});

  const selected = snapshot.projects.find((project) => project.id === route.id) ?? null;

  const totals = useMemo(() => {
    const contracted = snapshot.projects.reduce((sum, project) => sum + money(project.contracted), 0);
    const earned = snapshot.projects.reduce((sum, project) => sum + money(project.earned), 0);
    const spent = snapshot.projects.reduce((sum, project) => sum + money(project.spent), 0);
    const headcount = snapshot.projects.reduce((sum, project) => sum + project.headcount, 0);
    return { contracted, earned, spent, headcount };
  }, [snapshot.projects]);

  const isDone = (project: ProjectSite, milestoneId: string, fallback: boolean) =>
    done[`${project.id}:${milestoneId}`] ?? fallback;

  const toggleMilestone = (project: ProjectSite, milestoneId: string, fallback: boolean) => {
    setDone((previous) => ({
      ...previous,
      [`${project.id}:${milestoneId}`]: !(previous[`${project.id}:${milestoneId}`] ?? fallback),
    }));
    notify('Milestone progress updated in the local operating view.', 'success');
  };

  if (selected) {
    const status = STATUS_COPY[selected.status];
    const margin = money(selected.earned) > 0 ? ((money(selected.earned) - money(selected.spent)) / money(selected.earned)) * 100 : 0;
    const next = selected.milestones.find((milestone) => !isDone(selected, milestone.id, milestone.done));
    return (
      <div className="space-y-5">
        <div className="k-reveal flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={closeDetail}
            className="flex items-center gap-1.5 text-[10.5px] font-semibold text-[var(--k-t2)] transition-colors hover:text-[var(--k-t1)]"
          >
            <ArrowLeft size={13} /> All projects
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => notify('Site daily report opened for field entry.', 'info')}>
              <ClipboardList size={12} /> Site report
            </Button>
            <Button size="sm" variant="primary" onClick={() => notify('Client update drafted from the latest programme.', 'info')}>
              Draft client update
            </Button>
          </div>
        </div>

        <Panel className="k-reveal overflow-hidden p-0">
          <div className="relative p-5 md:p-6">
            <div
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{
                background:
                  'radial-gradient(ellipse 60% 100% at 0% 0%, var(--k-cyan-soft), transparent 62%), radial-gradient(ellipse 50% 80% at 100% 0%, var(--k-violet-soft), transparent 70%)',
              }}
            />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="k-mono text-[9px] uppercase tracking-[0.16em] text-[var(--k-cyan)]">{selected.code}</span>
                  <StatusChip status={selected.status} />
                  <Chip tone="neutral">{selected.client}</Chip>
                </div>
                <h1 className="k-page-title k-display mt-3 text-[28px] leading-tight text-[var(--k-t1)] md:text-[36px]">
                  {selected.name}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[10.5px] k-muted">
                  <span className="flex items-center gap-1"><MapPin size={11} /> {selected.location}</span>
                  <span className="flex items-center gap-1"><Users size={11} /> {selected.headcount} on site</span>
                  <span className="flex items-center gap-1"><CalendarDays size={11} /> {shortDate(selected.start)} → {shortDate(selected.end)}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="k-eyebrow !text-[8px]">physical progress</div>
                <div className="k-number-hero mt-1 text-[42px]" style={{ color: toneVar(selected.status === 'delayed' ? 'rose' : selected.status === 'at_risk' ? 'amber' : 'cyan') }}>
                  {selected.progress}%
                </div>
                <div className="mt-1 text-[9.5px] k-faint">{status.detail}</div>
              </div>
            </div>
            <div className="relative mt-5">
              <Progress
                value={selected.progress}
                tone={selected.status === 'delayed' ? 'rose' : selected.status === 'at_risk' ? 'amber' : 'cyan'}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 border-t border-[var(--k-line)] md:grid-cols-4">
            {[
              { label: 'Contracted', value: inrCompact(selected.contracted), tone: 'neutral' as const },
              { label: 'Earned value', value: inrCompact(selected.earned), tone: 'cyan' as const },
              { label: 'Cost to date', value: inrCompact(selected.spent), tone: 'violet' as const },
              { label: 'Margin', value: `${margin.toFixed(1)}%`, tone: margin > 20 ? 'cyan' as const : 'amber' as const },
            ].map((stat) => (
              <div key={stat.label} className="border-r border-t border-[var(--k-line)] p-3.5 last:border-r-0 md:border-t-0">
                <div className="k-eyebrow !text-[8px]">{stat.label}</div>
                <div className="mt-1 k-num text-[15px] font-semibold" style={{ color: toneVar(stat.tone) }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr]">
          <Panel className="p-5">
            <SectionHead
              eyebrow="Programme"
              title="Planned against earned."
              action={<Chip tone="cyan">S-curve</Chip>}
            />
            <div className="mt-4">
              <SCurve data={selected.sCurve} height={240} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-[var(--k-line)] pt-3 text-[10px] k-faint">
              <span className="flex items-center gap-1.5"><span className="h-px w-4 border-t border-dashed border-[var(--k-t3)]" /> Planned</span>
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[var(--k-cyan)]" /> Earned</span>
              <span className="ml-auto">{next ? `Next: ${next.title}` : 'Handover ready'}</span>
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHead eyebrow="Milestones" title="The weight of each gate." />
            <div className="mt-4 space-y-2.5">
              {selected.milestones.map((milestone) => {
                const complete = isDone(selected, milestone.id, milestone.done);
                return (
                  <button
                    key={milestone.id}
                    onClick={() => toggleMilestone(selected, milestone.id, milestone.done)}
                    className="flex w-full items-start gap-2.5 text-left"
                  >
                    <span className={cx('mt-0.5', complete ? 'text-[var(--k-cyan)]' : 'text-[var(--k-t4)]')}>
                      {complete ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cx('block text-[11px] font-semibold', complete ? 'text-[var(--k-t2)] line-through' : 'text-[var(--k-t1)]')}>
                        {milestone.title}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[9px] k-faint">
                        <CalendarDays size={9} /> {shortDate(milestone.due)}
                        <span>·</span>
                        <span>{milestone.weight}% weight</span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Panel>
        </div>

        <div className="grid gap-3 xl:grid-cols-[1fr_1fr]">
          <Panel className="p-5">
            <SectionHead eyebrow="Field note" title="What the site is saying." />
            <p className="mt-3 text-[12px] leading-[1.85] k-muted">{selected.note}</p>
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] p-3">
              <Avatar name={selected.lead} size={34} tone="violet" />
              <div>
                <div className="text-[11px] font-semibold text-[var(--k-t1)]">{selected.lead}</div>
                <div className="mt-0.5 text-[9.5px] k-faint">Project lead · reachable on site radio</div>
              </div>
              <Button size="sm" className="ml-auto" onClick={() => notify(`Call placed to ${selected.lead}.`, 'info')}>
                Contact
              </Button>
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHead eyebrow="Commercial" title="Earned value, read honestly." />
            <div className="mt-4 grid grid-cols-2 gap-4">
              <MetricInline label="Contracted" value={inrCompact(selected.contracted)} tone="neutral" />
              <MetricInline label="Earned" value={inrCompact(selected.earned)} tone="cyan" />
              <MetricInline label="Budget" value={inrCompact(selected.budget)} tone="violet" />
              <MetricInline label="Spent" value={inrCompact(selected.spent)} tone="amber" />
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-[10px]">
                <span className="k-faint">Budget consumed</span>
                <span className="k-num font-semibold">{Math.round((money(selected.spent) / Math.max(1, money(selected.budget))) * 100)}%</span>
              </div>
              <Progress
                value={(money(selected.spent) / Math.max(1, money(selected.budget))) * 100}
                tone={(money(selected.spent) / Math.max(1, money(selected.budget))) * 100 > 80 ? 'rose' : 'violet'}
                className="mt-1.5"
              />
            </div>
            <div className="mt-4 rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] p-3 text-[9.5px] leading-relaxed k-faint">
              Certified measurements drive billing. Zoho Books invoices are raised only after the client signs the measurement book.
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 xl:space-y-6">
      <PageHeader
        eyebrow="Projects · delivery"
        title={
          <>
            Four sites. One <em>honest</em> programme.
          </>
        }
        description="Physical progress, earned value and the next gate for every live site. Progress is measured against the revised programme — not the original, optimistic one."
        meta={
          <>
            <Chip tone="cyan" dot>{snapshot.projects.length} live sites</Chip>
            <Chip tone="neutral">{totals.headcount} people on site</Chip>
            <Chip tone="violet">{inrCompact(totals.contracted)} contracted</Chip>
          </>
        }
        actions={
          <>
            <Button onClick={() => notify('Portfolio export queued.', 'info')}>
              <ArrowUpRight size={14} /> Export portfolio
            </Button>
            <Button variant="primary" onClick={() => notify('New project canvas opened.', 'info')}>
              <Plus size={14} /> New site
            </Button>
          </>
        }
      />

      {/* Connected Intelligence — Projects & Tasks references */}
      <ConnectedIntelligenceNode
        referenceNum={4}
        size="compact"
        onAction={(action) => {
          if (action === 'execute-action') {
            notify('Optimizing task path and schedule…', 'info');
          }
        }}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: 'Contracted value', value: inrCompact(totals.contracted), hint: '4 sites · 2 clients + 1 internal', tone: 'cyan' as const },
          { label: 'Earned value', value: inrCompact(totals.earned), hint: 'Certified to 24 November', tone: 'violet' as const },
          { label: 'Cost to date', value: inrCompact(totals.spent), hint: 'Plant, labour, materials', tone: 'amber' as const },
          { label: 'Weighted margin', value: `${(((totals.earned - totals.spent) / Math.max(1, totals.earned)) * 100).toFixed(1)}%`, hint: 'Before overhead allocation', tone: 'sage' as const },
        ].map((stat) => (
          <Panel key={stat.label} className="k-reveal p-4">
            <div className="flex items-center justify-between">
              <span className="k-label">{stat.label}</span>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: toneVar(stat.tone) }} />
            </div>
            <div className="mt-2.5 k-number-hero text-[24px] text-[var(--k-t1)]">{stat.value}</div>
            <div className="mt-1.5 text-[10px] k-faint">{stat.hint}</div>
          </Panel>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          active={tab}
          onChange={(id) => setTab(id as ProjectTab)}
          items={[
            { id: 'portfolio', label: 'Portfolio', count: snapshot.projects.length },
            { id: 'milestones', label: 'Milestones' },
            { id: 'commercials', label: 'Commercials' },
          ]}
        />
        <div className="flex items-center gap-2">
          <Chip tone="rose" dot>{snapshot.projects.filter((project) => project.status === 'delayed').length} delayed</Chip>
          <Chip tone="amber">{snapshot.projects.filter((project) => project.status === 'at_risk').length} at risk</Chip>
        </div>
      </div>

      {tab === 'portfolio' ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {snapshot.projects.map((project) => {
            const status = STATUS_COPY[project.status];
            const next = project.milestones.find((milestone) => !isDone(project, milestone.id, milestone.done));
            const budgetUsed = (money(project.spent) / Math.max(1, money(project.budget))) * 100;
            return (
              <Panel
                key={project.id}
                className="group cursor-pointer p-5 transition-transform hover:-translate-y-0.5"
                onClick={() => navigate('projects', { id: project.id })}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="k-mono text-[8.5px] uppercase tracking-[0.14em] text-[var(--k-cyan)]">{project.code}</span>
                      <StatusChip status={project.status} />
                    </div>
                    <h2 className="mt-2 text-[15px] font-bold leading-tight text-[var(--k-t1)]">{project.name}</h2>
                    <div className="mt-1 flex items-center gap-2 text-[9.5px] k-faint">
                      <MapPin size={9} /> {project.location} · {project.client}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="k-num text-[24px] font-semibold leading-none text-[var(--k-t1)]">{project.progress}%</div>
                    <div className="mt-1 text-[8.5px] k-faint">{status.label}</div>
                  </div>
                </div>

                <div className="mt-4">
                  <Progress
                    value={project.progress}
                    tone={project.status === 'delayed' ? 'rose' : project.status === 'at_risk' ? 'amber' : 'cyan'}
                  />
                  <div className="mt-1.5 flex justify-between text-[8.5px] k-faint">
                    <span>Physical progress</span>
                    <span>{status.detail}</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--k-line)] pt-3">
                  <div>
                    <div className="k-eyebrow !text-[7.5px]">earned</div>
                    <div className="mt-0.5 k-num text-[11px] font-semibold text-[var(--k-t1)]">{inrCompact(project.earned)}</div>
                  </div>
                  <div>
                    <div className="k-eyebrow !text-[7.5px]">cost</div>
                    <div className="mt-0.5 k-num text-[11px] font-semibold text-[var(--k-t1)]">{inrCompact(project.spent)}</div>
                  </div>
                  <div>
                    <div className="k-eyebrow !text-[7.5px]">budget used</div>
                    <div className="mt-0.5 k-num text-[11px] font-semibold" style={{ color: budgetUsed > 85 ? 'var(--k-rose)' : 'var(--k-t1)' }}>
                      {budgetUsed.toFixed(0)}%
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-[var(--k-line)] bg-[var(--k-inset)] px-2.5 py-2">
                  <span className="flex min-w-0 items-center gap-1.5 text-[9.5px] k-muted">
                    <CalendarDays size={10} className="shrink-0" />
                    <span className="truncate">{next ? next.title : 'Ready for handover'}</span>
                  </span>
                  <span className="k-mono shrink-0 text-[8.5px] k-faint">{next ? shortDate(next.due) : '—'}</span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar name={project.lead} size={22} tone="violet" />
                    <span className="text-[9.5px] k-faint">{project.lead}</span>
                  </div>
                  <span className="flex items-center gap-1 text-[9.5px] font-semibold text-[var(--k-cyan)]">
                    Open canvas <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Panel>
            );
          })}
        </div>
      ) : null}

      {tab === 'milestones' ? (
        <Panel className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--k-line)] p-4">
            <SectionHead eyebrow="Programme" title="Every gate, in date order." />
            <Chip tone="neutral">15 milestones</Chip>
          </div>
          <div className="k-scroll-x">
            <table className="k-table">
              <thead>
                <tr>
                  <th>Site</th>
                  <th>Milestone</th>
                  <th>Due</th>
                  <th>Weight</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {snapshot.projects
                  .flatMap((project) =>
                    project.milestones.map((milestone) => ({ project, milestone })),
                  )
                  .sort((a, b) => a.milestone.due.localeCompare(b.milestone.due))
                  .map(({ project, milestone }) => {
                    const complete = isDone(project, milestone.id, milestone.done);
                    return (
                      <tr key={`${project.id}-${milestone.id}`}>
                        <td>
                          <div className="k-mono text-[8.5px] uppercase tracking-[0.1em] text-[var(--k-cyan)]">{project.code}</div>
                          <div className="mt-0.5 text-[10px] text-[var(--k-t2)]">{project.name}</div>
                        </td>
                        <td className="text-[11px] font-semibold text-[var(--k-t1)]">{milestone.title}</td>
                        <td className="whitespace-nowrap text-[10.5px]">{shortDate(milestone.due)}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="k-mono text-[9px]">{milestone.weight}%</span>
                            <div className="w-16"><Progress value={milestone.weight * 2.5} tone="violet" /></div>
                          </div>
                        </td>
                        <td>
                          <StatusChip status={complete ? 'cleared' : 'in_progress'} label={complete ? 'complete' : 'open'} />
                        </td>
                        <td className="text-right">
                          <Button size="sm" onClick={() => toggleMilestone(project, milestone.id, milestone.done)}>
                            {complete ? 'Reopen' : 'Mark done'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}

      {tab === 'commercials' ? (
        <Panel className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--k-line)] p-4">
            <SectionHead
              eyebrow="Commercial"
              title="Value earned, cost consumed, margin held."
              subtitle="Figures are management estimates until the chartered accountant closes the quarter."
            />
            <Button size="sm" onClick={() => notify('Project P&L export queued.', 'info')}>
              <ArrowUpRight size={12} /> Export P&L
            </Button>
          </div>
          <div className="k-scroll-x">
            <table className="k-table">
              <thead>
                <tr>
                  <th>Site</th>
                  <th className="text-right">Contracted</th>
                  <th className="text-right">Budget</th>
                  <th className="text-right">Earned</th>
                  <th className="text-right">Spent</th>
                  <th className="text-right">Margin</th>
                  <th>Health</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.projects.map((project) => {
                  const margin = money(project.earned) > 0 ? ((money(project.earned) - money(project.spent)) / money(project.earned)) * 100 : 0;
                  return (
                    <tr key={project.id} className="k-row-clickable" onClick={() => navigate('projects', { id: project.id })}>
                      <td>
                        <div className="text-[11px] font-semibold text-[var(--k-t1)]">{project.name}</div>
                        <div className="k-mono mt-0.5 text-[8.5px] text-[var(--k-t3)]">{project.code} · {project.client}</div>
                      </td>
                      <td className="text-right k-num text-[10.5px]">{inrCompact(project.contracted)}</td>
                      <td className="text-right k-num text-[10.5px]">{inrCompact(project.budget)}</td>
                      <td className="text-right k-num text-[10.5px] text-[var(--k-cyan)]">{inrCompact(project.earned)}</td>
                      <td className="text-right k-num text-[10.5px]">{inrCompact(project.spent)}</td>
                      <td className="text-right">
                        <span className={cx('k-num text-[10.5px] font-semibold', margin < 18 ? 'text-[var(--k-amber)]' : 'text-[var(--k-t1)]')}>
                          {margin.toFixed(1)}%
                        </span>
                      </td>
                      <td><StatusChip status={project.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-4 border-t border-[var(--k-line)] px-4 py-3 text-[9.5px] k-faint">
            <span className="flex items-center gap-1.5"><HardHat size={11} /> 4 live sites</span>
            <span className="flex items-center gap-1.5"><Users size={11} /> {totals.headcount} people</span>
            <span className="ml-auto k-mono">last measurement {longDate('2026-11-22')}</span>
          </div>
        </Panel>
      ) : null}
    </div>
  );
};

export default ProjectsScreen;
