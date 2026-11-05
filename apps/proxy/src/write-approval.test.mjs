import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createWriteApprovalToken, isValidWriteApproval } from './write-approval.mjs';

describe('write approval tokens', () => {
  it('binds confirmation to an exact operation and request fingerprint until expiry', () => {
    const token = createWriteApprovalToken('test-secret', 'create:invoices', 'request-fingerprint', 'invoice-write-1', 5000);
    assert.equal(isValidWriteApproval('test-secret', token, 'create:invoices', 'request-fingerprint', 'invoice-write-1', 4999), true);
    assert.equal(isValidWriteApproval('test-secret', token, 'create:invoices', 'different-request', 'invoice-write-1', 4999), false);
    assert.equal(isValidWriteApproval('test-secret', token, 'create:invoices', 'request-fingerprint', 'invoice-write-2', 4999), false);
    assert.equal(isValidWriteApproval('test-secret', token, 'email:invoices:1', 'request-fingerprint', 'invoice-write-1', 4999), false);
    assert.equal(isValidWriteApproval('test-secret', token, 'create:invoices', 'request-fingerprint', 'invoice-write-1', 5000), false);
    assert.equal(isValidWriteApproval('other-secret', token, 'create:invoices', 'request-fingerprint', 'invoice-write-1', 4999), false);
  });
});
