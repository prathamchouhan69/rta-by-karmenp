// Sliding-window limiter, in memory (one server process). Stale keys are pruned as it goes.
export class RateLimiter {
  constructor(now = () => Date.now()) { this.now = now; this.hits = new Map(); }
  hit(key, limit, windowMs) {
    const t = this.now(); const cut = t - windowMs;
    const arr = (this.hits.get(key) || []).filter((x) => x > cut);
    if (arr.length >= limit) { this.hits.set(key, arr); return { ok: false, retryAfterSec: Math.max(1, Math.ceil((arr[0] + windowMs - t) / 1000)) }; }
    arr.push(t); this.hits.set(key, arr);
    if (this.hits.size > 5000) for (const [k, v] of this.hits) if (!v.some((x) => x > cut)) this.hits.delete(k);
    return { ok: true };
  }
  reset(key) { this.hits.delete(key); }
}
