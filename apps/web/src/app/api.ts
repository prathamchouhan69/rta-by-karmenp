import type {
  LedgerBill,
  LedgerInvoice,
  InvoiceStatus,
  RiskLevel,
} from './types';

const API_BASE = '/api/v1';
const TOKEN_KEY = 'karm_session_token';

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code = 'API_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export interface LoginResult {
  access_token: string;
  token_type: string;
  expires_in: number;
  message?: string;
}

export interface Organization {
  name: string;
  mode: string;
}

export interface RawInvoice {
  invoice_id?: string;
  invoice_number?: string;
  customer_id?: string;
  customer_name?: string;
  status?: string;
  date?: string;
  due_date?: string;
  total?: string;
  balance?: string;
  sub_total?: string;
  currency_symbol?: string;
  reference_number?: string;
  place_of_supply?: string;
  gst_treatment?: string;
  line_items?: Array<{
    item_id?: string;
    name?: string;
    quantity?: string;
    rate?: string;
    hsn_or_sac?: string;
    unit?: string;
  }>;
  notes?: string;
}

export interface RawContact {
  contact_id?: string;
  contact_name?: string;
  contact_type?: string;
  company_name?: string;
  email?: string;
  phone?: string;
  gstin?: string;
  outstanding?: string;
  outstanding_formatted?: string;
  billing_address?: { city?: string };
}

export interface RawItem {
  item_id?: string;
  name?: string;
  hsn_or_sac?: string;
  rate?: string;
  rate_formatted?: string;
  stock_on_hand?: string;
  unit?: string;
}

export interface RawBill {
  bill_id?: string;
  bill_number?: string;
  vendor_id?: string;
  vendor_name?: string;
  status?: string;
  date?: string;
  due_date?: string;
  total?: string;
  balance?: string;
  category?: string;
}

export interface RawTask {
  task_id?: string;
  title?: string;
  status?: string;
  owner?: string;
  due_date?: string;
  project?: string;
  priority?: string;
  created_at?: string;
}

export interface RawGoal {
  goal_id?: string;
  title?: string;
  metric?: string;
  target?: string;
  current?: string;
  deadline?: string;
  status?: string;
  owner?: string;
}

export interface FluxAnswer {
  answer: string;
  confidence?: 'high' | 'medium' | 'low';
  dataSources?: Array<{ name: string; source: string }>;
  limitations?: string[];
  recommendedActions?: string[];
  evidence?: Array<{ label?: string; detail?: string; source?: string }>;
  health?: { score?: number; riskLevel?: string; summary?: string; nextBestAction?: string };
  engine?: { name?: string; reason?: string };
  source?: string;
  modelConfigured?: boolean;
}

export interface FluxBriefing {
  generatedAt?: string;
  mode?: string;
  counts?: {
    invoices?: number;
    overdueInvoices?: number;
    goals?: number;
    openTasks?: number;
  };
  attention?: Array<{ title?: string; detail?: string; severity?: string }>;
  health?: { score?: number; riskLevel?: string; summary?: string; nextBestAction?: string };
  sources?: Array<{ name?: string; records?: number; scope?: string }>;
}

export interface FluxStatus {
  gateway?: { uptimeSec?: number; requests?: number; errors?: number; avgLatencyMs?: number };
  flux?: { status?: string; auditChain?: { verified?: boolean }; models?: number };
  model?: { configured?: boolean; providers?: string[] };
}

export function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function writeToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage can be unavailable in private mode */
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = readToken();
  const headers = new Headers(init.headers);
  headers.set('accept', 'application/json');
  if (init.body && !headers.has('content-type')) headers.set('content-type', 'application/json');
  if (token) headers.set('authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
      credentials: 'include',
      signal: init.signal ?? AbortSignal.timeout(15000),
    });
  } catch (error) {
    throw new ApiError(
      error instanceof Error ? error.message : 'The workspace API is unreachable.',
      0,
      'NETWORK_ERROR',
    );
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const envelope = payload as { ok?: boolean; data?: T; error?: { code?: string; message?: string } } | null;
  if (!response.ok || envelope?.ok === false) {
    const message = envelope?.error?.message ?? `Request failed (${response.status})`;
    throw new ApiError(message, response.status, envelope?.error?.code ?? 'API_ERROR');
  }

  return (envelope?.data ?? (payload as T)) as T;
}

export const api = {
  readToken,
  writeToken,

  async login(setupCode: string): Promise<LoginResult> {
    const result = await request<LoginResult>('/auth/session', {
      method: 'POST',
      body: JSON.stringify({ setup_code: setupCode }),
    });
    if (result.access_token) writeToken(result.access_token);
    return result;
  },

  async logout(): Promise<void> {
    try {
      await request<unknown>('/auth/signout', { method: 'POST' });
    } catch {
      /* the local token is cleared regardless */
    } finally {
      writeToken(null);
    }
  },

  organization(): Promise<Organization> {
    return request<Organization>('/organization');
  },

  health(): Promise<{ mode: string; service: string; authenticated: boolean; zohoConfigured: boolean }> {
    return request('/health');
  },

  invoices(): Promise<RawInvoice[]> {
    return request<RawInvoice[]>('/invoices?per_page=200');
  },

  contacts(): Promise<RawContact[]> {
    return request<RawContact[]>('/contacts?per_page=200');
  },

  items(): Promise<RawItem[]> {
    return request<RawItem[]>('/items?per_page=200');
  },

  bills(): Promise<RawBill[]> {
    return request<RawBill[]>('/bills?per_page=200');
  },

  tasks(): Promise<RawTask[]> {
    return request<RawTask[]>('/tasks');
  },

  goals(): Promise<RawGoal[]> {
    return request<RawGoal[]>('/goals');
  },

  briefing(): Promise<FluxBriefing> {
    return request<FluxBriefing>('/flux/briefing');
  },

  fluxStatus(): Promise<FluxStatus> {
    return request<FluxStatus>('/flux/status');
  },

  ask(message: string, history: Array<{ role: 'user' | 'assistant'; content: string }> = []): Promise<FluxAnswer> {
    return request<FluxAnswer>('/flux/ask', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    });
  },
};

