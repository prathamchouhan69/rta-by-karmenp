import { redactText } from '../util/redact.js';
import { ProviderError } from './gateway.js';

export class RouterError extends Error { constructor(code, message, extra) { super(message); this.code = code; this.status = code === 'COST_GUARD' ? 402 : 503; this.extra = extra; } }

export class ModelRouter {
  constructor({ registry, gateways, usage, guard, audit, config, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), now = () => Date.now() }) { Object.assign(this, { registry, gateways, usage, guard, audit, config, sleep, now }); }
  get enabledProviders() { return Object.entries(this.gateways).filter(([, g]) => g.enabled).map(([n]) => n); }

  async sync() {
    const out = {};
    for (const [name, g] of Object.entries(this.gateways)) {
      if (!g.enabled) { out[name] = 'disabled'; continue; }
      try { const list = await g.listModels(); out[name] = name === 'openrouter' ? this.registry.syncOpenRouterList(list) : this.registry.syncOpenAiList(name, list); }
      catch (e) { out[name] = `failed: ${e.message}`; }
    }
    this.audit.append({ actor: 'system', action: 'models.sync', data: out }); return out;
  }

  async run({ role, messages, purpose = 'chat', json = false, maxTokens = 1500, paidApproved = false, actor = 'system', privacy = 'D2', temperature = 0.2 }) {
    const policy = this.config.costPolicy;
    const clean = messages.map((m) => ({ ...m, content: redactText(m.content).text })); // D3 never leaves the server
    const redactions = [...new Set(messages.flatMap((m) => redactText(m.content).found))];
    const cands = this.registry.candidates(role, { policy, paidApproved, privacy, enabledProviders: this.enabledProviders, now: this.now(), avgLatency: (k) => this.usage.avgLatency(k) });
    if (!cands.length) {
      const why = privacy === 'D2' && !this.enabledProviders.some((p) => ['T1', 'T2'].includes(this.registry.providerTrust(p))) ? 'No provider is marked as vetted (T1 or T2) for customer data. Review a provider\'s terms, then mark it vetted.' : `No ${policy === 'free-only' ? 'free ' : ''}model is available for the "${role}" role. Sync models or pin one.`;
      throw new RouterError('NO_MODEL', why, { role, policy, privacy });
    }
    const isFree = (k) => this.registry.get(k)?.costClass === 'free';
    const attempts = [];
    for (let i = 0; i < cands.length; i++) {
      const m = cands[i]; const g = this.gateways[m.provider];
      const pre = this.guard.allowBefore(m, { policy, paidApproved }); if (!pre.ok) { attempts.push({ model: m.id, skipped: pre.reason }); continue; }
      if (m.costClass === 'free') { const q = this.usage.canSpendFree({ cap: this.config.freeDailyCap, reserve: this.config.briefingReserve, purpose, isFree }); if (!q.ok) throw new RouterError('QUOTA', q.reason, q); }
      for (let attempt = 0; attempt < 2; attempt++) {
        this.usage.record(m.key, { request: true });
        try {
          const r = await g.chat({ model: m.id, messages: clean, json, maxTokens, temperature });
          const post = this.guard.checkActual(m, r.model, { policy, paidApproved });
          if (!post.ok) { // output is discarded, never returned
            this.usage.record(m.key, { blocked: true });
            this.audit.append({ actor, action: 'cost.blocked', data: { requested: m.id, answeredBy: r.model, reason: post.reason } });
            attempts.push({ model: m.id, blocked: post.reason }); break;
          }
          this.registry.markOk(m.key); this.usage.record(m.key, { latencyMs: r.latencyMs, fallback: i > 0 });
          return { text: r.text, usage: r.usage, latencyMs: r.latencyMs, attempts, redactions, model: { id: r.model, requested: m.id, provider: m.provider, costClass: m.costClass, role }, fallbackUsed: i > 0, substituted: !!post.substituted };
        } catch (e) {
          this.usage.record(m.key, { error: true }); attempts.push({ model: m.id, error: e.message, status: e.status });
          if (e instanceof ProviderError && e.retryable && attempt === 0) { await this.sleep(400 + Math.floor(Math.random() * 200)); continue; }
          this.registry.markFail(m.key, this.now()); break;
        }
      }
    }
    const blocked = attempts.find((a) => a.blocked);
    throw new RouterError(blocked ? 'COST_GUARD' : 'ALL_FAILED', blocked ? `Blocked: ${blocked.blocked}` : 'Every available model failed. Nothing was answered.', { attempts });
  }

  /** Asks for JSON, validates it, and gives the model one chance to repair a bad reply. */
  async runJson(opts, validate) {
    let last;
    for (let i = 0; i < 2; i++) {
      const messages = i === 0 ? opts.messages : [...opts.messages, { role: 'assistant', content: last.text.slice(0, 2000) }, { role: 'user', content: `That reply was not valid: ${last.problem}. Reply again with only the corrected JSON object.` }];
      const r = await this.run({ ...opts, messages, json: true });
      const parsed = parseJson(r.text); const problem = parsed === null ? 'it was not a JSON object' : validate(parsed);
      if (!problem) return { ...r, data: parsed };
      last = { text: r.text, problem };
    }
    throw new RouterError('BAD_OUTPUT', `The model did not return a usable answer (${last.problem}).`);
  }
}
export function parseJson(text) {
  const t = String(text).replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
  try { const v = JSON.parse(t); return v && typeof v === 'object' ? v : null; } catch { /* try to find an object inside */ }
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a >= 0 && b > a) try { return JSON.parse(t.slice(a, b + 1)); } catch { return null; }
  return null;
}
