// Jugaad Advisor - Advise Functions

import { PLAYBOOKS, ORDER, DISCLAIMER } from './playbooks.js';
import { getCategoryConfidence } from './detect.js';

export function advise({ problem, category = null, budget = null, timeAvailable = null, constraints = [], urgency = 'normal' } = {}) {
  const text = String(problem || '').trim();
  if (!text) throw Object.assign(new Error('Describe the problem in one or two sentences.'), { status: 422, code: 'BAD_PROBLEM' });
  if (text.length > 4000) throw Object.assign(new Error('Problem must be at most 4000 characters.'), { status: 422, code: 'BAD_PROBLEM' });
  
  const confidenceData = getCategoryConfidence(text);
  const key = category && PLAYBOOKS[category] ? category : confidenceData.category;
  const p = PLAYBOOKS[key];
  
  const constraintText = Array.isArray(constraints) ? constraints.map((c) => String(c).slice(0, 160)).filter(Boolean).slice(0, 10) : [];
  const budgetStr = budget ? `Budget: ${String(budget).slice(0, 80)}` : null;
  const timeStr = timeAvailable ? `Time: ${String(timeAvailable).slice(0, 80)}` : null;
  const constraintStr = constraintText.length ? `Constraints: ${constraintText.join('; ')}` : null;
  const urgencyStr = urgency !== 'normal' ? `Urgency: ${urgency}` : null;
  const context = [budgetStr, timeStr, constraintStr, urgencyStr].filter(Boolean);
  
  const filterSteps = (steps, maxSteps = 3) => steps.slice(0, maxSteps);
  
  return {
    ok: true, 
    problem: text, 
    category: key, 
    categoryLabel: p.label, 
    categoryConfidence: confidenceData.confidence,
    categoryScore: confidenceData.score,
    totalScore: confidenceData.totalScore,
    alternativeCategories: confidenceData.alternatives,
    context,
    proper: { 
      label: 'Proper solution', 
      summary: 'Compliant, scalable and durable.', 
      steps: p.proper.slice(0, 3),
      estimatedCost: p.costImpact,
      estimatedTime: p.timeToImplement,
      requiresExpertise: p.requiresExpertise,
    },
    fast: { 
      label: 'Fast practical solution', 
      summary: 'Low-cost action for the next few days.', 
      steps: p.fast.slice(0, 3),
      estimatedCost: p.costImpact,
      estimatedTime: p.timeToImplement,
      requiresExpertise: p.requiresExpertise,
    },
    jugaad: { 
      label: 'Legal frugal Jugaad', 
      summary: 'Use existing resources with minimum cash and maximum speed.', 
      steps: p.jugaad.slice(0, 3),
      estimatedCost: p.costImpact,
      estimatedTime: p.timeToImplement,
      requiresExpertise: p.requiresExpertise,
    },
    guardrails: p.guardrails,
    confidence: confidenceData.confidence,
    source: 'Curated Flux operating playbook. Adapt to the actual contract, drawings, law and site conditions.',
    limitations: ['This is a structured starting point, not a guarantee of the lowest cost or best outcome.', 'Verify every commercial, tax, safety and legal step with the responsible professional.'],
    disclaimer: 'Jugaad means a lawful, frugal workaround. Never use it to bypass safety, quality, tax, labour or environmental rules.',
  };
}

/** Premium: solve multiple problems in one call */
export function adviseMulti({ problems = [], budget = null, timeAvailable = null, constraints = [] } = {}) {
  if (!Array.isArray(problems) || !problems.length) throw Object.assign(new Error('problems must be a non-empty array'), { status: 422, code: 'BAD_PROBLEMS' });
  if (problems.length > 10) throw Object.assign(new Error('Maximum 10 problems per request'), { status: 422, code: 'TOO_MANY' });
  
  const results = problems.map((p, i) => {
    try {
      return { index: i, ...advise({ problem: p, budget, timeAvailable, constraints }) };
    } catch (e) {
      return { index: i, ok: false, error: e.message, code: e.code };
    }
  });
  
  const categories = results.filter(r => r.ok).map(r => r.category);
  const uniqueCategories = [...new Set(categories)];
  
  return {
    ok: true,
    results,
    summary: {
      total: problems.length,
      successful: results.filter(r => r.ok).length,
      failed: results.filter(r => !r.ok).length,
      uniqueCategories: uniqueCategories.length,
      dominantCategory: categories.length ? Object.entries(categories.reduce((acc, c) => { acc[c] = (acc[c] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1])[0][0] : null,
    },
    disclaimer: 'Jugaad means a lawful, frugal workaround. Never use it to bypass safety, quality, tax, labour or environmental rules.',
  };
}