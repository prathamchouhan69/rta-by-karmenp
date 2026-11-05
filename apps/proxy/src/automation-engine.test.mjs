import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createHash, randomUUID } from 'node:crypto';
import { nextDailyRunAt, runDueAutomations, validateAutomationInput } from './automation-engine.mjs';

const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

describe('bounded daily automations', () => {
  it('validates daily task schedules and rejects unsupported action input', () => {
    assert.equal(validateAutomationInput({ title: 'Review overdue invoices', owner: 'Owner', scheduleTime: '09:15' }).ok, true);
    assert.equal(validateAutomationInput({ title: 'Do anything', owner: 'Owner', scheduleTime: '25:15' }).ok, false);
    assert.equal(validateAutomationInput({ title: 'Do anything', owner: '', scheduleTime: '09:15' }).ok, false);
  });

  it('calculates the next daily run in India time', () => {
    const before = new Date('2026-11-04T02:00:00.000Z');
    const next = new Date(nextDailyRunAt('09:00', before));
    assert.equal(next.toISOString(), '2026-11-04T03:30:00.000Z');
    const after = new Date('2026-11-04T04:00:00.000Z');
    assert.equal(new Date(nextDailyRunAt('09:00', after)).toISOString(), '2026-11-05T03:30:00.000Z');
  });

  it('creates one internal task for a due automation and records the next run', async () => {
    const now = new Date('2026-11-04T04:00:00.000Z');
    const automation = {
      automation_id: 'auto-1',
      title: 'Review weekly goals',
      description: 'Check the goal pace and record verified actuals.',
      owner: 'Workspace owner',
      scheduleTime: '09:00',
      enabled: true,
      nextRunAt: '2026-11-04T03:30:00.000Z',
    };
    const state = { automations: [automation], tasks: [], keys: new Map(), audit: [] };
    const store = {
      requestFingerprint: hash,
      async list(entity) { return { [entity]: state[entity] }; },
      async getIdempotency(key) { return state.keys.get(key) ?? null; },
      async reserveIdempotency(key, request) {
        const existing = state.keys.get(key);
        if (existing) return { ...existing, created: false };
        const value = { fingerprint: hash(request), status: 'pending', created: true };
        state.keys.set(key, value);
        return value;
      },
      async create(entity, body) {
        const record = { ...body, task_id: randomUUID() };
        state[entity].unshift(record);
        return record;
      },
      async update(entity, id, patch) {
        const record = state[entity].find((item) => item.automation_id === id);
        if (!record) return null;
        Object.assign(record, patch);
        return record;
      },
      async recordAudit(entry) { state.audit.unshift(entry); },
      async saveIdempotency(key, request, response) {
        state.keys.set(key, { fingerprint: hash(request), status: 'complete', response });
      },
    };

    const first = await runDueAutomations(store, now);
    const repeated = await runDueAutomations(store, now);
    assert.equal(first.length, 1);
    assert.equal(repeated.length, 0);
    assert.equal(state.tasks.length, 1);
    assert.equal(state.tasks[0].sourceType, 'automation');
    assert.equal(state.tasks[0].automationRunKey, 'automation:auto-1:2026-11-04T03:30:00.000Z');
    assert.equal(state.automations[0].nextRunAt, '2026-11-05T03:30:00.000Z');
    assert.equal(state.audit.length, 1);
  });
});
