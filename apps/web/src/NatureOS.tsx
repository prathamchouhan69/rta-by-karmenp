import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { apiGet, clearAccessToken, getAccessToken, invoiceStatus, recordId, signIn, stringField, type ZohoRecord } from "./api";
import { charts, type ChartDefinition } from "./charts";
import { references, type NatureReference, type ReferenceCategory } from "./references";
import { FluxAssistant } from "./FluxAssistant";
import { useDialogFocus } from "./useDialogFocus";

const SourceTopology3D = lazy(() => import("./SourceTopology3D").then(({ SourceTopology3D: component }) => ({ default: component })));
const ContactList = lazy(() => import("./App").then(({ ContactList: component }) => ({ default: component })));
const ZohoBooksPanel = lazy(() => import("./App").then(({ ZohoBooksPanel: component }) => ({ default: component })));
const GoalsExecutionPage = lazy(() => import("./GoalsExecutionPage").then(({ GoalsExecutionPage: component }) => ({ default: component })));
const FluxBriefingPage = lazy(() => import("./FluxBriefingPage").then(({ FluxBriefingPage: component }) => ({ default: component })));
const TasksPage = lazy(() => import("./TasksPage").then(({ TasksPage: component }) => ({ default: component })));
const DocumentsPage = lazy(() => import("./DocumentsPage").then(({ DocumentsPage: component }) => ({ default: component })));
const AutomationsPage = lazy(() => import("./AutomationsPage").then(({ AutomationsPage: component }) => ({ default: component })));

type Page = "home" | "library" | "selections" | "business" | "projects" | "files" | "tasks" | "goals" | "accounting" | "transportation" | "people" | "relationships" | "charts" | "briefing" | "documents" | "automations" | "notifications" | "settings";
type Health = { mode: "mock" | "live"; authenticated: boolean; service: string };
type VisualMode = "day" | "night" | "classic";
type SavedReference = { optionKey: string; note: string };
type SelectionMap = Record<number, SavedReference>;
type WorkspaceData = { contacts: ZohoRecord[]; invoices: ZohoRecord[]; items: ZohoRecord[]; taxes: ZohoRecord[]; audit: ZohoRecord[] };

const EMPTY_WORKSPACE: WorkspaceData = { contacts: [], invoices: [], items: [], taxes: [], audit: [] };
const STORAGE_KEY = "karm-nature-selections-v1";
const VISUAL_MODE_KEY = "karm-visual-mode-v1";
const visualModes: { id: VisualMode; label: string; icon: string }[] = [
  { id: "day", label: "Day", icon: "sun" },
  { id: "night", label: "Night", icon: "moon" },
  { id: "classic", label: "Classic", icon: "classic" },
];
const themeColors: Record<VisualMode, string> = { day: "#e5f4f3", night: "#111326", classic: "#05070c" };
const pageTitles: Record<Page, string> = {
  home: "Home command center", library: "Nature library", selections: "My selections",
  business: "Business OS", projects: "Projects", files: "Files", tasks: "Tasks", goals: "Goals & Execution", documents: "Documents", automations: "Automations",
  accounting: "Accounting", transportation: "Transportation", people: "People & HR",
  relationships: "Relationships", charts: "Charts library", briefing: "Flux briefing", notifications: "Notifications", settings: "Settings",
};
const mobilePageTitles: Partial<Record<Page, string>> = {
  home: "Home", library: "Library", selections: "Saved", business: "Business",
  transportation: "Transit", people: "People", relationships: "CRM", accounting: "Books", goals: "Goals",
  notifications: "Alerts", charts: "Charts", briefing: "Flux",
};
const pageIcons: Record<Page, string> = {
  home: "home", library: "orbit", selections: "bookmark", business: "grid", projects: "branch",
  files: "file", tasks: "check", goals: "chart", accounting: "coins", transportation: "route", people: "users",
  relationships: "network", charts: "chart", briefing: "spark", documents: "file", automations: "orbit", notifications: "bell", settings: "settings",
};
const navGroups: { label: string; pages: Page[] }[] = [
  { label: "WORKSPACE", pages: ["home", "business", "projects", "files", "documents", "tasks", "goals", "automations"] },
  { label: "OPERATIONS", pages: ["accounting", "transportation", "people", "relationships"] },
  { label: "INTELLIGENCE", pages: ["briefing", "library", "selections", "charts", "notifications"] },
];
const categories: ("All" | ReferenceCategory)[] = ["All", "Nature", "Tesla", "Physics", "Math"];
const moduleIntros: Partial<Record<Page, string>> = {
  business: "A connected view of the work that keeps the business moving.",
  projects: "Milestones, dependencies, and delivery progress in one working space.",
  files: "A connected home for the documents behind your work.",
  tasks: "Turn complex work into clear next actions for the team.",
  accounting: "Review source records; Zoho Books remains responsible for accounting results.",
  goals: "Set realistic targets, check capacity, and turn verified actuals into measurable execution plans.",
  transportation: "Routes, vehicles, and delivery operations connected to the rest of the business.",
  people: "Attendance, workload, and people operations without losing the human context.",
  relationships: "Keep clients, partners, suppliers, and follow-ups connected.",
};
const moduleReferenceIds: Partial<Record<Page, number[]>> = {
  business: [2, 73, 106], projects: [108, 78, 115], files: [75, 76, 1], tasks: [78, 111, 110],
  accounting: [8, 140, 168], transportation: [76, 110, 111], people: [110, 78, 65],
  relationships: [75, 88, 73],
};

function readSelections(): SelectionMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as SelectionMap;
  } catch {
    return {};
  }
}

function readVisualMode(): VisualMode {
  try {
    const saved = localStorage.getItem(VISUAL_MODE_KEY);
    if (visualModes.some((mode) => mode.id === saved)) return saved as VisualMode;
  } catch {
    // The document bootstrap still provides a session-safe default.
  }
  const initial = document.documentElement.dataset.visualMode;
  return visualModes.some((mode) => mode.id === initial) ? initial as VisualMode : "day";
}

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
    orbit: <><circle cx="12" cy="12" r="2" /><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(-35 12 12)" /><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(35 12 12)" /></>,
    bookmark: <><path d="M6 4h12v17l-6-4-6 4z" /><path d="M9 8h6" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    branch: <><path d="M6 4v7a4 4 0 0 0 4 4h8" /><path d="m14 11 4 4-4 4" /><circle cx="6" cy="4" r="2" /></>,
    file: <><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M13 2v7h7M8 14h8M8 18h6" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
    coins: <><ellipse cx="9" cy="6" rx="6" ry="3" /><path d="M3 6v5c0 1.7 2.7 3 6 3M15 6v2" /><ellipse cx="15" cy="16" rx="6" ry="3" /><path d="M9 16v4c0 1.7 2.7 3 6 3s6-1.3 6-3v-4" /></>,
    route: <><circle cx="6" cy="18" r="2" /><circle cx="18" cy="6" r="2" /><path d="M8 18h3a3 3 0 0 0 3-3v-3a3 3 0 0 1 3-3h1" /><path d="M6 8V6h4" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a6 6 0 0 1 12 0v1M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v1" /></>,
    network: <><circle cx="12" cy="5" r="2" /><circle cx="5" cy="18" r="2" /><circle cx="19" cy="18" r="2" /><path d="m11 7-5 9m7-9 5 9M7 18h10" /></>,
    chart: <><path d="M3 3v18h18M8 16v-4m5 4V7m5 9v-7" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.8-.6a8 8 0 0 1-1.7 1l-.3 1.9h-2.8l-.3-1.9a8 8 0 0 1-1.7-1l-1.8.6-1.4-2.4 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.8.6a8 8 0 0 1 1.7-1L13 7h2.8l.3 1.9a8 8 0 0 1 1.7 1l1.8-.6 1.4 2.4-1.4 1.1a7 7 0 0 1-.2 2.2Z" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5M12 15V3" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
    moon: <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z" />,
    classic: <><rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="5" rx="1" /><rect x="13" y="10" width="8" height="11" rx="1" /><rect x="3" y="13" width="8" height="8" rx="1" /></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name] ?? paths.spark}</svg>;
}

