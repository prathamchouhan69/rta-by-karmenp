import { newId } from '../util/ids.js';
import { istDate, addDays } from '../util/time.js';
import { validateGstin } from '../checks/gstin.js';
import { guardNumbers } from '../checks/numberGuard.js';
import { DOC_TYPES } from '../zoho/writer.js';

const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const digits = (s) => String(s ?? '').replace(/,/g, '');
const EXTRACT = `You turn one business instruction into JSON. Reply with JSON only:
{"customerName": string|null, "date": "YYYY-MM-DD"|null, "paymentTermsDays": string|null, "delivery": string|null, "notes": string|null,
 "items": [{"name": string, "quantity": string|null, "unit": string|null, "rate": string|null, "discount": string|null, "gstRatePercent": string|null}],
 "missing": [string]}
Rules: copy every number exactly as the person wrote it, as text. Never calculate totals, tax or discounts. Never guess a missing value: use null and list it in "missing".`;

export class DocumentEngine {
  constructor({ router, reader, hsn, approvals, writer = null, store, audit, now = () => new Date() }) { Object.assign(this, { router, reader, hsn, approvals, writer, audit, now }); this.docs = store.collection('documents'); this.texts = store.collection('text_docs'); }

  async draftFromText(instruction, actor, { docType = 'invoice' } = {}) {
    if (!DOC_TYPES[docType]) throw Object.assign(new Error(`Document type must be one of ${Object.keys(DOC_TYPES).join(', ')}`), { status: 422, code: 'BAD_TYPE' });
    const r = await this.router.runJson({ role: 'structured', purpose: 'document', actor: actor.id, privacy: 'D2', messages: [{ role: 'system', content: EXTRACT }, { role: 'user', content: String(instruction).slice(0, 4000) }] },
      (o) => (Array.isArray(o.items) && o.items.length ? null : 'items must be a non-empty list'));
    const f = r.data; const warnings = []; const text = digits(instruction);
    const keep = (v, label) => { if (v == null || v === '') return null; const s = digits(String(v)).trim(); if (!/\d/.test(s) || text.includes(s)) return s; warnings.push(`${label} "${v}" is not in your instruction, so it was removed`); return null; };
    const items = f.items.map((i) => ({ name: String(i.name || '').trim(), quantity: keep(i.quantity, 'Quantity'), unit: i.unit || null, rate: keep(i.rate, 'Rate'), discount: keep(i.discount, 'Discount'), statedGstRate: keep(i.gstRatePercent, 'GST rate') }));
    const draft = { id: newId('doc'), docType, status: 'draft', createdBy: actor.id, createdAt: this.now().toISOString(), fields: { customerName: f.customerName || null, date: f.date || istDate(this.now()), paymentTermsDays: keep(f.paymentTermsDays, 'Payment terms'), delivery: f.delivery || null, notes: f.notes || null }, items, warnings, version: 1, versions: [] };
    await this.#enrich(draft); this.docs.put(draft.id, draft);
    this.audit.append({ actor: actor.id, action: 'document.drafted', data: { id: draft.id, docType, model: r.model, blockers: draft.blockers.length } });
    return this.view(draft);
  }

