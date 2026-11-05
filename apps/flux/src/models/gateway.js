export class ProviderError extends Error {
  constructor(message, { status = 0, retryable = false } = {}) { super(message); this.status = status; this.retryable = retryable; this.code = 'PROVIDER_ERROR'; }
}
// One adapter for any OpenAI-compatible chat endpoint (OpenRouter and OmniRoute both are). Keys stay on the server.
export class Gateway {
  constructor({ name, base, key = '', fetchFn = fetch, timeoutMs = 60000 }) { Object.assign(this, { name, base: String(base || '').replace(/\/$/, ''), key, fetchFn, timeoutMs }); }
  get enabled() { return !!this.base && (this.name !== 'openrouter' || !!this.key); }
  async #call(path, init) {
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), this.timeoutMs);
    try { return await this.fetchFn(`${this.base}${path}`, { ...init, signal: ctl.signal, headers: { 'content-type': 'application/json', ...(this.key ? { Authorization: `Bearer ${this.key}` } : {}), ...(init.headers || {}) } }); }
    catch (e) { throw new ProviderError(e.name === 'AbortError' ? 'Model timed out' : 'Could not reach the model gateway', { retryable: true }); }
    finally { clearTimeout(timer); }
  }
  async listModels() {
    const res = await this.#call('/models', { method: 'GET' });
    if (!res.ok) throw new ProviderError(`Model list failed (${res.status})`, { status: res.status, retryable: res.status >= 500 });
    return res.json();
  }
  async chat({ model, messages, temperature = 0.2, maxTokens = 1500, json = false }) {
    const body = { model, messages, temperature, max_tokens: maxTokens, ...(json ? { response_format: { type: 'json_object' } } : {}) };
    const t0 = Date.now(); const res = await this.#call('/chat/completions', { method: 'POST', body: JSON.stringify(body) });
    let data = null; try { data = await res.json(); } catch { /* handled below */ }
    if (!res.ok || data?.error) {
      const st = res.status || data?.error?.code || 0;
      throw new ProviderError(String(data?.error?.message || `Model error ${st}`).slice(0, 160), { status: Number(st) || 0, retryable: st === 429 || st >= 500 || st === 408 });
    }
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) throw new ProviderError('Model returned an empty answer', { retryable: true });
    return { text, model: data.model || model, usage: data.usage || null, latencyMs: Date.now() - t0 };
  }
}
