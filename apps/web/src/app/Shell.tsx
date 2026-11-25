import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Bell,
  ChevronRight,
  Command,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Search,
  Sparkles,
  X,
  Lock,
  Settings,
  UserRound,
  Wallet,
  Truck,
  HardHat,
  Handshake,
  FileText,
  ShieldCheck,
  Boxes,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from './auth';
import { useWorkspace } from './workspace';
import { useRouter } from './router';
import { NAV_GROUPS, MOBILE_ITEMS, ROUTE_LABELS, type RouteKey } from './nav';
import { cx, dueLabel, inrCompact, timeStamp } from './format';
import { Avatar, Button, Chip, IconButton, Ring, StatusChip, Toast, toneVar } from './ui';
import { useApp } from '../context/AppContext';

const ROUTE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  today: LayoutDashboard,
  money: Wallet,
  projects: HardHat,
  fleet: Truck,
  materials: Boxes,
  gates: ShieldCheck,
  people: UserRound,
  clients: Handshake,
  documents: FileText,
  flux: Sparkles,
  settings: Settings,
};

function useIstClock(): string {
  const [time, setTime] = useState(() => timeStamp());
  useEffect(() => {
    const timer = setInterval(() => setTime(timeStamp()), 30_000);
    return () => clearInterval(timer);
  }, []);
  return time;
}

const BrandMark: React.FC<{ collapsed?: boolean }> = ({ collapsed }) => {
  const { navigate } = useRouter();
  return (
    <button
      onClick={() => navigate('today')}
      className={cx('group flex items-center gap-3 text-left', collapsed && 'justify-center')}
      aria-label="RTA by KARM · Command deck"
    >
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border border-white/10 bg-white/[0.045] shadow-[0_0_22px_rgba(34,211,238,0.08)]">
        <img src="/karm-symbol-white.png" alt="" className="h-7 w-7 object-contain" />
        <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[var(--k-cyan)] shadow-[0_0_8px_var(--k-cyan)]" />
      </span>
      {!collapsed ? (
        <span className="min-w-0">
          <span className="block text-[15px] font-extrabold leading-none tracking-[-0.05em] text-[var(--k-t1)]">
            RTA <span className="font-medium text-[var(--k-t3)]">by</span> KARM
          </span>
          <span className="mt-1 block k-mono text-[7.5px] uppercase tracking-[0.22em] text-[var(--k-cyan)]">
            living business OS
          </span>
        </span>
      ) : null}
    </button>
  );
};

const SourceBadge: React.FC<{ source: string }> = ({ source }) => {
  const tone = source === 'live' ? 'cyan' : source === 'practice' ? 'violet' : 'neutral';
  return (
    <Chip tone={tone} dot>
      {source === 'live' ? 'Zoho live' : source === 'practice' ? 'Practice ledger' : 'Demo workspace'}
    </Chip>
  );
};

