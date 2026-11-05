import { useCallback, useEffect, useState } from "react";
import { apiGet } from "./api";

type Briefing = {
  generatedAt: string;
  timezone: string;
  mode: string;
  sources: { name: string; records: number; scope: string }[];
  counts: { invoices: number; overdueInvoices: number; goals: number; openTasks: number };
  attention: { kind: string; title: string; detail: string; recordId?: string; source: string; action: string }[];
  goalStatuses: { goal_id: string; title: string; status: string; progressPercent: number; risks: string[] }[];
  tasks: { task_id: string; title: string; owner: string; dueDate?: string; status: string }[];
  health?: { score: number; riskLevel: string; summary: string; nextBestAction: string; nextBestActions: string[] };
  engine?: { name: string; modelConfigured?: boolean; briefingDate?: string; status?: string; unverified?: string[]; degraded?: boolean; reason?: string };
};

type EngineStatus = {
  gateway: { uptimeSec: number; requests: number; errors: number; avgLatencyMs: number };
  proxy: { ok: boolean; status: number; mode?: string; service?: string; zohoConfigured?: boolean };
  flux: {
    ok: boolean;
    config: { zohoRead: boolean; zohoWrite: boolean; openrouter: boolean; omniroute: boolean; costPolicy: string; briefing: boolean; persistent: boolean };
    users: { id: string; name: string; role: string; active: boolean }[];
    models: number;
    providers: string[];
    audit: { ok: boolean; count: number };
    briefing: { date: string; status: string; unverified: number } | null;
  };
  security: { authRequired: boolean; authMode: string; ownerId: string; roles: string[] };
};

function formatUpdated(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(value));
}

