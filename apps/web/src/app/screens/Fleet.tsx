import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CircleGauge,
  Fuel,
  MapPin,
  Navigation,
  Phone,
  Plus,
  RefreshCw,
  Truck,
  Wrench,
} from 'lucide-react';
import { useRouter } from '../router';
import { useWorkspace } from '../workspace';
import {
  Avatar,
  Button,
  Chip,
  PageHeader,
  Panel,
  Progress,
  Ring,
  SectionHead,
  StatusChip,
  Tabs,
  toneVar,
} from '../ui';
import { DispatchMap } from '../charts';
import { cx, inrCompact } from '../format';
import type { FleetUnit, Tone } from '../types';
import { ConnectedIntelligenceNode } from '../components/ConnectedIntelligenceNode';

type FleetTab = 'board' | 'vehicles' | 'maintenance';

const STATUS_LABEL: Record<FleetUnit['status'], string> = {
  in_transit: 'In transit',
  loading: 'Loading',
  idle: 'Idle',
  maintenance: 'Workshop',
};

const KIND_ICON: Record<FleetUnit['kind'], React.ComponentType<{ size?: number; className?: string }>> = {
  tipper: Truck,
  excavator: Wrench,
  loader: Wrench,
  pickup: Navigation,
};

function healthTone(health: number): Tone {
  if (health >= 85) return 'cyan';
  if (health >= 65) return 'amber';
  return 'rose';
}

