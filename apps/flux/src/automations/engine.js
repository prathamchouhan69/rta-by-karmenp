// Flux Premium Automations engine.
// Every automation prepares a draft, alert or reminder. Nothing executes without approval.

export const AUTOMATION_DISCLAIMER = 'Automations prepare drafts and reminders only. Nothing is sent, created or changed without explicit owner approval.';

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

export const AUTOMATION_KINDS = {
  reminder: { label: 'Reminder', gates: ['reminder:send'] },
  alert: { label: 'Alert', gates: ['alert:acknowledge'] },
  draft: { label: 'Document Draft', gates: ['documents:propose'] },
  procurement: { label: 'Procurement Review', gates: ['procurement:review'] },
  approval: { label: 'Approval Request', gates: ['approvals:request'] },
  report: { label: 'Report Generation', gates: ['reports:generate'] },
};

export const AUTOMATION_TRIGGERS = {
  schedule: { label: 'Scheduled (cron)', config: ['cron', 'timezone'] },
  event: { label: 'Event-driven', config: ['eventType', 'conditions'] },
  threshold: { label: 'Threshold breach', config: ['metric', 'operator', 'threshold'] },
  webhook: { label: 'Webhook', config: ['url', 'secret'] },
  manual: { label: 'Manual trigger', config: [] },
};

