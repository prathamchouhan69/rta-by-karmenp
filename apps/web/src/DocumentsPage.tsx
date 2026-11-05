import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiGet, apiWrite, makeIdempotencyKey, type ZohoRecord } from "./api";

type DocumentDraft = { document_id: string; title: string; documentType: string; content: string; createdAt: string; linkedRecordId?: string; status: "draft" };
const templates = [
  { value: "meeting_note", label: "Meeting notes" },
  { value: "follow_up_draft", label: "Customer follow-up draft" },
  { value: "operations_checklist", label: "Operations checklist" },
];

export function DocumentsPage({ onToast }: { onToast: (message: string) => void }) {
  const [documents, setDocuments] = useState<DocumentDraft[]>([]);
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState(templates[0].value);
  const [content, setContent] = useState("");
  const [linkedRecordId, setLinkedRecordId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      setDocuments((await apiGet<DocumentDraft[]>("/documents")).data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Document drafts could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const saveDraft = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const request = { title, documentType, content, linkedRecordId: linkedRecordId || undefined } satisfies ZohoRecord;
      const created = await apiWrite<DocumentDraft>("/documents", "POST", request, makeIdempotencyKey("document-draft"));
      setDocuments((current) => [created.data, ...current]);
      setTitle("");
      setContent("");
      setLinkedRecordId("");
      onToast("Draft saved in KARM. Nothing was sent or posted.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Draft could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const exportDraft = (draft: DocumentDraft) => {
    const blob = new Blob([`${draft.title}\n${templates.find((template) => template.value === draft.documentType)?.label ?? draft.documentType}\nStatus: Draft · Not sent\n\n${draft.content}\n`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${draft.title.replace(/[^a-z0-9-_]+/gi, "-").slice(0, 60) || "karm-draft"}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return <>
    <div className="nature-page-heading"><div><span className="n-kicker">KARM WORKSPACE · UNSENT DOCUMENTS</span><h1>Document drafts</h1><p>Prepare meeting notes, follow-up drafts, and operations checklists. Drafts stay in KARM and are never emailed or posted automatically.</p></div><div className="heading-tools"><span className="mode-chip practice"><i />DRAFTS ONLY</span></div></div>
    <div className="task-layout">
      <section className="section-block"><div className="section-head"><div><h2>Prepare a draft</h2><p>No accounting document or external message is created.</p></div></div>
        <form className="task-form" onSubmit={(event) => void saveDraft(event)}>
          <label>Draft title<input required minLength={3} maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Site coordination meeting" /></label>
          <label>Draft type<select value={documentType} onChange={(event) => setDocumentType(event.target.value)}>{templates.map((template) => <option value={template.value} key={template.value}>{template.label}</option>)}</select></label>
          <label>Related record ID (optional)<input maxLength={120} value={linkedRecordId} onChange={(event) => setLinkedRecordId(event.target.value)} placeholder="Paste an ID from a verified source record" /></label>
          <label>Draft content<textarea required minLength={1} maxLength={20000} rows={10} value={content} onChange={(event) => setContent(event.target.value)} placeholder="Write or paste verified details. Flux does not invent business or compliance facts." /></label>
          {error && <p className="n-error" role="alert">{error}</p>}
          <button className="n-button n-button-primary" disabled={saving || title.trim().length < 3 || !content.trim()}>{saving ? "Saving…" : "Save unsent draft"}</button>
        </form>
      </section>
      <section className="section-block"><div className="section-head"><div><h2>Saved drafts</h2><p>{documents.length} KARM drafts</p></div><button className="n-button n-button-soft" onClick={() => void refresh()} disabled={loading}>{loading ? "Loading…" : "Refresh"}</button></div>
        {loading ? <div className="task-empty" role="status">Loading drafts…</div> : documents.length === 0 ? <div className="task-empty"><b>No drafts saved</b><span>Prepared content will remain a draft until a person copies or exports it.</span></div> : <div className="document-draft-list">{documents.map((draft) => <article className="document-draft" key={draft.document_id}><div><span className="table-status amber">DRAFT · NOT SENT</span><h3>{draft.title}</h3><small>{templates.find((template) => template.value === draft.documentType)?.label ?? draft.documentType} · {new Date(draft.createdAt).toLocaleString()}</small>{draft.linkedRecordId && <small>Linked record ID: {draft.linkedRecordId}</small>}</div><pre>{draft.content}</pre><button className="n-button n-button-soft" onClick={() => exportDraft(draft)}>Export text</button></article>)}</div>}
      </section>
    </div>
  </>;
}
