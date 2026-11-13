'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge, EmptyState, InlineError, LoadingRow, Notice, PageHeader, Section } from '@/components/ui';
import { useSession, can } from '@/components/providers';
import { api, errorMessage } from '@/lib/api';

interface DocumentItem {
  name: string;
  quantity: string | null;
  unit: string | null;
  rate: string | null;
  discount: string | null;
  statedGstRate: string | null;
  hsn?: {
    status: string;
    code: string | null;
    gstRate: string | null;
    source: string | null;
    warnings?: Array<{ code: string; message: string }>;
  };
}

interface DocumentDraft {
  id: string;
  docType: string;
  status: string;
  version: number;
  createdAt: string;
  fields: {
    customerName: string | null;
    date: string | null;
    paymentTermsDays: string | null;
    delivery: string | null;
    notes: string | null;
  };
  customer: {
    status: string;
    name?: string;
    candidates?: Array<{ id: string; name: string }>;
  };
  items: DocumentItem[];
  blockers: Array<{ code: string; line?: number; message: string }>;
  warnings: string[];
  versions: Array<{ version: number; at: string; by: string }>;
  zoho?: { id: string; number?: string; status?: string; total?: string };
}

interface DocumentSummary {
  id: string;
  docType: string;
  status: string;
  version: number;
  createdAt: string;
  customer?: string | null;
  zoho?: { number?: string };
}

const dateLabel = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

function documentPayload(document: DocumentDraft) {
  return {
    fields: document.fields,
    items: document.items.map(({ name, quantity, unit, rate, discount, statedGstRate }) => ({
      name, quantity, unit, rate, discount, statedGstRate,
    })),
  };
}

