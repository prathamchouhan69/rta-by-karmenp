import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Mail,
  MapPin,
  Phone,
  Plus,
  ReceiptText,
  Send,
  Star,
} from 'lucide-react';
import { useRouter } from '../router';
import { useWorkspace } from '../workspace';
import {
  Amount,
  Avatar,
  Button,
  Chip,
  Modal,
  PageHeader,
  Panel,
  Ring,
  SectionHead,
  StatusChip,
  Tabs,
  toneVar,
} from '../ui';
import { DottedArcDonut } from '../charts';
import { cx, inr, inrCompact, longDate } from '../format';
import type { ClientRecord } from '../types';

type ClientsTab = 'relationships' | 'receivables';

function healthTone(health: number): 'cyan' | 'amber' | 'rose' {
  if (health >= 75) return 'cyan';
  if (health >= 55) return 'amber';
  return 'rose';
}

export const ClientsScreen: React.FC = () => {
  const { snapshot, notify } = useWorkspace();
  const { navigate } = useRouter();
  const [tab, setTab] = useState<ClientsTab>('relationships');
  const [selected, setSelected] = useState<ClientRecord | null>(null);

  const out = snapshot.clients.reduce((sum, client) => sum + Number.parseFloat(client.outstanding.replace(/[^0-9.]/g, '') || '0'), 0);
  const avgHealth = Math.round(snapshot.clients.reduce((sum, client) => sum + client.health, 0) / Math.max(1, snapshot.clients.length));
  const watch = snapshot.clients.filter((client) => client.stage === 'watch');

  const selectedInvoices = useMemo(
    () => (selected ? snapshot.invoices.filter((invoice) => invoice.clientId === selected.id) : []),
    [selected, snapshot.invoices],
  );

  return (
    <div className="space-y-5 xl:space-y-6">
      <PageHeader
        eyebrow="Clients · relationships"
        title={
          <>
            Relationships carry the <em>ledger.</em>
          </>
        }
        description="Six accounts, one operating memory: what is owed, what was promised, and what the next conversation should be about. Health is a judgement, never a score to game."
        meta={
          <>
            <Chip tone="cyan" dot>{snapshot.clients.length} active accounts</Chip>
            <Chip tone="amber">{watch.length} on watch</Chip>
            <Chip tone="neutral">{snapshot.clients.reduce((sum, client) => sum + client.invoices, 0)} invoices this year</Chip>
          </>
        }
        actions={
          <>
            <Button onClick={() => notify('Account statements queued for November.', 'info')}>
              <Send size={14} /> Send statements
            </Button>
            <Button variant="primary" onClick={() => notify('New client form opened.', 'info')}>
              <Plus size={14} /> Add client
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: 'Active accounts', value: String(snapshot.clients.length), hint: '2 renewal conversations', tone: 'cyan' as const },
          { label: 'Outstanding', value: inrCompact(out), hint: `${snapshot.invoices.filter((invoice) => invoice.status === 'overdue').length} past due`, tone: 'amber' as const },
          { label: 'Average health', value: `${avgHealth}/100`, hint: 'Weighted by relationship depth', tone: 'violet' as const },
          { label: 'Lifetime value', value: '₹18.4 Cr', hint: 'Across active accounts', tone: 'sage' as const },
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
          onChange={(id) => setTab(id as ClientsTab)}
          items={[
            { id: 'relationships', label: 'Relationships', count: snapshot.clients.length },
            { id: 'receivables', label: 'Receivables', count: snapshot.invoices.filter((invoice) => invoice.balance !== '0.00').length },
          ]}
        />
        <div className="flex items-center gap-1.5">
          <Chip tone="neutral">B2B · GST registered</Chip>
        </div>
      </div>

      {tab === 'relationships' ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {snapshot.clients.map((client) => (
              <Panel
                key={client.id}
                className="group cursor-pointer p-4 transition-transform hover:-translate-y-0.5"
                onClick={() => setSelected(client)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-[11px] font-bold"
                      style={{
                        color: toneVar(healthTone(client.health)),
                        background: `color-mix(in srgb, ${toneVar(healthTone(client.health))} 10%, transparent)`,
                        borderColor: `color-mix(in srgb, ${toneVar(healthTone(client.health))} 24%, transparent)`,
                      }}
                    >
                      {client.name.split(' ').slice(0, 2).map((part) => part[0]).join('')}
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-[12.5px] font-bold text-[var(--k-t1)]">{client.name}</h3>
                      <div className="mt-0.5 truncate text-[9px] k-faint">{client.contact}</div>
                      <div className="mt-1 flex items-center gap-1 text-[8.5px] k-faint">
                        <MapPin size={8} /> {client.city}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="k-num text-[16px] font-semibold" style={{ color: toneVar(healthTone(client.health)) }}>{client.health}</div>
                    <div className="k-mono text-[7px] uppercase tracking-[0.1em] k-faint">health</div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] p-2.5">
                  <div>
                    <div className="k-eyebrow !text-[7.5px]">outstanding</div>
                    <div className="mt-0.5 k-num text-[12px] font-semibold text-[var(--k-t1)]">{client.outstanding}</div>
                  </div>
                  <div className="text-right">
                    <div className="k-eyebrow !text-[7.5px]">lifetime</div>
                    <div className="mt-0.5 k-num text-[12px] text-[var(--k-t2)]">{client.lifetime}</div>
                  </div>
                </div>

                <p className="mt-3 line-clamp-2 text-[10px] leading-relaxed k-muted">{client.nextStep}</p>

                <div className="mt-3 flex items-center justify-between border-t border-[var(--k-line)] pt-2.5">
                  <StatusChip status={client.stage} />
                  <span className="flex items-center gap-1 text-[9px] font-semibold text-[var(--k-cyan)]">
                    Open account <ArrowRight size={10} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Panel>
            ))}
          </div>

          <div className="grid gap-3 xl:grid-cols-[1fr_1.5fr]">
            <Panel className="p-5">
              <SectionHead eyebrow="Portfolio" title="Receivables ageing." />
              <div className="mt-4">
                <DottedArcDonut
                  data={snapshot.receivables}
                  total={inrCompact(snapshot.receivables.reduce((sum, item) => sum + item.value, 0))}
                  caption="open AR"
                />
              </div>
            </Panel>
            <Panel className="p-5">
              <SectionHead eyebrow="Watchlist" title="Relationships that need a call." />
              <div className="mt-3 space-y-2">
                {watch.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => setSelected(client)}
                    className="flex w-full items-start gap-3 rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] p-3 text-left transition-colors hover:border-[var(--k-line-strong)]"
                  >
                    <Ring value={client.health} size={40} stroke={3} tone={healthTone(client.health)} label={`${client.health}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-[var(--k-t1)]">{client.name}</span>
                        <span className="k-num text-[10.5px] text-[var(--k-amber)]">{client.outstanding}</span>
                      </div>
                      <p className="mt-1 text-[9.5px] leading-relaxed k-faint">{client.nextStep}</p>
                    </div>
                  </button>
                ))}
              </div>
              <Button className="mt-3 w-full" size="sm" onClick={() => notify('Relationship review opened for the two watch accounts.', 'info')}>
                Review both accounts <ArrowUpRight size={12} />
              </Button>
            </Panel>
          </div>
        </>
      ) : null}

      {tab === 'receivables' ? (
        <Panel className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--k-line)] p-4">
            <SectionHead
              eyebrow="Collections"
              title="The outstanding, by relationship."
              action={<Chip tone="amber" dot>{inrCompact(out)} open</Chip>}
            />
            <Button size="sm" onClick={() => notify('Collections list exported.', 'info')}>
              Export collections <ArrowUpRight size={12} />
            </Button>
          </div>
          <div className="k-scroll-x">
            <table className="k-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Contact</th>
                  <th>Stage</th>
                  <th>Health</th>
                  <th className="text-right">Outstanding</th>
                  <th className="text-right">Lifetime</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {snapshot.clients.map((client) => (
                  <tr key={client.id} className="k-row-clickable" onClick={() => setSelected(client)}>
                    <td>
                      <div className="text-[11px] font-semibold text-[var(--k-t1)]">{client.name}</div>
                      <div className="k-mono mt-0.5 text-[8.5px] text-[var(--k-t3)]">{client.gstin}</div>
                    </td>
                    <td>
                      <div className="text-[10px]">{client.contact}</div>
                      <div className="mt-0.5 flex items-center gap-1 text-[8.5px] k-faint"><Phone size={8} /> {client.phone}</div>
                    </td>
                    <td><StatusChip status={client.stage} /></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="k-num w-6 text-[10px]" style={{ color: toneVar(healthTone(client.health)) }}>{client.health}</span>
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--k-inset)]">
                          <div className="h-full rounded-full" style={{ width: `${client.health}%`, background: toneVar(healthTone(client.health)) }} />
                        </div>
                      </div>
                    </td>
                    <td className="text-right k-num text-[10.5px] font-semibold text-[var(--k-t1)]">{client.outstanding}</td>
                    <td className="text-right k-num text-[10px] text-[var(--k-t2)]">{client.lifetime}</td>
                    <td className="text-right">
                      <Button
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          notify(`Statement sent to ${client.name}.`, 'success');
                        }}
                      >
                        <Send size={10} /> Statement
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--k-line)] px-4 py-3">
            <span className="text-[9.5px] k-faint">Ageing is shown on the client tab · all amounts INR, tax inclusive</span>
            <button
              onClick={() => navigate('money', { sub: 'invoices' })}
              className="flex items-center gap-1 text-[9.5px] font-semibold text-[var(--k-cyan)] hover:underline"
            >
              Open invoice ledger <ArrowRight size={10} />
            </button>
          </div>
        </Panel>
      ) : null}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name ?? 'Client'}
        eyebrow={selected ? `${selected.city} · client since ${longDate(selected.since)}` : ''}
        side
        width={560}
      >
        {selected ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-[var(--k-line)] bg-[var(--k-inset)] p-4">
              <div>
                <div className="k-eyebrow !text-[8px]">outstanding</div>
                <div className="mt-1 k-number-hero text-[28px] text-[var(--k-t1)]">{selected.outstanding}</div>
                <div className="mt-1.5 text-[10px] k-faint">{selected.invoices} invoices · lifetime {selected.lifetime}</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusChip status={selected.stage} />
                <Ring value={selected.health} size={48} stroke={4} tone={healthTone(selected.health)} label={`${selected.health}`} sublabel="health" />
              </div>
            </div>

            <div>
              <div className="k-rule mb-2">contact</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-[var(--k-t1)]"><Building2 size={12} className="text-[var(--k-t3)]" /> {selected.contact}</div>
                <a href={`tel:${selected.phone}`} className="flex items-center gap-2 text-[11px] text-[var(--k-cyan)] hover:underline"><Phone size={12} /> {selected.phone}</a>
                <a href={`mailto:${selected.email}`} className="flex items-center gap-2 text-[11px] text-[var(--k-cyan)] hover:underline"><Mail size={12} /> {selected.email}</a>
                <div className="flex items-center gap-2 text-[10px] k-faint"><MapPin size={12} /> {selected.city} · GSTIN {selected.gstin}</div>
              </div>
            </div>

            <div>
              <div className="k-rule mb-2">next step</div>
              <div className="rounded-xl border border-[var(--k-amber)]/20 bg-[var(--k-amber-soft)] p-3">
                <div className="flex items-start gap-2">
                  <Star size={13} className="mt-0.5 shrink-0 text-[var(--k-amber)]" />
                  <p className="text-[10.5px] leading-relaxed text-[var(--k-t2)]">{selected.nextStep}</p>
                </div>
              </div>
            </div>

            <div>
              <div className="k-rule mb-2">invoices in this workspace</div>
              <div className="space-y-1.5">
                {selectedInvoices.map((invoice) => (
                  <button
                    key={invoice.id}
                    onClick={() => {
                      setSelected(null);
                      navigate('money', { sub: 'invoice', id: invoice.id });
                    }}
                    className="flex w-full items-center justify-between rounded-lg border border-[var(--k-line)] bg-[var(--k-inset)] px-3 py-2 text-left hover:border-[var(--k-line-strong)]"
                  >
                    <div>
                      <div className="k-mono text-[9px] text-[var(--k-t1)]">{invoice.number}</div>
                      <div className="mt-0.5 text-[8.5px] k-faint">{invoice.project}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Amount value={invoice.balance} className="text-[10px] font-semibold" />
                      <StatusChip status={invoice.status} />
                    </div>
                  </button>
                ))}
                {selectedInvoices.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[var(--k-line-strong)] px-3 py-4 text-center text-[10px] k-faint">
                    No live invoice rows for this account in the loaded set.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => notify(`Call logged with ${selected.name}.`, 'success')}>
                <Phone size={13} /> Log a call
              </Button>
              <Button onClick={() => notify(`Quotation started for ${selected.name}.`, 'info')}>
                <ReceiptText size={13} /> New quotation
              </Button>
              <Button variant="ghost" onClick={() => notify(`Statement for ${selected.name} queued.`, 'info')}>
                <Send size={13} /> Statement
              </Button>
            </div>

            <p className="text-[9px] leading-relaxed k-faint">
              Contact details are from the business contact book. Credit holds apply automatically when an account is
              more than 30 days past due.
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default ClientsScreen;
