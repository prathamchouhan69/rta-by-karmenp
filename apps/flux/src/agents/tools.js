import { can } from '../security/roles.js';
import { validateGstin } from '../checks/gstin.js';
import { fuelTrip } from '../calc/fuel.js';
import { rankDues } from '../calc/ageing.js';
import { daysBetween, istDate, parseDate } from '../util/time.js';
import { searchKnowledge, recommendKnowledge } from '../knowledge/library.js';
import { liveStatus } from '../live/status.js';
import { findSchemes } from '../opportunities/schemes.js';

const slimInvoice = (i) => ({
  id: i.invoice_id,
  invoice_number: i.invoice_number,
  customer_name: i.customer_name,
  status: i.status,
  date: i.date,
  due_date: i.due_date,
  total: i.total,
  balance: i.balance
});

const slimBill = (b) => ({
  id: b.bill_id,
  bill_number: b.bill_number,
  vendor_name: b.vendor_name,
  status: b.status,
  date: b.date,
  due_date: b.due_date,
  total: b.total,
  balance: b.balance
});

const slimContact = (c) => ({
  id: c.contact_id,
  name: c.contact_name,
  type: c.contact_type,
  gst_no: c.gst_no || null,
  outstanding_receivable_amount: c.outstanding_receivable_amount ?? null,
  outstanding_payable_amount: c.outstanding_payable_amount ?? null
});

const needStr = (v, n) => { if (typeof v !== 'string' || !v.trim()) throw new Error(`${n} is required`); return v.trim(); };