const Sidebar: React.FC<{
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}> = ({ collapsed, onToggle, onNavigate }) => {
  const { route, navigate } = useRouter();
  const { snapshot, source, refresh, loading } = useWorkspace();
  const { signOut } = useAuth();

  return (
    <aside
      className={cx(
        'fixed left-0 top-0 z-50 hidden h-full flex-col border-r border-[var(--k-line)] bg-[var(--k-sidebar)] backdrop-blur-2xl transition-[width] duration-300 lg:flex',
        collapsed ? 'w-[84px]' : 'w-[266px]',
      )}
    >
      <div className={cx('flex h-[76px] items-center border-b border-[var(--k-line)] px-5', collapsed && 'justify-center px-3')}>
        <BrandMark collapsed={collapsed} />
      </div>

      <div className="flex-1 overflow-y-auto py-5 k-hide-scroll">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            {!collapsed ? <div className="k-eyebrow mb-2 px-[22px] !text-[8.5px]">{group.label}</div> : null}
            <div className="space-y-0.5 px-3">
              {group.items.map((item) => {
                const active = route.key === item.key;
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      navigate(item.key);
                      onNavigate?.();
                    }}
                    className={cx('k-nav-item', active && 'k-nav-item-active', collapsed && 'justify-center px-0')}
                    title={collapsed ? item.label : item.hint}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon size={17} className={active ? 'text-[var(--k-cyan)]' : 'text-[var(--k-t3)]'} />
                    {!collapsed ? (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.key === 'gates' ? (
                          <span className="k-chip !min-h-[18px] !border-[var(--k-rose)]/25 !bg-[var(--k-rose-soft)] !px-1.5 !text-[8px] !text-[var(--k-rose)]">2</span>
                        ) : null}
                        {item.key === 'flux' ? (
                          <span className="k-mono text-[8px] uppercase tracking-[0.12em] text-[var(--k-violet)]">AI</span>
                        ) : null}
                      </>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-[var(--k-line)] p-3">
        {!collapsed ? (
          <div className="mb-3 rounded-2xl border border-[var(--k-line)] bg-[var(--k-inset)] p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ring value={94} size={34} stroke={3.5} tone="cyan" label="" />
                <div>
                  <div className="text-[10.5px] font-bold text-[var(--k-t1)]">Workspace healthy</div>
                  <div className="mt-0.5 text-[9px] text-[var(--k-t3)]">Flux · {source === 'demo' ? 'sample records' : 'live records'}</div>
                </div>
              </div>
              <button
                onClick={() => void refresh()}
                className="rounded-md p-1.5 text-[var(--k-t3)] hover:bg-[var(--k-raised)] hover:text-[var(--k-cyan)]"
                aria-label="Refresh workspace"
              >
                <RefreshCw size={13} className={loading ? 'k-spin' : ''} />
              </button>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[9px] text-[var(--k-t3)]">
              <span className="k-mono">SYNC {snapshot.syncedAt}</span>
              <span className="k-mono text-[var(--k-cyan)]">99.9%</span>
            </div>
          </div>
        ) : null}

        <div className={cx('flex items-center', collapsed ? 'justify-center' : 'justify-between')}>
          <button
            className={cx('flex min-w-0 items-center gap-2.5 rounded-xl p-1.5 hover:bg-[var(--k-raised)]', collapsed && 'justify-center')}
            title="Workspace owner"
          >
            <Avatar name={snapshot.operator} size={30} tone="violet" />
            {!collapsed ? (
              <span className="min-w-0 text-left">
                <span className="block truncate text-[11px] font-bold text-[var(--k-t1)]">{snapshot.operator} Parmar</span>
                <span className="block text-[9px] text-[var(--k-t3)]">Owner · Bhopal</span>
              </span>
            ) : null}
          </button>
          {!collapsed ? (
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => {
                  if (window.confirm('Sign out of this workspace?')) void signOut();
                }}
                className="rounded-md p-1.5 text-[var(--k-t3)] hover:bg-[var(--k-raised)] hover:text-[var(--k-rose)]"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
              <button
                onClick={onToggle}
                className="rounded-md p-1.5 text-[var(--k-t3)] hover:bg-[var(--k-raised)] hover:text-[var(--k-t1)]"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={onToggle}
              className="mt-1 hidden rounded-md p-1 text-[var(--k-t3)] hover:text-[var(--k-t1)] lg:block"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen size={14} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

interface SearchResult {
  type: 'nav' | 'invoice' | 'project' | 'client' | 'action';
  label: string;
  detail: string;
  onRun: () => void;
}

const CommandPalette: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { navigate } = useRouter();
  const { snapshot, notify } = useWorkspace();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const results = useMemo<SearchResult[]>(() => {
    if (!open) return [];
    const lower = query.trim().toLowerCase();
    const items: SearchResult[] = [];

    for (const group of NAV_GROUPS) {
      for (const item of group.items) {
        if (!lower || `${item.label} ${item.hint}`.toLowerCase().includes(lower)) {
          items.push({
            type: 'nav',
            label: item.label,
            detail: item.hint,
            onRun: () => {
              navigate(item.key);
              onClose();
            },
          });
        }
      }
    }

    if (lower) {
      for (const invoice of snapshot.invoices) {
        if (`${invoice.number} ${invoice.customer}`.toLowerCase().includes(lower)) {
          items.push({
            type: 'invoice',
            label: invoice.number,
            detail: `${invoice.customer} · ${inrCompact(invoice.balance)}`,
            onRun: () => {
              navigate('money', { sub: 'invoice', id: invoice.id });
              onClose();
            },
          });
        }
      }
      for (const project of snapshot.projects) {
        if (`${project.name} ${project.client}`.toLowerCase().includes(lower)) {
          items.push({
            type: 'project',
            label: project.name,
            detail: `${project.progress}% complete · ${project.code}`,
            onRun: () => {
              navigate('projects', { id: project.id });
              onClose();
            },
          });
        }
      }
      for (const client of snapshot.clients) {
        if (`${client.name} ${client.contact}`.toLowerCase().includes(lower)) {
          items.push({
            type: 'client',
            label: client.name,
            detail: `${client.city} · ${client.outstanding}`,
            onRun: () => {
              navigate('clients');
              onClose();
            },
          });
        }
      }
    }

    items.push({
      type: 'action',
      label: 'Ask Flux about this workspace',
      detail: 'Open the source-grounded assistant',
      onRun: () => {
        navigate('flux');
        onClose();
      },
    });
    items.push({
      type: 'action',
      label: 'Refresh from Zoho Books',
      detail: 'Re-read the connected ledger',
      onRun: () => {
        notify('Refreshing the workspace…', 'info');
        onClose();
      },
    });

    return items.slice(0, 16);
  }, [open, query, snapshot, navigate, onClose, notify]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[130]" role="dialog" aria-modal="true" aria-label="Command palette">
      <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-label="Close command palette" tabIndex={-1} />
      <div className="k-fade relative mx-auto mt-[12vh] w-[92vw] max-w-[620px] overflow-hidden rounded-2xl border border-[var(--k-line-strong)] bg-[var(--k-panel-solid)] shadow-2xl">
        <div className="flex items-center gap-3 border-b border-[var(--k-line)] px-4">
          <Search size={16} className="text-[var(--k-cyan)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the workspace, or jump to a module…"
            className="h-[56px] flex-1 bg-transparent text-[13px] outline-none placeholder:text-[var(--k-t3)]"
            aria-label="Search the workspace"
          />
          <span className="k-kbd">ESC</span>
        </div>
        <div className="max-h-[58vh] overflow-y-auto p-2">
          {results.map((result, index) => (
            <button
              key={`${result.type}-${result.label}-${index}`}
              onClick={result.onRun}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--k-raised)] focus:bg-[var(--k-raised)] focus:outline-none"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--k-line)] bg-[var(--k-inset)] text-[var(--k-t3)]">
                {result.type === 'nav' ? <Command size={13} /> : result.type === 'action' ? <Sparkles size={13} /> : <FileText size={13} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-semibold text-[var(--k-t1)]">{result.label}</span>
                <span className="mt-0.5 block truncate text-[10.5px] text-[var(--k-t3)]">{result.detail}</span>
              </span>
              <ArrowRight size={13} className="text-[var(--k-t3)]" />
            </button>
          ))}
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-[12px] text-[var(--k-t3)]">No records match “{query}”.</div>
          ) : null}
        </div>
        <div className="flex items-center justify-between border-t border-[var(--k-line)] px-4 py-2.5 text-[9px] text-[var(--k-t3)]">
          <span className="k-mono">KARM COMMAND · {snapshot.invoices.length} invoices · {snapshot.projects.length} sites</span>
          <span className="k-mono">↵ to open</span>
        </div>
      </div>
    </div>
  );
};

const NotificationsPanel: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { snapshot } = useWorkspace();
  const { navigate } = useRouter();
  if (!open) return null;

  const urgentGates = snapshot.gates.filter((gate) => gate.severity === 'critical');
  const overdue = snapshot.invoices.filter((invoice) => invoice.status === 'overdue');

  return (
    <>
      <button className="fixed inset-0 z-[90] cursor-default" onClick={onClose} aria-label="Close notifications" tabIndex={-1} />
      <div className="k-fade absolute right-0 top-[calc(100%+10px)] z-[100] w-[360px] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border border-[var(--k-line-strong)] bg-[var(--k-panel-solid)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--k-line)] px-4 py-3">
          <div>
            <div className="text-[12px] font-bold">Attention signal</div>
            <div className="mt-0.5 text-[9.5px] text-[var(--k-t3)]">{urgentGates.length + overdue.length} live items</div>
          </div>
          <Chip tone="rose" dot>live</Chip>
        </div>
        <div className="max-h-[360px] overflow-y-auto p-2">
          {urgentGates.map((gate) => (
            <button
              key={gate.id}
              onClick={() => {
                navigate('gates');
                onClose();
              }}
              className="flex w-full items-start gap-2.5 rounded-xl p-2.5 text-left hover:bg-[var(--k-raised)]"
            >
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--k-rose)] shadow-[0_0_8px_var(--k-rose)]" />
              <span>
                <span className="block text-[11.5px] font-semibold">{gate.title}</span>
                <span className="mt-0.5 block text-[10px] text-[var(--k-t3)]">{gate.due} · {gate.owner}</span>
              </span>
            </button>
          ))}
          {overdue.map((invoice) => (
            <button
              key={invoice.id}
              onClick={() => {
                navigate('money', { sub: 'invoice', id: invoice.id });
                onClose();
              }}
              className="flex w-full items-start gap-2.5 rounded-xl p-2.5 text-left hover:bg-[var(--k-raised)]"
            >
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--k-amber)] shadow-[0_0_8px_var(--k-amber)]" />
              <span>
                <span className="block text-[11.5px] font-semibold">{invoice.customer} · {inrCompact(invoice.balance)}</span>
                <span className="mt-0.5 block text-[10px] text-[var(--k-t3)]">{dueLabel(invoice.dueDate)} · {invoice.number}</span>
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            navigate('flux');
            onClose();
          }}
          className="flex w-full items-center justify-between border-t border-[var(--k-line)] px-4 py-3 text-[10.5px] font-semibold text-[var(--k-violet)] hover:bg-[var(--k-raised)]"
        >
          Ask Flux what matters most
          <Sparkles size={13} />
        </button>
      </div>
    </>
  );
};

