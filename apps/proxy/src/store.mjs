import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const seed = {
  contacts: [
    { contact_id: 'c1', contact_name: 'Dilip Buildcon Ltd', contact_type: 'customer', outstanding: '64944.84', outstanding_formatted: '₹64,944.84' },
    { contact_id: 'c2', contact_name: 'Apex Infra', contact_type: 'customer', outstanding: '18400.00', outstanding_formatted: '₹18,400.00' },
    { contact_id: 'c3', contact_name: 'Narmada Projects', contact_type: 'customer', outstanding: '9080.00', outstanding_formatted: '₹9,080.00' }
  ],
  items: [
    { item_id: 'i1', name: 'Stone dust', hsn_or_sac: '2517', rate: '950.00', rate_formatted: '₹950.00' },
    { item_id: 'i2', name: 'River sand', hsn_or_sac: '2505', rate: '1250.00', rate_formatted: '₹1,250.00' }
  ],
  taxes: [
    { tax_id: 'gst18', tax_name: 'GST 18%', tax_percentage: '18.000' },
    { tax_id: 'gst5', tax_name: 'GST 5%', tax_percentage: '5.000' }
  ],
  invoices: [
    { invoice_id: 'inv-golden', invoice_number: 'INV-KE-270031', customer_name: 'Dilip Buildcon Ltd', total: '64944.84', total_formatted: '₹64,944.84', balance: '64944.84', balance_formatted: '₹64,944.84', status: 'overdue' }
  ]
};

const blankState = () => ({ version: 1, records: structuredClone(seed), idempotency: {}, audit: [] });
const fingerprint = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const idKeys = { taxes: 'tax_id' };

export async function createStore(directory, databaseUrl, { seedPracticeData = true } = {}) {
  if (databaseUrl) {
    const { createPostgresStore } = await import('./postgres-store.mjs');
    return createPostgresStore(databaseUrl, seedPracticeData ? seed : {});
  }

  const file = join(directory, 'karm-proxy.json');
  await mkdir(dirname(file), { recursive: true, mode: 0o700 });
  let state;
  try {
    state = JSON.parse(await readFile(file, 'utf8'));
    if (state.version !== 1 || typeof state.records !== 'object' || typeof state.idempotency !== 'object' || !Array.isArray(state.audit)) {
      throw new Error('Unsupported or invalid practice-store format');
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw new Error(`Could not load practice store: ${error.message}`);
    state = blankState();
  }

  let pendingWrite = Promise.resolve();
  const persist = () => {
    const snapshot = JSON.stringify(state);
    const operation = pendingWrite.then(async () => {
      const temporary = `${file}.${randomUUID()}.tmp`;
      try {
        await writeFile(temporary, snapshot, { mode: 0o600, flag: 'wx' });
        await rename(temporary, file);
      } catch (error) {
        await unlink(temporary).catch(() => {});
        throw error;
      }
    });
    pendingWrite = operation.catch(() => {});
    return operation;
  };

  return {
    async list(entity, query = {}) {
      const entries = state.records[entity] ?? [];
      const needle = query.search_text?.toLowerCase();
      const filtered = entries.filter((entry) => {
        if (query.contact_type && entry.contact_type !== query.contact_type) return false;
        if (!needle) return true;
        return JSON.stringify(entry).toLowerCase().includes(needle);
      });
      const page = Math.max(1, Number(query.page) || 1);
      const perPage = Math.min(200, Math.max(1, Number(query.per_page) || 200));
      const start = (page - 1) * perPage;
      return { [entity]: filtered.slice(start, start + perPage), page_context: { page, per_page: perPage, has_more_page: start + perPage < filtered.length } };
    },
    async get(entity, id) {
      const idKey = idKeys[entity] ?? `${entity.slice(0, -1)}_id`;
      return (state.records[entity] ?? []).find((entry) => String(entry[idKey] ?? entry.id) === id) ?? null;
    },
    async create(entity, body) {
      const id = randomUUID();
      const idKey = idKeys[entity] ?? `${entity.slice(0, -1)}_id`;
      const record = { ...body, [idKey]: id, status: body.status ?? 'draft' };
      state.records[entity] ??= [];
      state.records[entity].unshift(record);
      await persist();
      return record;
    },
    async update(entity, id, body) {
      const entries = state.records[entity] ?? [];
      const idKey = idKeys[entity] ?? `${entity.slice(0, -1)}_id`;
      const index = entries.findIndex((entry) => String(entry[idKey] ?? entry.id) === id);
      if (index < 0) return null;
      entries[index] = { ...entries[index], ...body, [idKey]: id };
      await persist();
      return entries[index];
    },
    async getIdempotency(key) {
      return state.idempotency[key] ?? null;
    },
    async reserveIdempotency(key, request) {
      if (state.idempotency[key]) return { ...state.idempotency[key], created: false };
      state.idempotency[key] = { fingerprint: fingerprint(request), status: 'pending', response: null };
      await persist();
      return { ...state.idempotency[key], created: true };
    },
    async saveIdempotency(key, request, response) {
      state.idempotency[key] = { fingerprint: fingerprint(request), status: 'complete', response };
      await persist();
    },
    async recordAudit(entry) {
      state.audit.unshift({ ...entry, audit_id: randomUUID(), time: new Date().toISOString() });
      state.audit.length = Math.min(state.audit.length, 10000);
      await persist();
    },
    async listAudit(limit = 100) {
      return state.audit.slice(0, Math.min(500, Math.max(1, limit)));
    },
    requestFingerprint: fingerprint
  };
}
