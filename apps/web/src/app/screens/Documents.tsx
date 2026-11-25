import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  Download,
  FilePlus2,
  FileText,
  FolderOpen,
  Plus,
  Send,
  ShieldCheck,
  Upload,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useWorkspace } from '../workspace';
import {
  Button,
  Chip,
  DrawerRow,
  Modal,
  PageHeader,
  Panel,
  SearchField,
  SectionHead,
  StatusChip,
  Tabs,
  toneVar,
} from '../ui';
import { cx, timeStamp } from '../format';
import type { DocumentKind, DocumentRecord } from '../types';
import { GlassFolderCards } from '../components/GlassFolderCards';
import { ConnectedIntelligenceNode } from '../components/ConnectedIntelligenceNode';

type DocTab = 'all' | 'sales' | 'delivery' | 'purchase' | 'compliance';

const DOC_GROUP: Record<DocumentKind, Exclude<DocTab, 'all'>> = {
  Quotation: 'sales',
  Proforma: 'sales',
  'Sales order': 'sales',
  Invoice: 'sales',
  'Credit note': 'sales',
  'Delivery challan': 'delivery',
  'E-way bill': 'delivery',
  'Purchase order': 'purchase',
  Bill: 'purchase',
  'Payment receipt': 'purchase',
  'Work order': 'compliance',
  'Measurement book': 'compliance',
  'GST return': 'compliance',
};

const ALL_KINDS: DocumentKind[] = [
  'Quotation',
  'Proforma',
  'Sales order',
  'Invoice',
  'Delivery challan',
  'E-way bill',
  'Credit note',
  'Purchase order',
  'Bill',
  'Payment receipt',
  'Work order',
  'Measurement book',
  'GST return',
];

const GROUP_LABELS: Array<{ id: DocTab; label: string }> = [
  { id: 'all', label: 'All documents' },
  { id: 'sales', label: 'Sales' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'purchase', label: 'Purchase' },
  { id: 'compliance', label: 'Compliance' },
];

