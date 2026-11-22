// RTA by KARM — Comprehensive Enterprise Operational Data
export interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  date: string;
  due_date: string;
  total: string;
  total_formatted?: string;
  balance: string;
  balance_formatted?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'void';
  currency_symbol: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  items_count: number;
  gst_treatment: string;
  place_of_supply: string;
  notes?: string;
}

export interface Bill {
  id: string;
  bill_number: string;
  vendor_name: string;
  date: string;
  due_date: string;
  total: string;
  total_formatted?: string;
  balance: string;
  balance_formatted?: string;
  status: 'draft' | 'open' | 'paid' | 'overdue';
  category: string;
}

export interface BankTransaction {
  id: string;
  date: string;
  account_name: string;
  payee: string;
  type: 'credit' | 'debit';
  amount: string;
  status: 'reconciled' | 'unreconciled' | 'matched';
  reference_no: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  progress: number; // 0 - 100
  budget: string;
  spent: string;
  status: 'on_track' | 'at_risk' | 'delayed' | 'completed';
  start_date: string;
  end_date: string;
  earned_value: string;
  milestones: { id: string; title: string; completed: boolean; due_date: string }[];
  tasks_count: number;
  delayed_days?: number;
}

export interface Task {
  id: string;
  title: string;
  project_id: string;
  project_name: string;
  assignee: { name: string; avatar: string; role: string };
  status: 'backlog' | 'in_progress' | 'in_review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string;
  estimated_hours: number;
  logged_hours: number;
  dependencies: string[]; // task IDs
  tags: string[];
}

export interface FileItem {
  id: string;
  name: string;
  size: string;
  size_bytes: number;
  type: string;
  uploaded_at: string;
  updated_at: string;
  versions_count: number;
  versions: { version: number; date: string; author: string; note: string }[];
  related_files: string[];
  is_deleted?: boolean;
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  driver: string;
  status: 'in_transit' | 'idle' | 'maintenance' | 'charging';
  battery_level: number;
  current_location: string;
  destination: string;
  eta: string;
  efficiency_score: number;
  on_time_rate: number;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  join_date: string;
  status: 'active' | 'on_leave' | 'remote';
  productivity_score: number;
  active_tasks: number;
  monthly_payroll: string;
}

export interface ClientAccount {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  health_score: number; // 0 - 100
  deal_value: string;
  stage: 'lead' | 'proposal' | 'negotiation' | 'active' | 'renewal';
  mrr: string;
  partner_status: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: 'accounting' | 'projects' | 'fleet' | 'system' | 'security';
  severity: 'info' | 'warning' | 'critical' | 'success';
  timestamp: string;
  read: boolean;
  action_url?: string;
}

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-001',
    invoice_number: 'INV-2026-0891',
    customer_name: 'Apex Hyperdynamics Corp',
    date: '2026-11-01',
    due_date: '2026-11-15',
    total: '845000',
    balance: '845000',
    status: 'overdue',
    currency_symbol: '₹',
    risk_level: 'critical',
    items_count: 5,
    gst_treatment: 'business_gst',
    place_of_supply: 'Maharashtra (27)',
    notes: 'Awaiting executive approval on milestone 3 signoff'
  },
  {
    id: 'inv-002',
    invoice_number: 'INV-2026-0892',
    customer_name: 'Titanium Quantum Systems',
    date: '2026-11-05',
    due_date: '2026-11-20',
    total: '1250000',
    balance: '0',
    status: 'paid',
    currency_symbol: '₹',
    risk_level: 'low',
    items_count: 3,
    gst_treatment: 'business_gst',
    place_of_supply: 'Karnataka (29)'
  },
  {
    id: 'inv-003',
    invoice_number: 'INV-2026-0893',
    customer_name: 'Starlight Orbital Logistics',
    date: '2026-11-10',
    due_date: '2026-11-25',
    total: '420000',
    balance: '420000',
    status: 'sent',
    currency_symbol: '₹',
    risk_level: 'medium',
    items_count: 2,
    gst_treatment: 'business_gst',
    place_of_supply: 'Delhi (07)'
  },
  {
    id: 'inv-004',
    invoice_number: 'INV-2026-0894',
    customer_name: 'Helios Semiconductor Lab',
    date: '2026-11-12',
    due_date: '2026-11-18',
    total: '980000',
    balance: '980000',
    status: 'overdue',
    currency_symbol: '₹',
    risk_level: 'high',
    items_count: 4,
    gst_treatment: 'business_gst',
    place_of_supply: 'Gujarat (24)'
  },
  {
    id: 'inv-005',
    invoice_number: 'INV-2026-0895',
    customer_name: 'Nebula Biopharmaceutics',
    date: '2026-11-18',
    due_date: '2026-12-02',
    total: '615000',
    balance: '615000',
    status: 'sent',
    currency_symbol: '₹',
    risk_level: 'low',
    items_count: 6,
    gst_treatment: 'business_gst',
    place_of_supply: 'Telangana (36)'
  }
];

