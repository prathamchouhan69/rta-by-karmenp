import test from 'node:test';
import assert from 'node:assert/strict';
import { AGING_BUCKETS, countAgingBuckets } from './receivables-aging.ts';

test('counts overdue items at each non-overlapping bucket boundary', () => {
  const items = [0, 30, 31, 60, 61, 90, 91, 120].map((daysOverdue) => ({
    text: `${daysOverdue} days overdue`,
    daysOverdue,
  }));

  assert.deepEqual(countAgingBuckets(items), [
    { label: '0–30 days', count: 2 },
    { label: '31–60 days', count: 2 },
    { label: '61–90 days', count: 2 },
    { label: '90+ days', count: 2 },
  ]);
});

test('returns zero-count buckets for empty or unverified rows', () => {
  assert.deepEqual(countAgingBuckets([]), AGING_BUCKETS.map(({ label }) => ({ label, count: 0 })));
  assert.deepEqual(countAgingBuckets([
    { text: 'Missing age' },
    { text: 'Invalid age', daysOverdue: -1 },
    { text: 'Fractional age', daysOverdue: 1.5 },
  ]), AGING_BUCKETS.map(({ label }) => ({ label, count: 0 })));
});
