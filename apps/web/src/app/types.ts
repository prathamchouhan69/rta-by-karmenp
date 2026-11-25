/* RTA by KARM — workspace domain types shared by the operator console. */

export type SourceMode = 'demo' | 'practice' | 'live';
export type Tone = 'cyan' | 'violet' | 'amber' | 'rose' | 'sage' | 'neutral';
export type TrendDirection = 'up' | 'down' | 'flat';

export interface ReferenceItem {
  num: number;
  name: string;
  category: string;
  scientific: string;
  nature: string;
  business: string;
  workflow: string;
  app_data: string;
  screen: string;
  user_action: string;
  connected_chart: string;
  motion: string;
  visual: string;
  interaction: string;
  states: string;
  why_unique: string;
}

export interface Kpi {
  id: string;
  label: string;
  value: string;
  raw: number;
  unit: string;
  delta: string;
  direction: TrendDirection;
  caption: string;
  tone: Tone;
  spark: number[];
}

export interface InvoiceLine {
  name: string;
  hsn: string;
  qty: string;
  unit: string;
  rate: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'overdue' | 'paid' | 'void';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface LedgerInvoice {
  id: string;
  number: string;
  customer: string;
  clientId: string;
  date: string;
  dueDate: string;
  amount: string;
  balance: string;
  status: InvoiceStatus;
  risk: RiskLevel;
  project: string;
  gstin: string;
  placeOfSupply: string;
  lines: InvoiceLine[];
  note: string;
}

export interface LedgerBill {
  id: string;
  number: string;
  vendor: string;
  category: string;
  date: string;
  dueDate: string;
  amount: string;
  balance: string;
  status: 'open' | 'paid' | 'overdue' | 'draft';
}

export interface BankLine {
  id: string;
  date: string;
  account: string;
  party: string;
  reference: string;
  direction: 'credit' | 'debit';
  amount: string;
  status: 'reconciled' | 'matched' | 'unreconciled';
}

export interface ProjectMilestone {
  id: string;
  title: string;
  due: string;
  done: boolean;
  weight: number;
}

export interface ProjectSite {
  id: string;
  code: string;
  name: string;
  client: string;
  location: string;
  progress: number;
  budget: string;
  spent: string;
  contracted: string;
  earned: string;
  status: 'on_track' | 'at_risk' | 'delayed' | 'closing';
  start: string;
  end: string;
  lead: string;
  headcount: number;
  milestones: ProjectMilestone[];
  sCurve: { month: string; planned: number; earned: number }[];
  note: string;
}

export interface FleetUnit {
  id: string;
  plate: string;
  model: string;
  kind: 'tipper' | 'excavator' | 'loader' | 'pickup';
  driver: string;
  status: 'in_transit' | 'loading' | 'idle' | 'maintenance';
  utilisation: number;
  fuel: number;
  odometer: string;
  origin: string;
  destination: string;
  cargo: string;
  eta: string;
  health: number;
  lastService: string;
}

export interface MaterialStock {
  id: string;
  name: string;
  hsn: string;
  grade: string;
  unit: string;
  stock: string;
  reorder: string;
  rate: string;
  cost: string;
  margin: string;
  location: string;
  movement: 'inbound' | 'outbound' | 'steady';
  tone: Tone;
}

export interface GateItem {
  id: string;
  title: string;
  authority: string;
  reference: string;
  due: string;
  owner: string;
  severity: 'critical' | 'warning' | 'clear' | 'info';
  status: 'action_required' | 'in_progress' | 'cleared' | 'monitoring';
  detail: string;
}

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  pod: string;
  location: string;
  status: 'onsite' | 'remote' | 'leave';
  load: number;
  phone: string;
  joined: string;
  skills: string[];
}

export interface ClientRecord {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  gstin: string;
  city: string;
  health: number;
  outstanding: string;
  lifetime: string;
  stage: 'active' | 'renewal' | 'prospect' | 'watch';
  since: string;
  nextStep: string;
  invoices: number;
}

export type DocumentKind =
  | 'Quotation'
  | 'Proforma'
  | 'Sales order'
  | 'Invoice'
  | 'Delivery challan'
  | 'E-way bill'
  | 'Credit note'
  | 'Purchase order'
  | 'Bill'
  | 'Payment receipt'
  | 'Work order'
  | 'Measurement book'
  | 'GST return';

export interface DocumentRecord {
  id: string;
  title: string;
  kind: DocumentKind;
  reference: string;
  party: string;
  updated: string;
  size: string;
  version: string;
  status: 'draft' | 'sent' | 'signed' | 'filed' | 'archived';
  owner: string;
  tone: Tone;
}

export interface ActivityEvent {
  id: string;
  time: string;
  actor: string;
  action: string;
  target: string;
  kind: 'ledger' | 'project' | 'fleet' | 'gate' | 'flux' | 'people';
  tone: Tone;
}

export interface FluxInsight {
  id: string;
  question: string;
  answer: string;
  confidence: 'high' | 'medium' | 'low';
  evidence: string[];
  action: string;
  tone: Tone;
}

export interface Dispatch {
  id: string;
  challan: string;
  vehicle: string;
  material: string;
  quantity: string;
  from: string;
  to: string;
  status: 'loading' | 'in_transit' | 'delivered' | 'hold';
  eta: string;
}

export interface WorkspaceSnapshot {
  source: SourceMode;
  organization: string;
  operator: string;
  syncedAt: string;
  kpis: Kpi[];
  invoices: LedgerInvoice[];
  bills: LedgerBill[];
  bank: BankLine[];
  projects: ProjectSite[];
  fleet: FleetUnit[];
  materials: MaterialStock[];
  gates: GateItem[];
  team: TeamMember[];
  clients: ClientRecord[];
  documents: DocumentRecord[];
  activity: ActivityEvent[];
  insights: FluxInsight[];
  dispatches: Dispatch[];
  cashflow: { month: string; inflow: number; outflow: number; net: number }[];
  receivables: { name: string; value: number; color: string }[];
  revenue: { month: string; revenue: number; target: number }[];
  references: ReferenceItem[];
}

export interface FluxMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
  confidence?: 'high' | 'medium' | 'low';
  evidence?: string[];
  pending?: boolean;
}

export interface LiveEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: { code: string; message: string };
}