export const INITIAL_BILLS: Bill[] = [
  { id: 'bill-101', bill_number: 'BILL-4819', vendor_name: 'CloudScale Infrastructure', date: '2026-11-02', due_date: '2026-11-16', total: '142000', balance: '0', status: 'paid', category: 'Hosting & Servers' },
  { id: 'bill-102', bill_number: 'BILL-4820', vendor_name: 'Kyoto Precision Robotics', date: '2026-11-08', due_date: '2026-11-22', total: '530000', balance: '530000', status: 'open', category: 'Hardware Components' },
  { id: 'bill-103', bill_number: 'BILL-4821', vendor_name: 'Optima Fuel & Energy Grid', date: '2026-11-14', due_date: '2026-11-28', total: '88500', balance: '88500', status: 'open', category: 'Fleet Operations' }
];

export const INITIAL_BANK_TRANSACTIONS: BankTransaction[] = [
  { id: 'txn-501', date: '2026-11-20', account_name: 'HDFC Corporate Primary #4019', payee: 'Titanium Quantum Systems', type: 'credit', amount: '1250000', status: 'reconciled', reference_no: 'NEFT-8891024-HDFC' },
  { id: 'txn-502', date: '2026-11-19', account_name: 'ICICI Current Operational #9912', payee: 'Kyoto Precision Robotics', type: 'debit', amount: '265000', status: 'unreconciled', reference_no: 'RTGS-019283-ICICI' },
  { id: 'txn-503', date: '2026-11-18', account_name: 'HDFC Corporate Primary #4019', payee: 'State Tax Department (GSTN)', type: 'debit', amount: '184500', status: 'matched', reference_no: 'GST-PAY-NOV-2026' }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-01',
    name: 'Autonomous Fleet Telematics v4',
    client: 'Starlight Orbital Logistics',
    progress: 78,
    budget: '4500000',
    spent: '3420000',
    status: 'on_track',
    start_date: '2026-08-01',
    end_date: '2026-12-15',
    earned_value: '3510000',
    tasks_count: 24,
    milestones: [
      { id: 'm-1', title: 'Hardware Sensor Telemetry Bus', completed: true, due_date: '2026-09-15' },
      { id: 'm-2', title: 'Slime Mold Route Engine', completed: true, due_date: '2026-10-30' },
      { id: 'm-3', title: 'Field Deployment Smoke Test', completed: false, due_date: '2026-11-30' },
      { id: 'm-4', title: 'Enterprise Fleet Handover', completed: false, due_date: '2026-12-15' }
    ]
  },
  {
    id: 'proj-02',
    name: 'Tesla Resonant Energy Monitoring OS',
    client: 'Apex Hyperdynamics Corp',
    progress: 42,
    budget: '6800000',
    spent: '3900000',
    status: 'delayed',
    delayed_days: 9,
    start_date: '2026-09-10',
    end_date: '2027-01-20',
    earned_value: '2856000',
    tasks_count: 36,
    milestones: [
      { id: 'm-21', title: 'Power Grid Harmonic Sampling', completed: true, due_date: '2026-10-15' },
      { id: 'm-22', title: 'High-Frequency Arc Ingestion', completed: false, due_date: '2026-11-12' },
      { id: 'm-23', title: 'Firmware 2.4 Safety Verification', completed: false, due_date: '2026-12-20' }
    ]
  },
  {
    id: 'proj-03',
    name: 'Quantum Probability Risk Engine',
    client: 'Titanium Quantum Systems',
    progress: 91,
    budget: '3200000',
    spent: '2950000',
    status: 'on_track',
    start_date: '2026-07-01',
    end_date: '2026-11-30',
    earned_value: '2912000',
    tasks_count: 18,
    milestones: [
      { id: 'm-31', title: 'Mathematical Kernel Validation', completed: true, due_date: '2026-08-30' },
      { id: 'm-32', title: 'Multi-Scenario Forecast Waveform', completed: true, due_date: '2026-10-15' },
      { id: 'm-33', title: 'Final Production Certification', completed: false, due_date: '2026-11-30' }
    ]
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-001',
    title: 'Deploy Tesla Coil Resonant Pulse Stream to Zoho Books',
    project_id: 'proj-02',
    project_name: 'Tesla Resonant Energy Monitoring OS',
    assignee: { name: 'Karmesh Patel', avatar: 'KP', role: 'Lead Architect' },
    status: 'in_progress',
    priority: 'urgent',
    due_date: '2026-11-22',
    estimated_hours: 16,
    logged_hours: 11,
    dependencies: [],
    tags: ['Zoho', 'Accounting', 'Tesla Coil']
  },
  {
    id: 'task-002',
    title: 'Execute Slime Mold Multi-Stop Route Recalculation',
    project_id: 'proj-01',
    project_name: 'Autonomous Fleet Telematics v4',
    assignee: { name: 'Arya Sharma', avatar: 'AS', role: 'Algorithm Engineer' },
    status: 'in_progress',
    priority: 'high',
    due_date: '2026-11-23',
    estimated_hours: 12,
    logged_hours: 8,
    dependencies: ['task-001'],
    tags: ['Routing', 'Fleet', 'Slime Mold']
  },
  {
    id: 'task-003',
    title: 'Calibrate Black Hole Gravitational Risk Vortex for Overdue Receivables',
    project_id: 'proj-02',
    project_name: 'Tesla Resonant Energy Monitoring OS',
    assignee: { name: 'Devika Rao', avatar: 'DR', role: 'Risk Analyst' },
    status: 'backlog',
    priority: 'urgent',
    due_date: '2026-11-24',
    estimated_hours: 8,
    logged_hours: 0,
    dependencies: [],
    tags: ['Risk', 'Overdue', 'Black Hole']
  },
  {
    id: 'task-004',
    title: 'Verify Tardigrade Offline Storage Mutation Replay Queue',
    project_id: 'proj-03',
    project_name: 'Quantum Probability Risk Engine',
    assignee: { name: 'Vikram Joshi', avatar: 'VJ', role: 'Systems Engineer' },
    status: 'done',
    priority: 'medium',
    due_date: '2026-11-19',
    estimated_hours: 10,
    logged_hours: 10,
    dependencies: [],
    tags: ['Offline', 'PWA', 'Tardigrade']
  },
  {
    id: 'task-005',
    title: 'Synchronize Google Calendar Milestone Deadlines',
    project_id: 'proj-01',
    project_name: 'Autonomous Fleet Telematics v4',
    assignee: { name: 'Karmesh Patel', avatar: 'KP', role: 'Lead Architect' },
    status: 'in_review',
    priority: 'medium',
    due_date: '2026-11-21',
    estimated_hours: 6,
    logged_hours: 5,
    dependencies: [],
    tags: ['Google Calendar', 'Deadlines']
  }
];

