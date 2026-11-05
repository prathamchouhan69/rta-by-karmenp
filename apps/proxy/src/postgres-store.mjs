import { createHash, randomUUID } from 'node:crypto';
import { Pool } from 'pg';

const idKeys = { taxes: 'tax_id' };
const fingerprint = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export async function createPostgresStore(databaseUrl, seed, injectedPool) {
  const pool = injectedPool ?? new Pool({
    connectionString: databaseUrl,
    max: 10,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
    statement_timeout: 30_000,
  });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS karm_practice_records (
        entity text NOT NULL,
        record_id text NOT NULL,
        record_order bigserial NOT NULL,
        body jsonb NOT NULL,
        PRIMARY KEY (entity, record_id)
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS karm_practice_records_order_idx
      ON karm_practice_records (entity, record_order DESC)
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS karm_idempotency (
        idempotency_key text PRIMARY KEY,
        fingerprint text NOT NULL,
        status text NOT NULL CHECK (status IN ('pending', 'complete')),
        response jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CHECK ((status = 'pending' AND response IS NULL) OR (status = 'complete' AND response IS NOT NULL))
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS karm_audit (
        audit_order bigserial PRIMARY KEY,
        audit_id uuid NOT NULL UNIQUE,
        time timestamptz NOT NULL,
        body jsonb NOT NULL
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS karm_login_limits (
        client_key text PRIMARY KEY,
        window_started_at timestamptz NOT NULL,
        attempt_count integer NOT NULL CHECK (attempt_count > 0)
      )
    `);
    await pool.query('SELECT 1');
    for (const [entity, records] of Object.entries(seed)) {
      const idKey = idKeys[entity] ?? `${entity.slice(0, -1)}_id`;
      for (const record of [...records].reverse()) {
        await pool.query(
          'INSERT INTO karm_practice_records (entity, record_id, body) VALUES ($1, $2, $3::jsonb) ON CONFLICT (entity, record_id) DO NOTHING',
          [entity, String(record[idKey] ?? record.id), JSON.stringify(record)],
        );
      }
    }
  } catch (error) {
    await pool.end().catch(() => {});
    throw new Error(`Could not initialize PostgreSQL storage: ${error.message}`);
  }

  return {
    async health() {
      await pool.query('SELECT 1');
      return true;
    },
    async beginLoginAttempt(clientKey, { maxAttempts, windowMs }) {
      const result = await pool.query(
        `INSERT INTO karm_login_limits (client_key, window_started_at, attempt_count)
         VALUES ($1, now(), 1)
         ON CONFLICT (client_key) DO UPDATE SET
           window_started_at = CASE
             WHEN karm_login_limits.window_started_at <= now() - ($2 * interval '1 millisecond') THEN now()
             ELSE karm_login_limits.window_started_at
           END,
           attempt_count = CASE
             WHEN karm_login_limits.window_started_at <= now() - ($2 * interval '1 millisecond') THEN 1
             ELSE karm_login_limits.attempt_count + 1
           END
         WHERE karm_login_limits.window_started_at <= now() - ($2 * interval '1 millisecond')
            OR karm_login_limits.attempt_count < $3
         RETURNING attempt_count`,
        [clientKey, windowMs, maxAttempts],
      );
      return result.rows.length === 1;
    },
    async clearLoginAttempts(clientKey) {
      await pool.query('DELETE FROM karm_login_limits WHERE client_key = $1', [clientKey]);
    },
    async pruneLoginAttempts(maxAgeMs) {
      await pool.query(
        "DELETE FROM karm_login_limits WHERE window_started_at <= now() - ($1 * interval '1 millisecond')",
        [maxAgeMs],
      );
    },
    async list(entity, query = {}) {
      const values = [entity];
      const predicates = ['entity = $1'];
      const exactFields = ['contact_type', 'status', 'customer_id', 'vendor_id', 'invoice_id', 'account_id', 'item_id', 'tax_id'];
      for (const field of exactFields) {
        if (!query[field]) continue;
        values.push(query[field]);
        predicates.push(`body->>'${field}' = $${values.length}`);
      }
      if (query.date_start) {
        values.push(query.date_start);
        predicates.push(`body->>'date' >= $${values.length}`);
      }
      if (query.date_end) {
        values.push(query.date_end);
        predicates.push(`body->>'date' <= $${values.length}`);
      }
      if (query.search_text) {
        const escaped = query.search_text.replace(/[\\%_]/g, '\\$&');
        values.push(`%${escaped}%`);
        predicates.push(`body::text ILIKE $${values.length} ESCAPE E'\\\\'`);
      }
      const page = Math.max(1, Number(query.page) || 1);
      const perPage = Math.min(200, Math.max(1, Number(query.per_page) || 200));
      const start = (page - 1) * perPage;
      const sortOrder = query.sort_order?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
      const sortColumn = query.sort_column;
      const orderBy = sortColumn
        ? `body->>$${values.push(sortColumn)} ${sortOrder}, record_order DESC`
        : 'record_order DESC';
      values.push(perPage + 1, start);
      const result = await pool.query(
        `SELECT body FROM karm_practice_records
         WHERE ${predicates.join(' AND ')}
         ORDER BY ${orderBy}
         LIMIT $${values.length - 1} OFFSET $${values.length}`,
        values,
      );
      const hasMore = result.rows.length > perPage;
      return {
        [entity]: result.rows.slice(0, perPage).map(({ body }) => body),
        page_context: { page, per_page: perPage, has_more_page: hasMore },
      };
    },
    async get(entity, id) {
      const idKey = idKeys[entity] ?? `${entity.slice(0, -1)}_id`;
      const result = await pool.query(
        'SELECT body FROM karm_practice_records WHERE entity = $1 AND record_id = $2',
        [entity, id],
      );
      return result.rows[0]?.body ?? null;
    },
    async create(entity, body) {
      const id = randomUUID();
      const idKey = idKeys[entity] ?? `${entity.slice(0, -1)}_id`;
      const record = { ...body, [idKey]: id, status: body.status ?? 'draft' };
      await pool.query(
        'INSERT INTO karm_practice_records (entity, record_id, body) VALUES ($1, $2, $3::jsonb)',
        [entity, id, JSON.stringify(record)],
      );
      return record;
    },
    async update(entity, id, body) {
      const idKey = idKeys[entity] ?? `${entity.slice(0, -1)}_id`;
      const patch = { ...body, [idKey]: id };
      const result = await pool.query(
        'UPDATE karm_practice_records SET body = body || $3::jsonb WHERE entity = $1 AND record_id = $2 RETURNING body',
        [entity, id, JSON.stringify(patch)],
      );
      return result.rows[0]?.body ?? null;
    },
    async getIdempotency(key) {
      const result = await pool.query(
        'SELECT fingerprint, status, response FROM karm_idempotency WHERE idempotency_key = $1',
        [key],
      );
      return result.rows[0] ?? null;
    },
    async reserveIdempotency(key, request) {
      const requestFingerprint = await fingerprint(request);
      const inserted = await pool.query(
        `INSERT INTO karm_idempotency (idempotency_key, fingerprint, status)
         VALUES ($1, $2, 'pending')
         ON CONFLICT (idempotency_key) DO NOTHING
         RETURNING fingerprint, status, response`,
        [key, requestFingerprint],
      );
      if (inserted.rows[0]) return { ...inserted.rows[0], created: true };
      const existing = await this.getIdempotency(key);
      if (!existing) throw new Error('Could not read the reserved idempotency key');
      return { ...existing, created: false };
    },
    async saveIdempotency(key, request, response) {
      const requestFingerprint = await fingerprint(request);
      const result = await pool.query(
        `UPDATE karm_idempotency
         SET fingerprint = $2, status = 'complete', response = $3::jsonb, updated_at = now()
         WHERE idempotency_key = $1`,
        [key, requestFingerprint, JSON.stringify(response)],
      );
      if (result.rowCount !== 1) throw new Error('Could not persist the idempotency response');
    },
    async recordAudit(entry) {
      const record = { ...entry, audit_id: randomUUID(), time: new Date().toISOString() };
      const result = await pool.query(
        'INSERT INTO karm_audit (audit_id, time, body) VALUES ($1, $2, $3::jsonb) RETURNING audit_order',
        [record.audit_id, record.time, JSON.stringify(record)],
      );
      if (Number(result.rows[0]?.audit_order) % 100 === 0) {
        await pool.query(`
          DELETE FROM karm_audit
          WHERE audit_order NOT IN (
            SELECT audit_order FROM karm_audit ORDER BY audit_order DESC LIMIT 10000
          )
        `);
      }
    },
    async listAudit(limit = 100) {
      const safeLimit = Math.min(500, Math.max(1, Number(limit) || 100));
      const result = await pool.query(
        'SELECT body FROM karm_audit ORDER BY audit_order DESC LIMIT $1',
        [safeLimit],
      );
      return result.rows.map(({ body }) => body);
    },
    requestFingerprint: fingerprint,
    close: () => pool.end(),
  };
}
