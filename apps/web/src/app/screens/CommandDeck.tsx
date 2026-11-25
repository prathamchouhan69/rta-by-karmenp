import React, { useMemo } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileText,
  HardHat,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Truck,
  Wallet,
} from 'lucide-react';
import { useRouter } from '../router';
import { useWorkspace } from '../workspace';
import {
  Amount,
  Button,
  Chip,
  KpiCard,
  PageHeader,
  Panel,
  Progress,
  SectionHead,
  StatusChip,
  toneVar,
} from '../ui';
import { CashFlowArea, DispatchMap, DottedArcDonut } from '../charts';
import { cx, dayGreeting, dueLabel, inrCompact, longDate } from '../format';
import type { Tone } from '../types';

const TONE_ICON: Record<Tone, React.ComponentType<{ size?: number; className?: string }>> = {
  cyan: ShieldCheck,
  violet: Sparkles,
  amber: CircleAlert,
  rose: CircleAlert,
  sage: HardHat,
  neutral: FileText,
};

export const CommandDeckScreen: React.FC = () => {
  const { snapshot, source, refresh, loading, notify } = useWorkspace();
  const { navigate } = useRouter();

  const overdue = useMemo(
    () => snapshot.invoices.filter((invoice) => invoice.status === 'overdue'),
    [snapshot.invoices],
  );
  const insight = snapshot.insights[0];
  const overdueValue = overdue.reduce((sum, invoice) => sum + Number.parseFloat(invoice.balance || '0'), 0);
  const activeDispatches = snapshot.dispatches.filter((dispatch) => dispatch.status !== 'delivered');
  const criticalGates = snapshot.gates.filter((gate) => gate.severity === 'critical');

  const attention = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      detail: string;
      tone: Tone;
      onOpen: () => void;
    }> = [];
    for (const gate of criticalGates.slice(0, 2)) {
      items.push({
        id: gate.id,
        title: gate.title,
        detail: `${gate.due} · ${gate.owner}`,
        tone: gate.severity === 'critical' ? 'rose' : 'amber',
        onOpen: () => navigate('gates'),
      });
    }
    for (const invoice of overdue.slice(0, 2)) {
      items.push({
        id: invoice.id,
        title: `${invoice.customer} · ${inrCompact(invoice.balance)}`,
        detail: `${dueLabel(invoice.dueDate)} · ${invoice.number}`,
        tone: 'amber',
        onOpen: () => navigate('money', { sub: 'invoice', id: invoice.id }),
      });
    }
    return items;
  }, [criticalGates, navigate, overdue]);

  const liveFleet = snapshot.fleet.filter((unit) => unit.status !== 'maintenance').length;

  return (
    <div className="space-y-5 xl:space-y-6">
      <PageHeader
        eyebrow={`${longDate('2026-11-25')} · Bhopal · IST`}
        title={
          <>
            {dayGreeting()}, <em className="not-italic" style={{ color: 'var(--k-cyan)' }}>Karmen</em>.
            <br className="hidden sm:block" /> Here is the shape of today.
          </>
        }
        description="Every figure below is one operating picture: ledger, delivery, compliance and the next decision — in the order it matters."
        meta={
          <>
            <Chip tone={source === 'live' ? 'cyan' : source === 'practice' ? 'violet' : 'neutral'} dot>
              {source === 'live' ? 'Zoho live ledger' : source === 'practice' ? 'Practice ledger' : 'Demo workspace'}
            </Chip>
            <Chip tone="neutral">
              <Clock3 size={10} /> Synced {snapshot.syncedAt}
            </Chip>
            <Chip tone="violet">
              <Sparkles size={10} /> Flux ready
            </Chip>
          </>
        }
        actions={
          <>
            <Button onClick={() => void refresh()} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'k-spin' : ''} /> Sync workspace
            </Button>
            <Button variant="primary" onClick={() => navigate('flux')}>
              <Sparkles size={14} /> Ask Flux
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {snapshot.kpis.map((kpi, index) => (
          <KpiCard
            key={kpi.id}
            kpi={kpi}
            index={index}
            onClick={() =>
              navigate(kpi.id === 'gst' ? 'gates' : kpi.id === 'revenue' ? 'projects' : 'money')
            }
          />
        ))}
      </div>

      {/* Signal + attention */}
      <div className="grid gap-3 xl:grid-cols-[1.62fr_1fr]">
        <Panel className="k-reveal k-reveal-1 overflow-hidden !p-0">
          <div className="grid h-full lg:grid-cols-[1.5fr_1fr]">
            <div className="relative min-w-0 p-5 md:p-6">
              <div
                className="pointer-events-none absolute inset-0 opacity-60"
                style={{
                  background:
                    'radial-gradient(ellipse 70% 90% at 0% 0%, var(--k-cyan-soft), transparent 68%), radial-gradient(ellipse 60% 60% at 100% 100%, var(--k-violet-soft), transparent 70%)',
                }}
              />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="k-eyebrow flex items-center gap-1.5 !text-[8.5px] !text-[var(--k-cyan)]">
                    <span className="k-dot k-dot-pulse" /> Flux · the morning signal
                  </span>
                  <Chip tone={insight?.confidence === 'high' ? 'cyan' : 'amber'}>
                    {insight?.confidence ?? 'medium'} confidence
                  </Chip>
                  <span className="k-mono text-[8px] uppercase tracking-[0.12em] k-faint">
                    source-grounded
                  </span>
                </div>
                <h2 className="k-serif mt-4 max-w-[540px] text-[22px] leading-[1.25] text-[var(--k-t1)] md:text-[27px]">
                  “{insight?.question ?? 'What needs my attention before 11am?'}”
                </h2>
                <p className="mt-3 max-w-[560px] text-[12.5px] leading-[1.8] k-muted">
                  {insight?.answer ??
                    'Two statutory gates and one late invoice shape the next two hours. Start with the e-way bills, then call Apex Infra before their accounts desk closes.'}
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {(insight?.evidence ?? ['2 open e-way bills', 'Apex Infra · overdue', 'Dispatch log']).map(
                    (item) => (
                      <span
                        key={item}
                        className="rounded-full border border-[var(--k-line)] bg-[var(--k-inset)] px-2.5 py-1 text-[9.5px] k-faint"
                      >
                        {item}
                      </span>
                    ),
                  )}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <Button variant="primary" size="sm" onClick={() => navigate('gates')}>
                    <ShieldCheck size={13} /> Open the gates queue
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => navigate('flux')}>
                    Ask a follow-up <ArrowRight size={13} />
                  </Button>
                </div>
              </div>
            </div>

            <div className="relative border-t border-[var(--k-line)] p-4 lg:border-l lg:border-t-0">
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="k-eyebrow !text-[8.5px]">Attention · {attention.length}</span>
                <span className="k-mono text-[8px] uppercase tracking-[0.12em] text-[var(--k-rose)]">live</span>
              </div>
              <div className="space-y-1.5">
                {attention.map((item) => {
                  const Icon = TONE_ICON[item.tone];
                  return (
                    <button
                      key={item.id}
                      onClick={item.onOpen}
                      className="group flex w-full items-start gap-2.5 rounded-xl border border-transparent p-2.5 text-left transition-colors hover:border-[var(--k-line)] hover:bg-[var(--k-inset)]"
                    >
                      <span
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: `color-mix(in srgb, ${toneVar(item.tone)} 12%, transparent)`, color: toneVar(item.tone) }}
                      >
                        <Icon size={13} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11.5px] font-semibold text-[var(--k-t1)]">{item.title}</span>
                        <span className="mt-0.5 block truncate text-[9.5px] k-faint">{item.detail}</span>
                      </span>
                      <ChevronRight size={13} className="mt-1 shrink-0 text-[var(--k-t4)] transition-transform group-hover:translate-x-0.5" />
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] p-3">
                <div className="flex items-center justify-between">
                  <span className="k-eyebrow !text-[8px]">decision clock</span>
                  <span className="k-mono text-[9px] text-[var(--k-amber)]">2h 18m</span>
                </div>
                <p className="mt-1.5 text-[10.5px] leading-relaxed k-muted">
                  E-way extensions must be filed before the NH-46 gate closes at 18:00.
                </p>
                <div className="mt-2.5">
                  <div className="k-progress">
                    <span style={{ width: '62%', background: 'linear-gradient(90deg, var(--k-amber), var(--k-rose))' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel className="k-reveal k-reveal-2 flex flex-col p-5">
          <SectionHead
            eyebrow="Today’s order"
            title="Three moves, in sequence."
            action={
              <span className="k-mono text-[8px] uppercase tracking-[0.12em] k-faint">01 — 03</span>
            }
          />
          <div className="mt-4 flex-1 space-y-2">
            {[
              {
                step: '01',
                title: 'Extend the two expiring e-way bills',
                detail: 'EWB-2026-11-4471 and the Metro consignment',
                tone: 'rose' as Tone,
                action: () => navigate('gates'),
                icon: ShieldCheck,
              },
              {
                step: '02',
                title: 'Call Apex Infra commercial head',
                detail: '₹18,400 · 14 days past due · health 38',
                tone: 'amber' as Tone,
                action: () => navigate('clients'),
                icon: Wallet,
              },
              {
                step: '03',
                title: 'Release the Kolar crusher drawing',
                detail: 'Line 2 foundation is 9 days behind',
                tone: 'violet' as Tone,
                action: () => navigate('projects', { id: 'kolar' }),
                icon: HardHat,
              },
            ].map((item) => (
              <button
                key={item.step}
                onClick={item.action}
                className="group flex w-full items-start gap-3 rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] p-3 text-left transition-all hover:border-[var(--k-line-strong)] hover:bg-[var(--k-raised)]"
              >
                <span className="k-mono mt-0.5 text-[10px]" style={{ color: toneVar(item.tone) }}>
                  {item.step}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11.5px] font-semibold leading-snug text-[var(--k-t1)]">{item.title}</span>
                  <span className="mt-1 block text-[9.5px] k-faint">{item.detail}</span>
                </span>
                <item.icon size={14} className="mt-1 shrink-0" style={{ color: toneVar(item.tone) }} />
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[var(--k-line)] pt-3">
            <div className="flex items-center gap-2">
              <span className="flex -space-x-2">
                {snapshot.team.slice(1, 4).map((member) => (
                  <span
                    key={member.id}
                    className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--k-panel-solid)] bg-[var(--k-raised)] text-[7.5px] font-bold text-[var(--k-t2)]"
                    title={member.name}
                  >
                    {member.initials}
                  </span>
                ))}
              </span>
              <span className="text-[9.5px] k-faint">{liveFleet} units moving</span>
            </div>
            <button
              onClick={() => navigate('people')}
              className="flex items-center gap-1 text-[9.5px] font-semibold text-[var(--k-cyan)] hover:underline"
            >
              Team <ArrowUpRight size={11} />
            </button>
          </div>
        </Panel>
      </div>

      {/* Cash + receivables */}
      <div className="grid gap-3 xl:grid-cols-[1.55fr_1fr]">
        <Panel className="k-reveal k-reveal-2 p-5">
          <SectionHead
            eyebrow="Liquidity"
            title="Cash in, cash out, net position."
            subtitle="Eight months of operating flow. Values in lakhs; Zoho Books remains the ledger of record."
            action={
              <button
                onClick={() => navigate('money', { sub: 'reports' })}
                className="flex items-center gap-1 text-[10px] font-semibold text-[var(--k-cyan)] hover:underline"
              >
                Full ledger <ArrowUpRight size={11} />
              </button>
            }
          />
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="flex items-center gap-1.5 text-[10px] k-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--k-cyan)]" /> Inflow
            </span>
            <span className="flex items-center gap-1.5 text-[10px] k-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--k-violet)]" /> Outflow
            </span>
            <span className="flex items-center gap-1.5 text-[10px] k-muted">
              <span className="h-px w-4 border-t border-dashed border-[var(--k-amber)]" /> Net
            </span>
          </div>
          <div className="mt-2">
            <CashFlowArea data={snapshot.cashflow} height={238} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[var(--k-line)] pt-3.5">
            <div>
              <div className="k-eyebrow !text-[8px]">November net</div>
              <div className="mt-1 k-num text-[15px] font-semibold text-[var(--k-cyan)]">₹68.0 L</div>
            </div>
            <div>
              <div className="k-eyebrow !text-[8px]">Runway</div>
              <div className="mt-1 k-num text-[15px] font-semibold text-[var(--k-t1)]">7.4 months</div>
            </div>
            <div>
              <div className="k-eyebrow !text-[8px]">Collections</div>
              <div className="mt-1 k-num text-[15px] font-semibold text-[var(--k-t1)]">82.4%</div>
            </div>
          </div>
        </Panel>

        <Panel className="k-reveal k-reveal-3 p-5">
          <SectionHead
            eyebrow="Receivables"
            title="Where the money is ageing."
            action={
              <Chip tone="amber" dot>
                {overdue.length} past due
              </Chip>
            }
          />
          <div className="mt-5">
            <DottedArcDonut
              data={snapshot.receivables}
              total={inrCompact(snapshot.receivables.reduce((sum, item) => sum + item.value, 0))}
              caption={`${snapshot.invoices.filter((invoice) => invoice.balance !== '0.00').length} open invoices`}
            />
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] px-3 py-2.5">
            <div>
              <div className="k-eyebrow !text-[8px]">overdue exposure</div>
              <div className="mt-1 k-num text-[14px] font-semibold text-[var(--k-amber)]">{inrCompact(overdueValue)}</div>
            </div>
            <Button size="sm" onClick={() => navigate('money', { sub: 'invoices' })}>
              Chase <ArrowRight size={12} />
            </Button>
          </div>
        </Panel>
      </div>

      {/* Overdue + dispatch */}
      <div className="grid gap-3 xl:grid-cols-[1.2fr_1fr]">
        <Panel className="k-reveal k-reveal-2 overflow-hidden p-0">
          <div className="p-5 pb-3.5">
            <SectionHead
              eyebrow="Collections"
              title="Past due, in priority order."
              action={
                <button
                  onClick={() => navigate('money', { sub: 'invoices' })}
                  className="flex items-center gap-1 text-[10px] font-semibold text-[var(--k-cyan)] hover:underline"
                >
                  All invoices <ArrowUpRight size={11} />
                </button>
              }
            />
          </div>
          <div className="k-scroll-x">
            <table className="k-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Client</th>
                  <th>Due</th>
                  <th className="text-right">Balance</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {overdue.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="k-row-clickable"
                    onClick={() => navigate('money', { sub: 'invoice', id: invoice.id })}
                  >
                    <td>
                      <div className="k-mono text-[10px] text-[var(--k-t3)]">{invoice.number}</div>
                      <div className="mt-0.5 text-[10px] k-faint">{invoice.project}</div>
                    </td>
                    <td>
                      <div className="text-[11.5px] font-semibold text-[var(--k-t1)]">{invoice.customer}</div>
                      <div className="mt-0.5"><StatusChip status={invoice.status} /></div>
                    </td>
                    <td>
                      <div className="text-[10.5px] text-[var(--k-t2)]">{dueLabel(invoice.dueDate)}</div>
                      <div className="k-mono mt-0.5 text-[9px] text-[var(--k-rose)]">risk {invoice.risk}</div>
                    </td>
                    <td className="text-right">
                      <Amount value={invoice.balance} className="text-[11.5px] font-semibold text-[var(--k-t1)]" />
                    </td>
                    <td className="text-right">
                      <ChevronRight size={13} className="inline text-[var(--k-t4)]" />
                    </td>
                  </tr>
                ))}
                {overdue.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[11px] k-faint">
                      No overdue invoices in the loaded record set.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--k-line)] px-5 py-3">
            <span className="text-[10px] k-faint">
              {overdue.length} invoices · {inrCompact(overdueValue)} at risk
            </span>
            <button
              onClick={() => {
                notify('Reminder drafted for the three past-due accounts.', 'info');
                navigate('flux');
              }}
              className="flex items-center gap-1 text-[10px] font-semibold text-[var(--k-amber)] hover:underline"
            >
              Draft reminders with Flux <Sparkles size={11} />
            </button>
          </div>
        </Panel>

        <Panel className="k-reveal k-reveal-3 p-5">
          <SectionHead
            eyebrow="Dispatch"
            title="What is moving right now."
            action={
              <Chip tone="cyan" dot>
                {activeDispatches.length} active
              </Chip>
            }
          />
          <div className="mt-4">
            <DispatchMap height={188} />
          </div>
          <div className="mt-3.5 space-y-1">
            {snapshot.dispatches.slice(0, 3).map((dispatch) => (
              <button
                key={dispatch.id}
                onClick={() => navigate('fleet')}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[var(--k-inset)]"
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: 'var(--k-cyan-soft)',
                    color: dispatch.status === 'hold' ? 'var(--k-rose)' : 'var(--k-cyan)',
                  }}
                >
                  <Truck size={13} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-[11px] font-semibold text-[var(--k-t1)]">{dispatch.vehicle}</span>
                    <StatusChip status={dispatch.status} />
                  </span>
                  <span className="mt-0.5 flex items-center gap-1 truncate text-[9.5px] k-faint">
                    <MapPin size={9} /> {dispatch.from} → {dispatch.to}
                  </span>
                </span>
                <span className="k-mono shrink-0 text-[9px] text-[var(--k-t3)]">{dispatch.eta}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate('fleet')}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--k-line)] py-2 text-[10px] font-semibold text-[var(--k-t2)] transition-colors hover:bg-[var(--k-inset)] hover:text-[var(--k-t1)]"
          >
            Open dispatch board <ArrowRight size={11} />
          </button>
        </Panel>
      </div>

      {/* Projects + activity */}
      <div className="grid gap-3 xl:grid-cols-[1.45fr_1fr]">
        <Panel className="k-reveal k-reveal-3 p-5">
          <SectionHead
            eyebrow="Delivery"
            title="The four sites, honestly read."
            subtitle="Physical progress against the revised programme — not the billing position."
            action={
              <button
                onClick={() => navigate('projects')}
                className="flex items-center gap-1 text-[10px] font-semibold text-[var(--k-cyan)] hover:underline"
              >
                All projects <ArrowUpRight size={11} />
              </button>
            }
          />
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {snapshot.projects.map((project) => {
              const next = project.milestones.find((milestone) => !milestone.done);
              return (
                <button
                  key={project.id}
                  onClick={() => navigate('projects', { id: project.id })}
                  className="group rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] p-3.5 text-left transition-all hover:border-[var(--k-line-strong)] hover:bg-[var(--k-raised)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="k-mono text-[8.5px] uppercase tracking-[0.14em] k-faint">{project.code}</div>
                      <div className="mt-1 truncate text-[11.5px] font-semibold text-[var(--k-t1)]">{project.name}</div>
                    </div>
                    <StatusChip status={project.status} />
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <span className="k-num text-[19px] font-semibold leading-none text-[var(--k-t1)]">
                      {project.progress}%
                    </span>
                    <span className="k-mono text-[8.5px] k-faint">{project.headcount} people</span>
                  </div>
                  <Progress
                    value={project.progress}
                    tone={project.status === 'delayed' ? 'rose' : project.status === 'at_risk' ? 'amber' : 'cyan'}
                    className="mt-2"
                  />
                  <div className="mt-2.5 flex items-center gap-1.5 text-[9.5px] k-faint">
                    <CalendarDays size={10} />
                    <span className="truncate">{next ? next.title : 'Final handover'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel className="k-reveal k-reveal-4 p-5">
          <SectionHead eyebrow="Activity" title="The day, as it happened." />
          <div className="mt-4 space-y-0">
            {snapshot.activity.slice(0, 7).map((event, index) => (
              <div key={event.id} className="relative flex gap-3 pb-3.5 last:pb-0">
                {index < 6 ? (
                  <span className="absolute left-[3.5px] top-3 h-full w-px bg-[var(--k-line)]" aria-hidden="true" />
                ) : null}
                <span
                  className="relative mt-1.5 h-[7px] w-[7px] shrink-0 rounded-full"
                  style={{ background: toneVar(event.tone), boxShadow: `0 0 8px ${toneVar(event.tone)}` }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[10.5px] font-semibold text-[var(--k-t1)]">{event.actor}</span>
                    <span className="k-mono shrink-0 text-[8.5px] text-[var(--k-t3)]">{event.time}</span>
                  </div>
                  <p className="mt-0.5 text-[10.5px] leading-snug k-muted">{event.action}</p>
                  <span className="k-mono mt-0.5 block text-[8.5px] text-[var(--k-t4)]">{event.target}</span>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('flux')}
            className="mt-3 flex w-full items-center justify-between rounded-xl border border-[var(--k-violet)]/20 bg-[var(--k-violet-soft)] px-3 py-2.5 text-left"
          >
            <span>
              <span className="block text-[10px] font-semibold text-[var(--k-violet)]">Ask Flux what changed</span>
              <span className="mt-0.5 block text-[9px] k-faint">The day, summarised from records</span>
            </span>
            <Sparkles size={14} className="text-[var(--k-violet)]" />
          </button>
        </Panel>
      </div>
    </div>
  );
};

export default CommandDeckScreen;