function VisualModePicker({ mode, onChange, compact = false }: { mode: VisualMode; onChange: (mode: VisualMode) => void; compact?: boolean }) {
  const buttons = visualModes.map((item) => <button key={item.id} type="button" className={mode === item.id ? "visual-mode-option selected" : "visual-mode-option"} aria-pressed={mode === item.id} onClick={(event) => {
    onChange(item.id);
    event.currentTarget.closest("details")?.removeAttribute("open");
  }}><Icon name={item.icon} size={15} /><span>{item.label}</span></button>);
  if (compact) {
    const active = visualModes.find((item) => item.id === mode) ?? visualModes[0];
    return <details className="visual-mode-menu">
      <summary aria-label={`Appearance: ${active.label}. Choose Day, Night, or Classic`}><Icon name={active.icon} size={17} /><span>{active.label}</span></summary>
      <div className="visual-mode-options" role="group" aria-label="Choose appearance">{buttons}</div>
    </details>;
  }
  return <div className="visual-mode-options visual-mode-options-inline" role="group" aria-label="Choose appearance">{buttons}</div>;
}

function NatureMark({ id, category, large = false }: { id: number; category: ReferenceCategory; large?: boolean }) {
  const seed = id % 7;
  return (
    <span className={`nature-mark category-${category.toLowerCase()} ${large ? "nature-mark-large" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 100 100" className={`mark-shape shape-${seed}`}>
        <circle className="mark-ring ring-one" cx="50" cy="50" r="29" />
        <circle className="mark-ring ring-two" cx="50" cy="50" r="18" />
        <path className="mark-path" d={seed % 2 ? "M12 56C25 12 37 88 50 50s25-35 38-5" : "M18 70C22 28 41 22 50 50s28 22 32-20"} />
        <circle className="mark-core" cx="50" cy="50" r="4" />
        <circle className="mark-node" cx={seed % 2 ? "25" : "78"} cy={seed % 2 ? "34" : "30"} r="3" />
      </svg>
    </span>
  );
}

function App() {
  const [page, setPage] = useState<Page>("home");
  const [visualMode, setVisualMode] = useState<VisualMode>(readVisualMode);
  const [health, setHealth] = useState<Health | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceData>(EMPTY_WORKSPACE);
  const [selections, setSelections] = useState<SelectionMap>(readSelections);
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [query, setQuery] = useState("");
  const [selectedRef, setSelectedRef] = useState<NatureReference | null>(null);
  const [selectedChart, setSelectedChart] = useState<ChartDefinition | null>(null);
  const [accessCode, setAccessCode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState("");
  const [chartGroup, setChartGroup] = useState("All charts");
  const searchInput = useRef<HTMLInputElement>(null);

  const changeVisualMode = (nextMode: VisualMode) => {
    setVisualMode(nextMode);
    document.documentElement.dataset.visualMode = nextMode;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColors[nextMode]);
    try {
      localStorage.setItem(VISUAL_MODE_KEY, nextMode);
    } catch {
      setToast("Appearance changed for this session; browser storage is unavailable.");
    }
  };

  useEffect(() => {
    document.documentElement.dataset.visualMode = visualMode;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColors[visualMode]);
  }, [visualMode]);

  const persistSelections = useCallback((next: SelectionMap) => {
    setSelections(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      setToast("Browser storage is unavailable; changes may not persist.");
    }
  }, []);

  const refreshWorkspace = useCallback(async () => {
    setBusy(true);
    setLoadError("");
    const paths = ["/contacts?per_page=100", "/invoices?per_page=100", "/items?per_page=100", "/taxes?per_page=100", "/audit?limit=8"];
    const results = await Promise.allSettled(paths.map((path) => apiGet<ZohoRecord[]>(path)));
    const next = { ...EMPTY_WORKSPACE };
    const failed: string[] = [];
    results.forEach((result, index) => {
      const key = ["contacts", "invoices", "items", "taxes", "audit"][index] as keyof WorkspaceData;
      if (result.status === "fulfilled") next[key] = result.value.data;
      else if (result.reason instanceof Error) failed.push(result.reason.message);
    });
    setWorkspace(next);
    if (failed.length === paths.length) setLoadError(failed[0]);
    else if (failed.length) setLoadError(`${failed.length} record groups could not be loaded.`);
    setBusy(false);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/v1/health", { signal: controller.signal }).then(async (response) => {
      const payload = await response.json() as { ok?: boolean; data?: Health; error?: { message?: string } };
      if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error?.message || "The API is unavailable.");
      setHealth(payload.data);
    }).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setLoadError(error instanceof Error ? error.message : "The API is unavailable.");
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!health || (health.authenticated && !getAccessToken())) return;
    void refreshWorkspace();
  }, [health, refreshWorkspace]);

  useEffect(() => {
    const handleExpired = () => {
      setHealth((current) => current ? { ...current, authenticated: true } : current);
      clearAccessToken();
      setWorkspace(EMPTY_WORKSPACE);
      setToast("Your session expired. Sign in again.");
    };
    window.addEventListener("karm:auth-expired", handleExpired);
    return () => window.removeEventListener("karm:auth-expired", handleExpired);
  }, []);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      const target = event.target;
      const isEditing = target instanceof HTMLElement
        && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
      if (event.key === "/" && !event.altKey && !event.ctrlKey && !event.metaKey && !isEditing) {
        event.preventDefault();
        searchInput.current?.focus();
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  const visibleReferences = useMemo(() => references.filter((reference) => {
    const matchesCategory = category === "All" || reference.category === category;
    const text = `${reference.name} ${reference.meaning} ${reference.appMeaning} ${reference.module}`.toLowerCase();
    return matchesCategory && text.includes(query.trim().toLowerCase());
  }), [category, query]);
  const selectedReferences = useMemo(() => references.filter((reference) => Boolean(selections[reference.id])), [selections]);
  const activeTitle = pageTitles[page];

  const updateSelection = (id: number, patch: Partial<SavedReference>) => {
    const current = selections[id] ?? { optionKey: "", note: "" };
    const nextValue = { ...current, ...patch };
    const next = { ...selections };
    if (!nextValue.optionKey && !nextValue.note) delete next[id];
    else next[id] = nextValue;
    persistSelections(next);
  };

  const signInSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setLoginError("");
    try {
      await signIn(accessCode);
      setAccessCode("");
      await refreshWorkspace();
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  };

  const copySelections = async () => {
    const payload = selectedReferences.map((reference) => ({
      number: reference.id,
      reference: reference.name,
      direction: reference.options.find((option) => option.key === selections[reference.id]?.optionKey)?.title || "",
      note: selections[reference.id]?.note || "",
    }));
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setToast("Selections copied.");
    } catch {
      setToast("Clipboard access is unavailable in this browser.");
    }
  };

  const exportSelections = () => {
    const content = selectedReferences.map((reference) => {
      const selected = selections[reference.id];
      return `#${reference.id} ${reference.name}\nCategory: ${reference.category}\nDirection: ${reference.options.find((option) => option.key === selected?.optionKey)?.title || "Not chosen"}\nNote: ${selected?.note || "—"}\n`;
    }).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    link.download = "karm-nature-selections.txt";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (!health && !loadError) return <div className="n-load"><img src="/karm-logo.png" alt="" /><span className="loader" />Opening KARM OS</div>;
  if (loadError && !health) return <div className="n-gate"><div className="n-login"><img src="/karm-logo.png" alt="" /><h1>Workspace unavailable</h1><p>{loadError}</p><button className="n-button n-button-primary" onClick={() => window.location.reload()}>Retry</button></div></div>;
  if (health?.authenticated && !getAccessToken()) return (
    <div className="n-gate"><form className="n-login" onSubmit={(event) => void signInSubmit(event)}>
      <img src="/karm-logo.png" alt="" /><span className="n-kicker">RTA BY KARM</span><h1>Welcome back</h1>
      <p>Sign in to your {health.mode === "live" ? "connected Zoho Books workspace" : "practice workspace"}.</p>
      <label htmlFor="access-code">Owner access code</label>
      <input id="access-code" type="password" autoComplete="current-password" required value={accessCode} onChange={(event) => setAccessCode(event.target.value)} />
      {loginError && <p className="n-error" role="alert">{loginError}</p>}
      <button className="n-button n-button-primary" disabled={busy || !accessCode}>{busy ? "Connecting…" : "Open workspace"}<Icon name="arrow" size={16} /></button>
      <small>Private workspace · Access code stays in this session</small>
    </form></div>
  );

  return (
    <div className="nature-shell" data-visual-mode={visualMode}>
      <div className="nature-watermark" aria-hidden="true"><img src="/karm-logo.png" alt="" /></div>
      <aside className="nature-sidebar">
        <a className="nature-brand" href="#" onClick={(event) => { event.preventDefault(); setPage("home"); }}>
          <img src="/karm-logo.png" alt="" /><span><b>RTA <i>BY</i> KARM</b><small>NATURE-CONNECTED BUSINESS OS</small></span>
        </a>
        <div className="nature-workspace"><span className="workspace-seal">K</span><span><b>KARM Enterprises</b><small>{health?.mode === "live" ? "Zoho Books connected" : "Practice workspace"}</small></span><i className={`connection-indicator ${health?.mode === "live" ? "is-live" : ""}`} /></div>
        <nav className="nature-nav" aria-label="Workspace navigation">
          {navGroups.map((group) => <section key={group.label}>
            <span className="nav-group-label">{group.label}</span>
            {group.pages.map((item) => <button key={item} className={`nature-nav-item ${page === item ? "active" : ""}`} aria-label={pageTitles[item]} title={pageTitles[item]} aria-current={page === item ? "page" : undefined} onClick={() => { setPage(item); setSelectedRef(null); setSelectedChart(null); }}>
              <Icon name={pageIcons[item]} size={17} /><span className="nav-label-full">{pageTitles[item]}</span><span className="nav-label-short">{mobilePageTitles[item] || pageTitles[item]}</span>
              {item === "library" && <small>169</small>}{item === "selections" && selectedReferences.length > 0 && <small>{selectedReferences.length}</small>}
            </button>)}
          </section>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="nature-source"><span className="source-glyph"><Icon name="orbit" size={16} /></span><span><b>Nature as a system</b><small>Explore patterns. Apply meaning.</small></span></div>
          <button className={`nature-nav-item ${page === "settings" ? "active" : ""}`} aria-label="Settings" aria-current={page === "settings" ? "page" : undefined} onClick={() => setPage("settings")}><Icon name="settings" size={17} /><span>Settings</span></button>
          <button className="owner-button" onClick={() => { clearAccessToken(); setHealth((current) => current ? { ...current, authenticated: true } : current); }}>
            <span className="owner-avatar">O</span><span><b>Workspace owner</b><small>{health?.mode === "live" ? "Live access" : "Practice access"}</small></span><span className="owner-more">•••</span>
          </button>
        </div>
      </aside>

      <main className="nature-main">
        <header className="nature-topbar">
          <a className="mobile-brand" href="#" onClick={(event) => { event.preventDefault(); setPage("home"); }}><img src="/karm-logo.png" alt="" /><b>RTA BY KARM</b></a>
          <div className="topbar-crumb"><span>RTA BY KARM</span><i>/</i><b>{activeTitle}</b></div>
          <div className="topbar-tools">
            <label className="nature-search"><Icon name="search" size={16} /><input ref={searchInput} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") setQuery(""); if (event.key === "Enter" && page !== "accounting" && page !== "relationships") setPage("library"); }} placeholder={page === "accounting" || page === "relationships" ? "Search connected records…" : "Search nature references…"} aria-label={page === "accounting" || page === "relationships" ? "Search connected records" : "Search nature references"} /><kbd>/</kbd></label>
            <span className={`mode-chip ${health?.mode === "live" ? "live" : "practice"}`}><i />{health?.mode === "live" ? "LIVE DATA" : "PRACTICE"}</span>
            <VisualModePicker mode={visualMode} onChange={changeVisualMode} compact />
            <button className="top-icon" aria-label="Notifications" onClick={() => setPage("notifications")}><Icon name="bell" size={18} /></button>
            <span className="owner-avatar top-avatar">O</span>
          </div>
        </header>
        <div className="nature-content" data-page={page}>
          {loadError && <div className="nature-alert" role="status">{loadError}<button onClick={() => void refreshWorkspace()}>Retry</button></div>}
          <Suspense fallback={<div className="route-loading" role="status">Loading {pageTitles[page].toLowerCase()}…</div>}>
            {page === "home" && <HomePage health={health} workspace={workspace} busy={busy} visualMode={visualMode} onRefresh={() => void refreshWorkspace()} onNavigate={setPage} onOpenReference={(reference) => setSelectedRef(reference)} selectedCount={selectedReferences.length} />}
            {page === "library" && <LibraryPage references={visibleReferences} category={category} query={query} selections={selections} onCategory={setCategory} onOpen={setSelectedRef} onChoose={updateSelection} />}
            {page === "selections" && <SelectionsPage references={selectedReferences} selections={selections} onOpen={setSelectedRef} onRemove={(id) => persistSelections(Object.fromEntries(Object.entries(selections).filter(([key]) => Number(key) !== id)))} onCopy={() => void copySelections()} onExport={exportSelections} />}
            {page === "charts" && <ChartsPage group={chartGroup} onGroup={setChartGroup} onOpen={setSelectedChart} />}
            {page === "briefing" && <FluxBriefingPage onNavigate={setPage} />}
            {page === "accounting" && <AccountingPage health={health} workspace={workspace} busy={busy} search={query} onRefresh={() => void refreshWorkspace()} onInvoiceUpdated={(updated) => setWorkspace((current) => ({ ...current, invoices: current.invoices.map((invoice) => recordId(invoice) === recordId(updated) ? updated : invoice) }))} onInvoiceCreated={(created) => setWorkspace((current) => ({ ...current, invoices: [created, ...current.invoices.filter((invoice) => recordId(invoice) !== recordId(created))] }))} />}
            {page === "business" && <BusinessPage health={health} workspace={workspace} onNavigate={setPage} onOpenReference={setSelectedRef} />}
            {page === "tasks" && <TasksPage onToast={setToast} />}
            {page === "documents" && <DocumentsPage onToast={setToast} />}
            {page === "automations" && <AutomationsPage onToast={setToast} />}
            {page === "relationships" && <RelationshipsPage health={health} workspace={workspace} query={query} onNavigate={setPage} />}
            {(["projects", "files", "transportation", "people"] as Page[]).includes(page) && <ModulePage page={page} health={health} selections={selections} onOpenReference={setSelectedRef} onNavigate={setPage} />}
            {page === "notifications" && <NotificationsPage health={health} workspace={workspace} />}
            {page === "goals" && <GoalsExecutionPage onToast={setToast} />}
            {page === "settings" && <SettingsPage health={health} visualMode={visualMode} onVisualMode={changeVisualMode} onSignOut={() => { clearAccessToken(); setHealth((current) => current ? { ...current, authenticated: true } : current); }} />}
          </Suspense>
        </div>
        <footer className="nature-footer"><span>RTA BY KARM <i>·</i> {health?.mode === "live" ? "Zoho Books is the source of truth" : "Local practice data · no live books changes"}</span><span><i className="footer-orbit" /> Nature × systems × work</span></footer>
      </main>

      {selectedRef && <ReferenceDetail reference={selectedRef} saved={selections[selectedRef.id]} onClose={() => setSelectedRef(null)} onChoose={(optionKey) => updateSelection(selectedRef.id, { optionKey })} onNote={(note) => updateSelection(selectedRef.id, { note })} onNavigate={setPage} />}
      {selectedChart && <ChartDetail chart={selectedChart} onClose={() => setSelectedChart(null)} onNavigate={setPage} />}
      <FluxAssistant page={pageTitles[page]} />
      {toast && <div className="nature-toast" role="status" onAnimationEnd={() => setToast("")}>{toast}</div>}
    </div>
  );
}

function PageHeading({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description: string; actions?: ReactNode }) {
  return <div className="nature-page-heading"><div>{eyebrow && <span className="n-kicker">{eyebrow}</span>}<h1>{title}</h1><p>{description}</p></div>{actions && <div className="heading-tools">{actions}</div>}</div>;
}

function HomePage({ health, workspace, busy, visualMode, onRefresh, onNavigate, onOpenReference, selectedCount }: { health: Health | null; workspace: WorkspaceData; busy: boolean; visualMode: VisualMode; onRefresh: () => void; onNavigate: (page: Page) => void; onOpenReference: (reference: NatureReference) => void; selectedCount: number }) {
  const suggestion = references[(new Date().getDate() * 7) % references.length];
  const mode = health?.mode ?? "mock";
  const overdueRecords = workspace.invoices.filter((invoice) => invoiceStatus(invoice) === "overdue");
  const openRecords = workspace.invoices.filter((invoice) => !["paid", "void", "cancelled", "canceled", "closed"].includes(invoiceStatus(invoice)));
  const regularOpenRecords = openRecords.filter((invoice) => invoiceStatus(invoice) !== "overdue");
  const invoiceStates = [
    { label: "Open", value: regularOpenRecords.length, tone: "cyan" },
    { label: "Overdue", value: overdueRecords.length, tone: "rose" },
    { label: "Paid", value: workspace.invoices.filter((invoice) => invoiceStatus(invoice) === "paid").length, tone: "green" },
    { label: "Other", value: Math.max(0, workspace.invoices.length - regularOpenRecords.length - overdueRecords.length - workspace.invoices.filter((invoice) => invoiceStatus(invoice) === "paid").length), tone: "violet" },
  ];
  const today = new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "short", year: "numeric" }).format(new Date());
  const metrics = [
    { title: "Invoice records", value: workspace.invoices.length, note: mode === "live" ? "Returned by Zoho Books" : "Local practice records", color: "violet", icon: "file", page: "accounting" as Page },
    { title: "Open invoices", value: openRecords.length, note: "Among loaded records", color: "pink", icon: "orbit", page: "accounting" as Page },
    { title: "Overdue invoices", value: overdueRecords.length, note: "Among loaded records", color: "cyan", icon: "bell", page: "accounting" as Page },
    { title: "Contacts", value: workspace.contacts.length, note: mode === "live" ? "Returned by Zoho Books" : "Local practice records", color: "cyan", icon: "users", page: "relationships" as Page },
    { title: "Items", value: workspace.items.length, note: "Catalog records loaded", color: "amber", icon: "grid", page: "accounting" as Page },
    { title: "Tax records", value: workspace.taxes.length, note: "Returned by source", color: "green", icon: "chart", page: "accounting" as Page },
    { title: "Recent events", value: workspace.audit.length, note: "Activity records loaded", color: "cyan", icon: "network", page: "business" as Page },
    { title: "Saved patterns", value: selectedCount, note: "Stored in this browser", color: "pink", icon: "bookmark", page: "selections" as Page },
    { title: "Nature references", value: references.length, note: "Patterns in the library", color: "green", icon: "orbit", page: "library" as Page },
    { title: "Chart references", value: charts.length, note: "Layouts, not live metrics", color: "violet", icon: "chart", page: "charts" as Page },
  ];
  return <>
    <div className="home-heading">
      <div><time>{today}</time><h1>Good morning, KARM.</h1><p>Your workspace, in one view. Here’s what the connected records show.</p></div>
      <div className="home-heading-actions"><span className={`sync-state ${mode === "live" ? "is-live" : ""}`}><i />{mode === "live" ? "ZOHO BOOKS CONNECTED" : "PRACTICE WORKSPACE"}</span><button className="n-button n-button-soft" onClick={onRefresh} disabled={busy}><Icon name="orbit" size={15} />{busy ? "Syncing…" : "Refresh"}</button></div>
    </div>
    <section className="health-ecosystem" aria-label="Business source status">
      <div className={`health-gauge ${mode === "live" ? "has-live-source" : ""}`}><div><b>{mode === "live" ? "01" : "00"}</b><span>LIVE<br />SOURCES</span></div></div>
      <div className="health-summary"><span className="health-title">Business workspace <b className={`table-status ${mode === "live" ? "cyan" : "amber"}`}>{mode === "live" ? "CONNECTED" : "PRACTICE"}</b></span><p>{mode === "live" ? "Zoho Books is connected as the accounting source. Values below come from records returned by that source." : "This session is using local practice data. No live Books changes are being made."}</p><small>{workspace.invoices.length} invoices <i>·</i> {workspace.contacts.length} contacts <i>·</i> {workspace.audit.length} recent events loaded</small></div>
      <div className={`ecosystem-map ${busy ? "is-syncing" : ""}`} aria-hidden="true"><Suspense fallback={null}><SourceTopology3D mode={mode} visualMode={visualMode} /></Suspense><div className="ecosystem-wire wire-one" /><div className="ecosystem-wire wire-two" /><div className="ecosystem-wire wire-three" /><span className="eco-node eco-center">KARM</span><span className={`eco-node eco-source ${mode === "live" ? "connected" : "practice"}`}>{mode === "live" ? "BOOKS" : "PRACTICE"}</span><span className="eco-node eco-invoices">INV {workspace.invoices.length}</span><span className="eco-node eco-contacts">PEOPLE {workspace.contacts.length}</span></div>
    </section>
    {overdueRecords.length > 0 && <button className="attention-banner" onClick={() => onNavigate("accounting")}><span className="attention-symbol"><Icon name="bell" size={17} /></span><span><b>{overdueRecords.length} overdue invoice {overdueRecords.length === 1 ? "record" : "records"} in the loaded set</b><small>Review the source records in Accounting.</small></span><Icon name="arrow" size={16} /></button>}
    <div className="home-section-heading"><h2>Workspace signals</h2><button className="n-link" onClick={() => onNavigate("business")}>All modules <Icon name="arrow" size={13} /></button></div>
    <div className="metric-row">{metrics.map((metric) => <button key={metric.title} className={`nature-metric metric-${metric.color}`} onClick={() => onNavigate(metric.page)}><span className="metric-label"><Icon name={metric.icon} size={15} />{metric.title}</span><b>{metric.value.toLocaleString()}</b><small>{metric.note}</small><span className="metric-arrow"><Icon name="arrow" size={14} /></span><span className="metric-trace" aria-hidden="true"><i /><i /><i /><i /><i /></span></button>)}</div>
    <div className="dashboard-row dashboard-row-wide">
      <section className="section-block invoice-pulse"><div className="section-head"><div><h2>Invoice status</h2><p>Counts from the loaded {mode === "live" ? "Zoho Books" : "practice"} records.</p></div><button className="n-link" onClick={() => onNavigate("accounting")}>Invoice register <Icon name="arrow" size={13} /></button></div>
        {workspace.invoices.length ? <div className="invoice-status-list">{invoiceStates.map((status) => <div className="invoice-status-row" key={status.label}><span>{status.label}</span><div className="status-track"><i className={`tone-${status.tone}`} style={{ width: `${Math.min(100, (status.value / workspace.invoices.length) * 100)}%` }} /></div><b>{status.value}</b></div>)}</div> : <EmptyConnection label="No invoice records loaded" detail="Refresh the workspace to request records from the current source." />}
        <div className="panel-footnote"><span><i className="status-dot" />Source record counts</span><span>{workspace.invoices.length} total</span></div>
      </section>
      <section className="section-block source-pulse"><div className="section-head"><div><h2>Connected sources</h2><p>Data availability by workspace module.</p></div></div>
        <div className="connection-list">
          <ConnectionRow label="Accounting" detail={mode === "live" ? "Zoho Books" : "Local practice data"} value={`${workspace.invoices.length} invoices · ${workspace.contacts.length} contacts`} icon="coins" state={mode} onClick={() => onNavigate("accounting")} />
          <ConnectionRow label="Projects" detail="No project source connected" value="Unavailable" icon="branch" state="unavailable" onClick={() => onNavigate("projects")} />
          <ConnectionRow label="Files & people" detail="No source connected" value="Unavailable" icon="network" state="unavailable" onClick={() => onNavigate("files")} />
        </div>
        <button className="source-details-link" onClick={() => onNavigate("business")}>View source availability <Icon name="arrow" size={13} /></button>
      </section>
    </div>
    <div className="dashboard-row dashboard-row-triple">
      <section className="section-block priorities-panel"><div className="section-head"><div><h2>Recent source activity</h2><p>Events returned by the connected API.</p></div><span className="panel-count">{workspace.audit.length}</span></div>
        {workspace.audit.length ? <div className="activity-list">{workspace.audit.slice(0, 4).map((event, index) => {
          const title = stringField(event, "action", "event", "operation", "activity_type") || "Source event";
          const detail = stringField(event, "description", "resource_name", "module", "resource") || "Activity returned by the API";
          const date = stringField(event, "created_at", "date", "timestamp");
          return <div className="activity-row" key={recordId(event) || `${title}-${index}`}><i className="activity-mark" /><span><b>{title}</b><small>{detail}</small></span><time>{date || "—"}</time></div>;
        })}</div> : <EmptyConnection label="No activity records returned" detail="This API response did not include recent audit events." />}
        <button className="n-link" onClick={() => onNavigate("business")}>Open Business OS <Icon name="arrow" size={13} /></button>
      </section>
      <section className="section-block risk-panel"><div className="section-head"><div><h2>Attention horizon</h2><p>Record-based signals only.</p></div><Icon name="orbit" size={17} /></div>
        <div className="risk-count"><b>{overdueRecords.length}</b><span>overdue invoice records</span></div>
        {overdueRecords.length ? <div className="risk-record-list">{overdueRecords.slice(0, 3).map((invoice, index) => <div key={recordId(invoice) || index}><i /><span><b>{stringField(invoice, "invoice_number") || "Invoice record"}</b><small>{stringField(invoice, "customer_name") || "Customer not provided"}</small></span></div>)}</div> : <p className="risk-clear">No overdue invoice records in the loaded set.</p>}
        <button className="n-link" onClick={() => onNavigate("accounting")}>Review accounting <Icon name="arrow" size={13} /></button>
      </section>
      <section className="section-block daily-reference"><div className="reference-head"><span className="n-kicker">NATURE SUGGESTION · #{String(suggestion.id).padStart(3, "0")}</span><button className="n-icon-button" onClick={() => onOpenReference(suggestion)} aria-label="Open featured reference"><Icon name="arrow" size={15} /></button></div><button className="suggestion-art" onClick={() => onOpenReference(suggestion)}><NatureMark id={suggestion.id} category={suggestion.category} large /><span className="art-category">{suggestion.category.toUpperCase()}</span></button><h2>{suggestion.name}</h2><p>{suggestion.meaning}</p><div className="suggestion-link"><span>{suggestion.module} <i>·</i> {suggestion.appMeaning}</span><button onClick={() => onOpenReference(suggestion)}>Discover <Icon name="arrow" size={13} /></button></div></section>
    </div>
  </>;
}