const LiveTicker: React.FC = () => {
  const { snapshot, source } = useWorkspace();
  const items = [
    `CASH ${snapshot.kpis[0]?.value ?? '—'}`,
    `RECEIVABLES ${snapshot.kpis[1]?.value ?? '—'}`,
    `BILLINGS ${snapshot.kpis[2]?.value ?? '—'}`,
    `GST ${snapshot.kpis[3]?.value ?? '—'} · DUE 20 DEC`,
    `${snapshot.dispatches.filter((dispatch) => dispatch.status === 'in_transit').length} CONSIGNMENTS IN TRANSIT`,
    `${snapshot.projects.length} LIVE SITES`,
    `${snapshot.gates.filter((gate) => gate.severity === 'critical').length} CRITICAL GATES`,
    source === 'demo' ? 'DEMO RECORDS · LABELLED' : 'ZOHO LEDGER · SOURCE OF TRUTH',
  ];
  return (
    <div className="flex h-9 items-center overflow-hidden border-b border-[var(--k-line)] bg-[var(--k-bg-2)]/60">
      <div className="flex shrink-0 items-center gap-2 border-r border-[var(--k-line)] px-4 h-full">
        <span className="k-dot k-dot-pulse text-[var(--k-cyan)]" />
        <span className="k-mono text-[8px] uppercase tracking-[0.18em] text-[var(--k-t3)]">live signal</span>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <div className="k-marquee flex w-max items-center gap-8 whitespace-nowrap px-5">
          {[...items, ...items].map((item, index) => (
            <span key={`${item}-${index}`} className="flex items-center gap-2 k-mono text-[9px] uppercase tracking-[0.1em] text-[var(--k-t3)]">
              <span className="h-1 w-1 rounded-full bg-[var(--k-t3)]/50" />
              {item}
            </span>
          ))}
        </div>
      </div>
      <div className="hidden shrink-0 items-center gap-2 border-l border-[var(--k-line)] px-4 h-full md:flex">
        <Sparkles size={11} className="text-[var(--k-violet)]" />
        <span className="k-mono text-[8px] uppercase tracking-[0.16em] text-[var(--k-violet)]">flux ready</span>
      </div>
    </div>
  );
};