function statusOf(value: string | undefined): InvoiceStatus {
  const status = String(value || '').toLowerCase();
  if (status === 'paid' || status === 'void' || status === 'draft' || status === 'overdue') {
    return status;
  }
  if (status === 'sent' || status === 'open' || status === 'viewed') return 'sent';
  return 'draft';
}

function riskOf(invoice: RawInvoice): RiskLevel {
  const status = statusOf(invoice.status);
  if (status === 'overdue') return 'critical';
  if (status === 'sent') return 'medium';
  return 'low';
}

export function liveInvoiceToRecord(
  invoice: RawInvoice,
  contacts: Map<string, RawContact>,
  items: Map<string, RawItem>,
): LedgerInvoice {
  const contact = invoice.customer_id ? contacts.get(invoice.customer_id) : undefined;
  const customer = invoice.customer_name || contact?.contact_name || contact?.company_name || 'Zoho Books customer';
  const amount = invoice.total || invoice.balance || invoice.sub_total || '0';
  const date = invoice.date || new Date().toISOString().slice(0, 10);
  return {
    id: invoice.invoice_id || invoice.invoice_number || `zoho-${Math.random().toString(36).slice(2)}`,
    number: invoice.invoice_number || 'Zoho draft',
    customer,
    clientId: contact?.contact_id || invoice.customer_id || 'zoho-contact',
    date,
    dueDate: invoice.due_date || date,
    amount,
    balance: invoice.balance || amount,
    status: statusOf(invoice.status),
    risk: riskOf(invoice),
    project: invoice.reference_number || 'Zoho Books',
    gstin: contact?.gstin || '—',
    placeOfSupply: invoice.place_of_supply || '—',
    lines: (invoice.line_items ?? []).map((line) => {
      const item = line.item_id ? items.get(line.item_id) : undefined;
      return {
        name: line.name || item?.name || 'Line item',
        hsn: line.hsn_or_sac || item?.hsn_or_sac || '—',
        qty: line.quantity || '1',
        unit: line.unit || item?.unit || 'unit',
        rate: line.rate || item?.rate || '0.00',
      };
    }),
    note: invoice.notes || 'Loaded from Zoho Books. Amounts and tax remain authoritative in Zoho.',
  };
}

export function liveBillToRecord(bill: RawBill): LedgerBill {
  const status = String(bill.status || '').toLowerCase();
  return {
    id: bill.bill_id || bill.bill_number || `bill-${Math.random().toString(36).slice(2)}`,
    number: bill.bill_number || 'Zoho bill',
    vendor: bill.vendor_name || 'Zoho Books vendor',
    category: bill.category || 'Purchases',
    date: bill.date || new Date().toISOString().slice(0, 10),
    dueDate: bill.due_date || bill.date || '',
    amount: bill.total || bill.balance || '0',
    balance: bill.balance || bill.total || '0',
    status: status === 'paid' || status === 'overdue' || status === 'draft' ? status : 'open',
  };
}

export interface LiveWorkspacePayload {
  organization: Organization;
  invoices: LedgerInvoice[];
  bills: LedgerBill[];
  contacts: RawContact[];
  items: RawItem[];
  tasks: RawTask[];
  goals: RawGoal[];
  briefing: FluxBriefing | null;
  fetchedAt: string;
}

export async function loadLiveWorkspace(): Promise<LiveWorkspacePayload> {
  const organization = await api.organization();
  const [rawInvoices, rawBills, rawContacts, rawItems, tasks, goals, briefing] = await Promise.all([
    api.invoices().catch(() => [] as RawInvoice[]),
    api.bills().catch(() => [] as RawBill[]),
    api.contacts().catch(() => [] as RawContact[]),
    api.items().catch(() => [] as RawItem[]),
    api.tasks().catch(() => [] as RawTask[]),
    api.goals().catch(() => [] as RawGoal[]),
    api.briefing().catch(() => null),
  ]);

  const contactMap = new Map<string, RawContact>();
  for (const contact of rawContacts) if (contact.contact_id) contactMap.set(contact.contact_id, contact);
  const itemMap = new Map<string, RawItem>();
  for (const item of rawItems) if (item.item_id) itemMap.set(item.item_id, item);

  return {
    organization,
    invoices: rawInvoices.map((invoice) => liveInvoiceToRecord(invoice, contactMap, itemMap)),
    bills: rawBills.map(liveBillToRecord),
    contacts: rawContacts,
    items: rawItems,
    tasks,
    goals,
    briefing,
    fetchedAt: new Date().toISOString(),
  };
}

export function isSubstantiveInvoice(invoice: LedgerInvoice): boolean {
  return Number.parseFloat(invoice.amount) > 0;
}