function ConnectionRow({ label, detail, value, icon, state, onClick }: { label: string; detail: string; value: string; icon: string; state: "live" | "mock" | "unavailable"; onClick: () => void }) {
  return <button className="connection-row" onClick={onClick}><span className={`connection-icon ${state}`}><Icon name={icon} size={17} /></span><span className="connection-copy"><b>{label}</b><small>{detail}</small></span><span className="connection-value">{value}</span><span className={`connection-state ${state}`}>{state === "live" ? "CONNECTED" : state === "mock" ? "PRACTICE" : "NOT LINKED"}</span><Icon name="arrow" size={15} /></button>;
}

function LibraryPage({ references: list, category, query, selections, onCategory, onOpen, onChoose }: { references: NatureReference[]; category: (typeof categories)[number]; query: string; selections: SelectionMap; onCategory: (category: (typeof categories)[number]) => void; onOpen: (reference: NatureReference) => void; onChoose: (id: number, patch: Partial<SavedReference>) => void }) {
  const [visibleCount, setVisibleCount] = useState(24);
  useEffect(() => setVisibleCount(24), [category, query]);
  const shown = list.slice(0, visibleCount);
  return <>
    <PageHeading eyebrow="NATURE · PHYSICS · MATHEMATICS" title="Impossible nature library" description="169 real-world patterns. Each one opens a door into a more connected way to work." actions={<span className="library-total"><b>{list.length}</b> / 169 references</span>} />
    <div className="library-toolbar"><div className="category-filters" role="group" aria-label="Filter references by category">{categories.map((item) => <button key={item} className={category === item ? `filter-chip selected ${item.toLowerCase()}` : "filter-chip"} onClick={() => onCategory(item)}>{item === "All" ? "All 169" : item}</button>)}</div><span className="library-result">{query ? `${list.length} matches` : "CONTINUOUS FIELD NOTES"}</span></div>
    <div className="reference-grid">
      {shown.map((reference) => <ReferenceCard key={reference.id} reference={reference} saved={selections[reference.id]} onOpen={onOpen} onChoose={onChoose} />)}
      {shown.length === 0 && <div className="library-empty"><Icon name="search" size={24} /><b>No patterns found</b><span>Try a different word or category.</span></div>}
    </div>
    {visibleCount < list.length && <div className="load-more"><span>Showing {visibleCount} of {list.length}</span><button className="n-button n-button-soft" onClick={() => setVisibleCount((count) => Math.min(count + 24, list.length))}>Load next field notes <Icon name="arrow" size={15} /></button></div>}
  </>;
}