const Topbar: React.FC<{
  onMenu: () => void;
  onSearch: () => void;
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
}> = ({ onMenu, onSearch, onToggleSidebar, sidebarCollapsed }) => {
  const { route, navigate } = useRouter();
  const { snapshot, source, loading, refresh } = useWorkspace();
  const { organization } = useAuth();
  const { isLocked, setIsLocked } = useApp();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const clock = useIstClock();
  const alerts = snapshot.gates.filter((gate) => gate.severity === 'critical').length + snapshot.invoices.filter((invoice) => invoice.status === 'overdue').length;

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--k-line)] bg-[var(--k-bg)]/82 backdrop-blur-2xl">
      <div className="flex h-[64px] items-center gap-3 px-4 md:px-6">
        <button
          onClick={onMenu}
          className="k-icon-btn lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={17} />
        </button>
        <button
          onClick={onToggleSidebar}
          className="k-icon-btn hidden lg:inline-flex"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>

        <div className="hidden min-w-0 items-center gap-2 sm:flex">
          <span className="k-mono text-[9px] uppercase tracking-[0.14em] text-[var(--k-t3)]">RTA</span>
          <ChevronRight size={11} className="text-[var(--k-t4)]" />
          <span className="k-mono text-[9px] uppercase tracking-[0.14em] text-[var(--k-t3)]">{organization?.name ?? 'Karm Enterprises'}</span>
          <ChevronRight size={11} className="text-[var(--k-t4)]" />
          <span className="truncate text-[11.5px] font-semibold text-[var(--k-t1)]">{ROUTE_LABELS[route.key]}</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onSearch}
            className="group flex h-9 items-center gap-2 rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] px-3 text-[var(--k-t3)] transition-colors hover:border-[var(--k-line-strong)] hover:text-[var(--k-t2)]"
            aria-label="Search the workspace, Command K"
          >
            <Search size={14} />
            <span className="hidden text-[11px] md:inline">Search the workspace</span>
            <span className="k-kbd ml-2 hidden md:inline-flex">⌘K</span>
          </button>

          <div className="hidden items-center gap-2 xl:flex">
            <SourceBadge source={source} />
            <span className="k-mono text-[8.5px] uppercase tracking-[0.12em] text-[var(--k-t3)]">{clock} IST</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => void refresh()}
            disabled={loading}
            className="hidden sm:inline-flex !border-[var(--k-line)]"
          >
            <RefreshCw size={13} className={loading ? 'k-spin' : ''} />
            <span className="hidden md:inline">Sync</span>
          </Button>

          <div className="relative">
            <IconButton
              onClick={() => {
                setNotificationsOpen((value) => !value);
                setProfileOpen(false);
              }}
              aria-label={`Notifications, ${alerts} attention items`}
              aria-expanded={notificationsOpen}
              className="relative"
            >
              <Bell size={16} />
              {alerts > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--k-rose)] px-1 text-[8px] font-bold text-[#1b0710]">
                  {alerts}
                </span>
              ) : null}
            </IconButton>
            <NotificationsPanel open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setProfileOpen((value) => !value);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-2 rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] p-1 pr-2 transition-colors hover:border-[var(--k-line-strong)]"
              aria-label="Open account menu"
              aria-expanded={profileOpen}
            >
              <Avatar name={snapshot.operator} size={28} tone="violet" />
              <span className="hidden text-[10.5px] font-semibold text-[var(--k-t2)] md:block">{snapshot.operator}</span>
              <ChevronRight size={11} className={cx('hidden text-[var(--k-t3)] transition-transform md:block', profileOpen && 'rotate-90')} />
            </button>
            {profileOpen ? (
              <>
                <button className="fixed inset-0 z-[90] cursor-default" onClick={() => setProfileOpen(false)} aria-label="Close account menu" tabIndex={-1} />
                <div className="k-fade absolute right-0 top-[calc(100%+10px)] z-[100] w-[260px] overflow-hidden rounded-2xl border border-[var(--k-line-strong)] bg-[var(--k-panel-solid)] p-2 shadow-2xl">
                  <div className="mb-1 rounded-xl bg-[var(--k-inset)] px-3 py-2.5">
                    <div className="text-[11.5px] font-bold">{snapshot.operator} Parmar</div>
                    <div className="mt-0.5 text-[9.5px] text-[var(--k-t3)]">Owner · {organization?.name ?? 'Karm Enterprises'}</div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <SourceBadge source={source} />
                    </div>
                  </div>
                  <button onClick={() => { navigate('settings'); setProfileOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[11.5px] text-[var(--k-t2)] hover:bg-[var(--k-raised)] hover:text-[var(--k-t1)]">
                    <Settings size={14} /> Workspace settings
                  </button>
                  <button onClick={() => { setIsLocked(true); setProfileOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[11.5px] text-[var(--k-t2)] hover:bg-[var(--k-raised)] hover:text-[var(--k-t1)]">
                    <Lock size={14} /> Lock this session
                  </button>
                  <button onClick={() => navigate('flux')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[11.5px] text-[var(--k-t2)] hover:bg-[var(--k-raised)] hover:text-[var(--k-t1)]">
                    <Sparkles size={14} /> Ask Flux
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
      <LiveTicker />
      {isLocked ? <SessionLock /> : null}
    </header>
  );
};

const SessionLock: React.FC = () => {
  const { setIsLocked } = useApp();
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl" role="dialog" aria-modal="true" aria-label="Session locked">
      <div className="k-panel w-full max-w-[380px] p-7 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--k-cyan)]/25 bg-[var(--k-cyan-soft)] text-[var(--k-cyan)]">
          <Lock size={22} />
        </div>
        <div className="k-eyebrow mb-2">Session locked</div>
        <h2 className="k-title text-[24px]">Welcome back, Karmen.</h2>
        <p className="mt-2 text-[11.5px] k-muted">Enter the local passcode to reopen the operating deck.</p>
        <form
          className="mt-5 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (code === '1234') {
              setIsLocked(false);
              setCode('');
              setError(false);
            } else {
              setError(true);
              setCode('');
            }
          }}
        >
          <input
            type="password"
            inputMode="numeric"
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setError(false);
            }}
            maxLength={4}
            autoFocus
            placeholder="••••"
            aria-label="Passcode"
            className="k-input !h-[52px] text-center !text-[22px] !tracking-[0.5em]"
          />
          {error ? <div className="text-[10.5px] text-[var(--k-rose)]">That passcode did not match. Demo passcode: 1234.</div> : null}
          <Button type="submit" variant="primary" className="w-full !h-[44px]">Unlock workspace</Button>
        </form>
      </div>
    </div>
  );
};

