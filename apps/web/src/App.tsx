import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  AUTH_EXPIRED_EVENT,
  apiGet,
  apiPost,
  apiWrite,
  clearAccessToken,
  formatDate,
  getAccessToken,
  invoiceId,
  invoiceStatus,
  isOpenInvoice,
  makeIdempotencyKey,
  recordId,
  recordName,
  RequestError,
  signIn,
  statusTone,
  stringField,
  type ZohoRecord,
} from "./api";
import { useDialogFocus } from "./useDialogFocus";

type Health = {
  mode: "mock" | "live";
  authenticated: boolean;
  service: string;
};

type Organization = {
  name?: string;
  organization_name?: string;
  organization_id?: string;
  currency_code?: string;
};

type View = "overview" | "invoices" | "customers" | "vendors" | "items" | "reports";
type DataKey = "contacts" | "invoices" | "items" | "taxes" | "audit";

type DataSet = {
  organization: Organization | null;
  contacts: ZohoRecord[];
  invoices: ZohoRecord[];
  items: ZohoRecord[];
  taxes: ZohoRecord[];
  audit: ZohoRecord[];
};

const emptyData: DataSet = {
  organization: null,
  contacts: [],
  invoices: [],
  items: [],
  taxes: [],
  audit: [],
};

const navigation: { view: View; label: string; icon: string }[] = [
  { view: "overview", label: "Overview", icon: "grid" },
  { view: "invoices", label: "Invoices", icon: "file" },
  { view: "customers", label: "Customers", icon: "users" },
  { view: "vendors", label: "Vendors", icon: "building" },
  { view: "items", label: "Items & taxes", icon: "layers" },
  { view: "reports", label: "Reports", icon: "chart" },
];

const reportOptions = [
  ["profitandloss", "Profit & loss"],
  ["balancesheet", "Balance sheet"],
  ["cashflow", "Cash flow"],
  ["agedreceivables", "Aged receivables"],
  ["agedpayables", "Aged payables"],
  ["taxsummary", "Tax summary"],
] as const;

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    file: <><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M13 2v7h7M8 14h8M8 18h6" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    building: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 21V9h6v12M8 7h.01M12 7h.01M16 7h.01M8 12h.01M16 12h.01M8 16h.01M16 16h.01" /></>,
    layers: <><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 17l9 5 9-5" /></>,
    chart: <><path d="M3 3v18h18M18 17V9M13 17V5M8 17v-3" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.5 9a7 7 0 0 1 11.6-2L20 12M4 12l2.9 5a7 7 0 0 0 11.6-2" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5M12 15V3" /></>,
    lock: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
    external: <><path d="M14 3h7v7M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></>,
    dots: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    check: <path d="m5 12 4 4L19 6" />,
  };
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {paths[name] ?? paths.grid}
    </svg>
  );
}

function formatAmount(record: ZohoRecord): string {
  return stringField(record, "total_formatted", "balance_formatted", "outstanding_formatted", "rate_formatted")
    || stringField(record, "total", "balance", "outstanding", "rate")
    || "—";
}

function useInitialHealth() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/v1/health", { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json() as { ok?: boolean; data?: Health; error?: { message?: string } };
        if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error?.message || "Backend is not available.");
        setHealth(payload.data);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "Backend is not available.");
      });
    return () => controller.abort();
  }, []);

  return { health, error };
}

