import { rankDues } from '../calc/ageing.js';
import { istDate, istStamp, parseDate, daysBetween } from '../util/time.js';

export const SECTION_DEFS = [
  ['priorities', 'Top business priorities'], ['overdue', 'Overdue invoices and collections'], ['cashflow', 'Cash flow and upcoming payments'], ['customers', 'Customer updates'],
  ['projects', 'Project and site risks'], ['inventory', 'Inventory and material alerts'], ['suppliers', 'Supplier and purchase alerts'], ['leads', 'New leads and enquiries'],
  ['headlines', 'Market and economy headlines'], ['markets', 'Sensex, Nifty, gold, crude oil, USD/INR'], ['schemes', 'Government schemes, loans, subsidies, tenders'], ['materials', 'Material prices and construction market'], ['actions', 'Top 3 actions for today'],
];
const RESEARCH = { headlines: 'India economy and business headlines today', markets: 'Sensex, Nifty, gold, crude oil and USD/INR levels today', schemes: 'Government schemes, loans, subsidies and tenders relevant to an industrial construction supplier in Madhya Pradesh', materials: 'Steel, cement, aggregate and diesel price trends in India this week' };
const sec = (id, title) => ({ id, title, status: 'Could not verify', items: [], reason: '' });
const NO_SOURCE = { customers: 'Customer updates need a CRM or message source that is not connected.', projects: 'No project or site data source is connected.', inventory: 'No inventory data source is connected.', leads: 'No lead or enquiry source is connected.' };