export function evaluateBusinessRules(input = {}) {
  const proposals = [];
  const invoices = Array.isArray(input.invoices) ? input.invoices : [];
  const projects = Array.isArray(input.projects) ? input.projects : [];
  const materials = Array.isArray(input.materialPrices) ? input.materialPrices : [];
  const now = input.asOf ? new Date(input.asOf) : new Date();

  // 1. Overdue invoices -> payment reminder draft.
  for (const inv of invoices) {
    const due = inv.dueDate ? new Date(inv.dueDate) : null;
    if (!due || Number.isNaN(due.getTime())) continue;
    const days = Math.floor((now - due) / 86400000);
    if (days > 0) {
      proposals.push({
        id: `auto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        kind: 'reminder.payment',
        title: `Payment reminder for invoice ${inv.number || inv.id}`,
        summary: `Invoice ${inv.number || inv.id} for ${inv.customerName || 'customer'} is ${days} day(s) overdue. Balance: ${inv.balance ?? 'unknown'}.`,
        payload: { invoiceId: inv.id, days, balance: inv.balance },
        priority: days >= 30 ? 'critical' : days >= 7 ? 'high' : 'medium',
        confidence: 'high',
        gate: 'reminder:send',
        trigger: { type: 'threshold', metric: 'daysOverdue', operator: '>', threshold: 0 },
        suggestedActions: ['send_reminder', 'call_customer', 'escalate_legal'],
      });
    }
  }

  // 2. Project margin below threshold -> alert.
  for (const p of projects) {
    const margin = Number(p.marginPercent);
    if (Number.isFinite(margin) && margin < (input.marginThreshold ?? 10)) {
      proposals.push({
        id: `auto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        kind: 'alert.margin',
        title: `Project margin below threshold: ${p.name || p.id}`,
        summary: `Project ${p.name || p.id} margin is ${margin}%, below the ${input.marginThreshold ?? 10}% threshold. Review pricing, material cost and scope before accepting more work.`,
        payload: { projectId: p.id, marginPercent: margin },
        priority: margin < 5 ? 'critical' : 'high',
        confidence: 'high',
        gate: 'alert:acknowledge',
        trigger: { type: 'threshold', metric: 'marginPercent', operator: '<', threshold: input.marginThreshold ?? 10 },
        suggestedActions: ['review_pricing', 'negotiate_scope', 'reduce_costs'],
      });
    }
  }

  // 3. Material price rise -> procurement review.
  for (const m of materials) {
    const change = Number(m.priceChangePercent);
    if (Number.isFinite(change) && change > (input.priceRiseThreshold ?? 5)) {
      proposals.push({
        id: `auto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        kind: 'procurement.review',
        title: `Material price review: ${m.material}`,
        summary: `${m.material} in ${m.location || 'your area'} rose ${change}% to ${m.currentPrice ?? 'unknown'} per ${m.unit || 'unit'}. Compare three suppliers before the next purchase order.`,
        payload: { material: m.material, changePercent: change },
        priority: change >= 15 ? 'high' : 'medium',
        confidence: m.confidence || 'medium',
        gate: 'procurement:review',
        trigger: { type: 'threshold', metric: 'priceChangePercent', operator: '>', threshold: input.priceRiseThreshold ?? 5 },
        suggestedActions: ['compare_suppliers', 'negotiate_contract', 'adjust_budget'],
      });
    }
  }

  // 4. Cash flow forecast alerts.
  if (input.cashFlowForecast) {
    const shortfall = Number(input.cashFlowForecast.shortfall);
    if (Number.isFinite(shortfall) && shortfall > 0) {
      proposals.push({
        id: `auto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        kind: 'alert.cashflow',
        title: `Cash flow shortfall projected: ${shortfall.toLocaleString('en-IN')}`,
        summary: `Forecast shows a cash shortfall of ₹${shortfall.toLocaleString('en-IN')} over the next ${input.cashFlowForecast.horizonDays || 30} days. Consider delaying non-critical payments or arranging bridge financing.`,
        payload: { shortfall, horizonDays: input.cashFlowForecast.horizonDays },
        priority: shortfall > 1000000 ? 'critical' : 'high',
        confidence: 'medium',
        gate: 'alert:acknowledge',
        trigger: { type: 'threshold', metric: 'projectedCash', operator: '<', threshold: 0 },
        suggestedActions: ['delay_payments', 'arrange_financing', 'accelerate_collections'],
      });
    }
  }

  // 5. GST compliance alerts.
  if (input.gstDueDates) {
    for (const due of input.gstDueDates) {
      const days = Math.floor((new Date(due.date) - new Date()) / 86400000);
      if (days >= 0 && days <= 7) {
        proposals.push({
          id: `auto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          kind: 'alert.gst',
          title: `GST filing due: ${due.type} in ${days} day(s)`,
          summary: `${due.type} filing is due on ${due.date}. Estimated liability: ${due.estimatedAmount || 'to be calculated'}.`,
          payload: { gstType: due.type, dueDate: due.date, estimatedAmount: due.estimatedAmount },
          priority: days <= 2 ? 'critical' : 'high',
          confidence: 'high',
          gate: 'alert:acknowledge',
          trigger: { type: 'schedule', eventType: 'gst_due', daysUntil: days },
          suggestedActions: ['prepare_filing', 'verify_itc', 'schedule_payment'],
        });
      }
    }
  }

  return {
    ok: true,
    proposals,
    generatedAt: new Date().toISOString(),
    summary: {
      total: proposals.length,
      critical: proposals.filter(p => p.priority === 'critical').length,
      high: proposals.filter(p => p.priority === 'high').length,
      medium: proposals.filter(p => p.priority === 'medium').length,
      low: proposals.filter(p => p.priority === 'low').length,
      byKind: Object.fromEntries(Object.entries(proposals.reduce((acc, p) => { acc[p.kind] = (acc[p.kind] || 0) + 1; return acc; }, {})).map(([k, v]) => [k, v])),
    },
    limitations: ['Proposals are drafts. They create nothing and send nothing until an owner approves each one.'],
  };
}

export function evaluateHealthRules(input = {}) {
  const reminders = [];
  const profile = input.profile || null;
  const vitals = Array.isArray(input.vitals) ? input.vitals : [];
  const now = input.asOf ? new Date(input.asOf) : new Date();

  const latest = {};
  for (const v of vitals) if (!latest[v.type]) latest[v.type] = v;

  // Hydration below target.
  if (latest.hydration && profile?.weightKg) {
    const target = profile.weightKg * 30;
    if (Number(latest.hydration.value) < target) {
      reminders.push({
        id: `auto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        kind: 'reminder.hydration',
        title: 'Hydration reminder',
        summary: `Recorded intake is below a general target of about ${Math.round(target)} ml for today. Drink water and log the next intake.`,
        priority: 'medium',
        gate: 'reminder:send',
        trigger: { type: 'threshold', metric: 'hydrationMl', operator: '<', threshold: target },
        suggestedActions: ['drink_water', 'log_intake'],
      });
    }
  }

  // Medicine reminder.
  if (Array.isArray(profile?.medicines) && profile.medicines.length) {
    reminders.push({
      id: `auto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind: 'reminder.medicine',
      title: 'Medicine and supplement check',
      summary: `${profile.medicines.length} medicine or supplement record(s) are stored. Check whether a scheduled dose is due and confirm with the labelled instructions.`,
      priority: 'medium',
      gate: 'reminder:send',
      trigger: { type: 'schedule', eventType: 'medicine_check', frequency: 'daily' },
      suggestedActions: ['verify_dose', 'log_taken'],
    });
  }

  // Sleep recovery.
  if (latest.sleep && Number(latest.sleep.value) < 6) {
    reminders.push({
      id: `auto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind: 'reminder.sleep',
      title: 'Sleep recovery guidance',
      summary: 'Sleep under 6 hours was recorded. Prioritise a consistent bedtime, reduce screen time before bed, and see a qualified clinician if low sleep persists.',
      priority: 'low',
      gate: 'reminder:send',
      trigger: { type: 'threshold', metric: 'sleepHours', operator: '<', threshold: 6 },
      suggestedActions: ['adjust_bedtime', 'reduce_screens', 'consult_clinician'],
    });
  }

  // Step count reminder.
  if (latest.steps && Number(latest.steps.value) < 5000) {
    reminders.push({
      id: `auto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind: 'reminder.activity',
      title: 'Movement reminder',
      summary: `Only ${latest.steps.value} steps recorded today. Consider a short walk to improve circulation and energy.`,
      priority: 'low',
      gate: 'reminder:send',
      trigger: { type: 'threshold', metric: 'steps', operator: '<', threshold: 5000 },
      suggestedActions: ['take_walk', 'stand_up'],
    });
  }

  return {
    ok: true,
    reminders,
    generatedAt: new Date().toISOString(),
    summary: {
      total: reminders.length,
      byKind: Object.fromEntries(Object.entries(reminders.reduce((acc, r) => { acc[r.kind] = (acc[r.kind] || 0) + 1; return acc; }, {})).map(([k, v]) => [k, v])),
    },
    disclaimer: 'This is general health information, not medical advice.',
    limitations: ['Reminders are prompts, not medical instructions. Ask a qualified clinician before changing medicine or treatment.'],
  };
}

/** Premium: compose multiple rule sets into a single evaluation */
export function composeAutomations(...ruleSets) {
  return async (input) => {
    const results = await Promise.all(ruleSets.map(r => r(input)));
    const allProposals = results.flatMap(r => r.proposals || r.reminders || []);
    const allReminders = results.flatMap(r => r.reminders || []);
    return {
      ok: true,
      proposals: allProposals,
      reminders: allReminders,
      generatedAt: new Date().toISOString(),
      summary: {
        totalProposals: allProposals.length,
        totalReminders: allReminders.length,
        critical: [...allProposals, ...allReminders].filter(p => p.priority === 'critical').length,
        high: [...allProposals, ...allReminders].filter(p => p.priority === 'high').length,
      },
    };
  };
}

/** Premium: schedule automation with natural language cron */
export function parseNaturalSchedule(text) {
  const t = String(text || '').toLowerCase().trim();
  const patterns = [
    { pattern: /every\s+day/i, cron: '0 9 * * *' },
    { pattern: /every\s+weekday/i, cron: '0 9 * * 1-5' },
    { pattern: /every\s+monday/i, cron: '0 9 * * 1' },
    { pattern: /every\s+tuesday/i, cron: '0 9 * * 2' },
    { pattern: /every\s+wednesday/i, cron: '0 9 * * 3' },
    { pattern: /every\s+thursday/i, cron: '0 9 * * 4' },
    { pattern: /every\s+friday/i, cron: '0 9 * * 5' },
    { pattern: /every\s+saturday/i, cron: '0 9 * * 6' },
    { pattern: /every\s+sunday/i, cron: '0 9 * * 0' },
    { pattern: /every\s+month/i, cron: '0 9 1 * *' },
    { pattern: /every\s+quarter/i, cron: '0 9 1 */3 *' },
    { pattern: /every\s+(\d+)\s*(minute|hour|day|week|month)s?/i, cron: null },
  ];
  for (const p of patterns) {
    if (p.pattern.test(t)) {
      if (p.cron) return { cron: p.cron, natural: t };
      const match = t.match(p.pattern);
      if (match) {
        const n = parseInt(match[1], 10);
        const unit = match[2];
        return { cron: generateCron(n, unit), natural: t };
      }
    }
  }
  return { cron: null, natural: t, error: 'Could not parse schedule. Use standard cron or try "every weekday at 9am".' };
}

function generateCron(n, unit) {
  if (unit.startsWith('minute')) return `*/${n} * * * *`;
  if (unit.startsWith('hour')) return `0 */${n} * * *`;
  if (unit.startsWith('day')) return `0 9 */${n} * *`;
  if (unit.startsWith('week')) return `0 9 * * */${n}`;
  if (unit.startsWith('month')) return `0 9 1 */${n} *`;
  return null;
}

export function clampLimit(n, lo, hi) { return clamp(n, lo, hi); }