export const INITIAL_FILES: FileItem[] = [
  {
    id: 'file-01',
    name: 'KARM-Zoho-Books-Master-Reconciliation-Q3.xlsx',
    size: '4.8 MB',
    size_bytes: 5033164,
    type: 'spreadsheet',
    uploaded_at: '2026-11-01',
    updated_at: '2026-11-20',
    versions_count: 5,
    versions: [
      { version: 5, date: '2026-11-20 14:30', author: 'Karmesh Patel', note: 'Reconciled HDFC live scan' },
      { version: 4, date: '2026-11-18 11:15', author: 'Devika Rao', note: 'Added GST adjustment lines' },
      { version: 3, date: '2026-11-15 09:40', author: 'Karmesh Patel', note: 'Initial import from Zoho Books' }
    ],
    related_files: ['file-02', 'file-03']
  },
  {
    id: 'file-02',
    name: 'Autonomous-Vehicle-Telemetry-Spec-v4.2.pdf',
    size: '12.4 MB',
    size_bytes: 13002342,
    type: 'pdf',
    uploaded_at: '2026-10-25',
    updated_at: '2026-11-16',
    versions_count: 3,
    versions: [
      { version: 3, date: '2026-11-16 16:20', author: 'Arya Sharma', note: 'Integrated Slime Mold algorithms' }
    ],
    related_files: ['file-01']
  },
  {
    id: 'file-03',
    name: 'Board-Resolution-Tax-Provision-2026.docx',
    size: '1.2 MB',
    size_bytes: 1258291,
    type: 'document',
    uploaded_at: '2026-11-10',
    updated_at: '2026-11-10',
    versions_count: 1,
    versions: [
      { version: 1, date: '2026-11-10 10:00', author: 'Karmesh Patel', note: 'Signed board resolution' }
    ],
    related_files: []
  }
];