function ReferenceCard({ reference, saved, onOpen, onChoose }: { reference: NatureReference; saved?: SavedReference; onOpen: (reference: NatureReference) => void; onChoose: (id: number, patch: Partial<SavedReference>) => void }) {
  return <article className={`reference-card category-${reference.category.toLowerCase()}`}>
    <div className="ref-card-top"><span className="ref-number">#{String(reference.id).padStart(3, "0")}</span><span className="ref-category">{reference.category}</span>{saved?.optionKey && <span className="selected-mark"><Icon name="check" size={12} /> SAVED</span>}<button className="n-icon-button" onClick={() => onOpen(reference)} aria-label={`Open ${reference.name}`}><Icon name="arrow" size={14} /></button></div>
    <button className="ref-card-title" onClick={() => onOpen(reference)}><NatureMark id={reference.id} category={reference.category} /><span><b>{reference.name}</b><small>{reference.meaning}</small></span></button>
    <div className="ref-app-link"><span>APP CONNECTION</span><b>{reference.module}</b><small>{reference.appMeaning}</small></div>
    <div className="ref-option-list" aria-label={`Five visual directions for ${reference.name}`}>{reference.options.map((option, index) => <button key={option.key} className={saved?.optionKey === option.key ? "ref-option chosen" : "ref-option"} onClick={() => onChoose(reference.id, { optionKey: saved?.optionKey === option.key ? "" : option.key })} title={option.title}><i>{String(index + 1).padStart(2, "0")}</i><span>{option.family}</span>{saved?.optionKey === option.key && <Icon name="check" size={13} />}</button>)}</div>
    <button className="ref-card-foot" onClick={() => onOpen(reference)}><span>{saved?.note ? "NOTE SAVED" : "OPEN FIELD NOTE"}</span><span>Details <Icon name="arrow" size={13} /></span></button>
  </article>;
}

