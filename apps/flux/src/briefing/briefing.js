import { rankDues } from '../calc/ageing.js';
import { istDate, istStamp, parseDate, daysBetween } from '../util/time.js';

export const SECTION_DEFS = [
  ['priorities', 'Top Business Priorities'], ['overdue', 'Overdue Invoices & Collections'], ['cashflow', 'Cash Flow & Upcoming Payments'], ['customers', 'Customer Updates'],
  ['projects', 'Project & Site Risks'], ['inventory', 'Inventory & Material Alerts'], ['suppliers', 'Supplier & Purchase Alerts'], ['leads', 'New Leads & Enquiries'],
  ['headlines', 'Market & Economy Headlines'], ['markets', 'Sensex, Nifty, Gold, Crude Oil, USD/INR'], ['schemes', 'Government Schemes, Loans, Subsidies, Tenders'], ['materials', 'Material Prices & Construction Market'], ['actions', 'Top 3 Actions for Today'],
];

const RESEARCH = {
  headlines: 'India economy and business headlines today',
  markets: 'Sensex, Nifty, gold, crude oil and USD/INR levels today',
  schemes: 'Government schemes, loans, subsidies and tenders relevant to an industrial construction supplier in Madhya Pradesh',
  materials: 'Steel, cement, aggregate and diesel price trends in India this week'
};

const sec = (id, title) => ({ id, title, status: 'Could not verify', items: [], reason: '', insight: '', confidence: 'low' });

const NO_SOURCE = {
  customers: 'Customer updates need a CRM or message source that is not connected.',
  projects: 'No project or site data source is connected.',
  inventory: 'No inventory data source is connected.',
  leads: 'No lead or enquiry source is connected.'
};

const INSIGHT_TEMPLATES = {
  overdue: (count, totalOverdue, oldestDays) => {
    if (count === 0) return 'No overdue invoices — collections are current.';
    if (oldestDays > 90) return `${count} overdue invoice${count > 1 ? 's' : ''} totaling ₹${formatINR(totalOverdue)}. Oldest is ${oldestDays} days past due — immediate escalation recommended.`;
    if (oldestDays > 60) return `${count} overdue invoice${count > 1 ? 's' : ''} totaling ₹${formatINR(totalOverdue)}. ${count > 2 ? 'Multiple' : 'One'} past 60 days — formal notices should be issued this week.`;
    if (oldestDays > 30) return `${count} overdue invoice${count > 1 ? 's' : ''} totaling ₹${formatINR(totalOverdue)}. All within 30 days — friendly follow-ups sufficient for now.`;
    return `${count} overdue invoice${count > 1 ? 's' : ''} totaling ₹${formatINR(totalOverdue)}.`;
  },
  suppliers: (count, totalOverdue) => count ? `${count} overdue bill${count > 1 ? 's' : ''} totaling ₹${formatINR(totalOverdue)} require payment scheduling.` : 'No overdue bills — supplier payments are current.',
  cashflow: (upcomingCount, upcomingTotal) => upcomingCount ? `${upcomingCount} bill${upcomingCount > 1 ? 's' : ''} due within 7 days totaling ₹${formatINR(upcomingTotal)}. Cash position not verified (bank balances disconnected).` : 'No bills due in the next 7 days. Cash position not verified (bank balances disconnected).',
  priorities: (topCount) => topCount ? `Focus on collecting from ${topCount} oldest overdue invoice${topCount > 1 ? 's' : ''} first — they represent the highest recovery risk.` : 'No overdue invoices to prioritize.',
  actions: (topCount) => topCount ? `${topCount} approval-ready action${topCount > 1 ? 's' : ''} derived from verified overdue data.` : 'No actions could be derived from verified data.',
  research: (section, count) => count === 0 ? `No verified ${section} data returned with sources.` : `${count} verified ${section} item${count > 1 ? 's' : ''} with source links and dates.`
};

function formatINR(n) {
  if (!n || n === 0) return '0';
  const abs = Math.abs(Number(n));
  if (abs >= 10000000) return (abs / 10000000).toFixed(2) + ' Cr';
  if (abs >= 100000) return (abs / 100000).toFixed(2) + ' L';
  return abs.toLocaleString('en-IN');
}

function sumBalances(items) {
  return items.reduce((sum, item) => {
    const bal = typeof item.balance === 'string' ? item.balance : String(item.balance || 0);
    const num = Number(bal.replace(/[₹,]/g, ''));
    return sum + (isNaN(num) ? 0 : num);
  }, 0);
}