// Read and calculate only. No tool here can write to Zoho Books, send anything or approve anything.
export function createTools({ reader, hsn, memory, browserReader = null, now = () => new Date() }) {
  const t = {
    ist_now: {
      description: "Today's date in India (IST). args: none",
      permission: null,
      run: async () => ({ today: istDate(now()) })
    },
    days_between: {
      description: 'Whole days between two dates. args: {from, to} as YYYY-MM-DD or DD/MM/YYYY',
      permission: null,
      run: async (a) => {
        const f = parseDate(a.from), to = parseDate(a.to);
        if (!f || !to) throw new Error('Both dates must be real dates');
        return { days: daysBetween(f, to) };
      }
    },
    gstin_check: {
      description: "Check a GSTIN's format, state and check character (not a live registration check). args: {gstin}",
      permission: null,
      run: async (a) => validateGstin(needStr(a.gstin, 'gstin'))
    },
    fuel_calc: {
      description: 'Trip fuel estimate. args: {distanceKm, loadedKmpl, emptyKmpl, returnMode, dieselPrice, loadMt, otherCosts, freightPerMt, actualLitres}',
      permission: null,
      run: async (a) => fuelTrip(a)
    },
    rank_dues: {
      description: 'Rank overdue invoices by days overdue. args: {rows:[{invoiceNumber,customer,dueDate,balance}], asOf}',
      permission: null,
      run: async (a) => rankDues(a.rows, a.asOf || istDate(now()))
    },
    lookup_hsn: {
      description: 'HSN/SAC status for an item. Never guesses. args: {item, statedRate}',
      permission: 'read:zoho',
      run: async (a) => hsn.resolve(needStr(a.item, 'item'), { statedRate: a.statedRate ?? null })
    },
    find_invoices: {
      description: 'List invoices from Zoho Books. args: {status?: overdue|sent|draft|paid|unpaid, search?, perPage?}',
      permission: 'read:zoho',
      run: async (a) => {
        const r = await reader.listInvoices({
          status: a.status,
          search: a.search,
          perPage: Math.min(Number(a.perPage) || 15, 50)
        });
        return { invoices: r.items.slice(0, 50).map(slimInvoice), hasMore: r.hasMore };
      }
    },
    get_invoice: {
      description: 'One invoice from Zoho Books. args: {id}',
      permission: 'read:zoho',
      run: async (a) => slimInvoice(await reader.getInvoice(needStr(a.id, 'id')))
    },
    find_bills: {
      description: 'List bills from Zoho Books. args: {status?: overdue|open|paid, search?, perPage?}',
      permission: 'read:zoho',
      run: async (a) => {
        const r = await reader.listBills({
          status: a.status,
          search: a.search,
          perPage: Math.min(Number(a.perPage) || 15, 50)
        });
        return { bills: r.items.slice(0, 50).map(slimBill), hasMore: r.hasMore };
      }
    },
    get_bill: {
      description: 'One bill from Zoho Books. args: {id}',
      permission: 'read:zoho',
      run: async (a) => slimBill(await reader.getBill(needStr(a.id, 'id')))
    },
    find_customer: {
      description: 'Find a customer in Zoho Books. args: {name, perPage?}',
      permission: 'read:zoho',
      run: async (a) => ({
        customers: (await reader.listContacts({
          search: needStr(a.name, 'name'),
          perPage: Math.min(Number(a.perPage) || 5, 20)
        })).slice(0, 20).map(slimContact)
      })
    },
    find_vendor: {
      description: 'Find a vendor in Zoho Books. args: {name, perPage?}',
      permission: 'read:zoho',
      run: async (a) => ({
        vendors: (await reader.listContacts({
          search: needStr(a.name, 'name'),
          perPage: Math.min(Number(a.perPage) || 5, 20)
        })).slice(0, 20).map(slimContact)
      })
    },
    customer_ledger: {
      description: 'Get a customer\'s invoice ledger from Zoho Books. args: {customerId, perPage?}',
      permission: 'read:zoho',
      run: async (a) => {
        const r = await reader.listInvoices({
          customerId: needStr(a.customerId, 'customerId'),
          perPage: Math.min(Number(a.perPage) || 20, 50)
        });
        return { invoices: r.items.map(slimInvoice), hasMore: r.hasMore };
      }
    },
    vendor_ledger: {
      description: 'Get a vendor\'s bill ledger from Zoho Books. args: {vendorId, perPage?}',
      permission: 'read:zoho',
      run: async (a) => {
        const r = await reader.listBills({
          vendorId: needStr(a.vendorId, 'vendorId'),
          perPage: Math.min(Number(a.perPage) || 20, 50)
        });
        return { bills: r.items.map(slimBill), hasMore: r.hasMore };
      }
    },
    read_memory: {
      description: 'Facts the user asked Flux to remember. args: none',
      permission: 'memory',
      run: async () => ({ facts: memory.list().slice(0, 20).map((m) => m.text) })
    },
    search_knowledge: {
      description: 'Search the curated knowledge library by keyword. Returns principles, frameworks and cited sources, not live data. args: {query, category?, limit?}',
      permission: 'knowledge:read',
      run: async (a) => searchKnowledge({
        query: String(a.query || '').slice(0, 300),
        category: a.category ? String(a.category).slice(0, 80) : null,
        limit: Math.min(Number(a.limit) || 8, 20)
      })
    },
    recommend_knowledge: {
      description: 'Recommend curated knowledge for a context such as money, business, construction, startup, health, india, ai, marketing or operations. args: {context, limit?}',
      permission: 'knowledge:read',
      run: async (a) => recommendKnowledge({
        context: String(a.context || 'business').slice(0, 40),
        limit: Math.min(Number(a.limit) || 6, 20)
      })
    },
    find_schemes: {
      description: 'Search the curated government-scheme directory with official sources. Not a live eligibility check. args: {query, limit?}',
      permission: 'knowledge:read',
      run: async (a) => findSchemes({
        query: String(a.query || '').slice(0, 300),
        limit: Math.min(Number(a.limit) || 10, 20)
      })
    },
    live_data_status: {
      description: 'Say which live data feeds are configured. Use before answering questions about live economy, currency, tenders, schemes, news, market prices or local intelligence. args: none',
      permission: 'live:read',
      run: async () => liveStatus()
    },
    cash_position: {
      description: 'Get current cash position from Zoho Books (bank accounts). args: none',
      permission: 'read:zoho',
      run: async () => {
        const accounts = await reader.listBankAccounts();
        return { accounts: accounts.map(a => ({ name: a.account_name, balance: a.balance, type: a.account_type })) };
      }
    },
    bank_transactions: {
      description: 'List recent bank transactions from Zoho Books. args: {accountId?, perPage?, days?}',
      permission: 'read:zoho',
      run: async (a) => {
        const r = await reader.listBankTransactions({
          accountId: a.accountId,
          perPage: Math.min(Number(a.perPage) || 50, 100),
          days: Number(a.days) || 30
        });
        return { transactions: r.items, hasMore: r.hasMore };
      }
    },
    reconciliation_status: {
      description: 'Get bank reconciliation status from Zoho Books. args: none',
      permission: 'read:zoho',
      run: async () => {
        const status = await reader.getReconciliationStatus();
        return status;
      }
    }
  };

  if (browserReader) {
    t.read_public_page = {
      description: 'Read text from one public HTTPS page on the configured allowlist. Read-only; no login or page actions. args: {url}',
      permission: 'web:read',
      run: async (a) => browserReader(needStr(a.url, 'url'))
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
    }
  };
}