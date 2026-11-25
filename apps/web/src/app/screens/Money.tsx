import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Download,
  Landmark,
  Plus,
  ReceiptText,
  RefreshCw,
  Send,
  TrendingUp,
  Upload,
} from 'lucide-react';
import { useRouter } from '../router';
import { useWorkspace } from '../workspace';
import {
  Amount,
  Button,
  Chip,
  DrawerRow,
  EmptyState,
  PageHeader,
  Panel,
  Progress,
  SearchField,
  SectionHead,
  StatusChip,
  Tabs,
  Modal,
  toneVar,
} from '../ui';
import { CashFlowArea, DottedArcDonut, RevenueBars } from '../charts';
import { cx, dueLabel, inr, inrCompact, longDate, shortDate } from '../format';
import type { LedgerInvoice } from '../types';
import { ConnectedIntelligenceNode } from '../components/ConnectedIntelligenceNode';

type MoneyTab = 'overview' | 'invoices' | 'bills' | 'banking' | 'reports';
type InvoiceFilter = 'all' | 'overdue' | 'sent' | 'draft' | 'paid';

const TAB_FROM_SUB: Record<string, MoneyTab> = {
  overview: 'overview',
  invoices: 'invoices',
  bills: 'bills',
  banking: 'banking',
  reports: 'reports',
};

const ACCOUNTS = [
  { id: 'hdfc', name: 'HDFC Current', number: '•••• 4019', balance: '₹72,84,120.40', tone: 'cyan' as const, share: 52 },
  { id: 'icici', name: 'ICICI Current', number: '•••• 9912', balance: '₹46,12,880.00', tone: 'violet' as const, share: 33 },
  { id: 'sbi', name: 'SBI Current', number: '•••• 7701', balance: '₹21,03,410.20', tone: 'amber' as const, share: 15 },
];

