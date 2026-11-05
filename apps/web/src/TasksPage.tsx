import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiGet, apiWrite, makeIdempotencyKey, type ZohoRecord } from "./api";

type Task = { task_id: string; title: string; description: string; owner: string; dueDate?: string; status: "open" | "in_progress" | "done" | "cancelled"; sourceType: string; sourceId?: string };

export function TasksPage({ onToast }: { onToast: (message: string) => void }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState("");
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("Workspace owner");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setTasks((await apiGet<Task[]>("/tasks")).data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Tasks could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const createTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const task = { title, owner, dueDate: dueDate || undefined, description, sourceType: "manual" } satisfies ZohoRecord;
      const result = await apiWrite<Task>("/tasks", "POST", task, makeIdempotencyKey("create-task"));
      setTasks((current) => [result.data, ...current]);
      setTitle("");
      setDueDate("");
      setDescription("");
      onToast("Task created in KARM.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Task could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (task: Task, status: Task["status"]) => {
    setError("");
    setUpdatingTaskId(task.task_id);
    try {
      const updated = await apiWrite<Task>(`/tasks/${encodeURIComponent(task.task_id)}/status`, "POST", { status }, makeIdempotencyKey("task-status"));
      setTasks((current) => current.map((item) => item.task_id === updated.data.task_id ? updated.data : item));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Task status could not be updated.");
    } finally {
      setUpdatingTaskId("");
    }
  };

  const openTasks = tasks.filter((task) => !["done", "cancelled"].includes(task.status));
  const completedTasks = tasks.filter((task) => task.status === "done");
  return <>
    <div className="nature-page-heading"><div><span className="n-kicker">KARM WORKSPACE · INTERNAL TASKS</span><h1>Tasks</h1><p>Capture and track owner-assigned work inside KARM. Tasks do not send messages or modify Zoho Books.</p></div><div className="heading-tools"><span className="mode-chip practice"><i />KARM STORAGE</span></div></div>
    <div className="task-layout">
      <section className="section-block task-create">
        <div className="section-head"><div><h2>New task</h2><p>Give each action a clear owner; dates are optional.</p></div></div>
        <form className="task-form" onSubmit={(event) => void createTask(event)}>
          <label>Task title<input required minLength={3} maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Verify overdue invoice status" /></label>
          <div className="task-form-row"><label>Owner<input required maxLength={80} value={owner} onChange={(event) => setOwner(event.target.value)} /></label><label>Due date<input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label></div>
          <label>Context<textarea maxLength={1000} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What outcome should be delivered?" /></label>
          {error && <p className="n-error" role="alert">{error}</p>}
          <button className="n-button n-button-primary" disabled={saving || title.trim().length < 3}>{saving ? "Saving…" : "Create task"}</button>
        </form>
      </section>
      <section className="section-block task-list">
        <div className="section-head"><div><h2>Work queue</h2><p>{openTasks.length} open · {completedTasks.length} completed</p></div><button className="n-button n-button-soft" onClick={() => void refresh()} disabled={loading}>{loading ? "Loading…" : "Refresh"}</button></div>
        {loading ? <p className="task-empty">Loading tasks…</p> : openTasks.length === 0 ? <div className="task-empty"><b>No open tasks</b><span>Create a task here; no unconnected operational data is assumed.</span></div> : <div className="task-items">{openTasks.map((task) => <article className="task-item" key={task.task_id}>
          <span className={`task-status-mark ${task.status}`} aria-hidden="true" />
          <div className="task-item-body"><b>{task.title}</b>{task.description && <p>{task.description}</p>}<small>{task.owner}{task.dueDate ? ` · Due ${task.dueDate}` : " · No due date"}{task.sourceType !== "manual" ? ` · ${task.sourceType}` : ""}</small></div>
          <label className="sr-only" htmlFor={`task-status-${task.task_id}`}>Status for {task.title}</label>
          <select id={`task-status-${task.task_id}`} value={task.status} disabled={updatingTaskId === task.task_id} onChange={(event) => void updateStatus(task, event.target.value as Task["status"])}><option value="open">Open</option><option value="in_progress">In progress</option><option value="done">Done</option><option value="cancelled">Cancelled</option></select>
        </article>)}</div>}
      </section>
    </div>
  </>;
}
