import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiGet, apiWrite, makeIdempotencyKey, type ZohoRecord } from "./api";

type Automation = {
  automation_id: string;
  title: string;
  description: string;
  owner: string;
  scheduleTime: string;
  timezone: "Asia/Kolkata";
  enabled: boolean;
  nextRunAt: string;
  lastRunAt?: string;
  lastTaskId?: string;
  action: "create_internal_task";
};

const routineTemplates = [
  {
    category: "Business",
    label: "Daily business review",
    title: "Review today's business priorities",
    description: "Review the most important sales, delivery, cash, and people priorities. Record verified facts, blockers, owners, and next steps; do not estimate missing figures.",
    scheduleTime: "09:00",
  },
  {
    category: "Business",
    label: "Pratham · Business + health",
    title: "Pratham daily business and health check",
    description: "Business: review today's three income tasks, quote follow-ups, confirmed order terms, and margin/cash risks. Health: plan today's gym session, protein target, and bedtime. Record actuals; do not infer missing numbers.",
    scheduleTime: "09:00",
  },
  {
    category: "Relationships",
    label: "Customer · Quote follow-up",
    title: "Review quotes and customer follow-ups",
    description: "Check open quotes, follow up within the agreed window, and record next steps, owner, expected close date, and verified order terms.",
    scheduleTime: "10:00",
  },
  {
    category: "Goals",
    title: "Review goal progress and blockers",
    label: "Goals · Weekly progress",
    description: "Check dated actuals against each goal, identify missing evidence or capacity constraints, and assign an internal follow-up task to the owner.",
    scheduleTime: "09:15",
  },
  {
    category: "Projects",
    label: "Projects · Milestones",
    title: "Review project milestones and blockers",
    description: "Review upcoming milestones, owners, dependencies, and blocked work. Record only confirmed status and assign an internal follow-up for unresolved blockers.",
    scheduleTime: "09:30",
  },
  {
    category: "Files & documents",
    label: "Files · Missing records",
    title: "Check project files and required records",
    description: "Check whether active work has the required current files and supporting records. Note missing or outdated documents and assign an owner; do not claim a file is verified unless reviewed.",
    scheduleTime: "10:00",
  },
  {
    category: "Tasks",
    label: "Tasks · Priority queue",
    title: "Triage the open task queue",
    description: "Review open and in-progress tasks, confirm priority, owner, due date, and next action, and flag overdue or blocked items for human review.",
    scheduleTime: "09:00",
  },
  {
    category: "Accounting",
    label: "Accounting · Receivables",
    title: "Review overdue invoices and collections",
    description: "Review current source invoice records, identify overdue items, and prepare owner-assigned collection follow-up tasks. Do not send messages or change Zoho records.",
    scheduleTime: "10:30",
  },
  {
    category: "Accounting",
    label: "Accounting · Payables",
    title: "Review bills and upcoming payables",
    description: "Review current source bill and vendor-payment records for upcoming obligations. Record verified due dates and assign a review task; do not initiate or schedule payment.",
    scheduleTime: "11:00",
  },
  {
    category: "Transportation",
    label: "Transport · Delivery readiness",
    title: "Review delivery and transport readiness",
    description: "Review confirmed delivery commitments, route or vehicle readiness, and unresolved logistics blockers. Capture verified status and assign an internal follow-up.",
    scheduleTime: "08:30",
  },
  {
    category: "People",
    label: "People · Team check-in",
    title: "Review team workload and follow-ups",
    description: "Review team workload and pending people-operations follow-ups using approved records. Keep sensitive details private and assign only appropriate internal tasks.",
    scheduleTime: "09:30",
  },
  {
    category: "Relationships",
    label: "Relationships · Partner follow-up",
    title: "Review customer, supplier, and partner follow-ups",
    description: "Review due relationship follow-ups, confirm the record and owner, and create internal next-step tasks. Do not contact anyone automatically.",
    scheduleTime: "10:00",
  },
];

function scheduledDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(value));
}