export const FleetScreen: React.FC = () => {
  const { snapshot, notify } = useWorkspace();
  const { navigate } = useRouter();
  const [tab, setTab] = useState<FleetTab>('board');
  const [kind, setKind] = useState<'all' | FleetUnit['kind']>('all');

  const active = snapshot.fleet.filter((unit) => unit.status !== 'maintenance');
  const workshop = snapshot.fleet.filter((unit) => unit.status === 'maintenance');
  const moving = snapshot.fleet.filter((unit) => unit.status === 'in_transit' || unit.status === 'loading');
  const avgUtilisation = Math.round(
    active.reduce((sum, unit) => sum + unit.utilisation, 0) / Math.max(1, active.length),
  );
  const avgFuel = Math.round(
    active.reduce((sum, unit) => sum + unit.fuel, 0) / Math.max(1, active.length),
  );

  const filtered = useMemo(
    () => snapshot.fleet.filter((unit) => kind === 'all' || unit.kind === kind),
    [kind, snapshot.fleet],
  );

  return (
    <div className="space-y-5 xl:space-y-6">
      <PageHeader
        eyebrow="Fleet · dispatch and plant"
        title={
          <>
            Every tonne, <em>tracked</em> to the gate.
          </>
        }
        description="Live dispatch, plant utilisation and workshop health across the tipper fleet and the Kolar crushing plant. Telemetry is stitched from the dispatch app and driver check-ins."
        meta={
          <>
            <Chip tone="cyan" dot>{moving.length} units moving</Chip>
            <Chip tone="amber">{workshop.length} in workshop</Chip>
            <Chip tone="neutral">{snapshot.dispatches.length} challans today</Chip>
          </>
        }
        actions={
          <>
            <Button onClick={() => notify('Driver check-in request sent to all active units.', 'info')}>
              <Phone size={14} /> Ping drivers
            </Button>
            <Button variant="primary" onClick={() => notify('New dispatch form opened.', 'info')}>
              <Plus size={14} /> New dispatch
            </Button>
          </>
        }
      />

      {/* Connected Intelligence — Fleet & Transportation references */}
      <ConnectedIntelligenceNode
        referenceNum={3}
        size="compact"
        onAction={(action) => {
          if (action === 'execute-action') {
            notify('Dispatching optimal fleet route…', 'info');
          }
        }}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: 'Active units', value: `${active.length}/${snapshot.fleet.length}`, hint: '2 in workshop', tone: 'cyan' as const, icon: Truck },
          { label: 'Fleet utilisation', value: `${avgUtilisation}%`, hint: 'Weighted across plant', tone: 'violet' as const, icon: CircleGauge },
          { label: 'Average fuel', value: `${avgFuel}%`, hint: '₹1.86 L diesel this week', tone: 'amber' as const, icon: Fuel },
          { label: 'Open challans', value: String(snapshot.dispatches.filter((dispatch) => dispatch.status !== 'delivered').length), hint: `${inrCompact(148500)} freight exposure`, tone: 'rose' as const, icon: MapPin },
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
          onChange={(id) => setTab(id as FleetTab)}
          items={[
            { id: 'board', label: 'Live board', count: moving.length },
            { id: 'vehicles', label: 'Vehicles', count: snapshot.fleet.length },
            { id: 'maintenance', label: 'Maintenance', count: workshop.length },
          ]}
        />
        <div className="flex items-center gap-1.5">
          {(['all', 'tipper', 'excavator', 'loader', 'pickup'] as const).map((value) => (
            <button
              key={value}
              onClick={() => setKind(value)}
              className={cx(
                'rounded-full border px-2.5 py-1.5 text-[9.5px] font-semibold capitalize transition-colors',
                kind === value
                  ? 'border-[var(--k-cyan)]/30 bg-[var(--k-cyan-soft)] text-[var(--k-cyan)]'
                  : 'border-[var(--k-line)] text-[var(--k-t3)] hover:text-[var(--k-t1)]',
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {tab === 'board' ? (
        <div className="space-y-3">
          <div className="grid gap-3 xl:grid-cols-[1.35fr_1fr]">
            <Panel className="p-5">
              <SectionHead
                eyebrow="Corridor"
                title="Kolar → Bhopal, in motion."
                action={<Chip tone="cyan" dot>telemetry live</Chip>}
              />
              <div className="mt-4">
                <DispatchMap height={268} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { label: 'Kolar quarry', value: `${snapshot.materials.reduce((sum, material) => sum + (Number.parseFloat(material.stock.replace(/[^0-9.]/g, '')) || 0), 0).toLocaleString('en-IN')} T stock`, tone: 'cyan' as const },
                  { label: 'NH-46 site', value: '62% complete', tone: 'violet' as const },
                  { label: 'Metro V4', value: '78% complete', tone: 'amber' as const },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-[var(--k-line)] bg-[var(--k-inset)] p-2.5">
                    <div className="k-eyebrow !text-[7.5px]">{item.label}</div>
                    <div className="mt-1 text-[10px] font-semibold" style={{ color: toneVar(item.tone) }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel className="p-5">
              <SectionHead
                eyebrow="Challans"
                title="Today’s dispatch queue."
                action={<Chip tone="amber">{snapshot.dispatches.filter((dispatch) => dispatch.status === 'hold').length} on hold</Chip>}
              />
              <div className="mt-3 space-y-1.5">
                {snapshot.dispatches.map((dispatch) => (
                  <div
                    key={dispatch.id}
                    className="rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="k-mono text-[9px] text-[var(--k-t1)]">{dispatch.vehicle}</span>
                          <StatusChip status={dispatch.status} />
                        </div>
                        <div className="mt-1 text-[10px] k-muted">{dispatch.material}</div>
                      </div>
                      <span className="k-mono shrink-0 text-[9px] text-[var(--k-t3)]">{dispatch.eta}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1 text-[9px] k-faint">
                      <MapPin size={9} /> {dispatch.from} → {dispatch.to}
                      <span className="ml-auto k-mono">{dispatch.challan}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                className="mt-3 w-full"
                size="sm"
                onClick={() => notify('Dispatch challan PDF pack prepared.', 'info')}
              >
                Print all challans <ArrowUpRight size={12} />
              </Button>
            </Panel>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {filtered
              .filter((unit) => unit.status !== 'maintenance')
              .map((unit) => {
                const Icon = KIND_ICON[unit.kind];
                return (
                  <Panel key={unit.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="k-mono text-[9.5px] font-medium text-[var(--k-t1)]">{unit.plate}</div>
                        <div className="mt-0.5 truncate text-[9.5px] k-faint">{unit.model}</div>
                      </div>
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: 'var(--k-cyan-soft)', color: 'var(--k-cyan)' }}
                      >
                        <Icon size={13} />
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <Ring value={unit.utilisation} size={54} stroke={4} tone={unit.utilisation > 80 ? 'cyan' : unit.utilisation > 55 ? 'violet' : 'amber'} label={`${unit.utilisation}%`} />
                      <div className="min-w-0 flex-1">
                        <StatusChip status={unit.status} label={STATUS_LABEL[unit.status]} />
                        <div className="mt-2 flex items-center gap-1.5 text-[9px] k-faint">
                          <Fuel size={9} /> {unit.fuel}% fuel
                        </div>
                        <Progress value={unit.fuel} tone={unit.fuel < 30 ? 'rose' : unit.fuel < 55 ? 'amber' : 'cyan'} className="mt-1" />
                      </div>
                    </div>
                    <div className="mt-3 rounded-lg bg-[var(--k-inset)] px-2.5 py-2">
                      <div className="flex items-center gap-1.5 text-[9px] k-faint">
                        <MapPin size={9} /> <span className="truncate">{unit.destination}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[9.5px] text-[var(--k-t2)]">{unit.driver}</span>
                        <span className="k-mono text-[8.5px] text-[var(--k-t3)]">{unit.eta}</span>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[8.5px] k-faint">
                        <CircleGauge size={9} /> {unit.health}% health
                      </span>
                      <button
                        onClick={() => notify(`Calling ${unit.driver} on the fleet radio.`, 'info')}
                        className="flex items-center gap-1 text-[9px] font-semibold text-[var(--k-cyan)] hover:underline"
                      >
                        <Phone size={9} /> Call
                      </button>
                    </div>
                  </Panel>
                );
              })}
          </div>
        </div>
      ) : null}

      {tab === 'vehicles' ? (
        <Panel className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--k-line)] p-4">
            <SectionHead eyebrow="Register" title="The fleet, unit by unit." />
            <Button size="sm" onClick={() => void notify('Fleet register exported.', 'info')}>
              Export register <ArrowUpRight size={12} />
            </Button>
          </div>
          <div className="k-scroll-x">
            <table className="k-table">
              <thead>
                <tr>
                  <th>Unit</th>
                  <th>Driver</th>
                  <th>Status</th>
                  <th>Utilisation</th>
                  <th>Fuel</th>
                  <th>Odometer</th>
                  <th>Health</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((unit) => (
                  <tr key={unit.id}>
                    <td>
                      <div className="k-mono text-[10px] font-medium text-[var(--k-t1)]">{unit.plate}</div>
                      <div className="mt-0.5 text-[9px] k-faint">{unit.model} · {unit.kind}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar name={unit.driver} size={22} tone="violet" />
                        <span className="text-[10.5px]">{unit.driver}</span>
                      </div>
                    </td>
                    <td><StatusChip status={unit.status} label={STATUS_LABEL[unit.status]} /></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="k-mono w-8 text-[9.5px]">{unit.utilisation}%</span>
                        <div className="w-20"><Progress value={unit.utilisation} tone={unit.utilisation > 80 ? 'cyan' : 'violet'} /></div>
                      </div>
                    </td>
                    <td>
                      <span className={cx('k-mono text-[9.5px]', unit.fuel < 30 ? 'text-[var(--k-rose)]' : '')}>{unit.fuel}%</span>
                    </td>
                    <td className="k-mono text-[9.5px]">{unit.odometer}</td>
                    <td>
                      <span className="rounded-full px-2 py-0.5 text-[9px] font-semibold" style={{ background: `color-mix(in srgb, ${toneVar(healthTone(unit.health))} 12%, transparent)`, color: toneVar(healthTone(unit.health)) }}>
                        {unit.health}%
                      </span>
                    </td>
                    <td className="text-right">
                      <Button size="sm" onClick={() => notify(`Service history for ${unit.plate} opened.`, 'info')}>
                        Open
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-[var(--k-line)] px-4 py-3 text-[9.5px] k-faint">
            <span>{filtered.length} units in this view</span>
            <span className="k-mono">last service cycle · November 2026</span>
          </div>
        </Panel>
      ) : null}

      {tab === 'maintenance' ? (
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
          <Panel className="p-5">
            <SectionHead
              eyebrow="Workshop"
              title="Down units, and the cost of waiting."
              action={<Chip tone="rose" dot>{workshop.length} down</Chip>}
            />
            <div className="mt-4 space-y-3">
              {workshop.map((unit) => (
                <div key={unit.id} className="rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="k-mono text-[10px] font-medium text-[var(--k-t1)]">{unit.plate}</span>
                        <StatusChip status="maintenance" />
                      </div>
                      <div className="mt-1 text-[10px] k-faint">{unit.model} · {unit.cargo}</div>
                    </div>
                    <div className="text-right">
                      <div className="k-eyebrow !text-[8px]">expected back</div>
                      <div className="mt-1 text-[11px] font-semibold text-[var(--k-amber)]">{unit.eta}</div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div>
                      <div className="k-eyebrow !text-[7.5px]">health</div>
                      <div className="mt-1"><Progress value={unit.health} tone={healthTone(unit.health)} /></div>
                    </div>
                    <div>
                      <div className="k-eyebrow !text-[7.5px]">last service</div>
                      <div className="mt-1 text-[9.5px] text-[var(--k-t2)]">{unit.lastService}</div>
                    </div>
                    <div>
                      <div className="k-eyebrow !text-[7.5px]">standby cost</div>
                      <div className="mt-1 text-[9.5px] text-[var(--k-amber)]">₹9,000 / day</div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button size="sm" onClick={() => notify(`Workshop job card for ${unit.plate} opened.`, 'info')}>
                      Workspace order
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => navigate('gates')}>
                      Fitness & permits <ArrowUpRight size={11} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <div className="space-y-3">
            <Panel className="p-5">
              <SectionHead eyebrow="Preventive" title="Due this fortnight." />
              <div className="mt-4 space-y-2.5">
                {[
                  { plate: 'MP-04-HE-8921', task: 'Rear brake adjustment', due: '28 Nov', severity: 'amber' as const },
                  { plate: 'MP-04-AE-6618', task: 'Tyre rotation · 10,000 km', due: '30 Nov', severity: 'cyan' as const },
                  { plate: 'MP-04-JD-5520', task: 'Hydraulic oil change', due: '02 Dec', severity: 'amber' as const },
                  { plate: 'MP-09-UC-7781', task: 'Fitness certificate renewal', due: '28 Nov', severity: 'rose' as const },
                ].map((item) => (
                  <div key={item.plate} className="flex items-start gap-2.5">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full" style={{ background: toneVar(item.severity) }} />
                    <div className="min-w-0 flex-1">
                      <div className="k-mono text-[9px] text-[var(--k-t1)]">{item.plate}</div>
                      <div className="mt-0.5 text-[10px] k-muted">{item.task}</div>
                    </div>
                    <span className="k-mono shrink-0 text-[8.5px] k-faint">{item.due}</span>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel className="p-5">
              <SectionHead eyebrow="Leak" title="Standby is the silent cost." />
              <p className="mt-2.5 text-[11px] leading-relaxed k-muted">
                The backhoe at 47% utilisation is the clearest working-capital leak this week. Re-deploy it to the
                Mandideep final layer, or demobilise it — either decision is cheaper than standing by.
              </p>
              <div className="mt-3 flex items-center justify-between rounded-xl border border-[var(--k-amber)]/20 bg-[var(--k-amber-soft)] px-3 py-2.5">
                <span className="text-[10px] text-[var(--k-t2)]">Avoidable standby</span>
                <span className="k-num text-[12px] font-semibold text-[var(--k-amber)]">₹18,000</span>
              </div>
              <Button
                className="mt-3 w-full"
                size="sm"
                onClick={() => notify('Re-deployment request sent to Ravi and Imran.', 'success')}
              >
                Re-deploy the backhoe
              </Button>
            </Panel>
          </div>
        </div>
      ) : null}

      <Panel className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <span className="flex items-center gap-2 text-[9.5px] k-faint">
          <RefreshCw size={11} /> Dispatch telemetry updates every 30 seconds • GPS last seen 09:41 IST
        </span>
        <span className="k-mono text-[8.5px] uppercase tracking-[0.12em] k-faint">
          {snapshot.fleet.length} units · {snapshot.dispatches.length} challans · ozone-safe routing
        </span>
      </Panel>
    </div>
  );
};

export default FleetScreen;