export default function DocumentsPage() {
  const user = useSession();
  const mayRead = can(user, 'documents:draft');
  const mayPropose = can(user, 'documents:propose');
  const mayConfirmHsn = can(user, 'hsn:confirm');

  const [summaries, setSummaries] = useState<DocumentSummary[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [document, setDocument] = useState<DocumentDraft | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [detailRevision, setDetailRevision] = useState(0);
  const [instruction, setInstruction] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [proposing, setProposing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [restoreVersion, setRestoreVersion] = useState('');
  const [hsnForms, setHsnForms] = useState<Record<number, { code: string; rate: string; source: string }>>({});
  const [confirmingLine, setConfirmingLine] = useState<number | null>(null);

  const refreshList = useCallback(async () => {
    if (!mayRead) {
      setListLoading(false);
      return;
    }
    setListLoading(true);
    setListError('');
    try {
      const data = await api<{ documents: DocumentSummary[] }>('v1/documents');
      setSummaries(data.documents);
    } catch (cause) {
      setListError(errorMessage(cause));
    } finally {
      setListLoading(false);
    }
  }, [mayRead]);

  useEffect(() => { void refreshList(); }, [refreshList]);

  useEffect(() => {
    if (!selectedId || !mayRead) {
      setDocument(null);
      setDetailLoading(false);
      return;
    }
    const controller = new AbortController();
    setDetailLoading(true);
    setDetailError('');
    setDirty(false);
    setRestoreVersion('');
    setHsnForms({});
    api<DocumentDraft>(`v1/documents/${encodeURIComponent(selectedId)}`, { signal: controller.signal })
      .then(setDocument)
      .catch((cause) => {
        if (!controller.signal.aborted) setDetailError(errorMessage(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setDetailLoading(false);
      });
    return () => controller.abort();
  }, [selectedId, mayRead, detailRevision]);

  async function createDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!instruction.trim()) return;
    if (dirty && !window.confirm('Discard unsaved document edits and create a new draft?')) return;
    setDrafting(true);
    setError('');
    setNotice('');
    try {
      const created = await api<DocumentDraft>('v1/documents/draft', {
        method: 'POST',
        body: { instruction: instruction.trim(), docType: 'invoice' },
      });
      setInstruction('');
      setSelectedId(created.id);
      setDocument(created);
      setDirty(false);
      setNotice('Invoice draft created. Review every field and blocker before proposing it for approval.');
      await refreshList();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setDrafting(false);
    }
  }

  function updateFields(patch: Partial<DocumentDraft['fields']>) {
    setDocument((current) => current ? { ...current, fields: { ...current.fields, ...patch } } : current);
    setDirty(true);
  }

  function updateItem(index: number, patch: Partial<DocumentItem>) {
    setDocument((current) => current ? {
      ...current,
      items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
    } : current);
    setDirty(true);
  }

  function selectDocument(id: string) {
    if (id === selectedId) return;
    if (dirty && !window.confirm('Discard unsaved document edits?')) return;
    setSelectedId(id);
    setNotice('');
    setError('');
  }

  async function saveDraft() {
    if (!document) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const updated = await api<DocumentDraft>(`v1/documents/${encodeURIComponent(document.id)}`, {
        method: 'PATCH',
        body: documentPayload(document),
      });
      setDocument(updated);
      setDirty(false);
      setNotice(`Draft saved as version ${updated.version}.`);
      await refreshList();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  async function restoreDraft() {
    if (!document || !restoreVersion) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const updated = await api<DocumentDraft>(`v1/documents/${encodeURIComponent(document.id)}/revert`, {
        method: 'POST',
        body: { version: Number(restoreVersion) },
      });
      setDocument(updated);
      setDirty(false);
      setRestoreVersion('');
      setNotice(`Version ${restoreVersion} restored as version ${updated.version}.`);
      await refreshList();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  async function confirmHsn(index: number) {
    if (!document) return;
    const item = document.items[index];
    if (!item) return;
    const form = hsnForms[index];
    if (!form?.code.trim() || !form.rate.trim() || !form.source.trim()) return;
    setConfirmingLine(index);
    setError('');
    setNotice('');
    try {
      await api('v1/hsn/confirm', {
        method: 'POST',
        body: {
          itemName: item.name,
          code: form.code.trim(),
          gstRate: form.rate.trim(),
          source: form.source.trim(),
        },
      });
      const updated = await api<DocumentDraft>(`v1/documents/${encodeURIComponent(document.id)}`, {
        method: 'PATCH',
        body: documentPayload(document),
      });
      setDocument(updated);
      setDirty(false);
      setNotice('Owner-confirmed HSN mapping saved and the draft was rechecked.');
      await refreshList();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setConfirmingLine(null);
    }
  }

  async function proposeForApproval() {
    if (!document || dirty) return;
    setProposing(true);
    setError('');
    setNotice('');
    try {
      const proposal = await api<{ id: string }>(`v1/documents/${encodeURIComponent(document.id)}/propose`, { method: 'POST' });
      const updated = await api<DocumentDraft>(`v1/documents/${encodeURIComponent(document.id)}`);
      setDocument(updated);
      setNotice(`Proposal ${proposal.id} created. It is not approved or executed; review it in Approvals.`);
      await refreshList();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setProposing(false);
    }
  }

  if (!mayRead) {
    return (
      <div className="stack">
        <PageHeader eyebrow="Documents" title="Invoice drafts" description="Create and review invoice drafts using Flux’s connected document workflow." />
        <Notice tone="warn" title="Document access is not available.">
          Your role does not have the <code>documents:draft</code> permission required by the Flux API.
        </Notice>
      </div>
    );
  }

  const readyCount = summaries.filter((item) => item.status === 'ready').length;
  const attentionCount = summaries.filter((item) => item.status === 'needs_input').length;

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Business operations"
        title="Invoice drafts"
        description="Turn an instruction into an editable draft, check source-backed customer and HSN details, then send a ready draft to human approval."
        actions={<Link className="button small" href="/approvals">Open approvals</Link>}
      />

      {notice ? <p className="notice ok" role="status">{notice}</p> : null}
      {error ? <InlineError message={error} /> : null}

      <div className="stat-grid" aria-label="Document totals">
        <div className="stat"><span className="stat-label">Saved drafts</span><strong className="stat-value">{summaries.length}</strong></div>
        <div className="stat"><span className="stat-label">Ready to propose</span><strong className="stat-value">{readyCount}</strong></div>
        <div className="stat"><span className="stat-label">Need input</span><strong className="stat-value">{attentionCount}</strong></div>
      </div>

      <Section title="Create an invoice draft">
        <Notice title="Draft only.">
          Flux extracts only details it can support from your instruction. It does not calculate totals or create anything in Zoho Books here.
        </Notice>
        <form className="stack-sm" onSubmit={(event) => void createDraft(event)}>
          <label className="field">
            <span>Instruction <span className="hint">· include only the business details you want extracted</span></span>
            <textarea
              className="textarea"
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
              placeholder="Describe the invoice request using the customer, items, quantities, rates, and any terms you know."
              rows={4}
              maxLength={4000}
              required
            />
          </label>
          <div className="row">
            <button className="button primary" type="submit" disabled={drafting || !instruction.trim()}>
              {drafting ? 'Creating draft…' : 'Create draft'}
            </button>
            <span className="fineprint">The instruction is sent to the configured Flux document service.</span>
          </div>
        </form>
      </Section>

      <div className="grid-2">
        <Section title="Saved documents" aside={<button className="button small" type="button" onClick={() => void refreshList()} disabled={listLoading}>Refresh</button>}>
          {listLoading ? <LoadingRow label="Loading saved documents…" /> : null}
          {listError ? <div className="stack-sm"><InlineError message={listError} /><button className="button small" type="button" onClick={() => void refreshList()}>Try again</button></div> : null}
          {!listLoading && !listError && summaries.length === 0 ? (
            <EmptyState title="No saved documents yet">Create a draft above. Only documents returned by the Flux API appear here.</EmptyState>
          ) : null}
          {summaries.length ? (
            <div className="stack-sm">
              {summaries.map((item) => (
                <button
                  type="button"
                  className={`panel flat document-list-item${selectedId === item.id ? ' active' : ''}`}
                  key={item.id}
                  onClick={() => selectDocument(item.id)}
                  aria-pressed={selectedId === item.id}
                >
                  <span className="row-between">
                    <Badge tone={item.status === 'ready' ? 'ok' : item.status === 'needs_input' ? 'warn' : 'accent'}>{item.status.replaceAll('_', ' ')}</Badge>
                    <span className="fineprint">v{item.version}</span>
                  </span>
                  <strong>{item.customer || 'Customer not identified'}</strong>
                  <span className="fineprint">{item.docType} · {dateLabel(item.createdAt)}</span>
                  {item.zoho?.number ? <span className="fineprint">Zoho draft {item.zoho.number}</span> : null}
                </button>
              ))}
            </div>
          ) : null}
        </Section>

        <Section title="Draft details">
          {detailLoading ? <LoadingRow label="Loading document…" /> : null}
          {detailError ? <div className="stack-sm"><InlineError message={detailError} /><button className="button small" type="button" onClick={() => setDetailRevision((revision) => revision + 1)}>Try again</button></div> : null}
          {!selectedId && !detailLoading ? <EmptyState title="Select a saved draft">Document details and editable fields will appear here.</EmptyState> : null}
          {document && !detailLoading ? (
            <div className="stack">
              <div className="row-between">
                <div>
                  <p className="eyebrow">{document.docType} · version {document.version}</p>
                  <h3>{document.customer?.name || document.fields.customerName || 'Customer not identified'}</h3>
                </div>
                <Badge tone={document.status === 'ready' ? 'ok' : document.status === 'needs_input' ? 'warn' : 'accent'}>{document.status.replaceAll('_', ' ')}</Badge>
              </div>
              <p className="fineprint">Created {dateLabel(document.createdAt)} · customer match: {document.customer.status.replaceAll('_', ' ')}</p>

              {document.status !== 'proposed' && document.status !== 'created' ? (
                <>
                  <div className="form-grid">
                    <label className="field"><span>Customer</span><input className="input" value={document.fields.customerName || ''} onChange={(event) => updateFields({ customerName: event.target.value })} /></label>
                    <label className="field"><span>Document date</span><input className="input" type="date" value={document.fields.date || ''} onChange={(event) => updateFields({ date: event.target.value })} /></label>
                    <label className="field"><span>Payment terms (days)</span><input className="input" inputMode="numeric" value={document.fields.paymentTermsDays || ''} onChange={(event) => updateFields({ paymentTermsDays: event.target.value || null })} /></label>
                    <label className="field"><span>Delivery</span><input className="input" value={document.fields.delivery || ''} onChange={(event) => updateFields({ delivery: event.target.value || null })} /></label>
                    <label className="field span-2"><span>Notes</span><textarea className="textarea" rows={2} value={document.fields.notes || ''} onChange={(event) => updateFields({ notes: event.target.value || null })} /></label>
                  </div>

                  <Section title="Line items" aside={<Badge tone="accent">{document.items.length}</Badge>}>
                    <div className="stack-sm">
                      {document.items.map((item, index) => (
                        <article className="panel flat" key={`${index}-${item.name}`}>
                          <div className="row-between">
                            <strong>Line {index + 1}</strong>
                            <Badge tone={item.hsn?.status === 'Confirmed by owner' ? 'ok' : 'warn'}>{item.hsn?.status || 'HSN not checked'}</Badge>
                          </div>
                          <div className="form-grid" style={{ marginTop: '0.75rem' }}>
                            <label className="field span-2"><span>Item</span><input className="input" value={item.name} onChange={(event) => updateItem(index, { name: event.target.value })} /></label>
                            <label className="field"><span>Quantity</span><input className="input" inputMode="decimal" value={item.quantity || ''} onChange={(event) => updateItem(index, { quantity: event.target.value || null })} /></label>
                            <label className="field"><span>Unit</span><input className="input" value={item.unit || ''} onChange={(event) => updateItem(index, { unit: event.target.value || null })} /></label>
                            <label className="field"><span>Rate</span><input className="input" inputMode="decimal" value={item.rate || ''} onChange={(event) => updateItem(index, { rate: event.target.value || null })} /></label>
                            <label className="field"><span>Discount</span><input className="input" inputMode="decimal" value={item.discount || ''} onChange={(event) => updateItem(index, { discount: event.target.value || null })} /></label>
                            <label className="field"><span>Stated GST rate (%)</span><input className="input" inputMode="decimal" value={item.statedGstRate || ''} onChange={(event) => updateItem(index, { statedGstRate: event.target.value || null })} /></label>
                          </div>
                          {item.hsn?.code ? <p className="fineprint">HSN/SAC {item.hsn.code}{item.hsn.gstRate ? ` · ${item.hsn.gstRate}%` : ''}{item.hsn.source ? ` · ${item.hsn.source}` : ''}</p> : null}
                          {item.hsn?.warnings?.map((warning) => <p className="fineprint" key={warning.code}>{warning.message}</p>)}
                          {item.hsn?.status !== 'Confirmed by owner' && mayConfirmHsn ? (
                            <div className="panel flat stack-sm" style={{ marginTop: '0.7rem' }}>
                              <Notice tone="warn" title="Owner confirmation required.">
                                Enter a code and rate you have verified from your own authoritative source. Flux does not determine the correct code.
                              </Notice>
                              <div className="form-grid">
                                <label className="field"><span>Verified HSN/SAC code</span><input className="input" value={hsnForms[index]?.code || ''} onChange={(event) => setHsnForms((current) => ({ ...current, [index]: { code: event.target.value, rate: current[index]?.rate || '', source: current[index]?.source || '' } }))} /></label>
                                <label className="field"><span>Verified GST rate (%)</span><input className="input" inputMode="decimal" value={hsnForms[index]?.rate || ''} onChange={(event) => setHsnForms((current) => ({ ...current, [index]: { code: current[index]?.code || '', rate: event.target.value, source: current[index]?.source || '' } }))} /></label>
                                <label className="field span-2"><span>Verification source</span><input className="input" placeholder="Source you checked" value={hsnForms[index]?.source || ''} onChange={(event) => setHsnForms((current) => ({ ...current, [index]: { code: current[index]?.code || '', rate: current[index]?.rate || '', source: event.target.value } }))} /></label>
                              </div>
                              <button className="button small" type="button" onClick={() => void confirmHsn(index)} disabled={confirmingLine !== null || !hsnForms[index]?.code.trim() || !hsnForms[index]?.rate.trim() || !hsnForms[index]?.source.trim()}>
                                {confirmingLine === index ? 'Confirming…' : 'Save owner confirmation'}
                              </button>
                            </div>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  </Section>

                  <div className="row">
                    <button className="button primary" type="button" onClick={() => void saveDraft()} disabled={!dirty || saving || confirmingLine !== null}>
                      {saving ? 'Saving…' : 'Save draft'}
                    </button>
                    {document.versions.length ? (
                      <>
                        <select className="select" aria-label="Version to restore" value={restoreVersion} onChange={(event) => setRestoreVersion(event.target.value)}>
                          <option value="">Restore a prior version…</option>
                          {document.versions.map((version) => <option key={version.version} value={version.version}>Version {version.version} · {dateLabel(version.at)}</option>)}
                        </select>
                        <button className="button small" type="button" onClick={() => void restoreDraft()} disabled={!restoreVersion || saving}>Restore</button>
                      </>
                    ) : null}
                  </div>
                </>
              ) : null}

              {document.blockers.length ? (
                <Notice tone="warn" title={`${document.blockers.length} item(s) need attention before proposing.`}>
                  <ul className="bullets">{document.blockers.map((blocker, index) => <li key={`${blocker.code}-${index}`}>{blocker.message}</li>)}</ul>
                </Notice>
              ) : null}
              {document.warnings.length ? (
                <Notice tone="warn" title="Extraction warnings">
                  <ul className="bullets">{document.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>
                </Notice>
              ) : null}
              <Notice title="Totals and Zoho write status.">
                {document.zoho
                  ? `Zoho Books reports draft ${document.zoho.number || document.zoho.id}${document.zoho.total ? ` with total ${document.zoho.total}` : ''}.`
                  : 'Totals are not calculated in Flux. Zoho Books calculates totals after a separately approved execution.'}
              </Notice>

              {document.status === 'proposed' ? (
                <Notice tone="info" title="Proposal is separate from execution.">
                  This draft has been proposed. Review its approval status in <Link href="/approvals">Approvals</Link>; nothing is executed from this page.
                </Notice>
              ) : null}
              {document.status === 'created' && document.zoho?.id ? (
                <a className="button small" href={`/api/flux/v1/documents/${encodeURIComponent(document.id)}/pdf`} target="_blank" rel="noreferrer">Open Zoho invoice PDF</a>
              ) : null}
              {mayPropose && document.status === 'ready' ? (
                <button className="button primary" type="button" onClick={() => void proposeForApproval()} disabled={dirty || saving || proposing || confirmingLine !== null}>
                  {proposing ? 'Creating proposal…' : 'Propose for approval'}
                </button>
              ) : null}
              {!mayPropose && document.status === 'ready' ? <p className="fineprint">Your role can prepare drafts but cannot propose them for approval.</p> : null}
              {dirty ? <p className="fineprint" role="status">Unsaved edits. Save the draft before proposing it.</p> : null}
            </div>
          ) : null}
        </Section>
      </div>
    </div>
  );
}
