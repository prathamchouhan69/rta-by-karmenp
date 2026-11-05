import { istDate } from '../util/time.js';
// Daily usage, errors, latency, fallbacks and blocks, per model. Also enforces the optional free-request cap
// while holding a reserve back so the 8:00 AM briefing can always run.
export class Usage {
  constructor(store, now = () => new Date()) { this.col = store.collection('usage'); this.now = now; }
  #day() { const d = istDate(this.now()); return this.col.get(d) || { date: d, models: {} }; }
  record(key, ev) {
    const day = this.#day(); const m = (day.models[key] ??= { requests: 0, errors: 0, fallbacks: 0, blocked: 0, latencyMs: 0, ok: 0 });
    if (ev.request) m.requests++; if (ev.error) m.errors++; if (ev.fallback) m.fallbacks++; if (ev.blocked) m.blocked++;
    if (ev.latencyMs) { m.latencyMs += ev.latencyMs; m.ok++; }
    this.col.put(day.date, day);
  }
  today() { return this.#day(); }
  avgLatency(key) { const m = this.#day().models[key]; return m && m.ok ? Math.round(m.latencyMs / m.ok) : null; }
  freeRequestsToday(isFree) { return Object.entries(this.#day().models).filter(([k]) => isFree(k)).reduce((s, [, v]) => s + v.requests, 0); }
  canSpendFree({ cap, reserve, purpose, isFree }) {
    if (cap == null) return { ok: true };
    const used = this.freeRequestsToday(isFree); const limit = purpose === 'briefing' ? cap : cap - reserve;
    return used < limit ? { ok: true, used, limit } : { ok: false, used, limit, reason: purpose === 'briefing' ? 'Daily free-model cap reached' : `Free-model requests are held back (${used} of ${cap} used; the last ${reserve} are kept for the morning briefing)` };
  }
}
