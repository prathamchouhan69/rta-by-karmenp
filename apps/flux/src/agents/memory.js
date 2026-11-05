import { newId } from '../util/ids.js';
import { redactText } from '../util/redact.js';
// Conversation memory the user controls. It refuses anything that looks like PAN, Aadhaar, bank or card data.
export class Memory {
  constructor(store, audit) { this.col = store.collection('memory'); this.audit = audit; }
  add(text, actor) {
    const t = String(text || '').trim(); if (!t || t.length > 500) throw Object.assign(new Error('Memory must be 1 to 500 characters'), { status: 422, code: 'BAD_MEMORY' });
    if (redactText(t).found.length) throw Object.assign(new Error('That looks like a PAN, Aadhaar, bank, card or password detail. Flux does not store those.'), { status: 422, code: 'SENSITIVE' });
    const m = { id: newId('mem'), text: t, by: actor.id, at: new Date().toISOString() }; this.col.put(m.id, m); this.audit.append({ actor: actor.id, action: 'memory.added', data: { id: m.id } }); return m;
  }
  list() { return this.col.all().sort((a, b) => b.at.localeCompare(a.at)); }
  remove(id, actor) { const ok = this.col.del(id); if (ok) this.audit.append({ actor: actor.id, action: 'memory.removed', data: { id } }); return ok; }
}
