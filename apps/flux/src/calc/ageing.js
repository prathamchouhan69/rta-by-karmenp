import { daysBetween, parseDate } from '../util/time.js';
// Balances are passed through exactly as Zoho sent them (strings). Nothing is added up here: Zoho's ageing governs.
const bucket = (d) => (d <= 0 ? 'Not yet due' : d <= 30 ? '1-30 days' : d <= 60 ? '31-60 days' : d <= 90 ? '61-90 days' : 'Over 90 days');
const tone = (d) => (d <= 0 ? 'No reminder yet' : d <= 30 ? 'Friendly nudge' : d <= 60 ? 'Firm reminder' : d <= 90 ? 'Formal notice' : 'Escalate: owner decision, take professional advice');
export function rankDues(rows, asOf) {
  const today = parseDate(asOf); if (!today) throw new Error('asOf must be a real date');
  const ranked = [], rejected = [];
  for (const r of rows || []) {
    const due = parseDate(r.dueDate);
    if (!due) { rejected.push({ row: r, reason: 'Due date is missing or not a real date' }); continue; }
    const days = daysBetween(due, today);
    ranked.push({ invoiceNumber: r.invoiceNumber, customer: r.customer, dueDate: due, balance: r.balance == null ? null : String(r.balance), daysOverdue: Math.max(days, 0), daysToDue: days <= 0 ? -days : 0, bucket: bucket(days), suggestedTone: tone(days) });
  }
  ranked.sort((a, b) => b.daysOverdue - a.daysOverdue);
  return { asOf: today, ranked, rejected, note: 'Days are date arithmetic. Balances are Zoho Books figures shown as received.' };
}
