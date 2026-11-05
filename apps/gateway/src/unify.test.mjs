import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildHealth, measurementAnswer, mergeBriefing, normalizeFluxAnswer, parseIstStamp } from './unify.mjs';

const proxyBriefing = {
  generatedAt: '2026-11-04T00:00:00.000Z',
  timezone: 'Asia/Kolkata',
  mode: 'mock',
  sources: [
    { name: 'Practice records', records: 2, scope: 'Invoices' },
    { name: 'KARM goals', records: 1, scope: 'Goals' },
    { name: 'KARM tasks', records: 1, scope: 'Tasks' },
  ],
  counts: { invoices: 2, overdueInvoices: 1, goals: 1, openTasks: 1 },
  attention: [
    { kind: 'overdue_invoice', title: 'Review overdue invoice', detail: 'Practice invoice', source: 'Practice records', action: 'Review' },
    { kind: 'goal_attention', title: 'Review goal pace', detail: 'Grow margin', source: 'KARM goal record', action: 'Review the goal plan' },
  ],
  goalStatuses: [{ goal_id: 'g1', title: 'Grow margin', status: 'at_risk', progressPercent: 40, risks: ['Margin slipping'] }],
  tasks: [{ task_id: 't1', title: 'Call customer', owner: 'Owner', status: 'open' }],
  health: { score: 1, riskLevel: 'critical', summary: '', nextBestAction: '', nextBestActions: [] },
};

const fluxBriefing = {
  date: '2026-11-04',
  generatedAt: '2026-11-04 08:05 IST',
  headline: '1 overdue invoice needs follow-up',
  status: 'new',
  unverified: ['Customer updates'],
  sections: [
    { id: 'overdue', title: 'Overdue invoices and collections', status: 'Verified', reason: '', items: [
      { text: 'INV-1 · Sharma · due 2026-10-05 · 30 days overdue · balance ₹10.00', evidence: 'zoho:invoice:INV-1', daysOverdue: 30 },
    ] },
    { id: 'overdue', title: 'duplicate section ignored by id lookup', status: 'Verified', reason: '', items: [] },
    { id: 'suppliers', title: 'Supplier and purchase alerts', status: 'Partial', reason: 'Bank balance is not connected.', items: [
      { text: 'Bill B-1 · Vendor · due 2026-11-10 · balance ₹5.00', evidence: 'zoho:bill:B-1' },
    ] },
    { id: 'customers', title: 'Customer updates', status: 'Could not verify', reason: 'No CRM source.', items: [] },
  ],
};

describe('gateway briefing merge', () => {
  it('parses Flux IST stamps as ISO instants', () => {
    assert.equal(parseIstStamp('2026-11-04 08:05 IST'), '2026-11-04T02:35:00.000Z');
    assert.equal(parseIstStamp('not a date', new Date('2026-01-01T00:00:00Z')), '2026-01-01T00:00:00.000Z');
  });

  it('keeps Flux Zoho sections and proxy goals/tasks without duplicate overdue rows', () => {
    const merged = mergeBriefing({ proxy: proxyBriefing, flux: fluxBriefing, modelConfigured: true });
    assert.equal(merged.mode, 'live');
    assert.equal(merged.counts.overdueInvoices, 1);
    assert.equal(merged.goalStatuses.length, 1);
    assert.equal(merged.tasks.length, 1);
    assert.equal(merged.attention.filter((item) => item.kind === 'overdue_invoice').length, 1);
    assert.ok(merged.attention.some((item) => item.kind === 'goal_attention'));
    assert.ok(merged.attention.some((item) => item.kind === 'flux_suppliers'));
    assert.equal(merged.engine.name, 'flux');
    assert.deepEqual(merged.unverified, ['Customer updates']);
    assert.ok(merged.health.score < 100);
  });

  it('falls back to the proxy briefing when Flux has no sections', () => {
    const merged = mergeBriefing({ proxy: proxyBriefing, flux: null });
    assert.equal(merged.engine.name, 'karm-proxy');
    assert.equal(merged.engine.degraded, true);
    assert.equal(merged.counts.overdueInvoices, 1);
  });

  it('computes a bounded health profile', () => {
    const health = buildHealth({ counts: { overdueInvoices: 5, openTasks: 9 }, goalStatuses: [{ status: 'behind' }], sources: [] });
    assert.ok(health.score >= 0 && health.score <= 100);
    assert.ok(['low', 'medium', 'high', 'critical'].includes(health.riskLevel));
    assert.equal(health.nextBestActions.length, 3);
  });
});

describe('gateway Flux answer normalization', () => {
  it('normalizes a verified Flux answer and exposes evidence', () => {
    const answer = normalizeFluxAnswer({
      answer: 'Two invoices are overdue.',
      evidence: [{ id: 'E1', source: 'zoho:invoice:INV-1', label: 'Selected invoice' }],
      warnings: [],
      unsupportedNumbers: [],
      verification: { done: true, unsupported: [] },
      model: 'openrouter/free-model',
      auditId: 7,
    }, { context: { page: 'accounting' } });
    assert.equal(answer.confidence, 'high');
    assert.equal(answer.dataSources[0].recordId, 'INV-1');
    assert.match(answer.scope, /accounting/);
    assert.equal(answer.auditId, 7);
  });

  it('marks unsupported statements and removes empty answers', () => {
    const answer = normalizeFluxAnswer({
      answer: 'The total is ₹10.',
      evidence: [],
      warnings: ['Verification skipped'],
      unsupportedNumbers: [10],
      verification: { done: true, unsupported: ['The total is ₹10.'] },
      model: 'm',
    });
    assert.equal(answer.confidence, 'low');
    assert.ok(answer.limitations.length >= 2);
    assert.equal(normalizeFluxAnswer({ answer: '   ' }), null);
  });

  it('returns deterministic measurement answers', () => {
    const answer = measurementAnswer({
      supported: true,
      explanation: '20 MT = 20,000 kg',
      confidence: 'high',
    });
    assert.equal(answer.source, 'Flux Measurement Engine');
    assert.equal(answer.engine.deterministic, true);
    assert.equal(answer.measurement.converted, undefined);
  });
});
