// Flux Automations engine.
// Every automation prepares a draft, alert or reminder. Nothing executes without approval.

export const AUTOMATION_DISCLAIMER = 'Automations prepare drafts and reminders only. Nothing is sent, created or changed without explicit owner approval.';

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

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
        kind: 'reminder.payment',
        title: `Payment reminder for invoice ${inv.number || inv.id}`,
        summary: `Invoice ${inv.number || inv.id} for ${inv.customerName || 'customer'} is ${days} day(s) overdue. Balance: ${inv.balance ?? 'unknown'}.`,
        payload: { invoiceId: inv.id, days, balance: inv.balance },
        priority: days >= 30 ? 'critical' : days >= 7 ? 'high' : 'medium',
        confidence: 'high',
        gate: 'reminder:send',
      });
    }
  }

  // 2. Project margin below threshold -> alert.
  for (const p of projects) {
    const margin = Number(p.marginPercent);
    if (Number.isFinite(margin) && margin < (input.marginThreshold ?? 10)) {
      proposals.push({
        kind: 'alert.margin',
        title: `Project margin below threshold: ${p.name || p.id}`,
        summary: `Project ${p.name || p.id} margin is ${margin}%, below the ${input.marginThreshold ?? 10}% threshold. Review pricing, material cost and scope before accepting more work.`,
        payload: { projectId: p.id, marginPercent: margin },
        priority: margin < 5 ? 'critical' : 'high',
        confidence: 'high',
        gate: 'alert:acknowledge',
      });
    }
  }

  // 3. Material price rise -> procurement review.
  for (const m of materials) {
    const change = Number(m.priceChangePercent);
    if (Number.isFinite(change) && change > (input.priceRiseThreshold ?? 5)) {
      proposals.push({
        kind: 'procurement.review',
        title: `Material price review: ${m.material}`,
        summary: `${m.material} in ${m.location || 'your area'} rose ${change}% to ${m.currentPrice ?? 'unknown'} per ${m.unit || 'unit'}. Compare three suppliers before the next purchase order.`,
        payload: { material: m.material, changePercent: change },
        priority: change >= 15 ? 'high' : 'medium',
        confidence: m.confidence || 'medium',
        gate: 'procurement:review',
      });
    }
  }

  return {
    ok: true,
    proposals,
    generatedAt: new Date().toISOString(),
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
        kind: 'reminder.hydration',
        title: 'Hydration reminder',
        summary: `Recorded intake is below a general target of about ${Math.round(target)} ml for today. Drink water and log the next intake.`,
        priority: 'medium',
        gate: 'reminder:send',
      });
    }
  }

  // Medicine reminder.
  if (Array.isArray(profile?.medicines) && profile.medicines.length) {
    reminders.push({
      kind: 'reminder.medicine',
      title: 'Medicine and supplement check',
      summary: `${profile.medicines.length} medicine or supplement record(s) are stored. Check whether a scheduled dose is due and confirm with the labelled instructions.`,
      priority: 'medium',
      gate: 'reminder:send',
    });
  }

  // Sleep recovery.
  if (latest.sleep && Number(latest.sleep.value) < 6) {
    reminders.push({
      kind: 'reminder.sleep',
      title: 'Sleep recovery guidance',
      summary: 'Sleep under 6 hours was recorded. Prioritise a consistent bedtime, reduce screen time before bed, and see a qualified clinician if low sleep persists.',
      priority: 'low',
      gate: 'reminder:send',
    });
  }

  return {
    ok: true,
    reminders,
    disclaimer: 'This is general health information, not medical advice.',
    limitations: ['Reminders are prompts, not medical instructions. Ask a qualified clinician before changing medicine or treatment.'],
  };
}

export function clampLimit(n, lo, hi) { return clamp(n, lo, hi); }