import { useState, type FormEvent } from "react";
import { apiPost } from "./api";

type FluxAnswer = {
  answer: string;
  confidence?: "high" | "medium" | "low" | "uncertain";
  dataSources?: Array<{ name: string; source: string; recordId?: string }>;
  limitations?: string[];
  recommendedActions?: string[];
  draft?: string | null;
  approval?: { required: boolean; summary?: string } | null;
  source: string;
  modelConfigured: boolean;
  scope: string;
  health?: { score: number; riskLevel: string; nextBestAction?: string; summary?: string; nextBestActions?: string[] };
  measurement?: { supported: boolean; original: string; converted: string | null; formula: string | null; confidence: string; disclaimer?: string | null };
};
type Message = {
  role: "assistant" | "user";
  text: string;
  scope?: string;
  confidence?: string;
  actions?: string[];
  limitations?: string[];
  draft?: string | null;
  approval?: { required: boolean; summary?: string } | null;
  source?: string;
  health?: { score: number; riskLevel: string; nextBestAction?: string; summary?: string; nextBestActions?: string[] };
  measurement?: { supported: boolean; original: string; converted: string | null; formula: string | null; confidence: string; disclaimer?: string | null };
};

export function FluxAssistant({ page }: { page: string }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    text: "I can summarize the current KARM workspace or switch into Pratham personal-advisor mode for daily business, cash, and fitness planning.",
  }]);

  const runPrompt = async (value: string) => {
    const message = value.trim();
    if (message.length < 2 || busy) return;
    setQuestion("");
    setError("");
    setMessages((current) => [...current, { role: "user", text: message }]);
    setBusy(true);
    try {
      const result = await apiPost<FluxAnswer>("/flux/ask", { message, context: { page } });
      setMessages((current) => [...current, {
        role: "assistant",
        text: result.data.answer,
        scope: result.data.scope,
        confidence: result.data.confidence || "medium",
        actions: result.data.recommendedActions || [],
        limitations: result.data.limitations || [],
        draft: result.data.draft ?? null,
        approval: result.data.approval ?? null,
        source: result.data.source || "KARM workspace",
        health: result.data.health,
        measurement: result.data.measurement,
      }]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Flux could not load workspace evidence.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await runPrompt(question);
  };

  const quickPrompts = [
    "What needs attention in this workspace?",
    "What should I do now?",
    "Summarize the overdue invoices and risk.",
    "Which goals are most at risk right now?",
    "Aaj ka kaam kya hai?",
    "What can I verify before approving a write?",
    "Build my Pratham advisor daily plan with gym and income work.",
    "Convert 20 MT TMT steel into kg.",
    "Convert 120/80 mmHg blood pressure into kPa.",
  ];

  return (
    <aside className={`flux-capsule ${open ? "is-open" : ""}`} aria-label="Flux business assistant">
      {open && <section className="flux-panel" aria-label="Flux conversation">
        <header className="flux-panel-head">
          <span className="flux-mark" aria-hidden="true">F</span>
          <span><b>Flux</b><small>Grounded workspace assistant</small></span>
          <div className="flux-island-tags">
            <span className="flux-tag">Zoho Books</span>
            <span className="flux-tag muted">Approval required</span>
          </div>
          <button type="button" className="n-icon-button" aria-label="Close Flux" onClick={() => setOpen(false)}>×</button>
        </header>
        <div className="flux-scope-note">Source-of-truth: current KARM workspace · no external actions without approval</div>
        <div className="flux-quick-actions" aria-label="Flux prompt shortcuts">
          {quickPrompts.map((prompt) => (
            <button key={prompt} type="button" className="flux-quick-button" onClick={() => void runPrompt(prompt)} disabled={busy}>{prompt}</button>
          ))}
        </div>
        <div className="flux-messages" aria-live="polite">
          {messages.map((message, index) => <div className={`flux-message ${message.role}`} key={`${message.role}-${index}`}>
            <p>{message.text}</p>
            {message.confidence && <span className="flux-response-confidence">{message.confidence}</span>}
            {message.source && <span className="flux-response-source">{message.source}</span>}
            {message.health && (
              <span className="flux-response-health">Health {message.health.score}/100 · {message.health.riskLevel}</span>
            )}
            {message.measurement && (
              <dl className="flux-measurement-result">
                <div><dt>Original</dt><dd>{message.measurement.original}</dd></div>
                {message.measurement.converted && <div><dt>Converted</dt><dd>{message.measurement.converted}</dd></div>}
                {message.measurement.formula && <div><dt>Formula</dt><dd>{message.measurement.formula}</dd></div>}
                {message.measurement.disclaimer && <div><dt>Notice</dt><dd>{message.measurement.disclaimer}</dd></div>}
              </dl>
            )}
            {message.approval && (
              <span className="flux-response-approval">{message.approval.required ? 'Approval required before a write' : 'No write approval required'}</span>
            )}
            {message.actions && message.actions.length > 0 && <ul className="flux-response-actions">{message.actions.map((action) => <li key={`${index}-${action}`}>{action}</li>)}</ul>}
            {message.limitations && message.limitations.length > 0 && <ul className="flux-response-limitations">{message.limitations.map((limit) => <li key={`${index}-${limit}`}>{limit}</li>)}</ul>}
            {message.draft && <p className="flux-draft">Draft: {message.draft}</p>}
            {message.scope && <small>{message.scope}</small>}
          </div>)}
          {busy && <p className="flux-pending" role="status">Checking workspace records…</p>}
        </div>
        {error && <p className="n-error flux-error" role="alert">{error}</p>}
        <form className="flux-compose" onSubmit={(event) => void submit(event)}>
          <label className="sr-only" htmlFor="flux-question">Ask Flux about this workspace</label>
          <input id="flux-question" maxLength={500} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about goals, tasks, invoices…" />
          <button className="n-button n-button-primary" type="submit" disabled={busy || question.trim().length < 2}>Ask</button>
        </form>
      </section>}
      <button className="flux-capsule-trigger" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span className="flux-mark" aria-hidden="true">F</span><span>Flux</span><small>{open ? "Close" : "Ask"}</small>
      </button>
    </aside>
  );
}
