import {
  Boxes,
  Files,
  Handshake,
  HardHat,
  LayoutDashboard,
  Leaf,
  Settings,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
  Wallet,
  Gauge,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type RouteKey =
  | 'dashboard'
  | 'today'
  | 'money'
  | 'projects'
  | 'fleet'
  | 'materials'
  | 'gates'
  | 'people'
  | 'clients'
  | 'documents'
  | 'flux'
  | 'settings'
  | 'login';

export interface NavItem {
  key: RouteKey;
  label: string;
  short: string;
  icon: LucideIcon;
  group: 'Operate' | 'Record' | 'Intelligence';
  hint: string;
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', short: 'Dash', icon: Gauge, group: 'Operate', hint: 'Live command center' },
  { key: 'today', label: 'Command deck', short: 'Today', icon: LayoutDashboard, group: 'Operate', hint: 'The morning decision stack' },
  { key: 'money', label: 'Money', short: 'Money', icon: Wallet, group: 'Operate', hint: 'Zoho Books ledger & cash' },
  { key: 'projects', label: 'Projects', short: 'Sites', icon: HardHat, group: 'Operate', hint: 'Delivery, S-curve & milestones' },
  { key: 'fleet', label: 'Fleet', short: 'Fleet', icon: Truck, group: 'Operate', hint: 'Dispatch, plant & telemetry' },
  { key: 'materials', label: 'Materials', short: 'Stock', icon: Boxes, group: 'Record', hint: 'Stock, rates & HSN' },
  { key: 'gates', label: 'Gates', short: 'Gates', icon: ShieldCheck, group: 'Record', hint: 'Statutory approvals & audit' },
  { key: 'people', label: 'People', short: 'People', icon: Users, group: 'Record', hint: 'Team, load & field presence' },
  { key: 'clients', label: 'Clients', short: 'Clients', icon: Handshake, group: 'Record', hint: 'Relationships & receivables' },
  { key: 'documents', label: 'Documents', short: 'Docs', icon: Files, group: 'Record', hint: '13 document kinds' },
  { key: 'flux', label: 'Flux AI', short: 'Flux', icon: Sparkles, group: 'Intelligence', hint: 'Source-grounded decisions' },
  { key: 'settings', label: 'Settings', short: 'Settings', icon: Settings, group: 'Intelligence', hint: 'Workspace, theme & security' },
];

export const NAV_GROUPS: Array<{ label: NavItem['group']; items: NavItem[] }> = [
  { label: 'Operate', items: NAV_ITEMS.filter((item) => item.group === 'Operate') },
  { label: 'Record', items: NAV_ITEMS.filter((item) => item.group === 'Record') },
  { label: 'Intelligence', items: NAV_ITEMS.filter((item) => item.group === 'Intelligence') },
];

export const ROUTE_LABELS: Record<RouteKey, string> = {
  dashboard: 'Dashboard',
  today: 'Command deck',
  money: 'Money',
  projects: 'Projects',
  fleet: 'Fleet',
  materials: 'Materials',
  gates: 'Gates',
  people: 'People',
  clients: 'Clients',
  documents: 'Documents',
  flux: 'Flux AI',
  settings: 'Settings',
  login: 'Sign in',
};

export const MOBILE_ITEMS: NavItem[] = [
  NAV_ITEMS[0],
  NAV_ITEMS[1],
  NAV_ITEMS[2],
  NAV_ITEMS[3],
  NAV_ITEMS[4],
  NAV_ITEMS[9],
];