  async #enrich(d) {
    d.customer = { status: 'missing' };
    if (d.fields.customerName) {
      try {
        const found = await this.reader.listContacts({ search: d.fields.customerName }); const want = norm(d.fields.customerName);
        const exact = found.find((c) => norm(c.contact_name) === want);
        if (exact) { d.customer = { status: 'matched', id: exact.contact_id, name: exact.contact_name, gstin: exact.gst_no || null, outstanding: exact.outstanding_receivable_amount ?? null, gstinCheck: exact.gst_no ? validateGstin(exact.gst_no) : null }; }
        else d.customer = { status: found.length ? 'ambiguous' : 'not_found', candidates: found.slice(0, 5).map((c) => ({ id: c.contact_id, name: c.contact_name })) };
      } catch (e) { d.customer = { status: 'error', message: e.message }; }
    }
    for (const it of d.items) {
      it.hsn = await this.hsn.resolve(it.name, { statedRate: it.statedGstRate, date: d.fields.date });
      try { const z = (await this.reader.listItems({ search: it.name })).find((x) => norm(x.name) === norm(it.name)); it.zohoItemId = z?.item_id || null; } catch { it.zohoItemId = null; }
    }
    d.blockers = this.#blockers(d);
    d.status = d.blockers.length ? 'needs_input' : 'ready';
  }
  #blockers(d) {
    const b = [];
    if (d.customer.status !== 'matched') b.push({ code: 'CUSTOMER', message: d.customer.status === 'not_found' ? 'Customer not found in Zoho Books. Create it in Zoho Books first, or correct the name.' : d.customer.status === 'ambiguous' ? 'More than one possible customer. Pick one.' : 'Customer is missing' });
    if (d.customer.gstinCheck && !d.customer.gstinCheck.valid) b.push({ code: 'GSTIN', message: `Customer GSTIN looks wrong: ${d.customer.gstinCheck.reasons.join('; ')}` });
    d.items.forEach((it, i) => {
      if (!it.quantity) b.push({ code: 'QUANTITY', line: i + 1, message: `Line ${i + 1} (${it.name}): quantity is missing` });
      if (!it.rate) b.push({ code: 'RATE', line: i + 1, message: `Line ${i + 1} (${it.name}): rate is missing` });
      if (it.hsn.status !== 'Confirmed by owner') b.push({ code: 'HSN', line: i + 1, message: `Line ${i + 1} (${it.name}): HSN/SAC is "${it.hsn.status}". Confirm the code and GST rate before this can go to Zoho Books.` });
      for (const w of it.hsn.warnings) if (['RATE_MISMATCH', 'NOT_YET_IN_FORCE'].includes(w.code)) b.push({ code: w.code, line: i + 1, message: `Line ${i + 1}: ${w.message}` });
    });
    return b;
  }
  view(d) { return { ...d, preview: { totals: 'Total will be calculated by Zoho Books', lines: d.items.map((i) => ({ item: i.name, quantity: i.quantity, unit: i.unit, rate: i.rate, discount: i.discount, hsn: i.hsn.code, hsnStatus: i.hsn.status, gstRate: i.hsn.gstRate })), customer: d.customer.name || d.fields.customerName } }; }
  get(id) { const d = this.docs.get(id); return d ? this.view(d) : null; }
  list() { return this.docs.all().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(({ id, docType, status, version, createdAt, fields, zoho }) => ({ id, docType, status, version, createdAt, customer: fields.customerName, zoho })); }

  /** Edit a draft. Every edit is a new version; the old one is kept so it can be restored. */
  async update(id, patch, actor) {
    const d = this.docs.get(id); if (!d) throw Object.assign(new Error('Document not found'), { status: 404, code: 'NOT_FOUND' });
    if (d.status === 'proposed' || d.status === 'created') throw Object.assign(new Error('This draft is already with approvals or created in Zoho Books. Make a new draft.'), { status: 409, code: 'LOCKED' });
    d.versions.push({ version: d.version, at: this.now().toISOString(), by: actor.id, fields: d.fields, items: d.items }); d.version++;
    if (patch.fields) d.fields = { ...d.fields, ...Object.fromEntries(Object.entries(patch.fields).filter(([k]) => ['customerName', 'date', 'paymentTermsDays', 'delivery', 'notes'].includes(k))) };
    if (Array.isArray(patch.items)) d.items = patch.items.map((i) => ({ name: String(i.name || '').trim(), quantity: i.quantity == null ? null : String(i.quantity), unit: i.unit || null, rate: i.rate == null ? null : String(i.rate), discount: i.discount == null ? null : String(i.discount), statedGstRate: i.statedGstRate == null ? null : String(i.statedGstRate) }));
    await this.#enrich(d); this.docs.put(id, d); this.audit.append({ actor: actor.id, action: 'document.edited', data: { id, version: d.version } }); return this.view(d);
  }
  async revert(id, version, actor) {
    const d = this.docs.get(id); const v = d?.versions.find((x) => x.version === version); if (!v) throw Object.assign(new Error('Version not found'), { status: 404, code: 'NOT_FOUND' });
    return this.update(id, { fields: v.fields, items: v.items }, actor);
  }

  propose(id, actor) {
    const d = this.docs.get(id); if (!d) throw Object.assign(new Error('Document not found'), { status: 404, code: 'NOT_FOUND' });
    if (d.blockers.length) throw Object.assign(new Error('This draft still has open items'), { status: 422, code: 'BLOCKED', extra: { blockers: d.blockers } });
    const t = DOC_TYPES[d.docType];
    const payload = { [t.party]: d.customer.id, date: d.fields.date, ...(d.fields.paymentTermsDays ? { payment_terms: Number(d.fields.paymentTermsDays), payment_terms_label: `Net ${d.fields.paymentTermsDays}` } : {}), ...(d.fields.delivery ? { notes: `Delivery: ${d.fields.delivery}` } : {}),
      line_items: d.items.map((i) => ({ ...(i.zohoItemId ? { item_id: i.zohoItemId } : { name: i.name }), quantity: i.quantity, rate: i.rate, ...(i.unit ? { unit: i.unit } : {}), hsn_or_sac: i.hsn.code, ...(i.discount ? { discount: i.discount } : {}) })) };
    const p = this.approvals.create({ kind: `zoho.${d.docType}.draft`, gate: 'G2', payload, summary: `Create ${t.label} draft in Zoho Books for ${d.customer.name} (${d.items.length} line${d.items.length > 1 ? 's' : ''}). Totals will be calculated by Zoho Books.`, actor });
    d.status = 'proposed'; d.proposalId = p.id; this.docs.put(id, d); return p;
  }

  /** Runs after approval. The token is checked and burned inside approvals.consume. */
  async execute(proposalId, token, actor) {
    const pr = this.approvals.get(proposalId); if (!pr) throw Object.assign(new Error('Proposal not found'), { status: 404, code: 'NOT_FOUND' });
    if (!this.writer) throw Object.assign(new Error('Zoho Books writes are switched off on this server. Nothing was created and your approval was not used.'), { status: 403, code: 'WRITE_DISABLED' });
    const docType = pr.kind.split('.')[1]; const p = this.approvals.consume(token, { kind: pr.kind, gate: 'G2' });
    try {
      const r = await this.writer.createDraft(docType, p.payload);
      const result = { id: r.id, number: r.number, status: r.status, total: r.total, unexpectedStatus: r.unexpectedStatus };
      this.approvals.complete(p.id, result, actor.id);
      const d = this.docs.find((x) => x.proposalId === p.id)[0]; if (d) { d.status = 'created'; d.zoho = result; this.docs.put(d.id, d); }
      if (r.unexpectedStatus) this.audit.append({ actor: 'system', action: 'alert.unexpected_zoho_status', data: { proposalId: p.id, status: r.status } });
      return { ...result, note: 'Created as a draft in Zoho Books. Totals shown are Zoho Books figures.' };
    } catch (e) { this.approvals.fail(p.id, e.message, actor.id); throw e; }
  }

  /** Text documents (reminders, emails, reports...). Saved as drafts; nothing is ever sent from here. */
  async writeText({ kind, instruction, facts = '', actor }) {
    const KINDS = ['payment_reminder', 'quotation_followup', 'vendor_enquiry', 'proposal', 'meeting_notes', 'task_list', 'weekly_report', 'work_order', 'site_instruction', 'progress_report', 'material_requisition'];
    if (!KINDS.includes(kind)) throw Object.assign(new Error(`kind must be one of ${KINDS.join(', ')}`), { status: 422, code: 'BAD_KIND' });
    const r = await this.router.run({ role: 'fast', purpose: 'document', actor: actor.id, privacy: 'D2', maxTokens: 1200, messages: [{ role: 'system', content: `Draft a ${kind.replace(/_/g, ' ')} for an Indian construction-materials business. Plain, polite language. Use only the facts given. Do not invent names, amounts, dates or quantities: where a fact is missing write [to be filled in]. UK English.` }, { role: 'user', content: `Instruction: ${instruction}\n\nFacts you may use:\n${facts}` }] });
    const g = guardNumbers(r.text, [instruction, facts]);
    const doc = { id: newId('txt'), kind, createdBy: actor.id, createdAt: this.now().toISOString(), body: g.answer, unsupportedNumbers: g.unsupported, model: r.model, notice: 'DRAFT. Not sent. Review before using.', versions: [] };
    this.texts.put(doc.id, doc); this.audit.append({ actor: actor.id, action: 'document.text_drafted', data: { id: doc.id, kind, model: r.model } }); return doc;
  }
}