export async function buildBriefing({ reader, research = null, now = new Date() }) {
  const today = istDate(now);
  const s = Object.fromEntries(SECTION_DEFS.map(([id, t]) => [id, sec(id, t)]));
  const evidence = [];

  try {
    // Overdue invoices: Zoho figures shown exactly as received
    let rows = [], page = 1, more = true;
    while (more && page <= 5) {
      const r = await reader.listInvoices({ status: 'overdue', page });
      rows = rows.concat(r.items);
      more = r.hasMore;
      page++;
    }
    const ranked = rankDues(rows.map((i) => ({
      invoiceNumber: i.invoice_number,
      customer: i.customer_name,
      dueDate: i.due_date,
      balance: i.balance,
      id: i.invoice_id
    })), today);

    const overdueCount = ranked.ranked.length;
    const totalOverdue = sumBalances(ranked.ranked);
    const oldestDays = overdueCount > 0 ? Math.max(...ranked.ranked.map(r => r.daysOverdue)) : 0;

    s.overdue.status = ranked.rejected.length ? 'Partial' : 'Verified';
    s.overdue.reason = ranked.rejected.length ? `${ranked.rejected.length} invoice(s) had no readable due date` : '';
    s.overdue.insight = INSIGHT_TEMPLATES.overdue(overdueCount, totalOverdue, oldestDays);
    s.overdue.confidence = ranked.rejected.length ? 'medium' : 'high';
    s.overdue.items = ranked.ranked.map((r) => ({
      text: `${r.invoiceNumber} · ${r.customer} · due ${r.dueDate} · ${r.daysOverdue} days overdue · balance ₹${r.balance}`,
      evidence: `zoho:invoice:${r.invoiceNumber}`,
      daysOverdue: r.daysOverdue,
      bucket: r.bucket,
      tone: r.suggestedTone
    }));
    if (!ranked.ranked.length && !ranked.rejected.length) {
      s.overdue.items = [{ text: 'Zoho Books shows no overdue invoices.', evidence: 'zoho:invoices:overdue' }];
    }
    evidence.push(...s.overdue.items.map((i) => i.text));
  } catch (e) {
    s.overdue.reason = `Could not read Zoho Books: ${e.message}`;
    s.overdue.insight = 'Overdue data unavailable due to connection error.';
    s.overdue.confidence = 'none';
  }

  try {
    // Bills (what we owe)
    const bills = await reader.listBills({ status: 'overdue' });
    const open = await reader.listBills({ status: 'open' });
    const overdueBills = bills.length;
    const totalOverdueBills = sumBalances(bills);

    const soon = open.filter((b) => {
      const d = parseDate(b.due_date);
      return d && daysBetween(today, d) >= 0 && daysBetween(today, d) <= 7;
    });
    const upcomingTotal = sumBalances(soon);

    s.suppliers.status = 'Verified';
    s.suppliers.items = overdueBills ? bills.map((b) => ({
      text: `${b.bill_number} · ${b.vendor_name} · due ${b.due_date} · balance ₹${b.balance}`,
      evidence: `zoho:bill:${b.bill_number}`,
      vendor: b.vendor_name,
      dueDate: b.due_date,
      balance: b.balance
    })) : [{ text: 'Zoho Books shows no overdue bills.', evidence: 'zoho:bills:overdue' }];
    s.suppliers.insight = INSIGHT_TEMPLATES.suppliers(overdueBills, totalOverdueBills);
    s.suppliers.confidence = 'high';

    s.cashflow.status = 'Partial';
    s.cashflow.reason = 'Bank and cash balances are not connected, so the cash position could not be verified. Only bills due within 7 days are shown.';
    s.cashflow.items = soon.map((b) => ({
      text: `Bill ${b.bill_number} · ${b.vendor_name} due ${b.due_date} · ₹${b.balance}`,
      evidence: `zoho:bill:${b.bill_number}`,
      vendor: b.vendor_name,
      dueDate: b.due_date,
      balance: b.balance
    }));
    s.cashflow.insight = INSIGHT_TEMPLATES.cashflow(soon.length, upcomingTotal);
    s.cashflow.confidence = soon.length ? 'medium' : 'low';
    evidence.push(...s.suppliers.items.map((i) => i.text), ...s.cashflow.items.map((i) => i.text));
  } catch (e) {
    s.suppliers.reason = `Could not read Zoho Books bills: ${e.message}`;
    s.suppliers.insight = 'Supplier data unavailable due to connection error.';
    s.suppliers.confidence = 'none';
    s.cashflow.reason = s.suppliers.reason;
    s.cashflow.insight = 'Cash flow data unavailable due to connection error.';
    s.cashflow.confidence = 'none';
  }

  for (const [id, why] of Object.entries(NO_SOURCE)) {
    s[id].reason = why;
    s[id].confidence = 'none';
  }

  for (const [id, topic] of Object.entries(RESEARCH)) {
    if (!research) {
      s[id].reason = 'No research source is configured, so this could not be verified.';
      s[id].confidence = 'none';
      continue;
    }
    try {
      const claims = (await research.fetch(topic)) || [];
      const good = claims.filter((c) => c.claim && c.sourceUrl && c.checkedOn);
      s[id].items = good.map((c) => ({
        text: `${c.claim}${c.value != null ? ` (${c.value}${c.unit ? ' ' + c.unit : ''})` : ''}`,
        evidence: c.sourceUrl,
        checkedOn: c.checkedOn,
        confidence: c.confidence || 'uncertain'
      }));
      s[id].status = good.length === 0 ? 'Could not verify' : good.length < claims.length ? 'Partial' : good.every((c) => c.confidence === 'high') ? 'Verified' : 'Uncertain';
      if (!good.length) s[id].reason = 'The research source returned nothing with a link and a date.';
      else if (good.length < claims.length) s[id].reason = `${claims.length - good.length} item(s) were dropped because they had no source link or date.`;
      s[id].insight = INSIGHT_TEMPLATES.research(id, good.length);
      s[id].confidence = good.length === 0 ? 'none' : good.length < claims.length ? 'medium' : good.every((c) => c.confidence === 'high') ? 'high' : 'medium';
      evidence.push(...s[id].items.map((i) => i.text));
    } catch (e) {
      s[id].reason = `Research failed: ${e.message}`;
      s[id].insight = `${id} research unavailable due to error.`;
      s[id].confidence = 'none';
    }
  }

  const top = s.overdue.items.filter((i) => i.daysOverdue != null).slice(0, 3);
  const topCount = top.length;
  const totalOverdueForPriority = sumBalances(top);

  s.priorities.items = topCount ? [{
    text: `Collect overdue payments: ${topCount} oldest invoice${topCount > 1 ? 's' : ''} first (totaling ₹${formatINR(totalOverdueForPriority)}).`,
    evidence: 'derived:overdue'
  }] : [];
  s.priorities.status = topCount ? 'Partial' : 'Could not verify';
  s.priorities.reason = 'Priorities use overdue invoices only; other areas have no connected data.';
  s.priorities.insight = INSIGHT_TEMPLATES.priorities(topCount);
  s.priorities.confidence = topCount ? 'high' : 'none';

  s.actions.items = top.map((i) => ({
    text: `Follow up: ${i.text.split(' · ').slice(0, 2).join(' · ')} (${i.daysOverdue} days overdue)`,
    evidence: i.evidence,
    approvalRequired: true,
    daysOverdue: i.daysOverdue,
    bucket: i.bucket
  }));
  s.actions.status = topCount ? 'Partial' : 'Could not verify';
  s.actions.reason = topCount ? '' : 'No action could be derived from verified data.';
  s.actions.insight = INSIGHT_TEMPLATES.actions(topCount);
  s.actions.confidence = topCount ? 'high' : 'none';

  const sections = SECTION_DEFS.map(([id]) => s[id]);
  const n = s.overdue.items.filter((i) => i.daysOverdue != null).length;
  const totalOverdueAmount = sumBalances(s.overdue.items);

  // Premium headline with key metrics
  const headline = n
    ? `${n} overdue invoice${n > 1 ? 's' : ''} (₹${formatINR(totalOverdueAmount)}) need follow-up`
    : 'Briefing ready — no overdue invoices';

  return {
    date: today,
    generatedAt: istStamp(now),
    headline,
    sections,
    unverified: sections.filter((x) => x.status === 'Could not verify').map((x) => x.title),
    evidenceTexts: evidence,
    status: 'new',
    metrics: {
      overdueCount: n,
      overdueTotal: totalOverdueAmount,
      overdueBillsCount: s.suppliers.items.length,
      upcomingBillsCount: s.cashflow.items.length,
      verifiedSections: sections.filter((x) => x.status === 'Verified').length,
      partialSections: sections.filter((x) => x.status === 'Partial').length,
      unverifiedSections: sections.filter((x) => x.status === 'Could not verify').length
    }
  };
}

export class BriefingScheduler {
  constructor({ run, nextAt, hour = 8, now = () => new Date(), setTimer = setTimeout, clearTimer = clearTimeout, onError = () => {}, hasToday = () => false }) {
    Object.assign(this, { run, nextAt, hour, now, setTimer, clearTimer, onError, hasToday });
    this.timer = null;
  }
  start() {
    const n = this.now();
    const istHour = new Date(n.getTime() + 330 * 60000).getUTCHours();
    if (istHour >= this.hour && !this.hasToday(n)) this.#fire();
    this.#arm();
  }
  #arm() {
    const d = Math.min(this.nextAt(this.now()).getTime() - this.now().getTime(), 2 ** 31 - 1);
    this.timer = this.setTimer(async () => { await this.#fire(); this.#arm(); }, Math.max(d, 1));
    this.timer?.unref?.();
  }
  async #fire() {
    try { await this.run(); } catch (e) { this.onError(e); }
  }
  stop() { if (this.timer) this.clearTimer(this.timer); this.timer = null; }
}