function App() {
  const { health, error: healthError } = useInitialHealth();
  const [data, setData] = useState<DataSet>(emptyData);
  const [view, setView] = useState<View>("overview");
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const [authenticated, setAuthenticated] = useState(Boolean(getAccessToken()));
  const [setupCode, setSetupCode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<ZohoRecord | null>(null);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [selectedReport, setSelectedReport] = useState("");
  const [reportData, setReportData] = useState<unknown>(null);
  const [reportError, setReportError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleAuthExpired = () => {
      setAuthenticated(false);
      setData(emptyData);
      setSelectedInvoice(null);
      setShowInvoiceForm(false);
      setLoginError("");
      setLoadError("Your session expired. Sign in again to continue.");
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
  }, []);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      const target = event.target;
      const isEditing = target instanceof HTMLElement
        && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
      if (event.key === "/" && !event.altKey && !event.ctrlKey && !event.metaKey && !isEditing) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  const loadData = useCallback(async (signal?: AbortSignal) => {
    setBusy(true);
    setLoadError("");
    const jobs: [DataKey | "organization", string][] = [
      ["organization", "/organization"],
      ["contacts", "/contacts?per_page=100"],
      ["invoices", "/invoices?per_page=100"],
      ["items", "/items?per_page=100"],
      ["taxes", "/taxes?per_page=100"],
      ["audit", "/audit?limit=8"],
    ];
    const responses = await Promise.allSettled(jobs.map(([, path]) => apiGet<ZohoRecord[] | Organization>(path, signal)));
    if (signal?.aborted) return;
    const next = { ...emptyData };
    const problems: string[] = [];
    for (let index = 0; index < responses.length; index += 1) {
      const response = responses[index];
      const [key, path] = jobs[index];
      if (response.status === "rejected") {
        if (response.reason instanceof RequestError && response.reason.status === 401) {
          setAuthenticated(false);
          setLoadError("Your session expired. Sign in again to continue.");
          setBusy(false);
          return;
        }
        problems.push(response.reason instanceof Error ? response.reason.message : `${path} failed`);
        continue;
      }
      if (key === "organization") next.organization = response.value.data as Organization;
      else next[key] = Array.isArray(response.value.data) ? response.value.data : [];
    }
    setData(next);
    if (problems.length === jobs.length) setLoadError(problems[0]);
    else if (problems.length) setLoadError(`Some records could not be loaded: ${problems.join(" · ")}`);
    setBusy(false);
  }, []);

  useEffect(() => {
    if (!health || (health.authenticated && !authenticated)) return;
    const controller = new AbortController();
    void loadData(controller.signal);
    return () => controller.abort();
  }, [health, authenticated, loadData]);

  const signInSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError("");
    setBusy(true);
    try {
      await signIn(setupCode);
      setSetupCode("");
      setAuthenticated(true);
      setAnnouncement("Signed in successfully.");
    } catch (cause) {
      setLoginError(cause instanceof Error ? cause.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  };

  const signOut = () => {
    clearAccessToken();
    setAuthenticated(false);
    setData(emptyData);
    setAnnouncement("Signed out.");
  };

  const filterRecords = useCallback((records: ZohoRecord[], term: string) => {
    const query = term.trim().toLowerCase();
    if (!query) return records;
    return records.filter((record) => JSON.stringify(record).toLowerCase().includes(query));
  }, []);

  const visibleInvoices = useMemo(() => {
    const filtered = statusFilter === "all" ? data.invoices : data.invoices.filter((invoice) => invoiceStatus(invoice) === statusFilter);
    return filterRecords(filtered, search);
  }, [data.invoices, statusFilter, search, filterRecords]);

  const displayName = data.organization?.name || data.organization?.organization_name || "Your Zoho Books organization";
  const needsLogin = Boolean(health?.authenticated && !authenticated);

  if (!health && !healthError) {
    return <LoadingScreen label="Connecting to KARM OS" />;
  }
  if (healthError) {
    return <ConnectionError message={healthError} onRetry={() => window.location.reload()} />;
  }
  if (needsLogin) {
    return (
      <LoginScreen
        busy={busy}
        error={loginError}
        setupCode={setupCode}
        onChange={setSetupCode}
        onSubmit={signInSubmit}
        mode={health?.mode ?? "live"}
      />
    );
  }

  const activeTitle = navigation.find((item) => item.view === view)?.label ?? "Overview";

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark"><img src="/karm-logo.png" alt="" /></div>
          <div className="brand-copy"><strong>KARM<span>OS</span></strong><small>OPERATIONS PLATFORM</small></div>
        </div>

        <div className="workspace-switcher">
          <div className="workspace-avatar">K</div>
          <div className="workspace-name"><strong>KARM Enterprises</strong><small>Business workspace</small></div>
          <Icon name="chevron" size={14} />
        </div>

        <div className="nav-section-label">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Primary navigation">
          {navigation.map((item) => (
            <button key={item.view} className={`nav-item ${view === item.view ? "is-active" : ""}`} onClick={() => setView(item.view)} aria-current={view === item.view ? "page" : undefined}>
              <Icon name={item.icon} size={17} />
              <span>{item.label}</span>
              {item.view === "invoices" && data.invoices.length > 0 && <span className="nav-count">{data.invoices.length}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />
        <div className="source-card">
          <div className="source-card-top"><span className={`status-dot ${health?.mode === "live" ? "dot-cyan" : "dot-amber"}`} />{health?.mode === "live" ? "Connected to Zoho" : "Practice mode"}</div>
          <p>{health?.mode === "live" ? "Zoho Books is your accounting source of truth." : "Sample workspace. No live books connected."}</p>
          <span className="source-card-caption">{health?.mode === "live" ? displayName : "KARM OS"}</span>
        </div>
        <button className="sidebar-profile" onClick={signOut} title="Sign out">
          <span className="profile-avatar">O</span>
          <span className="profile-copy"><strong>Workspace owner</strong><small>{health?.mode === "live" ? "Live access" : "Practice access"}</small></span>
          <Icon name="dots" size={17} />
        </button>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="breadcrumbs"><span>KARM OS</span><Icon name="chevron" size={13} /><strong>{activeTitle}</strong></div>
          <div className="topbar-actions">
            <label className="global-search">
              <Icon name="search" size={16} />
              <input ref={searchRef} aria-label="Search current records" placeholder="Search records..." value={search} onChange={(event) => setSearch(event.target.value)} />
              <kbd>/</kbd>
            </label>
            <span className={`connection-pill ${health?.mode === "live" ? "connection-live" : "connection-practice"}`}>
              <span className="status-dot" />{health?.mode === "live" ? "Live" : "Practice"}
            </span>
            <span className="header-avatar" aria-hidden="true">O</span>
          </div>
        </header>

        <main id="main-content" className="page-content">
          <div className="page-heading">
            <div>
                  <h1>{view === "overview" ? "Home command center" : activeTitle}</h1>
                  <p>{view === "overview" ? `Your business records, connected to ${health?.mode === "live" ? "Zoho Books" : "practice data"}.` : pageDescription(view, health?.mode ?? "mock")}</p>
            </div>
            <div className="heading-actions">
              <span className="last-synced"><span className="sync-indicator" />{busy ? (health?.mode === "live" ? "Syncing records…" : "Loading practice records…") : health?.mode === "live" ? "Connected to Zoho Books" : "Practice records loaded"}</span>
              <button className="button button-quiet" onClick={() => void loadData()} disabled={busy}><Icon name="refresh" size={16} /><span>Refresh</span></button>
              {view === "overview" || view === "invoices" ? <button className="button button-primary" onClick={() => setShowInvoiceForm(true)}><Icon name="plus" size={16} /><span>New invoice</span></button> : null}
            </div>
          </div>

          {loadError && <div className="inline-alert" role="status"><span>{loadError}</span><button onClick={() => void loadData()} disabled={busy}>Retry</button></div>}

          {view === "overview" && (
            <Overview
              data={data}
              invoices={visibleInvoices}
              search={search}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              onOpenInvoice={setSelectedInvoice}
              onNavigate={setView}
              onRefresh={() => void loadData()}
              busy={busy}
              mode={health?.mode ?? "mock"}
            />
          )}
          {view === "invoices" && <InvoiceList invoices={visibleInvoices} filter={statusFilter} onFilter={setStatusFilter} onOpen={setSelectedInvoice} mode={health?.mode ?? "mock"} />}
          {view === "customers" && <ContactList title="Customers" contacts={filterRecords(data.contacts.filter((entry) => stringField(entry, "contact_type").toLowerCase() !== "vendor"), search)} emptyLabel="No customers found." mode={health?.mode ?? "mock"} />}
          {view === "vendors" && <ContactList title="Vendors" contacts={filterRecords(data.contacts.filter((entry) => stringField(entry, "contact_type").toLowerCase() === "vendor"), search)} emptyLabel="No vendors found." mode={health?.mode ?? "mock"} />}
          {view === "items" && <CatalogList items={filterRecords(data.items, search)} taxes={data.taxes} mode={health?.mode ?? "mock"} />}
          {view === "reports" && <ReportsPanel selected={selectedReport} reportData={reportData} error={reportError} mode={health?.mode ?? "mock"} onSelect={async (name) => {
            setSelectedReport(name);
            setReportData(null);
            setReportError("");
            try {
              const response = await apiGet<unknown>(`/reports/${name}`);
              setReportData(response.data);
            } catch (cause) {
              setReportError(cause instanceof Error ? cause.message : "The report could not be loaded.");
            }
          }} />}
          <footer className="page-footer"><span>{health?.mode === "live" ? "Financial records are served by Zoho Books." : "Practice records are local sample data; they do not update Zoho Books."}</span><span>KARM OS <i>·</i> {health?.mode === "live" ? "Live data" : "Practice data"}</span></footer>
        </main>
      </div>

      {selectedInvoice && <InvoiceDrawer invoice={selectedInvoice} mode={health?.mode ?? "mock"} onClose={() => setSelectedInvoice(null)} onUpdated={(updated) => {
        setSelectedInvoice(updated);
        setData((current) => ({ ...current, invoices: current.invoices.map((item) => invoiceId(item) === invoiceId(updated) ? updated : item) }));
        setAnnouncement("Invoice updated.");
      }} />}
      {showInvoiceForm && <InvoiceForm mode={health?.mode ?? "mock"} contacts={data.contacts.filter((record) => stringField(record, "contact_type").toLowerCase() !== "vendor")} items={data.items} onClose={() => setShowInvoiceForm(false)} onCreated={(invoice) => {
        setData((current) => ({ ...current, invoices: [invoice, ...current.invoices] }));
        setShowInvoiceForm(false);
        setView("invoices");
        setAnnouncement(health?.mode === "live" ? "Draft invoice created in Zoho Books." : "Practice invoice draft created.");
      }} />}
      <p className="sr-only" aria-live="polite">{announcement}</p>
    </div>
  );
}

function pageDescription(view: View, mode: "mock" | "live"): string {
  const source = mode === "live" ? "Zoho Books" : "the practice workspace";
  const descriptions: Record<View, string> = {
    overview: mode === "live" ? "A live view of the records your team is working with." : "A practice view of sample workspace records.",
    invoices: `Review invoice status and open a record for its ${source} details.`,
    customers: `Customer records from ${source}.`,
    vendors: `Vendor records from ${source}.`,
    items: `Item catalog and tax rates from ${source}.`,
    reports: mode === "live" ? "Reports are generated by Zoho Books, not recalculated here." : "Practice mode does not generate financial reports.",
  };
  return descriptions[view];
}

function LoadingScreen({ label }: { label: string }) {
  return <main className="gate-screen"><div className="gate-card"><img className="gate-logo" src="/karm-logo.png" alt="" /><span className="loading-ring" /><h1>{label}</h1><p>Checking your workspace connection.</p></div></main>;
}

function ConnectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <main className="gate-screen"><div className="gate-card"><img className="gate-logo" src="/karm-logo.png" alt="" /><span className="gate-symbol">!</span><h1>We can’t reach the backend</h1><p>{message}</p><button className="button button-primary" onClick={onRetry}>Try again</button></div></main>;
}

function LoginScreen({ busy, error, setupCode, onChange, onSubmit, mode }: { busy: boolean; error: string; setupCode: string; onChange: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; mode: "live" | "mock" }) {
  return (
    <main className="gate-screen">
      <form className="gate-card login-card" onSubmit={onSubmit}>
        <img className="gate-logo" src="/karm-logo.png" alt="" />
        <span className="gate-label">KARM OS · PRIVATE WORKSPACE</span>
        <h1>Welcome back</h1>
        <p>Enter your owner access code to connect with {mode === "live" ? "your live Zoho Books organization" : "your practice workspace"}.</p>
        <label className="field-label" htmlFor="setup-code">Owner access code</label>
        <input id="setup-code" className="text-input" type="password" autoComplete="current-password" value={setupCode} onChange={(event) => onChange(event.target.value)} required autoFocus />
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-primary gate-submit" type="submit" disabled={busy || !setupCode}>{busy ? "Signing in…" : "Sign in"}<Icon name="arrow" size={16} /></button>
        <span className="login-privacy"><Icon name="lock" size={14} />Access code stays in this session only.</span>
      </form>
    </main>
  );
}

function Metric({ label, value, meta, icon, accent, onClick }: { label: string; value: string; meta: string; icon: string; accent: string; onClick?: () => void }) {
  return (
    <button className={`metric-card metric-${accent}`} onClick={onClick} disabled={!onClick}>
      <span className="metric-header"><span>{label}</span><span className="metric-icon"><Icon name={icon} size={17} /></span></span>
      <strong className="metric-value">{value}</strong>
      <span className="metric-meta">{meta}</span>
      <span className="metric-spark" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></span>
    </button>
  );
}

function Overview({ data, invoices, search, statusFilter, onStatusChange, onOpenInvoice, onNavigate, onRefresh, busy, mode }: {
  data: DataSet;
  invoices: ZohoRecord[];
  search: string;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  onOpenInvoice: (invoice: ZohoRecord) => void;
  onNavigate: (view: View) => void;
  onRefresh: () => void;
  busy: boolean;
  mode: "mock" | "live";
}) {
  const openCount = data.invoices.filter(isOpenInvoice).length;
  const overdueCount = data.invoices.filter((invoice) => invoiceStatus(invoice) === "overdue").length;
  const latest = [...data.invoices].sort((a, b) => stringField(b, "date").localeCompare(stringField(a, "date")))[0];
  const invoiceStatusCounts = new Map<string, number>();
  data.invoices.forEach((invoice) => invoiceStatusCounts.set(invoiceStatus(invoice), (invoiceStatusCounts.get(invoiceStatus(invoice)) ?? 0) + 1));
  const maxStatusCount = Math.max(1, ...invoiceStatusCounts.values());
  const audit = data.audit.slice(0, 4);

  return (
    <>
      <section className="metric-grid" aria-label="Record counts">
        <Metric label="Open invoices" value={String(openCount)} meta="Across records loaded" icon="file" accent="cyan" onClick={() => onNavigate("invoices")} />
        <Metric label="Overdue" value={String(overdueCount)} meta="Needs a follow-up" icon="bell" accent="amber" onClick={() => { onNavigate("invoices"); onStatusChange("overdue"); }} />
        <Metric label="Customers" value={String(data.contacts.filter((entry) => stringField(entry, "contact_type").toLowerCase() !== "vendor").length)} meta="Customer records loaded" icon="users" accent="violet" onClick={() => onNavigate("customers")} />
        <Metric label="Catalog items" value={String(data.items.length)} meta={mode === "live" ? "Items loaded from Books" : "Practice items available"} icon="layers" accent="blue" onClick={() => onNavigate("items")} />
      </section>

      <div className="dashboard-grid">
        <section className="panel invoice-panel">
          <div className="panel-heading">
            <div><h2>Invoice register</h2><p>{mode === "live" ? "Individual records from Zoho Books" : "Individual practice records"}</p></div>
            <button className="text-action" onClick={() => onNavigate("invoices")}>View all <Icon name="arrow" size={15} /></button>
          </div>
          <InvoiceTable invoices={invoices.slice(0, 6)} onOpen={onOpenInvoice} isLoading={busy && data.invoices.length === 0} search={search} mode={mode} />
          {data.invoices.length > 0 && <div className="table-footnote">Amounts are shown as supplied by the active workspace. No totals are recalculated.</div>}
        </section>

        <div className="right-rail">
          <section className="panel status-panel">
            <div className="panel-heading">
              <div><h2>Invoice status</h2><p>Distribution of loaded records</p></div>
              <button className="icon-button subtle-button" aria-label="Refresh records" title="Refresh to update status counts" onClick={onRefresh} disabled={busy}><Icon name="refresh" size={16} /></button>
            </div>
            {data.invoices.length === 0 ? <EmptyState title="No invoice records yet" detail={`Invoice status will appear when ${mode === "live" ? "Zoho Books returns" : "practice records include"} invoices.`} /> : (
              <>
                <div className="status-chart" role="group" aria-label={`${data.invoices.length} loaded invoices grouped by status`}>
                  {[...invoiceStatusCounts.entries()].map(([status, count]) => (
                    <button className={`status-segment tone-${statusTone(status)}`} key={status} style={{ flexGrow: count }} title={`${statusLabel(status)}: ${count}`} onClick={() => onStatusChange(statusFilter === status ? "all" : status)} aria-label={`Filter ${count} ${statusLabel(status)} invoices`} />
                  ))}
                </div>
                <div className="status-legend">
                  {[...invoiceStatusCounts.entries()].map(([status, count]) => (
                    <button key={status} className={`legend-row ${statusFilter === status ? "legend-selected" : ""}`} onClick={() => onStatusChange(statusFilter === status ? "all" : status)}>
                      <span className={`status-dot dot-${statusTone(status)}`} /><span>{statusLabel(status)}</span><strong>{count}</strong>
                      <span className="legend-track"><i style={{ width: `${(count / maxStatusCount) * 100}%` }} /></span>
                    </button>
                  ))}
                </div>
                {statusFilter !== "all" && <button className="clear-filter" onClick={() => onStatusChange("all")}>Clear status filter</button>}
              </>
            )}
          </section>

          <section className="panel latest-panel">
            <div className="panel-heading"><div><h2>Latest invoice</h2><p>Most recent record received</p></div><span className="panel-live-mark"><span className={`status-dot ${mode === "live" ? "dot-cyan" : "dot-amber"}`} />{mode === "live" ? "LIVE" : "PRACTICE"}</span></div>
            {latest ? (
              <button className="latest-invoice" onClick={() => onOpenInvoice(latest)}>
                <span className="latest-invoice-symbol"><Icon name="file" size={18} /></span>
                <span className="latest-invoice-copy"><strong>{stringField(latest, "invoice_number") || invoiceId(latest) || "Invoice"}</strong><small>{recordName(latest)} <i>·</i> {formatDate(stringField(latest, "date"))}</small></span>
                <span className="latest-invoice-amount">{formatAmount(latest)}<small>{mode === "live" ? "as returned by Zoho" : "practice record value"}</small></span>
              </button>
            ) : <EmptyState title="Nothing to show" detail="The latest invoice will appear here." />}
          </section>

          <section className="panel activity-panel">
            <div className="panel-heading"><div><h2>Recent activity</h2><p>Activity recorded by this workspace</p></div></div>
            {audit.length ? <div className="activity-list">{audit.map((entry, index) => <ActivityRow key={stringField(entry, "audit_id") || index} entry={entry} />)}</div> : <EmptyState title="No recent activity" detail="Workspace actions will appear here." />}
          </section>
        </div>
      </div>
      <div className="overview-lower">
        <section className="panel organization-panel">
          <div className="panel-heading"><div><h2>Books connection</h2><p>Your accounting system remains the source of truth.</p></div><span className={`connection-pill ${mode === "live" ? "connection-live" : "connection-practice"}`}><span className="status-dot" />{mode === "live" ? "Connected" : "Practice mode"}</span></div>
          <div className="org-detail">
            <span className="org-glyph">K</span>
            <span><strong>{data.organization?.name || data.organization?.organization_name || "KARM Enterprises"}</strong><small>Organization <code>{data.organization?.organization_id || "Practice environment"}</code></small></span>
            <span className="org-currency">{data.organization?.currency_code || (mode === "live" ? "Currency not provided" : "Practice data")}</span>
          </div>
        </section>
        <section className="panel integrity-panel">
          <div className="integrity-icon"><Icon name="lock" size={17} /></div>
          <div><h2>Accounting stays in Books</h2><p>{mode === "live" ? "Totals, tax and balances are returned by Zoho Books. KARM OS doesn’t recalculate them." : "Practice mode uses local sample values and does not change Zoho Books."}</p></div>
          <span className="integrity-check"><Icon name="check" size={15} />Protected</span>
        </section>
      </div>
    </>
  );
}

function statusLabel(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function InvoiceTable({ invoices, onOpen, isLoading, search, mode }: { invoices: ZohoRecord[]; onOpen: (invoice: ZohoRecord) => void; isLoading: boolean; search: string; mode: "mock" | "live" }) {
  const source = mode === "live" ? "Zoho Books" : "the practice workspace";
  if (isLoading) return <div className="table-state"><span className="loading-ring" /><span>{mode === "live" ? "Loading invoices from Zoho Books…" : "Loading practice invoices…"}</span></div>;
  if (!invoices.length) return <EmptyState title={search ? "No matching invoices" : "No invoices found"} detail={search ? "Try another search." : `New invoices added to ${source} will appear here.`} />;
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead><tr><th>INVOICE</th><th>CUSTOMER</th><th>ISSUED</th><th>STATUS</th><th className="align-right">AMOUNT</th><th><span className="sr-only">Open invoice</span></th></tr></thead>
        <tbody>
          {invoices.map((invoice, index) => {
            const status = invoiceStatus(invoice);
            const id = invoiceId(invoice) || String(index);
            return (
              <tr key={id} onClick={() => onOpen(invoice)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpen(invoice); } }} tabIndex={0} aria-label={`Open invoice ${stringField(invoice, "invoice_number") || id}`}>
                <td><span className="record-primary">{stringField(invoice, "invoice_number") || id}</span><small className="record-secondary">{stringField(invoice, "reference_number") || (mode === "live" ? "Zoho Books record" : "Practice workspace record")}</small></td>
                <td><span className="record-customer">{stringField(invoice, "customer_name") || "Customer not provided"}</span></td>
                <td>{formatDate(stringField(invoice, "date"))}</td>
                <td><StatusBadge status={status} /></td>
                <td className="align-right amount-cell">{formatAmount(invoice)}</td>
                <td><button className="row-open" aria-label="Open invoice details" onClick={(event) => { event.stopPropagation(); onOpen(invoice); }}><Icon name="chevron" size={15} /></button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function InvoiceList({ invoices, filter, onFilter, onOpen, mode }: { invoices: ZohoRecord[]; filter: string; onFilter: (value: string) => void; onOpen: (record: ZohoRecord) => void; mode: "mock" | "live" }) {
  const filters = ["all", "overdue", "sent", "draft", "paid"];
  return (
    <section className="panel full-panel">
      <div className="list-toolbar">
        <div className="filter-tabs" role="group" aria-label="Filter invoices by status">{filters.map((item) => <button key={item} className={filter === item ? "filter-active" : ""} onClick={() => onFilter(item)}>{item === "all" ? "All invoices" : statusLabel(item)}</button>)}</div>
        <span className="list-count">{invoices.length} loaded</span>
      </div>
      <InvoiceTable invoices={invoices} onOpen={onOpen} isLoading={false} search="" mode={mode} />
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge tone-${statusTone(status)}`}><span className={`status-dot dot-${statusTone(status)}`} />{statusLabel(status)}</span>;
}

function ContactList({ title, contacts, emptyLabel, mode }: { title: string; contacts: ZohoRecord[]; emptyLabel: string; mode: "mock" | "live" }) {
  if (!contacts.length) return <section className="panel full-panel"><EmptyState title={emptyLabel} detail={`Records of type ${title.toLowerCase()} will appear when ${mode === "live" ? "Zoho Books returns them" : "practice data is available"}.`} /></section>;
  return (
    <section className="panel full-panel">
      <div className="panel-heading"><div><h2>{title}</h2><p>{contacts.length} {mode === "live" ? "records loaded from Zoho Books" : "practice records available"}</p></div><span className="panel-live-mark"><span className={`status-dot ${mode === "live" ? "dot-cyan" : "dot-amber"}`} />{mode === "live" ? "LIVE" : "PRACTICE"}</span></div>
      <div className="table-scroll"><table className="data-table">
        <thead><tr><th>NAME</th><th>EMAIL</th><th>PHONE</th><th>COMPANY</th><th className="align-right">OUTSTANDING</th></tr></thead>
        <tbody>{contacts.map((contact, index) => (
          <tr key={recordId(contact) || index}>
            <td><span className="contact-identity"><span className="contact-avatar">{recordName(contact).slice(0, 1).toUpperCase()}</span><strong>{recordName(contact)}</strong></span></td>
            <td>{stringField(contact, "email") || "—"}</td>
            <td>{stringField(contact, "phone", "mobile") || "—"}</td>
            <td>{stringField(contact, "company_name") || "—"}</td>
            <td className="align-right amount-cell">{stringField(contact, "outstanding_formatted", "outstanding") || "—"}</td>
          </tr>
        ))}</tbody>
      </table></div>
      <p className="table-footnote">{mode === "live" ? "Outstanding is shown only when supplied in the Zoho Books response." : "Practice balances are sample values."}</p>
    </section>
  );
}

function CatalogList({ items, taxes, mode }: { items: ZohoRecord[]; taxes: ZohoRecord[]; mode: "mock" | "live" }) {
  return (
    <div className="catalog-grid">
      <section className="panel full-panel">
        <div className="panel-heading"><div><h2>Item catalog</h2><p>{items.length} {mode === "live" ? "items loaded from Zoho Books" : "practice items available"}</p></div><span className="panel-live-mark"><span className={`status-dot ${mode === "live" ? "dot-cyan" : "dot-amber"}`} />{mode === "live" ? "LIVE" : "PRACTICE"}</span></div>
        {!items.length ? <EmptyState title="No catalog items" detail={mode === "live" ? "Items from Zoho Books will appear here." : "Practice items will appear here."} /> : <div className="table-scroll"><table className="data-table"><thead><tr><th>ITEM</th><th>SKU / CODE</th><th>UNIT</th><th className="align-right">RATE</th></tr></thead><tbody>{items.map((item, index) => <tr key={recordId(item) || index}><td><strong className="record-primary">{recordName(item)}</strong><small className="record-secondary">{stringField(item, "description")}</small></td><td>{stringField(item, "sku", "hsn_or_sac") || "—"}</td><td>{stringField(item, "unit") || "—"}</td><td className="align-right amount-cell">{formatAmount(item)}</td></tr>)}</tbody></table></div>}
      </section>
      <section className="panel full-panel">
        <div className="panel-heading"><div><h2>Tax rates</h2><p>{mode === "live" ? "Configured by the connected organization" : "Sample practice tax rates"}</p></div></div>
        {!taxes.length ? <EmptyState title="No tax rates loaded" detail={mode === "live" ? "Check the Zoho Books organization or refresh the connection." : "No practice tax rates are available."} /> : <div className="tax-list">{taxes.map((tax, index) => <div key={recordId(tax) || index} className="tax-row"><span className="tax-mark">%</span><span><strong>{stringField(tax, "tax_name", "name") || "Tax"}</strong><small>{stringField(tax, "tax_type") || (mode === "live" ? "Zoho Books tax" : "Practice tax")}</small></span><b>{stringField(tax, "tax_percentage", "tax_rate") || "—"}{stringField(tax, "tax_percentage", "tax_rate") ? "%" : ""}</b></div>)}</div>}
      </section>
    </div>
  );
}

function ActivityRow({ entry }: { entry: ZohoRecord }) {
  const action = stringField(entry, "action") || "record_update";
  const resource = stringField(entry, "resource").replace(/s$/, "");
  const time = stringField(entry, "time");
  return <div className="activity-row"><span className="activity-marker"><Icon name={action.startsWith("create") ? "plus" : "check"} size={13} /></span><span className="activity-copy"><strong>{statusLabel(action.replace(/:/g, " "))}</strong><small>{resource ? `${statusLabel(resource)} · ` : ""}{stringField(entry, "result") || "Completed"}</small></span><time>{time ? new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</time></div>;
}

function ReportsPanel({ selected, reportData, error, onSelect, mode }: { selected: string; reportData: unknown; error: string; onSelect: (name: string) => void; mode: "mock" | "live" }) {
  return (
    <div className="reports-layout">
      <section className="panel reports-menu"><div className="panel-heading"><div><h2>Financial reports</h2><p>{mode === "live" ? "Generated by Zoho Books" : "Unavailable in practice mode"}</p></div></div>
        <div className="report-options">{reportOptions.map(([key, title]) => <button key={key} className={`report-option ${selected === key ? "report-selected" : ""}`} onClick={() => onSelect(key)}><span className="report-icon"><Icon name="chart" size={16} /></span><span>{title}</span><Icon name="chevron" size={15} /></button>)}</div>
      </section>
      <section className="panel report-output"><div className="panel-heading"><div><h2>{reportOptions.find(([key]) => key === selected)?.[1] || "Select a report"}</h2><p>{mode === "live" ? "Values shown as returned by the connected organization." : "No financial figures are generated in practice mode."}</p></div>{selected && <span className="panel-live-mark"><span className={`status-dot ${mode === "live" ? "dot-cyan" : "dot-amber"}`} />{mode === "live" ? "ZOHO BOOKS" : "PRACTICE"}</span>}</div>
        {!selected ? <EmptyState title="Choose a report" detail={mode === "live" ? "Select a report to request current results from Zoho Books." : "Reports require a live Zoho Books connection."} /> : error ? <div className="report-error" role="alert"><span>{error}</span><p>{mode === "live" ? "Confirm the organization and report access in Zoho Books, then try again." : "Check the practice workspace connection, then try again."}</p></div> : reportData === null ? <div className="table-state"><span className="loading-ring" /><span>Requesting report…</span></div> : <ReportValues value={reportData} />}
      </section>
    </div>
  );
}

function ReportValues({ value }: { value: unknown }) {
  if (value && typeof value === "object" && !Array.isArray(value) && "available" in value && value.available === false) {
    return <div className="report-unavailable"><Icon name="building" size={22} /><strong>Report data requires a live connection</strong><p>{"message" in value && typeof value.message === "string" ? value.message : "Connect a Zoho Books organization to view this report."}</p></div>;
  }
  const entries = flattenReport(value);
  if (!entries.length) return <EmptyState title="No report rows returned" detail="Zoho Books returned an empty report for this request." />;
  return <div className="report-value-list">{entries.slice(0, 100).map(([label, output], index) => <div key={`${label}-${index}`} className="report-value-row"><span>{label}</span><strong>{output}</strong></div>)}</div>;
}

function flattenReport(value: unknown, prefix = "", depth = 0): [string, string][] {
  if (depth > 3 || value === null || value === undefined) return [];
  if (typeof value !== "object") return [[prefix || "Value", String(value)]];
  if (Array.isArray(value)) return value.slice(0, 20).flatMap((entry, index) => flattenReport(entry, `${prefix || "Row"} ${index + 1}`, depth + 1));
  return Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !["code", "message", "page_context"].includes(key))
    .flatMap(([key, item]) => flattenReport(item, prefix ? `${prefix} · ${statusLabel(key)}` : statusLabel(key), depth + 1));
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="empty-state"><span className="empty-mark"><Icon name="layers" size={18} /></span><strong>{title}</strong><p>{detail}</p></div>;
}

function InvoiceDrawer({ invoice, onClose, onUpdated, mode }: { invoice: ZohoRecord; onClose: () => void; onUpdated: (invoice: ZohoRecord) => void; mode: "mock" | "live" }) {
  const dialogRef = useDialogFocus<HTMLElement>(onClose);
  const [action, setAction] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const id = invoiceId(invoice);
  const status = invoiceStatus(invoice);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const runStatusAction = async (nextStatus: string) => {
    if (!id) { setError("This invoice is missing its Zoho ID."); return; }
    setAction(nextStatus);
    setError("");
    setNotice("");
    try {
      const request = {};
      const operation = `status:invoices:${id}:${nextStatus}`;
      const idempotencyKey = makeIdempotencyKey(`invoice-${nextStatus}`);
      const preview = await apiPost<{ approvalToken: string | null }>("/write-previews", { operation, request, idempotencyKey });
      const actionLabel = nextStatus === "void" ? "Void this invoice" : `Mark this invoice ${nextStatus}`;
      const sourceLabel = mode === "live" ? "in Zoho Books" : "in the practice workspace";
      if (!window.confirm(`${actionLabel} ${sourceLabel}?\n\nInvoice: ${stringField(invoice, "invoice_number") || id}\nCustomer: ${stringField(invoice, "customer_name") || "Not provided"}\n\nReview this exact change before confirming.`)) return;
      const headers: Record<string, string> = preview.data.approvalToken
        ? { "X-Confirm-Action": preview.data.approvalToken }
        : nextStatus === "void" ? { "X-Confirm-Action": `void-invoice:${id}` } : {};
      const result = await apiWrite<ZohoRecord>(`/invoices/${encodeURIComponent(id)}/status/${nextStatus}`, "POST", request, idempotencyKey, headers);
      onUpdated(result.data);
      setNotice(`Invoice marked ${nextStatus}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The status could not be updated.");
    } finally {
      setAction("");
    }
  };

  const sendEmail = async () => {
    if (!id) { setError("This invoice is missing its Zoho ID."); return; }
    setAction("email");
    setError("");
    setNotice("");
    try {
      const request = {};
      const idempotencyKey = makeIdempotencyKey("invoice-email");
      const preview = await apiPost<{ approvalToken: string | null }>("/write-previews", { operation: `email:invoices:${id}`, request, idempotencyKey });
      if (!window.confirm(`Send invoice ${stringField(invoice, "invoice_number") || id} to ${stringField(invoice, "customer_name") || "the customer"} via ${mode === "live" ? "Zoho Books" : "the practice workspace"}?\n\nThis action may send an external message only in live mode.`)) return;
      const headers: Record<string, string> = preview.data.approvalToken
        ? { "X-Confirm-Action": preview.data.approvalToken }
        : {};
      await apiWrite(`/invoices/${encodeURIComponent(id)}/email`, "POST", request, idempotencyKey, headers);
      setNotice(mode === "live" ? "Email request sent to Zoho Books." : "Practice email action recorded; no message was sent.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The email request failed.");
    } finally {
      setAction("");
    }
  };

  return (
    <div className="drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside ref={dialogRef} className="invoice-drawer" role="dialog" aria-modal="true" aria-labelledby="invoice-drawer-title" tabIndex={-1}>
        <div className="drawer-top"><span>INVOICE RECORD</span><button className="icon-button" aria-label="Close invoice details" onClick={onClose}><Icon name="close" /></button></div>
        <div className="drawer-heading"><span className="drawer-file-icon"><Icon name="file" size={22} /></span><div><h2 id="invoice-drawer-title">{stringField(invoice, "invoice_number") || "Invoice"}</h2><p>{stringField(invoice, "customer_name") || "Customer not provided"}</p></div></div>
        <div className="drawer-status"><span>Current status</span><StatusBadge status={status} /></div>
        <div className="drawer-total"><span>Invoice total</span><strong>{formatAmount(invoice)}</strong><small>{mode === "live" ? "Value received from Zoho Books" : "Value stored in practice record"}</small></div>
        <div className="drawer-fields">
          <DetailField label="Invoice date" value={formatDate(stringField(invoice, "date"))} />
          <DetailField label="Due date" value={formatDate(stringField(invoice, "due_date"))} />
          <DetailField label="Reference" value={stringField(invoice, "reference_number") || "—"} />
          <DetailField label="Balance" value={stringField(invoice, "balance_formatted", "balance") || "—"} />
          <DetailField label="Invoice ID" value={id || "Not supplied"} />
        </div>
        <div className="drawer-safety"><Icon name="lock" size={16} /><span>{mode === "live" ? "Financial calculations remain in Zoho Books." : "Practice data only; no live accounting system is changed."}</span></div>
        {error && <div className="form-error drawer-message" role="alert">{error}</div>}
        {notice && <div className="form-success drawer-message" role="status">{notice}</div>}
        <div className="drawer-actions">
          <button className="button button-primary drawer-action" onClick={() => void sendEmail()} disabled={Boolean(action)}>{action === "email" ? "Sending…" : mode === "live" ? "Send invoice" : "Record practice email"}<Icon name="arrow" size={16} /></button>
          {status !== "void" && status !== "paid" && <button className="button button-quiet drawer-action" onClick={() => void runStatusAction("sent")} disabled={Boolean(action)}>{action === "sent" ? "Updating…" : mode === "live" ? "Mark as sent" : "Mark sent in practice"}</button>}
          {status !== "void" && status !== "paid" && <button className="button button-danger drawer-action" onClick={() => void runStatusAction("void")} disabled={Boolean(action)}>{action === "void" ? "Voiding…" : mode === "live" ? "Void invoice" : "Void in practice"}</button>}
        </div>
      </aside>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return <div className="detail-field"><span>{label}</span><strong>{value}</strong></div>;
}

function InvoiceForm({ contacts, items, onClose, onCreated, mode }: { contacts: ZohoRecord[]; items: ZohoRecord[]; onClose: () => void; onCreated: (invoice: ZohoRecord) => void; mode: "mock" | "live" }) {
  const [customerId, setCustomerId] = useState("");
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const dialogRef = useDialogFocus<HTMLFormElement>(onClose, !saving);

  useEffect(() => {
    const firstField = dialogRef.current?.querySelector<HTMLElement>("select, input");
    firstField?.focus();
  }, [dialogRef]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!customerId || !itemId || !/^[1-9]\d*(\.\d+)?$/.test(quantity)) {
      setError("Choose a customer and item, and enter a quantity greater than zero.");
      return;
    }
    const selectedItem = items.find((item) => recordId(item) === itemId);
    const rate = selectedItem ? stringField(selectedItem, "rate") : "";
    if (!rate) {
      setError(mode === "live" ? "The selected Zoho item has no rate. Update its rate in Zoho Books, then try again." : "The selected practice item has no rate.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const request = {
        customer_id: customerId,
        line_items: [{ item_id: itemId, quantity, rate }],
      };
      const idempotencyKey = makeIdempotencyKey("invoice-create");
      const preview = await apiPost<{ approvalToken: string | null }>("/write-previews", { operation: "create:invoices", request, idempotencyKey });
      const customer = contacts.find((contact) => recordId(contact) === customerId);
      const item = items.find((entry) => recordId(entry) === itemId);
      if (!window.confirm(`Create a draft invoice ${mode === "live" ? "in Zoho Books" : "in the practice workspace"}?\n\nCustomer: ${customer ? recordName(customer) : "Selected customer"}\nItem: ${item ? recordName(item) : "Selected item"}\nQuantity: ${quantity}\n\nZoho Books will calculate totals and taxes.`)) {
        setSaving(false);
        return;
      }
      const headers: Record<string, string> = preview.data.approvalToken
        ? { "X-Confirm-Action": preview.data.approvalToken }
        : {};
      const result = await apiWrite<ZohoRecord>("/invoices", "POST", request, idempotencyKey, headers);
      onCreated(result.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The draft invoice could not be created.");
      setSaving(false);
    }
  };

  return (
    <div className="drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
      <form ref={dialogRef} className="invoice-drawer invoice-create-form" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="new-invoice-title" tabIndex={-1}>
        <div className="drawer-top"><span>{mode === "live" ? "NEW ZOHO BOOKS RECORD" : "NEW PRACTICE RECORD"}</span><button type="button" className="icon-button" aria-label="Close new invoice form" onClick={onClose} disabled={saving}><Icon name="close" /></button></div>
        <div className="drawer-heading"><span className="drawer-file-icon"><Icon name="plus" size={22} /></span><div><h2 id="new-invoice-title">Create invoice draft</h2><p>{mode === "live" ? "Zoho Books calculates totals and taxes." : "Saved to practice data; no live books change."}</p></div></div>
        <label className="field-label" htmlFor="invoice-customer">Customer</label>
        <select id="invoice-customer" className="text-input" value={customerId} onChange={(event) => setCustomerId(event.target.value)} required>
          <option value="">Select a customer</option>{contacts.map((contact, index) => <option key={recordId(contact) || index} value={recordId(contact)}>{recordName(contact)}</option>)}
        </select>
        {!contacts.length && <p className="field-hint">Customer records are not loaded. Refresh and try again.</p>}
        <label className="field-label" htmlFor="invoice-item">Line item</label>
        <select id="invoice-item" className="text-input" value={itemId} onChange={(event) => setItemId(event.target.value)} required>
          <option value="">Select an item</option>{items.map((item, index) => <option key={recordId(item) || index} value={recordId(item)}>{recordName(item)}{stringField(item, "rate_formatted") ? ` · ${stringField(item, "rate_formatted")}` : ""}</option>)}
        </select>
        {!items.length && <p className="field-hint">{mode === "live" ? "No Zoho Books items loaded. Add items in Zoho Books first." : "No practice items are available."}</p>}
        <label className="field-label" htmlFor="invoice-quantity">Quantity</label>
        <input id="invoice-quantity" className="text-input" type="number" min="0.001" step="any" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
        <div className="drawer-safety"><Icon name="lock" size={16} /><span>This creates a draft only. No amount is calculated in KARM OS.</span></div>
        {error && <div className="form-error drawer-message" role="alert">{error}</div>}
        <button className="button button-primary drawer-action" type="submit" disabled={saving || !contacts.length || !items.length}>{saving ? "Creating draft…" : "Create draft invoice"}<Icon name="arrow" size={16} /></button>
      </form>
    </div>
  );
}

type BooksPanelView = "invoices" | "customers" | "vendors" | "items" | "reports";

export function ZohoBooksPanel({ contacts, invoices, items, taxes, mode, search, onInvoiceUpdated, onInvoiceCreated }: {
  contacts: ZohoRecord[];
  invoices: ZohoRecord[];
  items: ZohoRecord[];
  taxes: ZohoRecord[];
  mode: "mock" | "live";
  search: string;
  onInvoiceUpdated: (invoice: ZohoRecord) => void;
  onInvoiceCreated: (invoice: ZohoRecord) => void;
}) {
  const [view, setView] = useState<BooksPanelView>("invoices");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<ZohoRecord | null>(null);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [selectedReport, setSelectedReport] = useState("");
  const [reportData, setReportData] = useState<unknown>(null);
  const [reportError, setReportError] = useState("");
  const query = search.trim().toLowerCase();
  const filterRecords = useCallback((records: ZohoRecord[]) => !query
    ? records
    : records.filter((record) => JSON.stringify(record).toLowerCase().includes(query)), [query]);
  const filteredInvoices = filterRecords(invoices.filter((invoice) => statusFilter === "all" || invoiceStatus(invoice) === statusFilter));
  const filteredContacts = filterRecords(contacts);
  const filteredItems = filterRecords(items);
  const customerRecords = filteredContacts.filter((entry) => stringField(entry, "contact_type").toLowerCase() !== "vendor");
  const vendorRecords = filteredContacts.filter((entry) => stringField(entry, "contact_type").toLowerCase() === "vendor");

  const requestReport = async (name: string) => {
    setSelectedReport(name);
    setReportData(null);
    setReportError("");
    try {
      const response = await apiGet<unknown>(`/reports/${name}`);
      setReportData(response.data);
    } catch (cause) {
      setReportError(cause instanceof Error ? cause.message : "The report could not be loaded.");
    }
  };

  const tabs: { value: BooksPanelView; label: string }[] = [
    { value: "invoices", label: "Invoices" },
    { value: "customers", label: "Customers" },
    { value: "vendors", label: "Vendors" },
    { value: "items", label: "Items & taxes" },
    { value: "reports", label: "Reports" },
  ];

  return <>
    <div className="books-toolbar">
      <div className="books-tabs" role="tablist" aria-label="Accounting records">
        {tabs.map((tab) => <button key={tab.value} className={view === tab.value ? "selected" : ""} role="tab" aria-selected={view === tab.value} onClick={() => setView(tab.value)}>{tab.label}</button>)}
      </div>
      {view === "invoices" && <button className="n-button n-button-primary" onClick={() => setShowInvoiceForm(true)}><Icon name="plus" size={15} />New invoice</button>}
    </div>
    {view === "invoices" && <InvoiceList invoices={filteredInvoices} filter={statusFilter} onFilter={setStatusFilter} onOpen={setSelectedInvoice} mode={mode} />}
    {view === "customers" && <ContactList title="Customers" contacts={customerRecords} emptyLabel="No customers found." mode={mode} />}
    {view === "vendors" && <ContactList title="Vendors" contacts={vendorRecords} emptyLabel="No vendors found." mode={mode} />}
    {view === "items" && <CatalogList items={filteredItems} taxes={filterRecords(taxes)} mode={mode} />}
    {view === "reports" && <ReportsPanel selected={selectedReport} reportData={reportData} error={reportError} onSelect={(name) => void requestReport(name)} mode={mode} />}
    {selectedInvoice && <InvoiceDrawer invoice={selectedInvoice} mode={mode} onClose={() => setSelectedInvoice(null)} onUpdated={(updated) => { onInvoiceUpdated(updated); setSelectedInvoice(updated); }} />}
    {showInvoiceForm && <InvoiceForm mode={mode} contacts={contacts.filter((record) => stringField(record, "contact_type").toLowerCase() !== "vendor")} items={items} onClose={() => setShowInvoiceForm(false)} onCreated={(invoice) => { onInvoiceCreated(invoice); setShowInvoiceForm(false); setView("invoices"); setStatusFilter("all"); }} />}
  </>;
}

export default App;