export async function buildBriefing({ reader, research = null, now = new Date() }) {
  const today = istDate(now); const s = Object.fromEntries(SECTION_DEFS.map(([id, t]) => [id, sec(id, t)]));
  const evidence = [];

  try { // Overdue invoices: Zoho figures shown exactly as received
    let rows = [], page = 1, more = true;
    while (more && page <= 5) { const r = await reader.listInvoices({ status: 'overdue', page }); rows = rows.concat(r.items); more = r.hasMore; page++; }
    const ranked = rankDues(rows.map((i) => ({ invoiceNumber: i.invoice_number, customer: i.customer_name, dueDate: i.due_date, balance: i.balance, id: i.invoice_id })), today);
    s.overdue.status = ranked.rejected.length ? 'Partial' : 'Verified'; s.overdue.reason = ranked.rejected.length ? `${ranked.rejected.length} invoice(s) had no readable due date` : '';
    s.overdue.items = ranked.ranked.map((r) => ({ text: `${r.invoiceNumber} · ${r.customer} · due ${r.dueDate} · ${r.daysOverdue} days overdue · balance ₹${r.balance}`, evidence: `zoho:invoice:${r.invoiceNumber}`, daysOverdue: r.daysOverdue }));
    if (!ranked.ranked.length && !ranked.rejected.length) s.overdue.items = [{ text: 'Zoho Books shows no overdue invoices.', evidence: 'zoho:invoices:overdue' }];
    evidence.push(...s.overdue.items.map((i) => i.text));
  } catch (e) { s.overdue.reason = `Could not read Zoho Books: ${e.message}`; }

  try { // Bills (what we owe)
    const bills = await reader.listBills({ status: 'overdue' }); const open = await reader.listBills({ status: 'open' });
    s.suppliers.status = 'Verified'; s.suppliers.items = bills.length ? bills.map((b) => ({ text: `${b.bill_number} · ${b.vendor_name} · due ${b.due_date} · balance ₹${b.balance}`, evidence: `zoho:bill:${b.bill_number}` })) : [{ text: 'Zoho Books shows no overdue bills.', evidence: 'zoho:bills:overdue' }];
    const soon = open.filter((b) => { const d = parseDate(b.due_date); return d && daysBetween(today, d) >= 0 && daysBetween(today, d) <= 7; });
    s.cashflow.status = 'Partial'; s.cashflow.reason = 'Bank and cash balances are not connected, so the cash position could not be verified. Only bills due within 7 days are shown.';
    s.cashflow.items = soon.map((b) => ({ text: `Bill ${b.bill_number} · ${b.vendor_name} due ${b.due_date} · ₹${b.balance}`, evidence: `zoho:bill:${b.bill_number}` }));
    evidence.push(...s.suppliers.items.map((i) => i.text), ...s.cashflow.items.map((i) => i.text));
  } catch (e) { s.suppliers.reason = `Could not read Zoho Books bills: ${e.message}`; s.cashflow.reason = s.suppliers.reason; }

  for (const [id, why] of Object.entries(NO_SOURCE)) s[id].reason = why;

  for (const [id, topic] of Object.entries(RESEARCH)) {
    if (!research) { s[id].reason = 'No research source is configured, so this could not be verified.'; continue; }
    try {
      const claims = (await research.fetch(topic)) || [];
      const good = claims.filter((c) => c.claim && c.sourceUrl && c.checkedOn); // no source, no claim
      s[id].items = good.map((c) => ({ text: `${c.claim}${c.value != null ? ` (${c.value}${c.unit ? ' ' + c.unit : ''})` : ''}`, evidence: c.sourceUrl, checkedOn: c.checkedOn, confidence: c.confidence || 'uncertain' }));
      s[id].status = good.length === 0 ? 'Could not verify' : good.length < claims.length ? 'Partial' : good.every((c) => c.confidence === 'high') ? 'Verified' : 'Uncertain';
      if (!good.length) s[id].reason = 'The research source returned nothing with a link and a date.'; else if (good.length < claims.length) s[id].reason = `${claims.length - good.length} item(s) were dropped because they had no source link or date.`;
      evidence.push(...s[id].items.map((i) => i.text));
    } catch (e) { s[id].reason = `Research failed: ${e.message}`; }
  }

  const top = s.overdue.items.filter((i) => i.daysOverdue != null).slice(0, 3);
  s.priorities.items = top.length ? [{ text: `Collect overdue payments: ${top.length} oldest invoice(s) first.`, evidence: 'derived:overdue' }] : [];
  s.priorities.status = top.length ? 'Partial' : 'Could not verify'; s.priorities.reason = 'Priorities use overdue invoices only; other areas have no connected data.';
  s.actions.items = top.map((i) => ({ text: `Follow up: ${i.text.split(' · ').slice(0, 2).join(' · ')} (${i.daysOverdue} days overdue)`, evidence: i.evidence, approvalRequired: true }));
  s.actions.status = top.length ? 'Partial' : 'Could not verify'; s.actions.reason = top.length ? '' : 'No action could be derived from verified data.';

  const sections = SECTION_DEFS.map(([id]) => s[id]);
  const n = s.overdue.items.filter((i) => i.daysOverdue != null).length;
  return { date: today, generatedAt: istStamp(now), headline: n ? `${n} overdue invoice${n > 1 ? 's' : ''} need follow-up` : 'Briefing ready', sections, unverified: sections.filter((x) => x.status === 'Could not verify').map((x) => x.title), evidenceTexts: evidence, status: 'new' };
}

export class BriefingScheduler {
  constructor({ run, nextAt, hour = 8, now = () => new Date(), setTimer = setTimeout, clearTimer = clearTimeout, onError = () => {}, hasToday = () => false }) { Object.assign(this, { run, nextAt, hour, now, setTimer, clearTimer, onError, hasToday }); this.timer = null; }
  start() {
    const n = this.now(); const istHour = new Date(n.getTime() + 330 * 60000).getUTCHours();
    if (istHour >= this.hour && !this.hasToday(n)) this.#fire(); // server started after the briefing time and none exists for today yet
    this.#arm();
  }
  #arm() { const d = Math.min(this.nextAt(this.now()).getTime() - this.now().getTime(), 2 ** 31 - 1); this.timer = this.setTimer(async () => { await this.#fire(); this.#arm(); }, Math.max(d, 1)); this.timer?.unref?.(); }
  async #fire() { try { await this.run(); } catch (e) { this.onError(e); } }
  stop() { if (this.timer) this.clearTimer(this.timer); this.timer = null; }
}
