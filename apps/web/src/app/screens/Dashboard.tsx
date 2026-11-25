import React, { useMemo } from 'react';
import { useWorkspace } from '../workspace';
import { useRouter } from '../router';
import {
  IconDashboard, IconAnalytics, IconFlux, IconGrid, IconDns, IconSettings,
  IconPerson, IconPower, IconSearch, IconNotifications, IconTerminal,
  IconBolt, IconTrendingUp, IconPsychology, IconVerifiedUser,
  IconArrowUpward, IconMoreVert, IconArrowForward, IconLightbulb, IconAutoAwesome
} from '../../components/common/Icons';
import { cx, inrCompact } from '../format';
import {
  PageHeader, Panel, Chip, KpiCard, SectionHead,
} from '../ui';
import { CashFlowArea, DottedArcDonut } from '../charts';

const CHART_DATA = [
  { time: '00:00', value: 160 },
  { time: '04:00', value: 130 },
  { time: '08:00', value: 110 },
  { time: '12:00', value: 80 },
  { time: '16:00', value: 50 },
  { time: '20:00', value: 30 },
  { time: 'NOW', value: 20 },
];

const WORKLOAD_DATA = [
  { label: 'Cyan Core Matrix', value: 54.2, color: 'var(--k-cyan)' },
  { label: 'Violet Vector Array', value: 28.6, color: 'var(--k-violet)' },
  { label: 'Brass Neural Edge', value: 17.2, color: 'var(--k-amber)' },
];

const NODE_DATA = [
  { id: '#NX-9042', cluster: 'US-EAST-ALPHA', status: 'OPTIMAL', telemetry: '0.9ms / 99.4%', tone: 'cyan' },
  { id: '#NX-9043', cluster: 'EU-CENTRAL-1', status: 'REBALANCING', telemetry: '2.4ms / 98.1%', tone: 'violet' },
  { id: '#NX-9044', cluster: 'AP-NORTHEAST', status: 'OPTIMAL', telemetry: '1.1ms / 99.9%', tone: 'cyan' },
  { id: '#NX-9045', cluster: 'SA-EAST-1', status: 'HIGH-LOAD', telemetry: '4.8ms / 95.2%', tone: 'amber' },
];

const STATUS_CHIPS: Record<string, { tone: string; label: string }> = {
  OPTIMAL: { tone: 'cyan', label: 'OPTIMAL' },
  REBALANCING: { tone: 'violet', label: 'REBALANCING' },
  'HIGH-LOAD': { tone: 'amber', label: 'HIGH-LOAD' },
};