export function AutomationsPage({ onToast }: { onToast: (message: string) => void }) {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState("Workspace owner");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    try {
      setAutomations((await apiGet<Automation[]>("/automations")).data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Automations could not be loaded.");
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const request = { title, description, owner, scheduleTime } satisfies ZohoRecord;
      const created = await apiWrite<Automation>("/automations", "POST", request, makeIdempotencyKey("automation-create"));
      setAutomations((current) => [created.data, ...current]);
      setTitle("");
      setDescription("");
      onToast("Daily KARM task automation scheduled.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Automation could not be created.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (automation: Automation) => {
    setBusyId(automation.automation_id);
    setError("");
    try {
      const updated = await apiWrite<Automation>(`/automations/${encodeURIComponent(automation.automation_id)}/enabled`, "POST", { enabled: !automation.enabled }, makeIdempotencyKey("automation-enabled"));
      setAutomations((current) => current.map((item) => item.automation_id === updated.data.automation_id ? updated.data : item));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Automation status could not be changed.");
    } finally {
      setBusyId("");
    }
  };

  const applyRoutine = (routine: (typeof routineTemplates)[number]) => {
    setTitle(routine.title);
    setDescription(routine.description);
    setScheduleTime(routine.scheduleTime);
    setError("");
  };

  return <>
    <div className="nature-page-heading"><div><span className="n-kicker">FLUX · BOUNDED INTERNAL AUTOMATIONS</span><h1>Automations</h1><p>Schedule daily KARM task creation in India time. Flux creates internal tasks only; it does not send messages or change Zoho records.</p></div><div className="heading-tools"><span className="mode-chip practice"><i />TASKS ONLY</span></div></div>
    <div className="task-layout">
      <section className="section-block"><div className="section-head"><div><h2>Schedule a daily task</h2><p>The scheduled run creates one owner-assigned internal task.</p></div></div>
        <div className="automation-routines" aria-label="Routine templates">
          <span>Choose an area. Selecting a routine fills the form; review it before scheduling.</span>
          <div className="automation-routine-groups">
            {[...new Set(routineTemplates.map((routine) => routine.category))].map((category) => (
              <section key={category}>
                <b>{category}</b>
                <div>{routineTemplates.filter((routine) => routine.category === category).map((routine) => <button key={routine.label} type="button" className="n-button n-button-soft" onClick={() => applyRoutine(routine)}>{routine.label}</button>)}</div>
              </section>
            ))}
          </div>
        </div>
        <form className="task-form" onSubmit={(event) => void create(event)}>
          <label>Task title<input required minLength={3} maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Review goal progress" /></label>
          <label>Owner<input required maxLength={80} value={owner} onChange={(event) => setOwner(event.target.value)} /></label>
          <label>Daily run time · Asia/Kolkata<input type="time" required value={scheduleTime} onChange={(event) => setScheduleTime(event.target.value)} /></label>
          <label>Task context<textarea maxLength={1000} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the review or internal work to perform." /></label>
          {error && <p className="n-error" role="alert">{error}</p>}
          <button className="n-button n-button-primary" disabled={saving || title.trim().length < 3}>{saving ? "Scheduling…" : "Schedule daily task"}</button>
        </form>
      </section>
      <section className="section-block"><div className="section-head"><div><h2>Scheduled automations</h2><p>{automations.filter((item) => item.enabled).length} enabled · Asia/Kolkata</p></div><button className="n-button n-button-soft" onClick={() => void refresh()}>Refresh</button></div>
        {automations.length === 0 ? <div className="task-empty"><b>No automations scheduled</b><span>Choose a routine or create your own. Scheduled runs create internal tasks that can be paused here.</span></div> : <div className="automation-list">{automations.map((automation) => <article className="automation-item" key={automation.automation_id}><div className="automation-item-head"><span className={`table-status ${automation.enabled ? "cyan" : "muted"}`}>{automation.enabled ? "ENABLED" : "PAUSED"}</span><button className="n-button n-button-soft" disabled={busyId === automation.automation_id} onClick={() => void toggle(automation)}>{automation.enabled ? "Pause" : "Enable"}</button></div><h3>{automation.title}</h3>{automation.description && <p>{automation.description}</p>}<small>Owner: {automation.owner} · Daily at {automation.scheduleTime} IST</small><small>Next run: {automation.enabled ? scheduledDate(automation.nextRunAt) : "Paused"}</small>{automation.lastRunAt && <small>Last task created: {scheduledDate(automation.lastRunAt)}</small>}</article>)}</div>}
      </section>
    </div>
  </>;
}