export const MoneyScreen: React.FC = () => {
  const { snapshot, markInvoicePaid, notify, refresh, loading, source } = useWorkspace();
  const { route, navigate, setSub, closeDetail } = useRouter();
  const [tab, setTab] = useState<MoneyTab>('overview');
  const [filter, setFilter] = useState<InvoiceFilter>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<LedgerInvoice | null>(null);
  const [reconciled, setReconciled] = useState<string[]>([]);

  useEffect(() => {
    const requested = route.sub && TAB_FROM_SUB[route.sub] ? TAB_FROM_SUB[route.sub] : null;
    if (requested) setTab(requested);
    if (route.sub === 'invoice' && route.id) {
      const invoice = snapshot.invoices.find((item) => item.id === route.id);
      if (invoice) setSelected(invoice);
    }
  }, [route.sub, route.id, snapshot.invoices]);

  useEffect(() => {
    if (!selected) return;
    const latest = snapshot.invoices.find((item) => item.id === selected.id);
    if (latest && latest !== selected) setSelected(latest);
  }, [snapshot.invoices, selected]);

  const overdue = snapshot.invoices.filter((invoice) => invoice.status === 'overdue');
  const payables = snapshot.bills
    .filter((bill) => bill.status !== 'paid')
    .reduce((sum, bill) => sum + Number.parseFloat(bill.balance || '0'), 0);
  const receivable = snapshot.invoices
    .filter((invoice) => invoice.status !== 'paid' && invoice.status !== 'void')
    .reduce((sum, invoice) => sum + Number.parseFloat(invoice.balance || '0'), 0);

  const openTab = (next: MoneyTab) => {
    setTab(next);
    setSub(next === 'overview' ? null : next);
  };

  const openInvoice = (invoice: LedgerInvoice) => {
    setSelected(invoice);
    navigate('money', { sub: 'invoice', id: invoice.id });
  };

  const closeInvoice = () => {
    setSelected(null);
    closeDetail();
  };

  const filteredInvoices = useMemo(() => {
    const lower = query.trim().toLowerCase();
    const order = { overdue: 0, sent: 1, draft: 2, paid: 3, void: 4 } as Record<string, number>;
    return snapshot.invoices
      .filter((invoice) => filter === 'all' || invoice.status === filter)
      .filter((invoice) =>
        !lower ||
        `${invoice.number} ${invoice.customer} ${invoice.project} ${invoice.amount}`.toLowerCase().includes(lower),
      )
      .sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));
  }, [filter, query, snapshot.invoices]);

  const selectedTotals = useMemo(() => {
    if (!selected) return { taxable: 0, tax: 0, total: 0 };
    const total = Number.parseFloat(selected.amount || '0');
    const taxable = total / 1.18;
    return { taxable, tax: total - taxable, total };
  }, [selected]);

  const headerActions = (
    <>
      <Button onClick={() => void refresh()} disabled={loading}>
        <RefreshCw size={14} className={loading ? 'k-spin' : ''} /> Sync Zoho
      </Button>
      <Button
        variant="primary"
        onClick={() => {
          openTab('invoices');
          notify('New invoice draft started. Numbering follows the Zoho series.', 'info');
        }}
      >
        <Plus size={14} /> New invoice
      </Button>
    </>
  );

  return (
    <div className="space-y-5 xl:space-y-6">
      <PageHeader
        eyebrow="Money · ledger and liquidity"
        title={
          <>
            The ledger, as it <em>actually</em> stands.
          </>
        }
        description="Receivables, payables, banking and reports in one operating view. Amounts and tax are authoritative in Zoho Books; this console reads them, and asks before it writes."
        meta={
          <>
            <Chip tone={source === 'live' ? 'cyan' : source === 'practice' ? 'violet' : 'neutral'} dot>
              {source === 'live' ? 'Zoho live' : source === 'practice' ? 'Zoho practice' : 'Demo ledger'}
            </Chip>
            <Chip tone="neutral">FY 2026–27 · November cycle</Chip>
            <span className="k-mono text-[8.5px] uppercase tracking-[0.12em] k-faint">
              last sync {snapshot.syncedAt}
            </span>
          </>
        }
        actions={headerActions}
      />

      {/* Connected Intelligence — Accounting & Cash Flow references */}
      <ConnectedIntelligenceNode
        referenceNum={5}
        size="compact"
        onAction={(action) => {
          if (action === 'execute-action') {
            openTab('invoices');
            notify('Executing live ledger reconciliation…', 'info');
          }
        }}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: 'Cash & bank', value: '₹1.40 Cr', caption: '3 current accounts', tone: 'cyan' as const, icon: Landmark },
          { label: 'Receivables', value: inrCompact(receivable), caption: `${overdue.length} past due · ${inrCompact(overdue.reduce((sum, invoice) => sum + Number.parseFloat(invoice.balance || '0'), 0))}`, tone: 'amber' as const, icon: ReceiptText },
          { label: 'Payables', value: inrCompact(payables), caption: `${snapshot.bills.filter((bill) => bill.status !== 'paid').length} vendor bills open`, tone: 'violet' as const, icon: ArrowUpRight },
          { label: 'GST payable', value: '₹14.80 L', caption: 'GSTR-3B due 20 Dec', tone: 'rose' as const, icon: TrendingUp },
        ].map((card) => (
          <Panel key={card.label} className="k-reveal p-4">
            <div className="flex items-start justify-between">
              <span className="k-label">{card.label}</span>
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: `color-mix(in srgb, ${toneVar(card.tone)} 12%, transparent)`, color: toneVar(card.tone) }}
              >
                <card.icon size={13} />
              </span>
            </div>
            <div className="mt-2.5 k-number-hero text-[25px] text-[var(--k-t1)]">{card.value}</div>
            <div className="mt-1.5 text-[10px] k-faint">{card.caption}</div>
          </Panel>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          active={tab}
          onChange={(id) => openTab(id as MoneyTab)}
          items={[
            { id: 'overview', label: 'Overview' },
            { id: 'invoices', label: 'Invoices', count: snapshot.invoices.length },
            { id: 'bills', label: 'Bills', count: snapshot.bills.length },
            { id: 'banking', label: 'Banking', count: snapshot.bank.length },
            { id: 'reports', label: 'Reports' },
          ]}
          className="w-full sm:w-auto"
        />
        <div className="flex items-center gap-2">
          <Chip tone="cyan">Receivable ₹84.6 L</Chip>
          <Chip tone="violet">Collected 82.4%</Chip>
        </div>
      </div>

      {tab === 'overview' ? (
        <div className="space-y-3">
          <div className="grid gap-3 xl:grid-cols-[1.6fr_1fr]">
            <Panel className="p-5">
              <SectionHead
                eyebrow="Operating cash"
                title="Inflow, outflow and the month's net."
                action={<Chip tone="cyan" dot>₹68.0 L net</Chip>}
              />
              <div className="mt-4">
                <CashFlowArea data={snapshot.cashflow} height={250} />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[var(--k-line)] pt-4">
                <div>
                  <div className="k-eyebrow !text-[8px]">inflow · November</div>
                  <div className="mt-1 k-num text-[15px] font-semibold text-[var(--k-cyan)]">₹1.86 Cr</div>
                </div>
                <div>
                  <div className="k-eyebrow !text-[8px]">outflow · November</div>
                  <div className="mt-1 k-num text-[15px] font-semibold text-[var(--k-violet)]">₹1.18 Cr</div>
                </div>
                <div>
                  <div className="k-eyebrow !text-[8px]">DSO</div>
                  <div className="mt-1 k-num text-[15px] font-semibold text-[var(--k-t1)]">46 days</div>
                </div>
              </div>
            </Panel>

            <Panel className="p-5">
              <SectionHead eyebrow="Ageing" title="Receivables, by bucket." />
              <div className="mt-4">
                <DottedArcDonut
                  data={snapshot.receivables}
                  total={inrCompact(snapshot.receivables.reduce((sum, item) => sum + item.value, 0))}
                  caption="4 ageing buckets"
                />
              </div>
              <div className="mt-4 rounded-xl border border-[var(--k-amber)]/20 bg-[var(--k-amber-soft)] px-3 py-3">
                <div className="text-[10.5px] font-semibold text-[var(--k-amber)]">₹1.84 L sits in 61–90 days</div>
                <p className="mt-1 text-[10px] leading-relaxed k-muted">
                  Apex and Bansal together hold 78% of that bucket. One call each before Friday changes the month.
                </p>
              </div>
            </Panel>
          </div>

          <div className="grid gap-3 xl:grid-cols-[1fr_1.3fr]">
            <Panel className="p-5">
              <SectionHead eyebrow="Banking" title="Accounts and float." />
              <div className="mt-4 space-y-3">
                {ACCOUNTS.map((account) => (
                  <div key={account.id}>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-[11px] font-semibold text-[var(--k-t1)]">
                        <Landmark size={12} style={{ color: toneVar(account.tone) }} />
                        {account.name}
                        <span className="k-mono text-[8.5px] k-faint">{account.number}</span>
                      </span>
                      <span className="k-num text-[11px] text-[var(--k-t1)]">{account.balance}</span>
                    </div>
                    <Progress value={account.share} tone={account.tone} className="mt-1.5" />
                  </div>
                ))}
              </div>
              <button
                onClick={() => openTab('banking')}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--k-line)] py-2 text-[10px] font-semibold text-[var(--k-t2)] hover:bg-[var(--k-inset)]"
              >
                Open reconciliation <ArrowRight size={11} />
              </button>
            </Panel>

            <Panel className="p-5">
              <SectionHead
                eyebrow="Billing"
                title="Billed against target."
                action={<Chip tone="violet">88.6% of ₹2.10 Cr</Chip>}
              />
              <div className="mt-4">
                <RevenueBars data={snapshot.revenue} height={206} />
              </div>
            </Panel>
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            <Panel className="overflow-hidden p-0">
              <div className="p-5 pb-2">
                <SectionHead
                  eyebrow="Needs attention"
                  title="Three clean-up actions."
                  action={<Chip tone="rose" dot>2 overdue</Chip>}
                />
              </div>
              <div className="px-3 pb-3">
                {overdue.slice(0, 2).map((invoice) => (
                  <button
                    key={invoice.id}
                    onClick={() => openInvoice(invoice)}
                    className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-[var(--k-inset)]"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--k-rose-soft)] text-[var(--k-rose)]">
                      <ReceiptText size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11.5px] font-semibold text-[var(--k-t1)]">
                        {invoice.customer} · {inrCompact(invoice.balance)}
                      </span>
                      <span className="mt-0.5 block text-[9.5px] k-faint">
                        {invoice.number} · {dueLabel(invoice.dueDate)}
                      </span>
                    </span>
                    <ArrowUpRight size={13} className="text-[var(--k-t3)]" />
                  </button>
                ))}
                <button
                  onClick={() => notify('GSTR-3B working pack opened for review.', 'info')}
                  className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-[var(--k-inset)]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--k-amber-soft)] text-[var(--k-amber)]">
                    <Upload size={14} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11.5px] font-semibold text-[var(--k-t1)]">
                      Three unmatched purchase invoices
                    </span>
                    <span className="mt-0.5 block text-[9.5px] k-faint">
                      ₹1.18 L ITC · books close 30 November
                    </span>
                  </span>
                  <ArrowUpRight size={13} className="text-[var(--k-t3)]" />
                </button>
              </div>
            </Panel>

            <Panel className="p-5">
              <SectionHead
                eyebrow="Payables"
                title="What leaves next."
                action={
                  <button onClick={() => openTab('bills')} className="text-[10px] font-semibold text-[var(--k-cyan)] hover:underline">
                    All bills
                  </button>
                }
              />
              <div className="mt-3 space-y-1">
                {snapshot.bills
                  .filter((bill) => bill.status !== 'paid')
                  .slice(0, 4)
                  .map((bill) => (
                    <div key={bill.id} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2">
                      <div className="min-w-0">
                        <div className="truncate text-[11px] font-semibold text-[var(--k-t1)]">{bill.vendor}</div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[9px] k-faint">
                          <span>{bill.category}</span>
                          <span>·</span>
                          <span>{shortDate(bill.dueDate)}</span>
                          {bill.status === 'overdue' ? <StatusChip status="overdue" /> : null}
                        </div>
                      </div>
                      <Amount value={bill.balance} className="text-[10.5px] font-semibold text-[var(--k-t1)]" />
                    </div>
                  ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] px-3 py-2.5">
                <span className="text-[10px] k-faint">Total open payables</span>
                <span className="k-num text-[12px] font-semibold text-[var(--k-violet)]">{inrCompact(payables)}</span>
              </div>
            </Panel>
          </div>
        </div>
      ) : null}

      {tab === 'invoices' ? (
        <Panel className="overflow-hidden p-0">
          <div className="flex flex-col gap-3 border-b border-[var(--k-line)] p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  ['all', 'All', snapshot.invoices.length],
                  ['overdue', 'Overdue', snapshot.invoices.filter((invoice) => invoice.status === 'overdue').length],
                  ['sent', 'Sent', snapshot.invoices.filter((invoice) => invoice.status === 'sent').length],
                  ['draft', 'Draft', snapshot.invoices.filter((invoice) => invoice.status === 'draft').length],
                  ['paid', 'Paid', snapshot.invoices.filter((invoice) => invoice.status === 'paid').length],
                ] as Array<[InvoiceFilter, string, number]>
              ).map(([id, label, count]) => (
                <button
                  key={id}
                  onClick={() => setFilter(id)}
                  className={cx(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10.5px] font-semibold transition-colors',
                    filter === id
                      ? 'border-[var(--k-cyan)]/30 bg-[var(--k-cyan-soft)] text-[var(--k-cyan)]'
                      : 'border-[var(--k-line)] text-[var(--k-t3)] hover:text-[var(--k-t1)]',
                  )}
                >
                  {label}
                  <span className="k-mono text-[8.5px] opacity-70">{count}</span>
                </button>
              ))}
            </div>
            <SearchField value={query} onChange={setQuery} placeholder="Search invoice, client, project…" className="w-full md:w-[300px]" />
          </div>

          <div className="k-scroll-x">
            <table className="k-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Client / project</th>
                  <th>Issued</th>
                  <th>Due</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Balance</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="k-row-clickable" onClick={() => openInvoice(invoice)}>
                    <td>
                      <div className="k-mono text-[10px] font-medium text-[var(--k-t1)]">{invoice.number}</div>
                      <div className="mt-0.5 k-mono text-[8px] uppercase tracking-[0.1em] k-faint">{invoice.gstin}</div>
                    </td>
                    <td>
                      <div className="text-[11.5px] font-semibold text-[var(--k-t1)]">{invoice.customer}</div>
                      <div className="mt-0.5 text-[9.5px] k-faint">{invoice.project}</div>
                    </td>
                    <td className="whitespace-nowrap text-[10.5px]">{shortDate(invoice.date)}</td>
                    <td className="whitespace-nowrap">
                      <span className={invoice.status === 'overdue' ? 'text-[var(--k-rose)]' : ''}>
                        {shortDate(invoice.dueDate)}
                      </span>
                      <div className="mt-0.5 text-[8.5px] k-faint">{dueLabel(invoice.dueDate)}</div>
                    </td>
                    <td className="text-right"><Amount value={invoice.amount} className="text-[10.5px]" /></td>
                    <td className="text-right">
                      <Amount
                        value={invoice.balance}
                        className={cx('text-[10.5px] font-semibold', invoice.balance === '0.00' ? 'text-[var(--k-t3)]' : 'text-[var(--k-t1)]')}
                      />
                    </td>
                    <td><StatusChip status={invoice.status} /></td>
                    <td className="text-right"><ArrowUpRight size={13} className="inline text-[var(--k-t4)]" /></td>
                  </tr>
                ))}
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-[11px] k-faint">
                      No invoices match this view.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--k-line)] px-4 py-3">
            <span className="text-[10px] k-faint">
              {filteredInvoices.length} of {snapshot.invoices.length} invoices · read from Zoho Books
            </span>
            <span className="k-num text-[10.5px] text-[var(--k-t2)]">
              Open balance{' '}
              <span className="font-semibold text-[var(--k-t1)]">
                {inr(filteredInvoices.reduce((sum, invoice) => sum + Number.parseFloat(invoice.balance || '0'), 0))}
              </span>
            </span>
          </div>
        </Panel>
      ) : null}

      {tab === 'bills' ? (
        <Panel className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--k-line)] p-4">
            <SectionHead
              eyebrow="Purchases"
              title="Vendor bills and the payment queue."
              subtitle="Payments are staged here, then approved and executed in Zoho Books."
            />
            <Button size="sm" onClick={() => notify('Vendor bill draft opened.', 'info')}>
              <Plus size={12} /> Add bill
            </Button>
          </div>
          <div className="k-scroll-x">
            <table className="k-table">
              <thead>
                <tr>
                  <th>Bill</th>
                  <th>Vendor</th>
                  <th>Category</th>
                  <th>Due</th>
                  <th className="text-right">Amount</th>
                  <th className="text-right">Balance</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {snapshot.bills.map((bill) => (
                  <tr key={bill.id}>
                    <td className="k-mono text-[10px] text-[var(--k-t1)]">{bill.number}</td>
                    <td className="text-[11.5px] font-semibold text-[var(--k-t1)]">{bill.vendor}</td>
                    <td className="text-[10px]">{bill.category}</td>
                    <td className="whitespace-nowrap text-[10.5px]">
                      {shortDate(bill.dueDate)}
                      <div className="mt-0.5 text-[8.5px] k-faint">{dueLabel(bill.dueDate)}</div>
                    </td>
                    <td className="text-right"><Amount value={bill.amount} className="text-[10.5px]" /></td>
                    <td className="text-right"><Amount value={bill.balance} className="text-[10.5px] font-semibold" /></td>
                    <td><StatusChip status={bill.status} /></td>
                    <td className="text-right">
                      {bill.status !== 'paid' ? (
                        <Button
                          size="sm"
                          onClick={() => notify(`${bill.number} staged for payment approval.`, 'success')}
                        >
                          Pay
                        </Button>
                      ) : (
                        <span className="text-[9px] k-faint">settled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}

      {tab === 'banking' ? (
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            {ACCOUNTS.map((account) => (
              <Panel key={account.id} className="p-4">
                <div className="flex items-start justify-between">
                  <span className="flex items-center gap-2">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{ background: `color-mix(in srgb, ${toneVar(account.tone)} 12%, transparent)`, color: toneVar(account.tone) }}
                    >
                      <Landmark size={14} />
                    </span>
                    <span>
                      <span className="block text-[11px] font-semibold text-[var(--k-t1)]">{account.name}</span>
                      <span className="k-mono text-[8.5px] k-faint">{account.number}</span>
                    </span>
                  </span>
                  <Chip tone="cyan">feed live</Chip>
                </div>
                <div className="mt-3 k-num text-[18px] font-semibold text-[var(--k-t1)]">{account.balance}</div>
                <div className="mt-1 text-[9.5px] k-faint">Available balance · auto-fetched</div>
              </Panel>
            ))}
          </div>

          <Panel className="overflow-hidden p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--k-line)] p-4">
              <SectionHead
                eyebrow="Reconciliation"
                title="Bank feed against the ledger."
                subtitle="Matched and reconciled items update the cash position immediately."
              />
              <Chip tone="amber" dot>
                {snapshot.bank.filter((line) => !reconciled.includes(line.id) && line.status === 'unreconciled').length} unmatched
              </Chip>
            </div>
            <div className="k-scroll-x">
              <table className="k-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Account</th>
                    <th>Party / reference</th>
                    <th>Direction</th>
                    <th className="text-right">Amount</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {snapshot.bank.map((line) => {
                    const isReconciled = reconciled.includes(line.id);
                    return (
                      <tr key={line.id}>
                        <td className="whitespace-nowrap text-[10.5px]">{shortDate(line.date)}</td>
                        <td className="text-[10.5px]">{line.account}</td>
                        <td>
                          <div className="text-[11px] font-semibold text-[var(--k-t1)]">{line.party}</div>
                          <div className="k-mono mt-0.5 text-[8.5px] k-faint">{line.reference}</div>
                        </td>
                        <td>
                          <span className={cx('inline-flex items-center gap-1 text-[9.5px]', line.direction === 'credit' ? 'text-[var(--k-cyan)]' : 'text-[var(--k-violet)]')}>
                            {line.direction === 'credit' ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />}
                            {line.direction}
                          </span>
                        </td>
                        <td className="text-right">
                          <Amount
                            value={line.amount}
                            className={cx('text-[10.5px] font-semibold', line.direction === 'credit' ? 'text-[var(--k-cyan)]' : 'text-[var(--k-t1)]')}
                          />
                        </td>
                        <td><StatusChip status={isReconciled ? 'reconciled' : line.status} /></td>
                        <td className="text-right">
                          {line.status === 'unreconciled' && !isReconciled ? (
                            <Button
                              size="sm"
                              onClick={() => {
                                setReconciled((previous) => [...previous, line.id]);
                                notify(`${line.reference} matched and reconciled.`, 'success');
                              }}
                            >
                              Match
                            </Button>
                          ) : (
                            <CheckCircle2 size={13} className="inline text-[var(--k-cyan)]" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      ) : null}

      {tab === 'reports' ? (
        <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
          <Panel className="p-5">
            <SectionHead
              eyebrow="Reports"
              title="Statements ready for the month."
              subtitle="Generated from the loaded ledger. Every export is watermarked with its source and period."
            />
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {[
                { name: 'Profit & loss', detail: 'Apr–Nov 2026 · accrual', tone: 'cyan' as const },
                { name: 'Balance sheet', detail: 'As at 24 Nov 2026', tone: 'violet' as const },
                { name: 'Cash flow statement', detail: 'Indirect · 8 months', tone: 'amber' as const },
                { name: 'GST summary', detail: 'GSTR-1 & 3B · November', tone: 'rose' as const },
                { name: 'Receivables ageing', detail: '4 buckets · 6 clients', tone: 'cyan' as const },
                { name: 'Project profitability', detail: '4 live sites · cost to date', tone: 'violet' as const },
              ].map((report) => (
                <div key={report.name} className="rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[11.5px] font-semibold text-[var(--k-t1)]">{report.name}</div>
                      <div className="mt-0.5 text-[9.5px] k-faint">{report.detail}</div>
                    </div>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: toneVar(report.tone) }} />
                  </div>
                  <div className="mt-3 flex items-center gap-1.5">
                    <Button size="sm" onClick={() => notify(`${report.name} export queued as PDF.`, 'info')}>
                      <Download size={11} /> PDF
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => notify(`${report.name} opened in the preview.`, 'info')}>
                      Preview
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHead eyebrow="Month end" title="The close, in order." />
            <div className="mt-4 space-y-3">
              {[
                { title: 'Bank reconciliation', done: true, detail: '4 of 5 lines matched' },
                { title: 'Purchase bills posted', done: false, detail: '3 bills awaiting approval' },
                { title: 'E-way & delivery challans', done: false, detail: '2 consignments open' },
                { title: 'GSTR-3B working', done: false, detail: 'ITC mismatch ₹1.18 L' },
                { title: 'Project cost accrual', done: false, detail: 'Kolar line 2 pending' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-2.5">
                  <span
                    className={cx(
                      'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                      item.done
                        ? 'border-[var(--k-cyan)]/50 bg-[var(--k-cyan-soft)] text-[var(--k-cyan)]'
                        : 'border-[var(--k-line-strong)] text-transparent',
                    )}
                  >
                    <CheckCircle2 size={10} />
                  </span>
                  <div>
                    <div className={cx('text-[11px] font-semibold', item.done ? 'text-[var(--k-t3)] line-through' : 'text-[var(--k-t1)]')}>
                      {item.title}
                    </div>
                    <div className="mt-0.5 text-[9.5px] k-faint">{item.detail}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-[var(--k-violet)]/20 bg-[var(--k-violet-soft)] p-3">
              <div className="text-[10.5px] font-semibold text-[var(--k-violet)]">Books close 30 November</div>
              <p className="mt-1 text-[10px] leading-relaxed k-muted">
                Flux will hold the close until every unmatched line is explained — no silent write-offs.
              </p>
            </div>
          </Panel>
        </div>
      ) : null}

      {/* Invoice drawer */}
      <Modal
        open={Boolean(selected)}
        onClose={closeInvoice}
        title={selected?.number ?? 'Invoice'}
        eyebrow={selected ? `${selected.customer} · ${selected.status}` : ''}
        side
        width={640}
      >
        {selected ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-[var(--k-line)] bg-[var(--k-inset)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="k-eyebrow !text-[8px]">balance due</div>
                  <div className="mt-1.5 k-number-hero text-[30px] text-[var(--k-t1)]">
                    {inr(selected.balance)}
                  </div>
                  <div className="mt-1.5 text-[10px] k-faint">
                    Total {inr(selected.amount)} · {dueLabel(selected.dueDate)}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusChip status={selected.status} />
                  <span
                    className="rounded-full px-2 py-0.5 text-[8.5px] font-semibold uppercase tracking-[0.1em]"
                    style={{ background: 'var(--k-rose-soft)', color: 'var(--k-rose)' }}
                  >
                    risk {selected.risk}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="k-rule mb-2">parties</div>
              <DrawerRow label="Client">{selected.customer}</DrawerRow>
              <DrawerRow label="GSTIN" mono>{selected.gstin}</DrawerRow>
              <DrawerRow label="Place of supply">{selected.placeOfSupply}</DrawerRow>
              <DrawerRow label="Project">{selected.project}</DrawerRow>
              <DrawerRow label="Issued">{longDate(selected.date)}</DrawerRow>
              <DrawerRow label="Due">{longDate(selected.dueDate)}</DrawerRow>
            </div>

            <div>
              <div className="k-rule mb-2">line items</div>
              <div className="k-scroll-x">
                <table className="k-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>HSN</th>
                      <th className="text-right">Qty</th>
                      <th className="text-right">Rate</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.lines.map((line, index) => (
                      <tr key={`${line.name}-${index}`}>
                        <td className="text-[10.5px] text-[var(--k-t1)]">{line.name}</td>
                        <td className="k-mono text-[9.5px]">{line.hsn}</td>
                        <td className="text-right text-[10px]">
                          {line.qty} {line.unit}
                        </td>
                        <td className="text-right"><Amount value={line.rate} className="text-[10px]" /></td>
                        <td className="text-right">
                          <Amount
                            value={String(Number.parseFloat(line.qty || '0') * Number.parseFloat(line.rate || '0'))}
                            className="text-[10px] font-semibold"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] p-4">
              <div className="flex items-center justify-between py-1 text-[11px]">
                <span className="k-faint">Taxable value</span>
                <span className="k-num">{inr(selectedTotals.taxable)}</span>
              </div>
              <div className="flex items-center justify-between py-1 text-[11px]">
                <span className="k-faint">IGST 18%</span>
                <span className="k-num">{inr(selectedTotals.tax)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between border-t border-[var(--k-line)] pt-2 text-[12px] font-semibold">
                <span>Invoice total</span>
                <span className="k-num" style={{ color: 'var(--k-cyan)' }}>{inr(selectedTotals.total)}</span>
              </div>
            </div>

            <div>
              <div className="k-rule mb-2">note</div>
              <p className="text-[11px] leading-relaxed k-muted">{selected.note}</p>
            </div>

            <div className="rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] px-3 py-2.5 text-[9.5px] leading-relaxed k-faint">
              Source: {source === 'demo' ? 'demo workspace record' : 'Zoho Books'}. Marking paid here updates this console
              only; the accounting entry must still be posted in Zoho.
            </div>

            <div className="flex flex-wrap gap-2">
              {selected.status !== 'paid' ? (
                <Button
                  variant="primary"
                  onClick={() => {
                    markInvoicePaid(selected.id);
                  }}
                >
                  <CheckCircle2 size={14} /> Mark as paid
                </Button>
              ) : (
                <Button disabled>
                  <CheckCircle2 size={14} /> Settled
                </Button>
              )}
              <Button onClick={() => notify(`Payment reminder for ${selected.number} drafted.`, 'info')}>
                <Send size={14} /> Send reminder
              </Button>
              <Button variant="ghost" onClick={() => notify('PDF export queued in Zoho format.', 'info')}>
                <Download size={14} /> PDF
              </Button>
            </div>
            <div className="flex items-center gap-1 text-[9.5px] k-faint">
              <ReceiptText size={11} /> GST invoice · e-invoice reference applies above ₹5 Cr turnover.
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default MoneyScreen;
