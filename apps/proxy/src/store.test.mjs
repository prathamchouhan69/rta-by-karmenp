import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore } from './store.mjs';

const directory = await mkdtemp(join(tmpdir(), 'karm-store-test-'));

after(async () => {
  await rm(directory, { recursive: true, force: true });
});

describe('practice store durability', () => {
  it('persists in-flight idempotency reservations across restarts', async () => {
    const request = { customer_id: 'customer-1', line_items: [{ item_id: 'item-1' }] };
    const first = await createStore(directory);
    const reservation = await first.reserveIdempotency('create:invoices:retry-key', request);
    assert.equal(reservation.created, true);
    assert.equal(reservation.status, 'pending');

    const restarted = await createStore(directory);
    const recovered = await restarted.reserveIdempotency('create:invoices:retry-key', request);
    assert.equal(recovered.created, false);
    assert.equal(recovered.status, 'pending');
    assert.equal(recovered.fingerprint, first.requestFingerprint(request));
  });
});