function ReferenceDetail({ reference, saved, onClose, onChoose, onNote, onNavigate }: { reference: NatureReference; saved?: SavedReference; onClose: () => void; onChoose: (optionKey: string) => void; onNote: (note: string) => void; onNavigate: (page: Page) => void }) {
  const dialogRef = useDialogFocus<HTMLElement>(onClose);
  return <div className="nature-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><aside ref={dialogRef} className="nature-detail" role="dialog" aria-modal="true" aria-labelledby="detail-title" tabIndex={-1}>
    <header className="detail-top"><span>FIELD NOTE <i>·</i> #{String(reference.id).padStart(3, "0")}</span><button className="n-icon-button" onClick={onClose} aria-label="Close reference"><Icon name="close" size={18} /></button></header>
    <div className="detail-art"><NatureMark id={reference.id} category={reference.category} large /><span>{reference.category.toUpperCase()} PATTERN</span><b>#{String(reference.id).padStart(3, "0")}</b></div>
    <div className="detail-scroll"><span className="n-kicker">{reference.category.toUpperCase()} REFERENCE</span><h2 id="detail-title">{reference.name}</h2><p className="detail-meaning">{reference.meaning}</p>
      <div className="detail-translation"><span>NATURE → APP</span><p>{reference.name} becomes a design lens for <b>{reference.appMeaning.toLowerCase()}</b>.</p><div><Icon name={pageIcons[(reference.module.toLowerCase() as Page)] || "orbit"} size={16} />{reference.module}<i>·</i>{reference.dataConnection}</div></div>
      <div className="detail-options"><div className="detail-section-title"><b>Choose a visual direction</b><small>5 CONCEPTS</small></div>{reference.options.map((option, index) => <button className={saved?.optionKey === option.key ? "detail-option selected" : "detail-option"} key={option.key} onClick={() => onChoose(option.key)}><span className="option-index">{String(index + 1).padStart(2, "0")}</span><span><b>{option.family}</b><small>{option.title}</small></span>{saved?.optionKey === option.key ? <Icon name="check" size={16} /> : <i className="option-radio" />}</button>)}</div>
      <label className="note-editor"><span>YOUR FIELD NOTE <small>{saved?.note ? "SAVED AUTOMATICALLY" : "SAVES AUTOMATICALLY"}</small></span><textarea value={saved?.note || ""} onChange={(event) => onNote(event.target.value)} placeholder="What does this pattern suggest for your work?" maxLength={1000} /></label>
      <div className="detail-actions"><button className="n-button n-button-primary" onClick={() => { onNavigate(reference.module.toLowerCase() === "accounting" ? "accounting" : "business"); onClose(); }}>Open {reference.module} <Icon name="arrow" size={15} /></button><span>Selection and note stay in this browser.</span></div>
    </div>
  </aside></div>;
}

