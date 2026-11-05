import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createPostgresStore } from './postgres-store.mjs';

class FakePool {
  queries = [];
  reservations = new Map();
  loginLimits = new Map();
  closed = false;

  async query(sql, values = []) {
    this.queries.push({ sql, values });
    if (sql.includes('INSERT INTO karm_idempotency')) {
      if (this.reservations.has(values[0])) return { rows: [], rowCount: 0 };
      const reservation = { fingerprint: values[1], status: 'pending', response: null };
      this.reservations.set(values[0], reservation);
      return { rows: [reservation], rowCount: 1 };
    }
    if (sql.includes('SELECT fingerprint, status, response FROM karm_idempotency')) {
      const reservation = this.reservations.get(values[0]);
      return { rows: reservation ? [reservation] : [], rowCount: reservation ? 1 : 0 };
    }
    if (sql.includes('UPDATE karm_idempotency')) {
      const reservation = this.reservations.get(values[0]);
      if (reservation) {
        Object.assign(reservation, { fingerprint: values[1], status: 'complete', response: JSON.parse(values[2]) });
      }
      return { rows: [], rowCount: reservation ? 1 : 0 };
    }
    if (sql.includes('INSERT INTO karm_login_limits')) {
      const attempts = this.loginLimits.get(values[0]) ?? 0;
      if (attempts >= values[2]) return { rows: [], rowCount: 0 };
      this.loginLimits.set(values[0], attempts + 1);
      return { rows: [{ attempt_count: attempts + 1 }], rowCount: 1 };
    }
    if (sql.includes('DELETE FROM karm_login_limits WHERE client_key')) {
      this.loginLimits.delete(values[0]);
      return { rows: [], rowCount: 1 };
    }
    if (sql.includes('DELETE FROM karm_login_limits')) {
      return { rows: [], rowCount: 0 };
    }
    if (sql.includes('SELECT body FROM karm_practice_records')) {
      return { rows: [{ body: { invoice_id: 'inv-1', total: '12.00' } }], rowCount: 1 };
    }
    if (sql.includes('INSERT INTO karm_audit')) return { rows: [{ audit_order: '1' }], rowCount: 1 };
    if (sql.includes('SELECT body FROM karm_audit')) return { rows: [{ body: { action: 'create' } }], rowCount: 1 };
    return { rows: [], rowCount: 1 };
  }

  async end() {
    this.closed = true;
  }
}

describe('PostgreSQL store', () => {
  it('initializes storage, reserves idempotency keys atomically, and persists results', async () => {
    const pool = new FakePool();
    const store = await createPostgresStore('postgresql://localhost/karm', { invoices: [] }, pool);

    assert.equal(pool.queries.filter(({ sql }) => sql.includes('CREATE TABLE IF NOT EXISTS')).length, 4);
    assert.equal(await store.health(), true);
    assert.deepEqual((await store.list('invoices')).invoices, [{ invoice_id: 'inv-1', total: '12.00' }]);
    await store.list('invoices', {
      search_text: 'INV_100%',
      status: 'open',
      date_start: '2026-01-01',
      date_end: '2026-12-31',
      sort_column: 'date',
      sort_order: 'asc',
      page: 2,
      per_page: 10,
    });
    const listQuery = pool.queries.findLast(({ sql }) => sql.includes('SELECT body FROM karm_practice_records'));
    assert.match(listQuery.sql, /ILIKE .* ESCAPE/);
    assert.match(listQuery.sql, /body->>'status'/);
    assert.deepEqual(listQuery.values, ['invoices', 'open', '2026-01-01', '2026-12-31', '%INV\\_100\\%%', 'date', 11, 10]);

    for (let attempt = 0; attempt < 8; attempt += 1) {
      assert.equal(await store.beginLoginAttempt('client-a', { maxAttempts: 8, windowMs: 60_000 }), true);
    }
    assert.equal(await store.beginLoginAttempt('client-a', { maxAttempts: 8, windowMs: 60_000 }), false);
    assert.equal(await store.beginLoginAttempt('client-b', { maxAttempts: 8, windowMs: 60_000 }), true);
    await store.clearLoginAttempts('client-a');
    assert.equal(await store.beginLoginAttempt('client-a', { maxAttempts: 8, windowMs: 60_000 }), true);

    const first = await store.reserveIdempotency('create:invoices:key-1', { customer_id: 'c1' });
    const retry = await store.reserveIdempotency('create:invoices:key-1', { customer_id: 'c1' });
    assert.equal(first.created, true);
    assert.equal(retry.created, false);
    assert.equal(retry.fingerprint, first.fingerprint);

    const response = { status: 201, body: { ok: true, data: { invoice_id: 'inv-1' } } };
    await store.saveIdempotency('create:invoices:key-1', { customer_id: 'c1' }, response);
    assert.deepEqual(await store.getIdempotency('create:invoices:key-1'), {
      fingerprint: first.fingerprint,
      status: 'complete',
      response,
    });

    await store.recordAudit({ action: 'create', resource: 'invoices' });
    assert.deepEqual(await store.listAudit(), [{ action: 'create' }]);
    await store.close();
    assert.equal(pool.closed, true);
  });
});
