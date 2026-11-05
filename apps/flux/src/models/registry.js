// The registry is data, not code: models are discovered from the gateways or pinned by the owner. No model
// identifier is written into the program, so nothing is permanently hard-coded.
export const ROLES = ['reasoning', 'structured', 'fast', 'research', 'vision', 'judge'];
export const keyOf = (provider, id) => `${provider}::${id}`;
const BASE = (id) => String(id).split(':')[0];
export { BASE as baseId };

export class ModelRegistry {
  constructor(store) { this.models = store.collection('models'); this.pins = store.collection('model_pins'); this.scores = store.collection('model_scores'); this.trust = store.collection('provider_trust'); this.health = new Map(); }

  upsert(m) {
    const key = keyOf(m.provider, m.id); const old = this.models.get(key) || {};
    const entry = { trustTier: 'T3', costClass: 'unknown', inputModalities: ['text'], params: [], contextLength: 0, ...old, ...m, key, lastSeen: new Date().toISOString() };
    this.models.put(key, entry); return entry;
  }
  /** Maps an OpenRouter-style listing ({data:[{id,pricing,context_length,architecture,supported_parameters,expiration_date}]}). */
  syncOpenRouterList(list) {
    let n = 0;
    for (const m of list?.data || []) {
      if (!m?.id) continue;
      const p = m.pricing || {}; const free = Number(p.prompt) === 0 && Number(p.completion) === 0 && p.prompt !== undefined && p.completion !== undefined;
      const mods = m.architecture?.input_modalities || ['text'];
      if (!(m.architecture?.output_modalities || ['text']).includes('text')) continue;
      this.upsert({ provider: 'openrouter', id: m.id, costClass: free ? 'free' : p.prompt === undefined ? 'unknown' : 'paid', contextLength: Number(m.context_length) || 0, inputModalities: mods, params: m.supported_parameters || [], priceIn: p.prompt ?? null, priceOut: p.completion ?? null, expiresAt: m.expiration_date || null }); n++;
    }
    return n;
  }
  syncOpenAiList(provider, list, costClass = 'unknown') { let n = 0; for (const m of list?.data || []) if (m?.id) { this.upsert({ provider, id: m.id, costClass: this.models.get(keyOf(provider, m.id))?.costClass ?? costClass }); n++; } return n; }
  get(key) { return this.models.get(key); }
  all() { return this.models.all(); }
  patch(key, patch) { const m = this.models.get(key); if (!m) throw new Error('Unknown model'); const allowed = ['costClass', 'trustTier', 'expiresAt']; for (const k of Object.keys(patch)) if (!allowed.includes(k)) throw new Error(`Cannot change ${k}`); return this.models.put(key, { ...m, ...patch }); }
  providerTrust(provider) { return this.trust.get(provider)?.tier || 'T3'; }
  setProviderTrust(provider, tier) { if (!['T1', 'T2', 'T3'].includes(tier)) throw new Error('Tier must be T1, T2 or T3'); this.trust.put(provider, { tier }); }
  setPin(role, { primary, fallbacks = [] }) {
    if (!ROLES.includes(role)) throw new Error('Unknown role');
    for (const k of [primary, ...fallbacks].filter(Boolean)) if (!this.models.get(k)) throw new Error(`Model not in registry: ${k}`);
    this.pins.put(role, { primary: primary || null, fallbacks }); return this.pins.get(role);
  }
  clearPin(role) { this.pins.del(role); }
  setScore(key, role, score) { const s = this.scores.get(key) || {}; s[role] = score; this.scores.put(key, s); }
  markFail(key, now) { const h = this.health.get(key) || { fails: 0, until: 0 }; h.fails++; if (h.fails >= 3) h.until = now + 5 * 60000; this.health.set(key, h); }
  markOk(key) { this.health.delete(key); }

  #fits(m, role) {
    const has = (...xs) => xs.some((x) => m.params.includes(x));
    if (role === 'vision') return m.inputModalities.includes('image');
    if (role === 'research') return false; // web-aware models are chosen by the owner (pin), never guessed
    if (role === 'structured') return has('response_format', 'structured_outputs');
    if (role === 'reasoning' || role === 'judge') return has('reasoning', 'include_reasoning');
    return true;
  }
  /** Ordered candidates: owner pins first, then auto-ranked. Never crosses cost policy, trust tier or modality. */
  candidates(role, { policy = 'free-only', paidApproved = false, privacy = 'D2', enabledProviders, now = Date.now(), avgLatency = () => null } = {}) {
    const ok = (m) => m && enabledProviders.includes(m.provider) && (!m.expiresAt || Date.parse(m.expiresAt) > now) && !((this.health.get(m.key) || {}).until > now)
      && (m.costClass === 'free' || (policy === 'paid-per-use' && paidApproved && m.costClass === 'paid'))
      && (privacy !== 'D2' || ['T1', 'T2'].includes(this.providerTrust(m.provider)) && this.providerTrust(m.provider) !== 'T3');
    const pin = this.pins.get(role); const pinned = pin ? [pin.primary, ...pin.fallbacks].filter(Boolean).map((k) => this.models.get(k)).filter(ok) : [];
    let pool = this.all().filter((m) => ok(m) && this.#fits(m, role));
    if (!pool.length && ['reasoning', 'structured', 'judge'].includes(role)) pool = this.all().filter((m) => ok(m) && this.#fits(m, 'fast')); // general models, output is validated by the caller
    const score = (m) => (this.scores.get(m.key) || {})[role] || 0;
    pool.sort((a, b) => score(b) - score(a) || (a.costClass === 'free' ? 0 : 1) - (b.costClass === 'free' ? 0 : 1) || (avgLatency(a.key) ?? 1e9) - (avgLatency(b.key) ?? 1e9) || b.contextLength - a.contextLength || a.key.localeCompare(b.key));
    const seen = new Set(); return [...pinned, ...pool].filter((m) => !seen.has(m.key) && seen.add(m.key));
  }
}