function formatUptime(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export function FluxBriefingPage({ onNavigate }: { onNavigate: (page: "accounting" | "goals" | "tasks" | "automations") => void }) {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    const [briefingResult, statusResult] = await Promise.allSettled([
      apiGet<Briefing>("/flux/briefing"),
      apiGet<EngineStatus>("/flux/status"),
    ]);
    if (briefingResult.status === "fulfilled") setBriefing(briefingResult.value.data);
    else setError(briefingResult.reason instanceof Error ? briefingResult.reason.message : "The Flux briefing could not be loaded.");
    if (statusResult.status === "fulfilled") setEngineStatus(statusResult.value.data);
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const brainTiles = briefing ? [
    { label: "Operating score", value: `${briefing.health?.score ?? 0}/100`, detail: briefing.health?.summary ?? "Flux has not yet produced a score for the loaded source set.", tone: briefing.health?.riskLevel === "critical" ? "rose" : briefing.health?.riskLevel === "high" ? "amber" : "cyan" },
    { label: "Open risk", value: `${briefing.counts.overdueInvoices + Math.max(0, briefing.goalStatuses.filter((goal) => goal.status !== "completed" && goal.status !== "on_track").length)}`, detail: "Items that need a human decision loop.", tone: "rose" },
    { label: "Execution load", value: `${briefing.counts.openTasks}`, detail: "Active work still waiting for assignment or follow-through.", tone: "amber" },
  ] : [];

  const brainSignals = briefing ? [
    { title: "Source health", detail: briefing.sources.length ? `${briefing.sources.length} sources returned usable records for the current brief.` : "No source records were returned.", target: "accounting" as const, action: "Review sources" },
    { title: "Next best action", detail: briefing.health?.nextBestAction ?? "Review the highest-risk item before moving into the next work block.", target: "tasks" as const, action: "Open queue" },
    { title: "Goal pressure", detail: briefing.goalStatuses.some((goal) => goal.status !== "completed" && goal.status !== "on_track") ? "A few goals are drifting or need re-estimation before the next cycle." : "Goals are tracking inside the current brief.", target: "goals" as const, action: "Open goals" },
  ] : [];

  return <>
    <div className="nature-page-heading"><div><span className="n-kicker">FLUX · SOURCE-GROUNDED INTELLIGENCE</span><h1>Briefing & advisor board</h1><p>Signals and suggested reviews from available accounting records, KARM goals, and internal tasks. Advice is rule-based, not a substitute for owner judgment.</p></div><div className="heading-tools"><button className="n-button n-button-soft" onClick={() => onNavigate("automations")}>Build a daily routine</button><button className="n-button n-button-soft" onClick={() => void refresh()} disabled={loading}>{loading ? "Refreshing…" : "Refresh briefing"}</button></div></div>
    {error && <div className="nature-alert" role="alert">{error}<button onClick={() => void refresh()}>Retry</button></div>}
    {briefing && <>
      <section className="flux-briefing-banner"><div><div className="flux-banner-chips"><span className={`mode-chip ${briefing.mode === "live" ? "live" : "practice"}`}><i />{briefing.mode === "live" ? "LIVE SOURCE DATA" : "PRACTICE DATA"}</span><span className={`mode-chip ${briefing.engine?.name === "flux" ? "live" : "practice"}`} title={briefing.engine?.reason}><i />{briefing.engine?.name === "flux" ? "FLUX ENGINE" : "SAFE FALLBACK"}</span></div><h2>{briefing.attention.length ? `${briefing.attention.length} review signal${briefing.attention.length === 1 ? "" : "s"}` : "No review signals in the loaded set"}</h2><p>Generated {formatUpdated(briefing.generatedAt)} · All times follow {briefing.timezone}{briefing.engine?.reason ? ` · ${briefing.engine.reason}` : ""}</p></div><div className="flux-briefing-counts"><div><b>{briefing.counts.overdueInvoices}</b><span>Overdue invoices</span></div><div><b>{briefing.counts.goals}</b><span>Goals</span></div><div><b>{briefing.counts.openTasks}</b><span>Open tasks</span></div></div></section>
      {engineStatus && <section className="section-block flux-engine-panel">
        <div className="section-head">
          <div><span className="n-kicker">RUNTIME TRUTH</span><h2>Engine & safety</h2><p>Live production state from the gateway, the hardened proxy, and Flux&apos;s tamper-evident audit chain.</p></div>
          <span className={`flux-engine-state ${engineStatus.flux.audit.ok && engineStatus.proxy.ok ? "ok" : "warn"}`}><i />{engineStatus.flux.audit.ok && engineStatus.proxy.ok ? "ALL SYSTEMS NOMINAL" : "DEGRADED"}</span>
        </div>
        <div className="flux-engine-grid">
          <article className="flux-engine-card"><span>Flux engine</span><strong>{engineStatus.flux.providers.length ? engineStatus.flux.providers.join(" + ") : "Deterministic fallback"}</strong><small>{engineStatus.flux.models} models · {engineStatus.flux.config.costPolicy} · Zoho {engineStatus.flux.config.zohoRead ? "read connected" : "not connected"}</small></article>
          <article className={`flux-engine-card ${engineStatus.flux.audit.ok ? "tone-cyan" : "tone-rose"}`}><span>Audit chain</span><strong>{engineStatus.flux.audit.ok ? `${engineStatus.flux.audit.count} entries verified` : "CHAIN BROKEN"}</strong><small>Hash-chained HMAC audit · {engineStatus.flux.users.length} identity{engineStatus.flux.users.length === 1 ? "" : "s"}</small></article>
          <article className="flux-engine-card"><span>Gateway</span><strong>{engineStatus.gateway.requests} requests</strong><small>{engineStatus.gateway.avgLatencyMs}ms avg · {engineStatus.gateway.errors} errors · up {formatUptime(engineStatus.gateway.uptimeSec)}</small></article>
          <article className={`flux-engine-card ${engineStatus.proxy.ok ? "tone-cyan" : "tone-rose"}`}><span>Execution plane</span><strong>{engineStatus.proxy.ok ? `${engineStatus.proxy.mode ?? "unknown"} mode` : "UNAVAILABLE"}</strong><small>{engineStatus.proxy.service ?? "karm-proxy"} · {engineStatus.proxy.zohoConfigured ? "Zoho configured" : "practice records"}</small></article>
        </div>
        <p className="flux-data-limit">Access: {engineStatus.security.authMode} · owner {engineStatus.security.ownerId} · roles {engineStatus.security.roles.join(", ")}.</p>
      </section>}
      <section className="section-block flux-brain-overview">
        <div className="section-head">
          <div><span className="n-kicker">BRAIN SUMMARY</span><h2>What the operating layer sees</h2><p>Flux ranks the available evidence so the next human action is clear.</p></div>
        </div>
        <div className="flux-brain-metrics">
          {brainTiles.map((tile) => (
            <div key={tile.label} className={`flux-brain-tile tone-${tile.tone}`}>
              <span>{tile.label}</span>
              <strong>{tile.value}</strong>
              <small>{tile.detail}</small>
            </div>
          ))}
        </div>
        <div className="flux-brain-actions">
          {brainSignals.map((signal) => (
            <article key={signal.title} className="flux-brain-card">
              <div>
                <b>{signal.title}</b>
                <p>{signal.detail}</p>
              </div>
              <button className="n-link" onClick={() => onNavigate(signal.target)}>{signal.action} <span aria-hidden="true">→</span></button>
            </article>
          ))}
        </div>
      </section>
      <div className="flux-briefing-grid">
        <section className="section-block">
          <div className="section-head">
            <div><span className="n-kicker">ADVISOR BOARD · EVIDENCE FIRST</span><h2>Items to review</h2><p>Recommendations point to a human review; Flux does not execute them.</p></div>
          </div>
          {briefing.attention.length > 0 ? (
            <div className="flux-attention-list">
              {briefing.attention.map((item, index) => (
                <article className="flux-attention-item" key={`${item.kind}-${item.recordId ?? index}`}>
                  <span className={`flux-advisor-icon ${item.kind}`} aria-hidden="true">{item.kind === "overdue_invoice" ? "₹" : "↗"}</span>
                  <div>
                    <b>{item.title}</b>
                    <p>{item.detail}</p>
                    <small>{item.action}</small>
                    <small className="flux-evidence-label">Evidence: {item.source}{item.recordId ? ` · ${item.recordId}` : ""}</small>
                  </div>
                  <button className="n-link" onClick={() => onNavigate(item.kind === "overdue_invoice" ? "accounting" : "goals")}>Review <span aria-hidden="true">→</span></button>
                </article>
              ))}
            </div>
          ) : <div className="task-empty"><b>No rule-based signals</b><span>This only means none were found in the records returned for this briefing. It is not a full business health assessment.</span></div>}
        </section>
        <section className="section-block flux-goal-board">
          <div className="section-head">
            <div><span className="n-kicker">GOAL HEALTH</span><h2>Goal status</h2></div>
            <button className="n-link" onClick={() => onNavigate("goals")}>Open goals →</button>
          </div>
          {briefing.goalStatuses.length > 0 ? briefing.goalStatuses.map((goal) => (
            <div className="flux-goal-row" key={goal.goal_id}>
              <span><b>{goal.title}</b><small>{goal.status.replaceAll("_", " ")} · {goal.progressPercent}% progress</small>{goal.risks[0] && <small>{goal.risks[0]}</small>}</span>
              <i className={`table-status ${goal.status === "on_track" || goal.status === "completed" ? "cyan" : "amber"}`}>{goal.status.replaceAll("_", " ")}</i>
            </div>
          )) : <div className="task-empty"><b>No goals created</b><span>Create evidence-based goals to include them in the briefing.</span></div>}
        </section>
        <section className="section-block flux-source-board">
          <div className="section-head"><div><span className="n-kicker">EVIDENCE SCOPE</span><h2>Sources included</h2></div></div>
          <div className="flux-source-list">
            {briefing.sources.map((source) => <div key={source.name}><b>{source.name}</b><span>{source.records} records</span><small>{source.scope}</small></div>)}
          </div>
          <p className="flux-data-limit">This briefing includes only returned records, capped at 200 per source. It does not infer unavailable project, people, transport, market, or compliance data.</p>
        </section>
        <section className="section-block">
          <div className="section-head">
            <div><span className="n-kicker">EXECUTION</span><h2>Open task queue</h2></div>
            <button className="n-link" onClick={() => onNavigate("tasks")}>Manage tasks →</button>
          </div>
          {briefing.tasks.length > 0 ? (
            <div className="flux-task-list">
              {briefing.tasks.slice(0, 6).map((task) => <div key={task.task_id}><b>{task.title}</b><small>{task.owner}{task.dueDate ? ` · Due ${task.dueDate}` : ""}</small></div>)}
            </div>
          ) : <div className="task-empty"><b>No open tasks</b><span>Add owner-assigned work to the KARM task queue.</span></div>}
        </section>
      </div>
    </>}
    {!briefing && !error && <div className="task-empty" role="status">Loading source records…</div>}
  </>;
}
