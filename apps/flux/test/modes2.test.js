import test from 'node:test';
import assert from 'node:assert/strict';
import { economyBrief, priceTrendSummary } from '../src/economy/mode.js';
import { opportunityAlerts, trendRadar } from '../src/opportunities/radar.js';
import { localInsights } from '../src/intelligence/local.js';
import { evaluateBusinessRules, evaluateHealthRules } from '../src/automations/engine.js';
import { structureMeeting } from '../src/meeting/assistant.js';

test('economy brief: labels every entry and never invents a figure', () => {
  const r = economyBrief({ events: [
    { event: 'Steel price', whatHappened: 'TMT rose 4%', source: 'supplier', confidence: 'medium' },
    { event: 'Unknown feed', whatHappened: 'A headline', source: '', confidence: 'high' },
  ] });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.events.length, 2);
  assert.strictEqual(r.events[0].confidence, 'medium');
  assert.strictEqual(r.events[1].confidence, 'uncertain');
  assert.ok(r.limitations.length > 0);
  assert.ok(r.disclaimer.includes('not personalised investment advice'));
});

test('economy price trend: computes from caller rows only', () => {
  const r = priceTrendSummary([
    { material: 'Cement', price: 380, date: '2026-10-01' },
    { material: 'Cement', price: 400, date: '2026-11-01' },
    { material: 'Cement', price: 410, date: '2026-11-05' },
  ]);
  assert.strictEqual(r.summary.length, 1);
  assert.strictEqual(r.summary[0].trend, 'rising');
  assert.strictEqual(r.summary[0].observations, 3);
  assert.ok(r.limitations[0].includes('caller-supplied'));
});

test('opportunity radar: passes through caller alerts and marks unknown confidence', () => {
  const r = opportunityAlerts({ alerts: [{ whatHappened: 'Tender X', confidence: 'high' }, { whatHappened: 'Rumour', confidence: 'high' }] });
  assert.strictEqual(r.alerts.length, 2);
  assert.strictEqual(r.alerts[1].confidence, 'uncertain');
  assert.strictEqual(r.alerts[0].approvalRequired, true);
});

test('trend radar: validates structure', () => {
  const r = trendRadar({ trends: [{ trend: 'AI adoption', whatChanged: 'More automation', confidence: 'medium' }] });
  assert.strictEqual(r.trends.length, 1);
  assert.strictEqual(r.trends[0].timeHorizon, 'unknown');
});

test('local insights: accepts the five known areas and rejects others', () => {
  const r = localInsights({ insights: [
    { area: 'Mandideep', whatHappened: 'New factory', confidence: 'medium' },
    { area: 'Mars', whatHappened: 'No', confidence: 'high' },
  ] });
  assert.strictEqual(r.insights[0].area, 'Mandideep');
  assert.strictEqual(r.insights[1].area, 'uncertain');
});

test('business automations: overdue invoice, low margin and price rise', () => {
  const r = evaluateBusinessRules({
    invoices: [{ id: 'i1', number: 'INV-1', customerName: 'Sharma', dueDate: '2026-10-01', balance: '50000' }],
    projects: [{ id: 'p1', name: 'Shed A', marginPercent: 6 }],
    materialPrices: [{ material: 'Steel', location: 'Bhopal', unit: 'MT', currentPrice: 62000, priceChangePercent: 12, confidence: 'medium' }],
    marginThreshold: 10, priceRiseThreshold: 5, asOf: '2026-11-06',
  });
  assert.ok(r.proposals.some((p) => p.kind === 'reminder.payment'));
  assert.ok(r.proposals.some((p) => p.kind === 'alert.margin'));
  assert.ok(r.proposals.some((p) => p.kind === 'procurement.review'));
  assert.ok(r.proposals.every((p) => p.gate));
});

test('health automations: hydration, medicine and sleep reminders', () => {
  const r = evaluateHealthRules({
    profile: { weightKg: 70, medicines: ['Tablet A'] },
    vitals: [{ type: 'hydration', value: 1500 }, { type: 'sleep', value: 5.5 }],
    asOf: '2026-11-06',
  });
  assert.ok(r.reminders.some((x) => x.kind === 'reminder.hydration'));
  assert.ok(r.reminders.some((x) => x.kind === 'reminder.medicine'));
  assert.ok(r.reminders.some((x) => x.kind === 'reminder.sleep'));
  assert.ok(r.disclaimer.includes('not medical advice'));
});

test('meeting assistant: extracts actions, decisions and dates', () => {
  const r = structureMeeting({
    text: '2026-11-04\n- Action: order steel by Friday\n- Decision: use supplier B\nAttendees: Rta, Karm',
    title: 'Weekly ops',
    owner: 'rta',
    due: '2026-11-10',
  });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.date, '2026-11-04');
  assert.ok(r.actionItems.length >= 1);
  assert.ok(r.decisions.some((d) => /supplier B/i.test(d)));
  assert.ok(r.disclaimer.includes('Flux does not know your team'));
});