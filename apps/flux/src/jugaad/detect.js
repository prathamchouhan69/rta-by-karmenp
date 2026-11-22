// Jugaad Category Detection

import { ORDER, PLAYBOOKS } from './playbooks.js';

export function detectCategory(problem) {
  const text = String(problem || '').toLowerCase();
  for (const key of ORDER) {
    const p = PLAYBOOKS[key];
    if (p.keywords.some((k) => text.includes(k))) return key;
  }
  return 'generic';
}

export function getCategoryConfidence(problem) {
  const text = String(problem || '').toLowerCase();
  const scores = {};
  for (const key of ORDER) {
    const p = PLAYBOOKS[key];
    let score = 0;
    for (const k of p.keywords) {
      if (text.includes(k)) score += 1;
    }
    if (score > 0) scores[key] = score;
  }
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (!sorted.length) return { category: 'generic', confidence: 'low', alternatives: [] };
  const total = sorted.reduce((sum, [, s]) => sum + s, 0);
  const best = sorted[0];
  const confidence = best[1] / total;
  let confLabel = 'low';
  if (confidence > 0.7) confLabel = 'high';
  else if (confidence > 0.4) confLabel = 'medium';
  return {
    category: best[0],
    confidence: confLabel,
    score: best[1],
    totalScore: total,
    alternatives: sorted.slice(1, 4).map(([cat, score]) => ({ category: cat, score, confidence: score / total })),
  };
}