export const INITIAL_VEHICLES: Vehicle[] = [
  { id: 'veh-01', plate: 'MH-12-QX-4891', model: 'Volvo Electric Heavy Feeder', driver: 'Rajesh Mehra', status: 'in_transit', battery_level: 84, current_location: 'Pune Bypass NH48', destination: 'JNPT Port Mumbai', eta: '42 mins', efficiency_score: 96, on_time_rate: 98.4 },
  { id: 'veh-02', plate: 'KA-04-ET-9920', model: 'Tata Ultra Electric Van', driver: 'Sunil Kumar', status: 'in_transit', battery_level: 62, current_location: 'Electronic City Flyover', destination: 'Peenya Industrial Node', eta: '28 mins', efficiency_score: 92, on_time_rate: 94.2 },
  { id: 'veh-03', plate: 'DL-01-ZZ-3301', model: 'BYD E-Transit Fleet', driver: 'Amit Singh', status: 'charging', battery_level: 35, current_location: 'Noida Hub Supercharger', destination: 'Gurugram Cybercity', eta: 'Scheduled 19:30', efficiency_score: 89, on_time_rate: 91.0 }
];

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'emp-01', name: 'Karmesh Patel', role: 'Chief Operating Officer & Architect', department: 'Executive', email: 'karmesh@karm.os', join_date: '2024-01-15', status: 'active', productivity_score: 98, active_tasks: 5, monthly_payroll: '350000' },
  { id: 'emp-02', name: 'Arya Sharma', role: 'Staff Systems & Algorithm Lead', department: 'Engineering', email: 'arya@karm.os', join_date: '2024-06-01', status: 'active', productivity_score: 94, active_tasks: 4, monthly_payroll: '220000' },
  { id: 'emp-03', name: 'Devika Rao', role: 'Principal Financial Controller', department: 'Finance', email: 'devika@karm.os', join_date: '2024-03-10', status: 'active', productivity_score: 96, active_tasks: 3, monthly_payroll: '240000' },
  { id: 'emp-04', name: 'Vikram Joshi', role: 'Lead DevOps & Reliability', department: 'Infrastructure', email: 'vikram@karm.os', join_date: '2025-02-15', status: 'active', productivity_score: 91, active_tasks: 4, monthly_payroll: '190000' }
];

export const INITIAL_CLIENTS: ClientAccount[] = [
  { id: 'client-01', name: 'Apex Hyperdynamics Corp', contact_person: 'Elena Rostova', email: 'elena@apex.co', health_score: 72, deal_value: '6800000', stage: 'active', mrr: '450000', partner_status: 'Strategic Prime' },
  { id: 'client-02', name: 'Titanium Quantum Systems', contact_person: 'Dr. Marcus Vance', email: 'mvance@titanium-q.io', health_score: 96, deal_value: '8200000', stage: 'renewal', mrr: '680000', partner_status: 'Alliance Tier 1' },
  { id: 'client-03', name: 'Starlight Orbital Logistics', contact_person: 'Farhan Siddiqui', email: 'farhan@starlight-logistics.com', health_score: 88, deal_value: '4500000', stage: 'active', mrr: '380000', partner_status: 'Ecosystem Partner' }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  { id: 'notif-01', title: 'Tesla Coil Arc: Live Zoho Books Sync Ready', message: 'New bank statement feed with 14 reconciled line items from HDFC.', category: 'accounting', severity: 'info', timestamp: '2 mins ago', read: false, action_url: '/accounting' },
  { id: 'notif-02', title: 'Black Hole Risk Alert: Overdue Invoice #INV-2026-0891', message: 'Apex Hyperdynamics ₹8,45,000 balance is 5 days past due date.', category: 'accounting', severity: 'critical', timestamp: '15 mins ago', read: false, action_url: '/invoices/inv-001' },
  { id: 'notif-03', title: 'Coral Growth Milestone: Sensor Bus Completed', message: 'Autonomous Fleet Telematics v4 reached 78% overall earned value.', category: 'projects', severity: 'success', timestamp: '1 hour ago', read: false, action_url: '/projects/proj-01' },
  { id: 'notif-04', title: 'Tardigrade Offline Protection: Local Sync Active', message: 'All pending mutations safely cached in encrypted local store.', category: 'system', severity: 'info', timestamp: '3 hours ago', read: true }
];
