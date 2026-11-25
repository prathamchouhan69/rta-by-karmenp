import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Boxes,
  CircleAlert,
  FileText,
  Layers,
  Plus,
  Scale,
  TrendingUp,
} from 'lucide-react';
import { useRouter } from '../router';
import { useWorkspace } from '../workspace';
import {
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
import { SparkBars } from '../charts';
import { cx, inrCompact } from '../format';
import type { MaterialStock, Tone } from '../types';

type MaterialsTab = 'stock' | 'rates' | 'dispatch';

function toNumber(value: string): number {
  return Number.parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
}

export const MaterialsScreen: React.FC = () => {
  const { snapshot, notify } = useWorkspace();
  const { navigate } = useRouter();
  const [tab, setTab] = useState<MaterialsTab>('stock');
  const [selected, setSelected] = useState<MaterialStock | null>(null);

  const reorderAlerts = snapshot.materials.filter((material) => toNumber(material.stock) / Math.max(1, toNumber(material.reorder)) < 2.1);
  const avgMargin = snapshot.materials.reduce((sum, material) => sum + Number.parseFloat(material.margin), 0) / Math.max(1, snapshot.materials.length);
  const totalStock = snapshot.materials.reduce((sum, material) => sum + toNumber(material.stock), 0);

  const sorted = useMemo(
    () =>
      [...snapshot.materials].sort(
        (a, b) => toNumber(a.stock) / Math.max(1, toNumber(a.reorder)) - toNumber(b.stock) / Math.max(1, toNumber(b.reorder)),
      ),
    [snapshot.materials],
  );

  return (
    <div className="space-y-5 xl:space-y-6">
      <PageHeader
        eyebrow="Materials · quarry to gate"
        title={
          <>
            Stone, sand, and the <em>margin</em> between.
          </>
        }
        description="Stock cover, rate discipline and HSN-correct supply. The Kolar quarry is the physical inventory; Zoho Books holds the priced ledger."
        meta={
          <>
            <Chip tone="cyan" dot>{snapshot.materials.length} active grades</Chip>
            <Chip tone="amber">{reorderAlerts.length} near reorder</Chip>
            <Chip tone="neutral">HSN 2517 · 2505</Chip>
          </>
        }
        actions={
          <>
            <Button onClick={() => navigate('documents')}>
              <FileText size={14} /> Documents
            </Button>
            <Button variant="primary" onClick={() => notify('New material quotation started.', 'info')}>
              <Plus size={14} /> New quotation
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: 'Stock on hand', value: `${totalStock.toLocaleString('en-IN')} T`, hint: 'Across 7 Kolar bays', tone: 'cyan' as const, icon: Boxes },
          { label: 'Average margin', value: `${avgMargin.toFixed(1)}%`, hint: 'Own-quarry contribution', tone: 'violet' as const, icon: TrendingUp },
          { label: 'Near reorder', value: String(reorderAlerts.length), hint: 'Cover under 15 days', tone: 'amber' as const, icon: CircleAlert },
          { label: 'In transit', value: `${snapshot.dispatches.filter((dispatch) => dispatch.status === 'in_transit').length} loads`, hint: `${snapshot.dispatches.filter((dispatch) => dispatch.status === 'in_transit').reduce((sum, dispatch) => sum + (Number.parseFloat(dispatch.quantity.replace(/[^0-9.]/g, '')) || 0), 0).toLocaleString('en-IN')} T on the corridor`, tone: 'rose' as const, icon: Scale },
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
          onChange={(id) => setTab(id as MaterialsTab)}
          items={[
            { id: 'stock', label: 'Stock', count: snapshot.materials.length },
            { id: 'rates', label: 'Rate card' },
            { id: 'dispatch', label: 'Dispatch', count: snapshot.dispatches.length },
          ]}
        />
        <Chip tone="sage">GST 5% · HSN 2517</Chip>
      </div>

      {tab === 'stock' ? (
        <div className="grid gap-3 xl:grid-cols-[1.6fr_1fr]">
          <Panel className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-[var(--k-line)] p-4">
              <SectionHead eyebrow="Stock cover" title="Lowest cover first." />
              <span className="k-mono text-[8.5px] uppercase tracking-[0.12em] k-faint">opening 09:42</span>
            </div>
            <div className="k-scroll-x">
              <table className="k-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Stock / reorder</th>
                    <th className="text-right">Rate</th>
                    <th className="text-right">Margin</th>
                    <th>Bay</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((material) => {
                    const stock = toNumber(material.stock);
                    const reorder = Math.max(1, toNumber(material.reorder));
                    const ratio = stock / reorder;
                    return (
                      <tr key={material.id} className="k-row-clickable" onClick={() => setSelected(material)}>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="h-6 w-1 rounded-full" style={{ background: toneVar(material.tone) }} />
                            <div>
                              <div className="text-[11px] font-semibold text-[var(--k-t1)]">{material.name}</div>
                              <div className="mt-0.5 text-[8.5px] k-faint">{material.grade} · HSN {material.hsn}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className={cx('k-num w-[86px] text-[10px]', ratio < 2.1 ? 'text-[var(--k-amber)]' : 'text-[var(--k-t1)]')}>
                              {material.stock}
                            </span>
                            <div className="w-24">
                              <Progress value={Math.min(100, (ratio / 4) * 100)} tone={ratio < 2.1 ? 'amber' : 'cyan'} />
                            </div>
                          </div>
                          <div className="k-mono mt-0.5 text-[8px] text-[var(--k-t4)]">reorder at {material.reorder}</div>
                        </td>
                        <td className="text-right k-num text-[10.5px] text-[var(--k-t1)]">{material.rate}</td>
                        <td className="text-right">
                          <span className="k-num text-[10.5px] font-semibold text-[var(--k-cyan)]">{material.margin}</span>
                        </td>
                        <td className="text-[9.5px] text-[var(--k-t2)]">{material.location}</td>
                        <td className="text-right"><ArrowUpRight size={12} className="inline text-[var(--k-t4)]" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--k-line)] px-4 py-3">
              <span className="text-[9.5px] k-faint">Daily weighbridge reconciliation · 08:00 and 17:00</span>
              <button
                onClick={() => notify('Weighbridge reconciliation sheet opened.', 'info')}
                className="flex items-center gap-1 text-[9.5px] font-semibold text-[var(--k-cyan)] hover:underline"
              >
                Open sheet <ArrowUpRight size={11} />
              </button>
            </div>
          </Panel>

          <div className="space-y-3">
            <Panel className="p-5">
              <SectionHead eyebrow="Crusher" title="Two lines, one constraint." />
              <div className="mt-3 space-y-2.5">
                <div className="rounded-xl border border-[var(--k-cyan)]/10 bg-[var(--k-inset)] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-semibold text-[var(--k-t1)]">Line 1 · 200 TPH</span>
                    <StatusChip status="on_track" label="running" />
                  </div>
                  <div className="mt-2 flex items-end justify-between">
                    <span className="k-mono text-[9px] k-faint">Availability 94%</span>
                    <span className="k-num text-[12px] font-semibold text-[var(--k-cyan)]">186 T/h</span>
                  </div>
                  <Progress value={94} tone="cyan" className="mt-1.5" />
                </div>
                <div className="rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-semibold text-[var(--k-t1)]">Line 2 · expansion</span>
                    <StatusChip status="delayed" label="foundation" />
                  </div>
                  <div className="mt-2 flex items-end justify-between">
                    <span className="k-mono text-[9px] k-faint">9 days behind</span>
                    <span className="k-num text-[12px] font-semibold text-[var(--k-amber)]">41%</span>
                  </div>
                  <Progress value={41} tone="amber" className="mt-1.5" />
                </div>
              </div>
              <Button
                className="mt-3 w-full"
                size="sm"
                onClick={() => navigate('projects', { id: 'kolar' })}
              >
                Open Kolar programme <ArrowUpRight size={12} />
              </Button>
            </Panel>

            <Panel className="p-5">
              <SectionHead eyebrow="Cover" title="Days of stock." />
              <div className="mt-3">
                <SparkBars data={[18, 21, 24, 19, 16, 14, 12, 10]} tone="amber" height={54} />
                <div className="mt-2 flex items-center justify-between text-[9px] k-faint">
                  <span>Last 8 weeks</span>
                  <span className="text-[var(--k-amber)]">10 days cover</span>
                </div>
              </div>
              <p className="mt-3 text-[10.5px] leading-relaxed k-muted">
                Cover is tightening because the crusher is prioritising GSB for the NH-46 deck. Schedule one night shift
                of 20 mm before Friday to protect the Metro pour.
              </p>
            </Panel>
          </div>
        </div>
      ) : null}

      {tab === 'rates' ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {snapshot.materials.map((material) => {
            const margin = Number.parseFloat(material.margin);
            return (
              <Panel key={material.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[12.5px] font-bold text-[var(--k-t1)]">{material.name}</div>
                    <div className="mt-0.5 text-[9px] k-faint">{material.grade} · {material.unit}</div>
                  </div>
                  <Chip tone="neutral">HSN {material.hsn}</Chip>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div>
                    <div className="k-eyebrow !text-[7.5px]">rate</div>
                    <div className="mt-1 k-num text-[13px] font-semibold text-[var(--k-t1)]">{material.rate}</div>
                  </div>
                  <div>
                    <div className="k-eyebrow !text-[7.5px]">cost</div>
                    <div className="mt-1 k-num text-[13px] font-semibold text-[var(--k-t2)]">{material.cost}</div>
                  </div>
                  <div>
                    <div className="k-eyebrow !text-[7.5px]">margin</div>
                    <div className="mt-1 k-num text-[13px] font-semibold text-[var(--k-cyan)]">{material.margin}</div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[8.5px] k-faint">
                    <span>Margin held</span>
                    <span>{margin.toFixed(0)}%</span>
                  </div>
                  <Progress value={margin * 2.4} tone="cyan" className="mt-1" />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-[var(--k-line)] pt-2.5">
                  <span className="text-[8.5px] k-faint">w.e.f. 01 Nov 2026</span>
                  <button
                    onClick={() => notify(`Rate revision note opened for ${material.name}.`, 'info')}
                    className="text-[9px] font-semibold text-[var(--k-cyan)] hover:underline"
                  >
                    Revise rate
                  </button>
                </div>
              </Panel>
            );
          })}
          <Panel className="flex flex-col justify-between p-4">
            <div>
              <div className="k-eyebrow">rate discipline</div>
              <h3 className="mt-2 text-[14px] font-bold text-[var(--k-t1)]">Every rate has a reason.</h3>
              <p className="mt-2 text-[10.5px] leading-relaxed k-muted">
                Rates are reviewed against royalty, diesel, crusher power and freight. A rate is never changed inside a
                running work order without a credit or debit note.
              </p>
            </div>
            <Button className="mt-4 w-full" size="sm" onClick={() => notify('Rate revision workflow opened.', 'info')}>
              Open revision workflow
            </Button>
          </Panel>
        </div>
      ) : null}

      {tab === 'dispatch' ? (
        <div className="grid gap-3 xl:grid-cols-[1.5fr_1fr]">
          <Panel className="overflow-hidden p-0">
            <div className="border-b border-[var(--k-line)] p-4">
              <SectionHead
                eyebrow="Today"
                title="Loads leaving the quarry."
                subtitle="Challan weight, vehicle and destination, reconciled against the weighbridge."
              />
            </div>
            <div className="k-scroll-x">
              <table className="k-table">
                <thead>
                  <tr>
                    <th>Challan</th>
                    <th>Vehicle</th>
                    <th>Material</th>
                    <th>Destination</th>
                    <th>Status</th>
                    <th className="text-right">ETA</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.dispatches.map((dispatch) => (
                    <tr key={dispatch.id}>
                      <td className="k-mono text-[9.5px] text-[var(--k-t1)]">{dispatch.challan}</td>
                      <td className="k-mono text-[9.5px]">{dispatch.vehicle}</td>
                      <td>
                        <div className="text-[10.5px] text-[var(--k-t1)]">{dispatch.material}</div>
                        <div className="mt-0.5 text-[8.5px] k-faint">{dispatch.quantity}</div>
                      </td>
                      <td className="text-[10px]">{dispatch.to}</td>
                      <td><StatusChip status={dispatch.status} /></td>
                      <td className="text-right k-mono text-[9px]">{dispatch.eta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-[var(--k-line)] px-4 py-3">
              <span className="text-[9.5px] k-faint">Total dispatched today · 108 T</span>
              <Button size="sm" onClick={() => notify('E-way bundle generated for today’s loads.', 'info')}>
                Generate e-way bundle
              </Button>
            </div>
          </Panel>

          <div className="space-y-3">
            <Panel className="p-5">
              <SectionHead eyebrow="Weighbridge" title="Last three slips." />
              <div className="mt-4 space-y-3">
                {[
                  { slip: 'WB-8841', time: '09:12', gross: '52.4 T', tare: '12.6 T', net: '39.8 T' },
                  { slip: 'WB-8842', time: '09:24', gross: '44.8 T', tare: '12.3 T', net: '32.5 T' },
                  { slip: 'WB-8839', time: '08:48', gross: '13.2 T', tare: '12.8 T', net: '0.4 T' },
                ].map((slip) => (
                  <div key={slip.slip} className="rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] p-3">
                    <div className="flex items-center justify-between">
                      <span className="k-mono text-[9px] text-[var(--k-t1)]">{slip.slip}</span>
                      <span className="k-mono text-[8.5px] k-faint">{slip.time} IST</span>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-1 text-center">
                      <div>
                        <div className="k-eyebrow !text-[7px]">gross</div>
                        <div className="k-num mt-0.5 text-[9.5px]">{slip.gross}</div>
                      </div>
                      <div>
                        <div className="k-eyebrow !text-[7px]">tare</div>
                        <div className="k-num mt-0.5 text-[9.5px]">{slip.tare}</div>
                      </div>
                      <div>
                        <div className="k-eyebrow !text-[7px] text-[var(--k-cyan)]">net</div>
                        <div className="k-num mt-0.5 text-[9.5px] font-semibold text-[var(--k-cyan)]">{slip.net}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel className="p-5">
              <SectionHead eyebrow="Reconciliation" title="Weight is the invoice." />
              <p className="mt-2.5 text-[10.5px] leading-relaxed k-muted">
                Every dispatch is invoiced on weighbridge net weight, not the nominal load. Short loads are credited in
                the next running bill, never hidden.
              </p>
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] px-3 py-2.5">
                <Layers size={13} className="text-[var(--k-violet)]" />
                <span className="text-[9.5px] k-muted">3 of 5 slips reconciled to challans</span>
                <span className="ml-auto k-mono text-[9px] text-[var(--k-amber)]">2 open</span>
              </div>
            </Panel>
          </div>
        </div>
      ) : null}

      {selected ? (
        <div className="fixed inset-0 z-[120] flex" role="dialog" aria-modal="true" aria-label={`${selected.name} stock detail`}>
          <button className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={() => setSelected(null)} aria-label="Close material detail" tabIndex={-1} />
          <div className="k-fade relative z-10 ml-auto flex h-full w-full max-w-[520px] flex-col overflow-hidden rounded-l-3xl border border-[var(--k-line)] bg-[var(--k-panel-solid)]">
            <div className="flex items-start justify-between border-b border-[var(--k-line)] p-5">
              <div>
                <div className="k-eyebrow mb-1">material · {selected.hsn}</div>
                <h3 className="k-title text-[20px]">{selected.name}</h3>
                <div className="mt-1 text-[10px] k-faint">{selected.grade} · {selected.location}</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>Close</Button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="k-eyebrow !text-[8px]">stock</div>
                  <div className="mt-1 k-num text-[20px] font-semibold text-[var(--k-t1)]">{selected.stock}</div>
                </div>
                <div>
                  <div className="k-eyebrow !text-[8px]">reorder</div>
                  <div className="mt-1 k-num text-[20px] font-semibold text-[var(--k-t2)]">{selected.reorder}</div>
                </div>
                <div>
                  <div className="k-eyebrow !text-[8px]">rate</div>
                  <div className="mt-1 k-num text-[16px] font-semibold text-[var(--k-cyan)]">{selected.rate}</div>
                </div>
                <div>
                  <div className="k-eyebrow !text-[8px]">margin</div>
                  <div className="mt-1 k-num text-[16px] font-semibold text-[var(--k-violet)]">{selected.margin}</div>
                </div>
              </div>
              <div className="mt-5">
                <div className="k-rule mb-2">movement</div>
                <div className="flex items-center justify-between rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] p-3">
                  <StatusChip status={selected.movement} />
                  <span className="text-[9.5px] k-faint">last 24 hours · weighbridge synced</span>
                </div>
              </div>
              <div className="mt-5">
                <div className="k-rule mb-2">supply context</div>
                <p className="text-[11px] leading-relaxed k-muted">
                  {selected.name} is supplied from the Kolar quarry under HSN {selected.hsn}. GST is charged at the
                  notified rate for mineral products; freight is billed separately where the client collects ex-quarry.
                  Stock cover is checked against the reorder point at every weighbridge close.
                </p>
              </div>
              <div className="mt-5 grid gap-2">
                <Button variant="primary" onClick={() => { notify(`Quotation started for ${selected.name}.`, 'info'); setSelected(null); }}>
                  Quote this material
                </Button>
                <Button onClick={() => { notify(`Stock adjustment note opened for ${selected.name}.`, 'info'); setSelected(null); }}>
                  Adjust stock
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MaterialsScreen;