function SelectionsPage({ references: list, selections, onOpen, onRemove, onCopy, onExport }: { references: NatureReference[]; selections: SelectionMap; onOpen: (reference: NatureReference) => void; onRemove: (id: number) => void; onCopy: () => void; onExport: () => void }) {
  const [filter, setFilter] = useState("All categories");
  const options = ["All categories", ...categories.slice(1)];
  const filtered = list.filter((reference) => filter === "All categories" || reference.category === filter);
  return <>
    <PageHeading eyebrow="YOUR PERSONAL FIELD NOTES" title="My selections" description="A private board of patterns, directions, and observations saved in this browser." actions={<><button className="n-button n-button-soft" onClick={onCopy}><Icon name="copy" size={15} />Copy</button><button className="n-button n-button-primary" onClick={onExport}><Icon name="download" size={15} />Export</button></>} />
    <div className="selection-summary"><b>{list.length}</b><span>patterns kept</span><i /><span>{Object.values(selections).filter((item) => item.note).length} with notes</span><div className="category-filters">{options.map((item) => <button key={item} className={filter === item ? "filter-chip selected" : "filter-chip"} onClick={() => setFilter(item)}>{item}</button>)}</div></div>
    {!filtered.length ? <div className="selection-empty"><NatureMark id={1} category="Nature" large /><h2>Your collection starts with a pattern.</h2><p>Choose one of 169 references and a visual direction. Your notes save automatically in this browser.</p></div> : <div className="selection-grid">{filtered.map((reference) => { const saved = selections[reference.id]; return <article key={reference.id} className={`selection-card category-${reference.category.toLowerCase()}`}><div className="selection-card-head"><span>#{String(reference.id).padStart(3, "0")} · {reference.category}</span><button onClick={() => onRemove(reference.id)} aria-label={`Remove ${reference.name}`}>Remove</button></div><button className="selection-title" onClick={() => onOpen(reference)}><NatureMark id={reference.id} category={reference.category} /><span><b>{reference.name}</b><small>{reference.module} · {reference.appMeaning}</small></span></button><div className="selection-direction"><span>SELECTED DIRECTION</span><b>{reference.options.find((item) => item.key === saved?.optionKey)?.family || "Direction not selected"}</b><small>{reference.options.find((item) => item.key === saved?.optionKey)?.title}</small></div>{saved?.note && <p className="selection-note">“{saved.note}”</p>}<button className="n-link" onClick={() => onOpen(reference)}>Edit field note <Icon name="arrow" size={14} /></button></article>; })}</div>}
  </>;
}

function ChartsPage({ group, onGroup, onOpen }: { group: string; onGroup: (group: string) => void; onOpen: (chart: ChartDefinition) => void }) {
  const groups = ["All charts", ...Array.from(new Set(charts.map((chart) => chart.group)))];
  const filtered = charts.filter((chart) => group === "All charts" || chart.group === group);
  return <>
    <PageHeading eyebrow="DATA VISUALIZATION" title="Charts library" description="A map of business and engineering charts, each connected to its source, module, and a related natural pattern." actions={<span className="library-total"><b>{filtered.length}</b> chart references</span>} />
    <div className="library-toolbar"><div className="category-filters">{groups.map((item) => <button key={item} className={group === item ? "filter-chip selected" : "filter-chip"} onClick={() => onGroup(item)}>{item}</button>)}</div><span className="library-result">72 CHART REFERENCES</span></div>
    <div className="chart-grid">{filtered.map((chart, index) => <ChartCard key={chart.id} chart={chart} index={index} onClick={() => onOpen(chart)} />)}</div>
  </>;
}

function ChartCard({ chart, index, onClick }: { chart: ChartDefinition; index: number; onClick: () => void }) {
  const bars = Array.from({ length: 8 }, (_, i) => 16 + ((index * 17 + i * 31 + (i * index) % 29) % 65));
  return <button className="chart-card" onClick={onClick}><div className="chart-card-top"><span>{chart.id}</span><span>{chart.group}</span></div><div className="chart-preview"><div className="chart-grid-lines"><i /><i /><i /></div><div className={`chart-bars chart-kind-${index % 3}`}>{bars.map((height, i) => <i key={i} style={{ height: `${height}%` }} />)}</div><span>CONCEPT PREVIEW · NO BUSINESS DATA</span></div><b>{chart.name}</b><div className="chart-card-meta"><span>{chart.module}</span><Icon name="arrow" size={14} /></div></button>;
}

function ChartDetail({ chart, onClose, onNavigate }: { chart: ChartDefinition; onClose: () => void; onNavigate: (page: Page) => void }) {
  const related = references.find((reference) => reference.module.toLowerCase() === chart.module.toLowerCase()) ?? references[0];
  const dialogRef = useDialogFocus<HTMLElement>(onClose);
  return <div className="nature-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><aside ref={dialogRef} className="nature-detail chart-detail" role="dialog" aria-modal="true" aria-labelledby="chart-title" tabIndex={-1}><header className="detail-top"><span>CHART REFERENCE <i>·</i> {chart.id}</span><button className="n-icon-button" onClick={onClose} aria-label="Close chart"><Icon name="close" /></button></header><div className="chart-detail-visual"><ChartCard chart={chart} index={charts.indexOf(chart)} onClick={() => undefined} /></div><div className="detail-scroll"><span className="n-kicker">{chart.group.toUpperCase()}</span><h2 id="chart-title">{chart.name}</h2><p className="detail-meaning">Chart type: {chart.name}. The illustration shows layout only. Connect an approved data source before displaying operational values.</p><div className="detail-translation"><span>DATA CONNECTION</span><p>{chart.source}</p><div><Icon name="grid" size={16} />{chart.module}<i>·</i>Related pattern: {related.name}</div></div><div className="chart-note">No metrics or sample business values are displayed here. Chart rendering needs a configured source and matching fields.</div><button className="n-button n-button-primary" onClick={() => { onNavigate(chart.module === "Accounting" ? "accounting" : "business"); onClose(); }}>Open {chart.module} <Icon name="arrow" size={15} /></button></div></aside></div>;
}

function AccountingPage({ health, workspace, busy, search, onRefresh, onInvoiceUpdated, onInvoiceCreated }: {
  health: Health | null;
  workspace: WorkspaceData;
  busy: boolean;
  search: string;
  onRefresh: () => void;
  onInvoiceUpdated: (invoice: ZohoRecord) => void;
  onInvoiceCreated: (invoice: ZohoRecord) => void;
}) {
  return <>
    <PageHeading eyebrow="FINANCIAL RECORDS" title="Accounting" description="Source records only. Calculations, tax, and balances remain in Zoho Books." actions={<button className="n-button n-button-soft" onClick={onRefresh} disabled={busy}><Icon name="orbit" size={15} />{busy ? "Refreshing…" : "Refresh"}</button>} />
    <div className="accounting-state">
      <div><span className={`mode-chip ${health?.mode === "live" ? "live" : "practice"}`}><i />{health?.mode === "live" ? "ZOHO BOOKS" : "PRACTICE DATA"}</span><h2>{health?.mode === "live" ? "Connected records" : "Practice records"}</h2><p>{health?.mode === "live" ? "Values below are returned by the connected organization." : "These records are local samples and will not update Zoho Books."}</p></div>
      <div className="accounting-counts"><div><b>{workspace.invoices.length}</b><span>Invoices loaded</span></div><div><b>{workspace.contacts.length}</b><span>Contacts loaded</span></div><div><b>{workspace.items.length}</b><span>Items loaded</span></div><div><b>{workspace.taxes.length}</b><span>Taxes loaded</span></div></div>
    </div>
    <ZohoBooksPanel contacts={workspace.contacts} invoices={workspace.invoices} items={workspace.items} taxes={workspace.taxes} mode={health?.mode ?? "mock"} search={search} onInvoiceUpdated={onInvoiceUpdated} onInvoiceCreated={onInvoiceCreated} />
  </>;
}

function RelationshipsPage({ health, workspace, query, onNavigate }: { health: Health | null; workspace: WorkspaceData; query: string; onNavigate: (page: Page) => void }) {
  const isVendor = (contact: ZohoRecord) => stringField(contact, "contact_type").toLowerCase() === "vendor";
  const matches = (contact: ZohoRecord) => !query.trim() || JSON.stringify(contact).toLowerCase().includes(query.trim().toLowerCase());
  const customers = workspace.contacts.filter((contact) => !isVendor(contact));
  const vendors = workspace.contacts.filter(isVendor);
  const [kind, setKind] = useState<"customers" | "vendors">("customers");
  const records = (kind === "vendors" ? vendors : customers).filter(matches);
  const source = health?.mode === "live" ? "Zoho Books" : "practice workspace";
  return <>
    <PageHeading eyebrow="CONNECTED CONTACTS" title="Relationships" description={`Review customer and vendor contacts returned by ${source}. This view does not send messages or change contact records.`} actions={<><span className={`mode-chip ${health?.mode === "live" ? "live" : "practice"}`}><i />{health?.mode === "live" ? "ZOHO BOOKS" : "PRACTICE DATA"}</span><button className="n-button n-button-soft" onClick={() => onNavigate("accounting")}>Open accounting <Icon name="arrow" size={14} /></button></>} />
    <div className="library-toolbar">
      <div className="category-filters" role="group" aria-label="Contact type">
        <button className={`filter-chip ${kind === "customers" ? "selected" : ""}`} aria-pressed={kind === "customers"} onClick={() => setKind("customers")}>Customers · {customers.length}</button>
        <button className={`filter-chip ${kind === "vendors" ? "selected" : ""}`} aria-pressed={kind === "vendors"} onClick={() => setKind("vendors")}>Vendors · {vendors.length}</button>
      </div>
      <span className="library-result">{records.length} {kind} {records.length === 1 ? "record" : "records"}</span>
    </div>
    <ContactList title={kind === "vendors" ? "Vendors" : "Customers"} contacts={records} emptyLabel={query.trim() ? "No matching contacts" : `No ${kind} found`} mode={health?.mode ?? "mock"} />
    <p className="notification-foot">Contact details and outstanding values are shown only when supplied by {source}. Use Accounting for invoices, catalog items, and reports.</p>
  </>;
}

function BusinessPage({ health, workspace, onNavigate, onOpenReference }: { health: Health | null; workspace: WorkspaceData; onNavigate: (page: Page) => void; onOpenReference: (reference: NatureReference) => void }) {
  const refs = [references[1], references[72], references[105]];
  return <><PageHeading eyebrow="CONNECTED BUSINESS OPERATIONS" title="Business OS" description="A map of the modules and source records available to this workspace." /><div className="business-overview"><div className="business-source"><span className={`mode-chip ${health?.mode === "live" ? "live" : "practice"}`}><i />{health?.mode === "live" ? "LIVE CONNECTION" : "PRACTICE MODE"}</span><h2>{workspace.invoices.length} invoices. {workspace.contacts.length} contacts.</h2><p>{health?.mode === "live" ? "Loaded from the connected Zoho Books organization." : "Local sample records. They do not update Zoho Books."}</p><button className="n-button n-button-soft" onClick={() => onNavigate("accounting")}>Review accounting records <Icon name="arrow" size={15} /></button></div><div className="business-orbit"><div /><div /><Icon name="network" size={33} /><span>BUSINESS<br />SYSTEM</span></div></div><div className="module-grid">{(["projects", "files", "tasks", "accounting", "transportation", "people", "relationships", "charts"] as Page[]).map((item) => <button key={item} className="module-card" onClick={() => onNavigate(item)}><span className="module-icon"><Icon name={pageIcons[item]} size={18} /></span><span><b>{pageTitles[item]}</b><small>{moduleIntros[item] || "Explore the chart concepts and connected data."}</small></span><Icon name="arrow" size={15} /></button>)}</div><div className="section-head"><div><span className="n-kicker">PATTERNS FOR BUSINESS SYSTEMS</span><h2>Nature-connected thinking</h2></div><button className="n-link" onClick={() => onNavigate("library")}>All references <Icon name="arrow" size={14} /></button></div><div className="business-reference-row">{refs.map((reference) => <button key={reference.id} className="business-reference" onClick={() => onOpenReference(reference)}><NatureMark id={reference.id} category={reference.category} /><span><b>{reference.name}</b><small>{reference.appMeaning}</small></span><Icon name="arrow" size={14} /></button>)}</div></>;
}

function ModulePage({ page, health, selections, onOpenReference, onNavigate }: { page: Page; health: Health | null; selections: SelectionMap; onOpenReference: (reference: NatureReference) => void; onNavigate: (page: Page) => void }) {
  const ids = moduleReferenceIds[page] ?? [];
  const related = ids.map((id) => references.find((reference) => reference.id === id)).filter((item): item is NatureReference => Boolean(item));
  const savedRelated = related.filter((item) => Boolean(selections[item.id]));
  const moduleName = pageTitles[page];
  return <>
    <PageHeading eyebrow={`WORKSPACE · ${moduleName.toUpperCase()}`} title={moduleName} description={moduleIntros[page] || "A connected business workspace."} actions={<span className={`mode-chip ${health?.mode === "live" ? "live" : "practice"}`}><i />{health?.mode === "live" ? "LIVE WORKSPACE" : "PRACTICE MODE"}</span>} />
    <div className="module-workspace-layout">
      <div className="module-intro-panel"><div className="module-intro-symbol"><Icon name={pageIcons[page]} size={27} /></div><div><span className="n-kicker">A WORKSPACE FOR REAL OPERATIONS</span><h2>Bring this system into the living map.</h2><p>Connect an approved source to show real {moduleName.toLowerCase()} data. Until then, this workspace stays clear of invented records or metrics.</p>{page === "files" && <p>KARM currently supports unsent document drafts, not a connected file repository.</p>}{page === "people" && <p>Task owners are not an employee directory; no HR or attendance records are connected.</p>}{page === "transportation" && <p>Internal tasks can track follow-ups, but route, vehicle, and delivery data are not connected.</p>}{page === "projects" && <p>Goals and tasks are available for execution tracking, but project and milestone records are not connected.</p>}<div className="heading-tools">{page === "files" && <button className="n-button n-button-soft" onClick={() => onNavigate("documents")}>Open document drafts <Icon name="arrow" size={14} /></button>}{page === "projects" && <><button className="n-button n-button-soft" onClick={() => onNavigate("goals")}>Open goals <Icon name="arrow" size={14} /></button><button className="n-button n-button-soft" onClick={() => onNavigate("tasks")}>Open tasks <Icon name="arrow" size={14} /></button></>}{(page === "people" || page === "transportation") && <button className="n-button n-button-soft" onClick={() => onNavigate("tasks")}>Open internal tasks <Icon name="arrow" size={14} /></button>}</div></div></div>
      <section className="section-block module-patterns"><div className="section-head"><div><span className="n-kicker">CONNECTED PATTERNS</span><h2>Nature gives the system a shape.</h2><p>Explore related references and save the visual direction that best explains this module.</p></div><button className="n-link" onClick={() => onNavigate("library")}>Explore library <Icon name="arrow" size={14} /></button></div><div className="module-reference-grid">{related.map((reference) => <button key={reference.id} className="module-reference-card" onClick={() => onOpenReference(reference)}><NatureMark id={reference.id} category={reference.category} large /><span>#{String(reference.id).padStart(3, "0")} · {reference.category}</span><b>{reference.name}</b><small>{reference.appMeaning}</small><i>{selections[reference.id] ? "DIRECTION SAVED" : "OPEN FIELD NOTE"} <Icon name="arrow" size={12} /></i></button>)}</div></section>
      {savedRelated.length > 0 && <section className="section-block module-saved-patterns"><span className="n-kicker">YOUR SAVED LENSES</span><div className="saved-lenses">{savedRelated.map((reference) => <button key={reference.id} onClick={() => onOpenReference(reference)}><NatureMark id={reference.id} category={reference.category} /><b>{reference.name}</b><Icon name="arrow" size={13} /></button>)}</div></section>}
      <EmptyConnection label={`${moduleName} data is not connected`} detail={`No ${moduleName.toLowerCase()} records are being shown until an approved data source is available.`} />
    </div>
  </>;
}

function NotificationsPage({ health, workspace }: { health: Health | null; workspace: WorkspaceData }) {
  const alerts = workspace.invoices.filter((invoice) => invoiceStatus(invoice) === "overdue");
  return <><PageHeading eyebrow="SIGNALS & ATTENTION" title="Notifications" description="Signals from connected records, kept separate from nature-inspired concepts." /><section className="section-block notification-list">{alerts.length ? alerts.map((invoice, index) => <div key={recordId(invoice) || index} className="notification-row"><span className="notification-pulse" /><div><b>Overdue invoice record</b><small>{stringField(invoice, "invoice_number")} · {stringField(invoice, "customer_name") || "Customer not provided"}</small></div><span className="table-status amber">Source record</span></div>) : <EmptyConnection label="No record alerts" detail="Overdue invoice alerts will appear here when the connected source returns them." />}<div className="notification-row concept-alert"><span className="notification-pulse" /><div><b>Pattern reminder</b><small>{references[64].name} · {references[64].appMeaning}</small></div><span className="table-status violet">Nature note</span></div></section><p className="notification-foot">{health?.mode === "live" ? "Record-based alerts reflect Zoho Books data." : "Practice mode alert values come from local sample records."}</p></>;
}

function SettingsPage({ health, visualMode, onVisualMode, onSignOut }: { health: Health | null; visualMode: VisualMode; onVisualMode: (mode: VisualMode) => void; onSignOut: () => void }) {
  return <><PageHeading eyebrow="WORKSPACE PREFERENCES" title="Settings" description="Manage this browser's saved nature selections and workspace session." /><section className="section-block settings-list"><div><span><b>Appearance</b><small>Choose a visual system. Your route, filters, and in-progress work stay in place.</small></span><VisualModePicker mode={visualMode} onChange={onVisualMode} /></div><div><span><b>Connection mode</b><small>{health?.mode === "live" ? "Zoho Books is connected as the accounting source of truth." : "Practice mode uses local sample records."}</small></span><span className={`mode-chip ${health?.mode === "live" ? "live" : "practice"}`}><i />{health?.mode === "live" ? "LIVE" : "PRACTICE"}</span></div><div><span><b>Saved references</b><small>Selections and notes are stored in this browser only.</small></span><span>Local browser storage</span></div><div><span><b>Sign out</b><small>Remove the current bearer token from this browser session.</small></span><button className="n-button n-button-soft" onClick={onSignOut}>Sign out</button></div><div><span><b>Motion</b><small>Animations honor your device's reduced-motion preference.</small></span><span>System preference</span></div></section></>;
}

function EmptyConnection({ label, detail }: { label: string; detail: string }) {
  return <div className="empty-connection"><span><Icon name="network" size={20} /></span><b>{label}</b><p>{detail}</p></div>;
}

export default App;