const MobileNav: React.FC<{ onMore: () => void }> = ({ onMore }) => {
  const { route, navigate } = useRouter();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--k-line)] bg-[var(--k-bg)]/92 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl lg:hidden" aria-label="Primary navigation">
      <div className="flex h-[62px] items-center justify-around">
        {MOBILE_ITEMS.map((item) => {
          const active = route.key === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.key)}
              className={cx(
                'flex min-w-[52px] flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[8.5px] font-semibold transition-colors',
                active ? 'text-[var(--k-cyan)]' : 'text-[var(--k-t3)]',
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={18} />
              {item.short}
            </button>
          );
        })}
        <button
          onClick={onMore}
          className="flex min-w-[52px] flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[8.5px] font-semibold text-[var(--k-t3)]"
        >
          <Menu size={18} />
          More
        </button>
      </div>
    </nav>
  );
};

const MobileSheet: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { navigate } = useRouter();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[110] lg:hidden">
      <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-label="Close navigation" tabIndex={-1} />
      <div className="k-fade absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-3xl border-t border-[var(--k-line-strong)] bg-[var(--k-panel-solid)] p-4 pb-[calc(80px+env(safe-area-inset-bottom))]">
        <div className="mb-4 flex items-center justify-between">
          <BrandMark />
          <IconButton onClick={onClose} aria-label="Close navigation">
            <X size={17} />
          </IconButton>
        </div>
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-4">
            <div className="k-eyebrow mb-2 px-1">{group.label}</div>
            <div className="grid grid-cols-2 gap-1.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      navigate(item.key);
                      onClose();
                    }}
                    className="flex items-center gap-2 rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] px-3 py-2.5 text-left text-[11px] font-semibold text-[var(--k-t2)]"
                  >
                    <Icon size={15} className="text-[var(--k-cyan)]" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSheet, setMobileSheet] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { toast } = useWorkspace();
  const { route, navigate } = useRouter();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    setMobileSheet(false);
  }, [route.key]);

  return (
    <div className="relative z-10 min-h-screen">
      <a
        href="#main-content"
        className="skip-link"
      >
        Skip to main content
      </a>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((value) => !value)}
      />
      <div className={cx('min-h-screen transition-[padding] duration-300', sidebarCollapsed ? 'lg:pl-[84px]' : 'lg:pl-[266px]')}>
        <Topbar
          onMenu={() => setMobileSheet(true)}
          onSearch={() => setSearchOpen(true)}
          onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
          sidebarCollapsed={sidebarCollapsed}
        />
        <main id="main-content" className="k-safe-bottom px-4 py-5 md:px-6 md:py-6 xl:px-8">
          <div className="mx-auto w-full max-w-[1540px]">{children}</div>
          <footer className="mx-auto mt-10 flex w-full max-w-[1540px] flex-wrap items-center justify-between gap-2 border-t border-[var(--k-line)] pt-4 text-[9px] text-[var(--k-t3)]">
            <span className="k-mono uppercase tracking-[0.12em]">RTA by KARM · Operator console 2.4</span>
            <span className="k-mono uppercase tracking-[0.12em]">Ṛta · living order · Bhopal · IST</span>
          </footer>
        </main>
      </div>
      <MobileNav onMore={() => setMobileSheet(true)} />
      <MobileSheet open={mobileSheet} onClose={() => setMobileSheet(false)} />
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      {toast ? <Toast message={toast.message} tone={toast.tone} /> : null}
    </div>
  );
};

export const RouteIcon: React.FC<{ route: RouteKey; size?: number }> = ({ route, size = 16 }) => {
  const Icon = ROUTE_ICONS[route] ?? LayoutDashboard;
  return <Icon size={size} />;
};
