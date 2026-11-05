import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Small durable key-value store: one JSON file per collection, written atomically (temp file, then rename).
// With no directory it keeps everything in memory, which is what the tests use.
export class Store {
  constructor(dir = null) {
    this.dir = dir; this.cols = new Map();
    if (dir) mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
  collection(name) {
    if (!/^[a-z0-9_]+$/.test(name)) throw new Error('Invalid collection name');
    if (!this.cols.has(name)) this.cols.set(name, new Collection(this.dir, name));
    return this.cols.get(name);
  }
}

class Collection {
  constructor(dir, name) {
    this.file = dir ? join(dir, `${name}.json`) : null; this.data = new Map();
    if (this.file && existsSync(this.file)) {
      const obj = JSON.parse(readFileSync(this.file, 'utf8'));
      this.data = new Map(Object.entries(obj));
    }
  }
  get(id) { const v = this.data.get(id); return v === undefined ? null : structuredClone(v); }
  put(id, value) { this.data.set(id, structuredClone(value)); this.#flush(); return value; }
  del(id) { const had = this.data.delete(id); if (had) this.#flush(); return had; }
  all() { return [...this.data.values()].map((v) => structuredClone(v)); }
  entries() { return [...this.data.entries()].map(([k, v]) => [k, structuredClone(v)]); }
  find(fn) { return this.all().filter(fn); }
  get size() { return this.data.size; }
  #flush() {
    if (!this.file) return;
    const tmp = `${this.file}.${process.pid}.tmp`;
    writeFileSync(tmp, JSON.stringify(Object.fromEntries(this.data)), { mode: 0o600 });
    renameSync(tmp, this.file);
  }
}
