import { can } from '../security/roles.js';
import { validateGstin } from '../checks/gstin.js';
import { fuelTrip } from '../calc/fuel.js';
import { rankDues } from '../calc/ageing.js';
import { daysBetween, istDate, parseDate } from '../util/time.js';

const slimInvoice = (i) => ({ id: i.invoice_id, invoice_number: i.invoice_number, customer_name: i.customer_name, status: i.status, date: i.date, due_date: i.due_date, total: i.total, balance: i.balance });
const needStr = (v, n) => { if (typeof v !== 'string' || !v.trim()) throw new Error(`${n} is required`); return v.trim(); };

// Read and calculate only. No tool here can write to Zoho Books, send anything or approve anything.
export function createTools({ reader, hsn, memory, browserReader = null, now = () => new Date() }) {
  const t = {
    ist_now: { description: 'Today\'s date in India (IST). args: none', permission: null, run: async () => ({ today: istDate(now()) }) },
    days_between: { description: 'Whole days between two dates. args: {from, to} as YYYY-MM-DD or DD/MM/YYYY', permission: null, run: async (a) => { const f = parseDate(a.from), to = parseDate(a.to); if (!f || !to) throw new Error('Both dates must be real dates'); return { days: daysBetween(f, to) }; } },
    gstin_check: { description: 'Check a GSTIN\'s format, state and check character (not a live registration check). args: {gstin}', permission: null, run: async (a) => validateGstin(needStr(a.gstin, 'gstin')) },
    fuel_calc: { description: 'Trip fuel estimate. args: {distanceKm, loadedKmpl, emptyKmpl, returnMode, dieselPrice, loadMt, otherCosts, freightPerMt, actualLitres}', permission: null, run: async (a) => fuelTrip(a) },
    rank_dues: { description: 'Rank overdue invoices by days overdue. args: {rows:[{invoiceNumber,customer,dueDate,balance}], asOf}', permission: null, run: async (a) => rankDues(a.rows, a.asOf || istDate(now())) },
    lookup_hsn: { description: 'HSN/SAC status for an item. Never guesses. args: {item, statedRate}', permission: 'read:zoho', run: async (a) => hsn.resolve(needStr(a.item, 'item'), { statedRate: a.statedRate ?? null }) },
    find_invoices: { description: 'List invoices from Zoho Books. args: {status?: overdue|sent|draft|paid|unpaid, search?}', permission: 'read:zoho', run: async (a) => { const r = await reader.listInvoices({ status: a.status, search: a.search, perPage: 15 }); return { invoices: r.items.slice(0, 15).map(slimInvoice), hasMore: r.hasMore }; } },
    get_invoice: { description: 'One invoice from Zoho Books. args: {id}', permission: 'read:zoho', run: async (a) => slimInvoice(await reader.getInvoice(needStr(a.id, 'id'))) },
    find_customer: { description: 'Find a customer in Zoho Books. args: {name}', permission: 'read:zoho', run: async (a) => ({ customers: (await reader.listContacts({ search: needStr(a.name, 'name') })).slice(0, 5).map((c) => ({ id: c.contact_id, name: c.contact_name, type: c.contact_type, gst_no: c.gst_no || null, outstanding_receivable_amount: c.outstanding_receivable_amount ?? null })) }) },
    read_memory: { description: 'Facts the user asked Flux to remember. args: none', permission: 'memory', run: async () => ({ facts: memory.list().slice(0, 20).map((m) => m.text) }) },
  };
  if (browserReader) {
    t.read_public_page = {
      description: 'Read text from one public HTTPS page on the configured allowlist. Read-only; no login or page actions. args: {url}',
      permission: 'web:read',
      run: async (a) => browserReader(needStr(a.url, 'url')),
    };
  }
  return {
    names: Object.keys(t),
    describe: (allowed) => allowed.map((n) => `- ${n}: ${t[n].description}`).join('\n'),
    available: (name, role) => {
      const tool = t[name];
      return !!tool && (!tool.permission || can(role, tool.permission));
    },
    async call(name, args, { role, allowed }) {
      const tool = t[name];
      if (!tool || !allowed.includes(name)) throw new Error(`Tool "${name}" is not available to this agent`);
      if (tool.permission && !can(role, tool.permission)) throw new Error(`Your role cannot use ${name}`);
      return tool.run(args && typeof args === 'object' ? args : {});
    },
  };
}