export const DocumentsScreen: React.FC = () => {
  const { snapshot, addDocument, notify } = useWorkspace();
  const [tab, setTab] = useState<DocTab>('all');
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState<DocumentRecord | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [newKind, setNewKind] = useState<DocumentKind>('Quotation');
  const [newTitle, setNewTitle] = useState('');
  const [newParty, setNewParty] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    return snapshot.documents
      .filter((document) => tab === 'all' || DOC_GROUP[document.kind] === tab)
      .filter((document) =>
        !lower ||
        `${document.title} ${document.kind} ${document.reference} ${document.party} ${document.owner}`.toLowerCase().includes(lower),
      );
  }, [query, snapshot.documents, tab]);

  const counts = {
    all: snapshot.documents.length,
    sales: snapshot.documents.filter((document) => DOC_GROUP[document.kind] === 'sales').length,
    delivery: snapshot.documents.filter((document) => DOC_GROUP[document.kind] === 'delivery').length,
    purchase: snapshot.documents.filter((document) => DOC_GROUP[document.kind] === 'purchase').length,
    compliance: snapshot.documents.filter((document) => DOC_GROUP[document.kind] === 'compliance').length,
  };

  const createDocument = () => {
    if (!newTitle.trim()) {
      notify('Give the document a title first.', 'warning');
      return;
    }
    const sequence = snapshot.documents.length + 1;
    const prefix =
      newKind === 'Quotation' ? 'QT' : newKind === 'Invoice' ? 'INV' : newKind === 'Purchase order' ? 'PO' : newKind === 'GST return' ? 'GST' : 'DOC';
    const record: DocumentRecord = {
      id: `doc-${Date.now()}`,
      title: newTitle.trim(),
      kind: newKind,
      reference: `${prefix}-2026-${String(sequence).padStart(3, '0')}`,
      party: newParty.trim() || 'Internal',
      updated: `25 Nov · ${timeStamp()}`,
      size: 'Draft',
      version: 'v1',
      status: 'draft',
      owner: 'Karmen Parmar',
      tone: 'violet',
    };
    addDocument(record);
    setGenerateOpen(false);
    setNewTitle('');
    setNewParty('');
    setPreview(record);
  };

  return (
    <div className="space-y-5 xl:space-y-6">
      <PageHeader
        eyebrow="Documents · the paper trail"
        title={
          <>
            Everything signed, in <em>one place.</em>
          </>
        }
        description="Thirteen document kinds, one numbering discipline. Quotations become orders, orders become challans, challans become invoices, and every artefact stays attached to its work."
        meta={
          <>
            <Chip tone="cyan" dot>{snapshot.documents.length} documents</Chip>
            <Chip tone="amber">{snapshot.documents.filter((document) => document.status === 'draft').length} drafts</Chip>
            <Chip tone="neutral">{ALL_KINDS.length} document kinds</Chip>
          </>
        }
        actions={
          <>
            <Button onClick={() => notify('Upload dialog opened for a signed document.', 'info')}>
              <Upload size={14} /> Upload
            </Button>
            <Button variant="primary" onClick={() => setGenerateOpen(true)}>
              <FilePlus2 size={14} /> Generate
            </Button>
          </>
        }
      />

      {/* Connected Intelligence — Files & Recovery references */}
      <ConnectedIntelligenceNode
        referenceNum={1}
        size="compact"
        onAction={(action) => {
          if (action === 'execute-action') {
            notify('Rolling back document version…', 'info');
          }
        }}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: 'Total documents', value: String(snapshot.documents.length), hint: 'Across 13 kinds', tone: 'cyan' as const },
          { label: 'Awaiting signature', value: String(snapshot.documents.filter((document) => document.status === 'sent').length), hint: 'Sent to clients', tone: 'violet' as const },
          { label: 'Filed this cycle', value: String(snapshot.documents.filter((document) => document.status === 'signed' || document.status === 'filed').length), hint: 'Signed or filed with evidence', tone: 'sage' as const },
          { label: 'Drafts', value: String(snapshot.documents.filter((document) => document.status === 'draft').length), hint: 'Need a human review', tone: 'amber' as const },
        ].map((stat) => (
          <Panel key={stat.label} className="k-reveal p-4">
            <div className="flex items-center justify-between">
              <span className="k-label">{stat.label}</span>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: toneVar(stat.tone) }} />
            </div>
            <div className="mt-2.5 k-number-hero text-[24px] text-[var(--k-t1)]">{stat.value}</div>
            <div className="mt-1.5 text-[10px] k-faint">{stat.hint}</div>
          </Panel>
        ))}
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs
          active={tab}
          onChange={(id) => setTab(id as DocTab)}
          items={GROUP_LABELS.map((group) => ({ ...group, count: counts[group.id] }))}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('table')}
            className={cx('p-2 rounded-lg border transition-colors', viewMode === 'table' ? 'bg-[var(--k-cyan)] text-[var(--k-bg)] border-[var(--k-cyan)]' : 'bg-[var(--k-inset)] text-[var(--k-t3)] border-[var(--k-line)] hover:border-[var(--k-line-strong)]')}
            aria-label="Table view"
            aria-pressed={viewMode === 'table'}
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={cx('p-2 rounded-lg border transition-colors', viewMode === 'cards' ? 'bg-[var(--k-cyan)] text-[var(--k-bg)] border-[var(--k-cyan)]' : 'bg-[var(--k-inset)] text-[var(--k-t3)] border-[var(--k-line)] hover:border-[var(--k-line-strong)]')}
            aria-label="Card view"
            aria-pressed={viewMode === 'cards'}
          >
            <LayoutGrid size={16} />
          </button>
        </div>
        <SearchField value={query} onChange={setQuery} placeholder="Search document, party, reference…" className="w-full md:w-[320px]" />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.65fr_1fr]">
        <Panel className="overflow-hidden p-0">
          {viewMode === 'table' ? (
            <div>
              <div className="k-scroll-x">
                <table className="k-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Party</th>
                  <th>Updated</th>
                  <th>Version</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((document) => (
                  <tr key={document.id} className="k-row-clickable" onClick={() => setPreview(document)}>
                    <td>
                      <div className="flex items-start gap-2.5">
                        <span
                          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                          style={{ background: `color-mix(in srgb, ${toneVar(document.tone)} 10%, transparent)`, color: toneVar(document.tone) }}
                        >
                          <FileText size={12} />
                        </span>
                        <div className="min-w-0">
                          <div className="max-w-[240px] truncate text-[11px] font-semibold text-[var(--k-t1)]">{document.title}</div>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[8.5px] k-faint">
                            <span className="k-mono">{document.reference}</span>
                            <span>·</span>
                            <span>{document.kind}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="text-[10px]">{document.party}</td>
                    <td className="whitespace-nowrap text-[9.5px]">
                      {document.updated}
                      <div className="mt-0.5 text-[8px] k-faint">{document.owner}</div>
                    </td>
                    <td>
                      <span className="k-mono rounded border border-[var(--k-line)] bg-[var(--k-inset)] px-1.5 py-0.5 text-[8.5px]">{document.version}</span>
                    </td>
                    <td><StatusChip status={document.status} /></td>
                    <td className="text-right"><ArrowUpRight size={12} className="inline text-[var(--k-t4)]" /></td>
                  </tr>
                ))}
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-[11px] k-faint">No documents match this view.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-[var(--k-line)] px-4 py-3 text-[9.5px] k-faint">
            <span>{filtered.length} documents · {counts[tab]} in this category</span>
            <span className="k-mono">Storage 42% of 50 GB</span>
          </div>
            </div>
) : (
            <div>
              <GlassFolderCards
                folders={filtered
                  .filter(d => ['Folder', 'Work order', 'Measurement book'].includes(d.kind))
                  .map(d => ({
                    id: d.id,
                    name: d.title,
                    count: d.version ? 1 : 0,
                    date: d.updated,
                    doc: d,
                  }))}
                files={filtered
                  .filter(d => !['Folder', 'Work order', 'Measurement book'].includes(d.kind))
                  .map(d => ({
                    id: d.id,
                    name: d.title,
                    size: d.size,
                    date: d.updated,
                    doc: d,
                  }))}
                onFolderOpen={item => setPreview(item.doc as unknown as DocumentRecord)}
                onFileOpen={item => setPreview(item.doc as unknown as DocumentRecord)}
                onFileDownload={item => notify(`${item.doc.title} download started.`, 'success')}
              />
              <div className="flex items-center justify-between border-t border-[var(--k-line)] px-4 py-3 text-[9.5px] k-faint">
                <span>{filtered.length} documents · {counts[tab]} in this category</span>
                <span className="k-mono">Storage 42% of 50 GB</span>
              </div>
            </div>
          )}
        </Panel>

        <div className="space-y-3">
          <Panel className="p-5">
            <SectionHead eyebrow="Kinds" title="The chain of paper." />
            <div className="mt-3 grid grid-cols-1 gap-1.5">
              {ALL_KINDS.map((kind) => {
                const count = snapshot.documents.filter((document) => document.kind === kind).length;
                return (
                  <button
                    key={kind}
                    onClick={() => {
                      setTab(DOC_GROUP[kind]);
                      setQuery('');
                    }}
                    className="flex items-center justify-between rounded-lg border border-[var(--k-line)] bg-[var(--k-inset)] px-2.5 py-1.5 text-left transition-colors hover:border-[var(--k-line-strong)]"
                  >
                    <span className="text-[9.5px] text-[var(--k-t2)]">{kind}</span>
                    <span className="k-mono text-[8.5px] k-faint">{count}</span>
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHead eyebrow="Integrity" title="Every file has a source." />
            <div className="mt-3 space-y-2.5">
              <div className="flex items-center gap-2 text-[10px] k-muted">
                <ShieldCheck size={13} className="shrink-0 text-[var(--k-cyan)]" />
                Signed documents are immutable and hash-stamped.
              </div>
              <div className="flex items-center gap-2 text-[10px] k-muted">
                <CheckCircle2 size={13} className="shrink-0 text-[var(--k-cyan)]" />
                Numbering follows the Zoho Books series.
              </div>
              <div className="flex items-center gap-2 text-[10px] k-muted">
                <FolderOpen size={13} className="shrink-0 text-[var(--k-violet)]" />
                Filed documents are retained for 8 years.
              </div>
            </div>
            <Button className="mt-4 w-full" size="sm" onClick={() => notify('Document audit log exported.', 'info')}>
              Audit log <ArrowUpRight size={11} />
            </Button>
          </Panel>
        </div>
      </div>

      {/* Preview */}
      <Modal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        title={preview?.title ?? 'Document'}
        eyebrow={preview ? `${preview.kind} · ${preview.reference}` : ''}
        side
        width={620}
      >
        {preview ? (
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl border border-[var(--k-line)] bg-[var(--k-bg-3)] p-5">
              <div className="pointer-events-none absolute right-[-20px] top-[42%] -rotate-[24deg] text-[36px] font-black uppercase tracking-[0.2em] opacity-[0.055]">
                {preview.status}
              </div>
              <div className="flex items-start justify-between border-b border-[var(--k-line)] pb-4">
                <div>
                  <div className="text-[15px] font-extrabold tracking-[-0.03em] text-[var(--k-t1)]">KARM ENTERPRISES</div>
                  <div className="mt-1 text-[8.5px] k-faint">Kolar Quarry · Sehore, Madhya Pradesh · GSTIN 23AAGCK9921D1Z4</div>
                </div>
                <div className="text-right">
                  <div className="k-mono text-[8px] uppercase tracking-[0.14em] k-faint">{preview.kind}</div>
                  <div className="mt-1 k-mono text-[9px] font-semibold text-[var(--k-t1)]">{preview.reference}</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="k-eyebrow !text-[8px]">issued to</div>
                <div className="mt-1 text-[12px] font-semibold text-[var(--k-t1)]">{preview.party}</div>
              </div>
              <div className="mt-4 h-px bg-[var(--k-line)]" />
              <div className="mt-4 space-y-2">
                {[
                  ['Document', preview.title],
                  ['Kind', preview.kind],
                  ['Version', preview.version],
                  ['Owner', preview.owner],
                  ['Last updated', preview.updated],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-4 text-[10px]">
                    <span className="k-faint">{label}</span>
                    <span className="text-right font-medium text-[var(--k-t1)]">{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-dashed border-[var(--k-line-strong)] p-3 text-center">
                <div className="text-[9px] k-faint">Original PDF preview · generated from the workspace record</div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[8px] k-faint">
                <span>KARM · RTA OS 2.4</span>
                <span className="k-mono">page 1 of 1</span>
              </div>
            </div>

            <div>
              <div className="k-rule mb-1">record</div>
              <DrawerRow label="Status"><StatusChip status={preview.status} /></DrawerRow>
              <DrawerRow label="Size">{preview.size}</DrawerRow>
              <DrawerRow label="Owner">{preview.owner}</DrawerRow>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => notify(`${preview.reference} download started.`, 'success')}>
                <Download size={13} /> Download PDF
              </Button>
              <Button onClick={() => notify(`${preview.reference} sent for signature.`, 'info')}>
                <Send size={13} /> Send for signature
              </Button>
              <Button variant="ghost" onClick={() => { setPreview(null); setGenerateOpen(true); }}>
                <Plus size={13} /> Duplicate
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Generate */}
      <Modal
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        title="Generate a document"
        eyebrow="New record · numbered on create"
        width={520}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="doc-kind" className="mb-1.5 block text-[10.5px] font-semibold text-[var(--k-t2)]">Document kind</label>
            <select
              id="doc-kind"
              value={newKind}
              onChange={(event) => setNewKind(event.target.value as DocumentKind)}
              className="k-input !bg-[var(--k-panel-solid)]"
            >
              {ALL_KINDS.map((kind) => <option key={kind} value={kind}>{kind}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="doc-title" className="mb-1.5 block text-[10.5px] font-semibold text-[var(--k-t2)]">Title</label>
            <input
              id="doc-title"
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="e.g. M-sand trial supply · December"
              className="k-input"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="doc-party" className="mb-1.5 block text-[10.5px] font-semibold text-[var(--k-t2)]">Party</label>
            <input
              id="doc-party"
              value={newParty}
              onChange={(event) => setNewParty(event.target.value)}
              placeholder="Client, vendor or authority"
              className="k-input"
            />
          </div>
          <div className="rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] p-3 text-[9.5px] leading-relaxed k-faint">
            A draft is created locally. Numbering and tax fields are validated again in Zoho Books before the document is
            sent. Nothing is posted automatically.
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setGenerateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={createDocument}>
              <FilePlus2 size={13} /> Create draft
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentsScreen;