export const DashboardScreen: React.FC = () => {
  const { snapshot, source, refresh, loading } = useWorkspace();
  const { navigate } = useRouter();

  const cashKpi = snapshot.kpis.find(k => k.id === 'cash');
  const receivablesKpi = snapshot.kpis.find(k => k.id === 'receivables');
  const revenueKpi = snapshot.kpis.find(k => k.id === 'revenue');
  const gstKpi = snapshot.kpis.find(k => k.id === 'gst');

  const overdue = snapshot.invoices.filter((invoice) => invoice.status === 'overdue');
  const overdueValue = overdue.reduce((sum, invoice) => sum + Number.parseFloat(invoice.balance || '0'), 0);
  const payables = snapshot.bills
    .filter((bill) => bill.status !== 'paid')
    .reduce((sum, bill) => sum + Number.parseFloat(bill.balance || '0'), 0);
  const receivable = snapshot.invoices
    .filter((invoice) => invoice.status !== 'paid' && invoice.status !== 'void')
    .reduce((sum, invoice) => sum + Number.parseFloat(invoice.balance || '0'), 0);

  return (
    <div className="space-y-5 xl:space-y-6">
      <PageHeader
        eyebrow={`${snapshot.syncedAt} · Bhopal · IST`}
        title={
          <>
            Good morning, <em className="not-italic" style={{ color: 'var(--k-cyan)' }}>Karmen</em>.
            <br className="hidden sm:block" /> Here is the live operating picture.
          </>
        }
        description="Every figure below is one operating picture: ledger, delivery, compliance and the next decision — in the order it matters."
        meta={
          <div className="flex items-center gap-2">
            <Chip tone={source === 'live' ? 'cyan' : source === 'practice' ? 'violet' : 'neutral'} dot>
              {source === 'live' ? 'Zoho live' : source === 'practice' ? 'Practice ledger' : 'Demo workspace'}
            </Chip>
            <span className="k-mono text-[10px] uppercase tracking-[0.14em] text-[var(--k-t3)]">{snapshot.syncedAt} IST</span>
          </div>
        }
        actions={
          <button
            onClick={() => void refresh()}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] px-3 py-1.5 text-[var(--k-t3)] transition-colors hover:border-[var(--k-line-strong)] hover:text-[var(--k-t2)]"
            aria-label="Refresh workspace"
          >
            <IconArrowUpward size={13} />
            <span className="hidden md:inline">Sync</span>
          </button>
        }
      />

      {/* Dynamic Island Ticker */}
      <div className="flex h-9 items-center overflow-hidden border-b border-[var(--k-line)] bg-[var(--k-bg-2)]/60 rounded-xl">
        <div className="flex shrink-0 items-center gap-2 border-r border-[var(--k-line)] px-4 h-full">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--k-cyan)] animate-pulse" />
          <span className="k-mono text-[8px] uppercase tracking-[0.18em] text-[var(--k-t3)]">live signal</span>
        </div>
        <div className="relative flex-1 overflow-hidden">
          <div className="flex w-max items-center gap-8 whitespace-nowrap px-5 animate-marquee">
            {[`CASH ${cashKpi?.value ?? '—'}`, `RECEIVABLES ${receivablesKpi?.value ?? '—'}`, `BILLINGS ${revenueKpi?.value ?? '—'}`, `GST ${gstKpi?.value ?? '—'} · DUE 20 DEC`, `${snapshot.dispatches.filter((dispatch) => dispatch.status === 'in_transit').length} CONSIGNMENTS IN TRANSIT`, `${snapshot.projects.length} LIVE SITES`, `${snapshot.gates.filter((gate) => gate.severity === 'critical').length} CRITICAL GATES`, source === 'demo' ? 'DEMO RECORDS · LABELLED' : 'ZOHO LEDGER · SOURCE OF TRUTH'].map((item, index) => (
              <span key={`${item}-${index}`} className="flex items-center gap-2 k-mono text-[9px] uppercase tracking-[0.1em] text-[var(--k-t3)]">
                <span className="h-1 w-1 rounded-full bg-[var(--k-t3)]/50" />
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="hidden shrink-0 items-center gap-2 border-l border-[var(--k-line)] px-4 h-full md:flex">
          <IconFlux size={11} className="text-[var(--k-violet)]" />
          <span className="k-mono text-[8px] uppercase tracking-[0.16em] text-[var(--k-violet)]">flux ready</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cashKpi && <KpiCard kpi={cashKpi} index={0} />}
        {receivablesKpi && <KpiCard kpi={receivablesKpi} index={1} />}
        {revenueKpi && <KpiCard kpi={revenueKpi} index={2} />}
        {gstKpi && <KpiCard kpi={gstKpi} index={3} />}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Panel className="lg:col-span-8">
          <SectionHead
            title="Throughput velocity & telemetry"
            subtitle="Real-time vector data streaming across global subnets"
            action={
              <div className="flex items-center gap-1">
                {(['1H', '24H', '7D'] as const).map(period => (
                  <button
                    key={period}
                    className="px-3 py-1 rounded-lg text-[11px] font-bold transition-colors text-[var(--k-t3)] hover:text-[var(--k-t1)]"
                  >
                    {period}
                  </button>
                ))}
              </div>
            }
          />
          <div className="h-64 w-full">
            <CashFlowArea
              data={[
                { month: 'JAN', inflow: 82, outflow: 64, net: 18 },
                { month: 'FEB', inflow: 86, outflow: 71, net: 15 },
                { month: 'MAR', inflow: 84, outflow: 74, net: 10 },
                { month: 'APR', inflow: 91, outflow: 82, net: 9 },
                { month: 'MAY', inflow: 96, outflow: 88, net: 8 },
                { month: 'JUN', inflow: 94, outflow: 91, net: 3 },
                { month: 'JUL', inflow: 102, outflow: 96, net: 6 },
                { month: 'AUG', inflow: 108, outflow: 102, net: 6 },
                { month: 'SEP', inflow: 112, outflow: 106, net: 6 },
                { month: 'OCT', inflow: 118, outflow: 112, net: 6 },
                { month: 'NOV', inflow: 121, outflow: 118, net: 3 },
                { month: 'DEC', inflow: 128, outflow: 124, net: 4 },
              ]}
              height={230}
            />
          </div>
        </Panel>

        <Panel className="lg:col-span-4">
          <SectionHead
            title="Workload allocation"
            subtitle="Distribution across processing clusters"
          />
          <div className="space-y-5">
            {WORKLOAD_DATA.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-[12px] font-semibold k-mono">
                  <span className="flex items-center gap-2 text-[var(--k-t2)]">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </span>
                  <span className="text-[var(--k-t1)]">{item.value}%</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden bg-[var(--k-inset)]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.value}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between px-4 py-3 rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)]">
            <span className="k-mono text-[8px] uppercase tracking-[0.14em] text-[var(--k-t3)]">Optimization state</span>
            <Chip tone="cyan" dot>AUTONOMOUS</Chip>
          </div>
        </Panel>
      </div>

      {/* Flux AI + Live Data Matrices */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Panel className="lg:col-span-4">
          <SectionHead
            title="Flux AI Assistant"
            subtitle="Autonomous workflow engine monitoring cluster stability"
            action={
              <Chip tone="cyan" dot>ACTIVE</Chip>
            }
          />
          <div className="space-y-4 mb-6">
            <div className="p-4 rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] flex items-start gap-3">
              <IconLightbulb size={16} style={{ color: 'var(--k-amber)' }} className="mt-0.5" />
              <div>
                <p className="text-[12px] font-semibold text-[var(--k-t1)]">Rebalance sub-routing for node cluster AP-09</p>
                <p className="mt-0.5 text-[11px] text-[var(--k-t3)]">Reduce jitter by 4.2% across 124 worker instances.</p>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] flex items-start gap-3">
              <IconAutoAwesome size={16} style={{ color: 'var(--k-cyan)' }} className="mt-0.5" />
              <div>
                <p className="text-[12px] font-semibold text-[var(--k-t1)]">Workflow automated</p>
                <p className="mt-0.5 text-[11px] text-[var(--k-t3)]">Auto-scaled memory allocation across all zones.</p>
              </div>
            </div>
          </div>
          <form className="relative" onSubmit={e => { e.preventDefault(); }}>
            <input
              type="text"
              placeholder="Prompt Flux AI command…"
              className="w-full bg-[var(--k-inset)] text-[var(--k-t1)] pl-4 pr-12 py-3 rounded-xl text-[12px] outline-none focus:ring-1 focus:ring-[var(--k-cyan)] border border-[var(--k-line)]"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-[var(--k-cyan)] text-[var(--k-bg)] flex items-center justify-center hover:brightness-110 transition-all"
            >
              <IconArrowUpward size={14} />
            </button>
          </form>
        </Panel>

        <Panel className="lg:col-span-8">
          <SectionHead
            title="Live data matrices"
            subtitle="Recent cluster deployments & active telemetry states"
            action={
              <button className="text-[var(--k-cyan)] text-[11px] font-bold hover:underline flex items-center gap-1">
                View all matrices
                <IconArrowForward size={12} />
              </button>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.1em] text-[var(--k-t3)] border-b border-[var(--k-line)]">
                  <th className="py-3 px-5">NODE ID</th>
                  <th className="py-3 px-5">CLUSTER</th>
                  <th className="py-3 px-5">STATUS</th>
                  <th className="py-3 px-5 text-right">TELEMETRY</th>
                  <th className="py-3 px-5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--k-line)] text-[12px] k-mono">
                {NODE_DATA.map((node, index) => {
                  const statusConfig = STATUS_CHIPS[node.status];
                  return (
                    <tr key={index} className="hover:bg-[var(--k-raised)] transition-colors">
                      <td className="py-4 px-5 font-semibold text-[var(--k-t1)]">{node.id}</td>
                      <td className="py-4 px-5 text-[var(--k-t2)]">{node.cluster}</td>
                      <td className="py-4 px-5">
                        <Chip tone={statusConfig.tone as any} dot>{statusConfig.label}</Chip>
                      </td>
                      <td className="py-4 px-5 text-right text-[var(--k-t2)]">{node.telemetry}</td>
                      <td className="py-4 px-5 text-right">
                        <button className="p-1.5 rounded hover:bg-[var(--k-raised)] text-[var(--k-t3)] hover:text-[var(--k-t1)]" aria-label="More actions">
                          <IconMoreVert size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--k-line)] text-[11px] text-[var(--k-t3)] k-mono">
            <span>Showing 4 of {snapshot.projects.length + snapshot.clients.length} active clusters</span>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 bg-[var(--k-inset)] text-[var(--k-t2)] rounded-lg hover:bg-[var(--k-raised)] transition-colors">Prev</button>
              <button className="px-3 py-1.5 bg-[var(--k-inset)] text-[var(--k-t2)] rounded-lg hover:bg-[var(--k-raised)] transition-colors">Next</button>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
};

export default DashboardScreen;