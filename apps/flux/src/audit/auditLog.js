import { appendFileSync, closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, writeSync } from 'node:fs';
import { dirname } from 'node:path';
import { canonical, hmac, safeEqual } from '../util/json.js';
import { redactDeep } from '../util/redact.js';

const GENESIS = '0'.repeat(64);

// Append-only, hash-chained and keyed: each entry's MAC covers the previous MAC, so editing, deleting or
// reordering any row breaks every later row. The key is a server secret, so an attacker who can edit the
// file cannot recompute a valid chain.
export class AuditLog {
  constructor({ key, file = null, now = () => new Date() }) {
    if (!key || key.length < 32) throw new Error('Audit key must be at least 32 characters');
    this.key = key; this.file = file; this.now = now; this.rows = []; this.last = GENESIS;
    if (file) {
      mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
      if (existsSync(file)) for (const line of readFileSync(file, 'utf8').split('\n')) if (line.trim()) {
        try { const r = JSON.parse(line); this.rows.push(r); this.last = r.mac; } catch { this.rows.push({ corrupt: true }); }
      }
    }
  }
  append({ actor, action, data = {} }) {
    const body = { seq: this.rows.length + 1, ts: this.now().toISOString(), actor: actor || 'system', action, data: redactDeep(data) };
    const row = { ...body, prev: this.last, mac: hmac(this.key, this.last + canonical(body)) };
    if (this.file) {
      const fd = openSync(this.file, 'a', 0o600);
      try { writeSync(fd, JSON.stringify(row) + '\n'); fsyncSync(fd); } finally { closeSync(fd); }
    }
    this.rows.push(row); this.last = row.mac;
    return row;
  }
  verify() {
    let prev = GENESIS;
    for (let i = 0; i < this.rows.length; i++) {
      const r = this.rows[i];
      if (r.corrupt) return { ok: false, count: this.rows.length, brokenAt: i + 1, reason: 'unreadable row' };
      const { prev: p, mac, ...body } = r;
      if (p !== prev || body.seq !== i + 1 || !safeEqual(mac, hmac(this.key, prev + canonical(body)))) return { ok: false, count: this.rows.length, brokenAt: i + 1, reason: 'chain broken' };
      prev = mac;
    }
    return { ok: true, count: this.rows.length };
  }
  list({ limit = 50, before = Infinity } = {}) { return this.rows.filter((r) => r.seq < before).slice(-limit).reverse(); }
}
