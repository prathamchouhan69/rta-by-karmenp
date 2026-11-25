import React from 'react';

// ==========================================================================
// RTA by KARM — PROPRIETARY ICONOGRAPHY SYSTEM (UK ENGLISH)
// Original, World-Class, Living Organic-Tech Icon Language for Indian Industrial OS
// No Lucide, No Feather, No Material, No FontAwesome, No Third-Party Packs
// ==========================================================================

export type KarmIconState =
  | 'default'
  | 'hover'
  | 'active'
  | 'pressed'
  | 'selected'
  | 'disabled'
  | 'loading'
  | 'error'
  | 'warning'
  | 'success'
  | 'flux-thinking'
  | 'flux-responding';

export interface KarmIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  state?: KarmIconState;
  color?: string;
  strokeWidth?: number;
  label?: string;
  ariaHidden?: boolean;
}

// Compute state-based styles and stroke colors (Strict Green Rule: No green for success)
const resolveIconColor = (state?: KarmIconState, explicitColor?: string): string => {
  if (explicitColor) return explicitColor;
  switch (state) {
    case 'selected':
    case 'active':
      return '#00f2fe'; // Karm Electric Cyan
    case 'error':
      return '#ef4444'; // Crimson alert
    case 'warning':
      return '#f59e0b'; // Amber caution
    case 'success':
      return '#22d3ee'; // Crisp Sky / Lapis — NO GREEN for success (Green Rule compliant)
    case 'flux-thinking':
      return '#00f2fe'; // Living pulse cyan
    case 'flux-responding':
      return '#7000ff'; // Living violet
    case 'disabled':
      return '#475569'; // Muted slate
    case 'hover':
      return '#ffffff';
    default:
      return 'currentColor';
  }
};

const resolveIconClasses = (state?: KarmIconState, baseClass: string = ''): string => {
  let stateClass = '';
  if (state === 'flux-thinking') stateClass = 'anim-karm-flux';
  if (state === 'loading') stateClass = 'anim-karm-sync';
  if (state === 'warning') stateClass = 'anim-karm-attention';
  return `karm-icon ${stateClass} ${baseClass}`.trim();
};

// --------------------------------------------------------------------------
// 1. FLUX & OS LIVING CORE ICONS
// --------------------------------------------------------------------------

/** Flux Living Intelligence Core: Quantum tetrahedral star with central nucleus aperture */
export const IconFlux: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Flux Intelligence',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M12 2.5L15.5 8.5L22 12L15.5 15.5L12 21.5L8.5 15.5L2 12L8.5 8.5L12 2.5Z" />
      <circle cx="12" cy="12" r="2.5" fill={stroke} fillOpacity={state === 'active' || state === 'selected' ? 0.35 : 0.15} />
      <path d="M12 7V9.5M12 14.5V17M7 12H9.5M14.5 12H17" strokeWidth={1.2} />
    </svg>
  );
};

/** Life Scanning: High-frequency radar / plasma wave telemetry */
export const IconLifeScan: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Life Scanning',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12" />
      <path d="M6.5 12C6.5 8.96243 8.96243 6.5 12 6.5C15.0376 6.5 17.5 8.96243 17.5 12" strokeDasharray="2 2" />
      <circle cx="12" cy="12" r="2.5" fill={stroke} fillOpacity={0.25} />
      <path d="M12 12L18.5 5.5" strokeWidth={1.5} />
      <path d="M4 17L7 20L11 16L15 20L20 15" strokeWidth={1.5} />
    </svg>
  );
};

/** Tesla Coil Resonant Energy Arc */
export const IconTeslaCoil: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Tesla Coil Resonant Arc',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <circle cx="12" cy="4" r="2.5" fill={stroke} fillOpacity={0.2} />
      <path d="M7 8H17M5.5 12H18.5M8 16H16M10 20H14" />
      <path d="M12 6.5V21" />
      <path d="M9 10L6.5 14H17.5L15 10" strokeWidth={1.2} />
    </svg>
  );
};

/** Command Center (Home): Multi-layered cockpit command crest */
export const IconHome: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Command Center',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M3 10.5L12 3.5L21 10.5V19.5C21 20.3284 20.3284 21 19.5 21H4.5C3.67157 21 3 20.3284 3 19.5V10.5Z" />
      <path d="M9 21V13.5H15V21" />
      <circle cx="12" cy="8.5" r="1.5" fill={stroke} fillOpacity={0.4} />
    </svg>
  );
};

// --------------------------------------------------------------------------
// 2. FINANCIAL, LEDGER & ZOHO BOOKS ICONS
// --------------------------------------------------------------------------

/** Invoices & Accounts: Chamfered financial ledger with Indian Rupee folding integral */
export const IconAccounting: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Accounting & Cash Flow',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M3 9.5H21" />
      {/* Indian Rupee ₹ Symbol Integration */}
      <path d="M8 13.5H12M8 15.5H11M8 12H13C14 12 14.5 13 14.5 13.8C14.5 14.8 13.8 15.5 12.5 15.5L8.5 18" strokeWidth={1.5} />
      <circle cx="17.5" cy="15.5" r="1.5" fill={stroke} fillOpacity={0.3} />
    </svg>
  );
};

/** Invoices: Formal technical commercial invoice document */
export const IconInvoice: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Invoice',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M5 3.5H19C19.5523 3.5 20 3.94772 20 4.5V20.5L17.5 19L15 20.5L12 19L9 20.5L6.5 19L4 20.5V4.5C4 3.94772 4.44772 3.5 5 3.5Z" />
      <path d="M8 8H16M8 12H16M8 15H12" strokeWidth={1.5} />
    </svg>
  );
};

/** Payments: Instant quantum vector exchange */
export const IconPayment: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Payments',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 10H21.5" />
      <path d="M7 15H11" strokeWidth={2} />
      <circle cx="17" cy="15" r="1.5" fill={stroke} fillOpacity={0.4} />
    </svg>
  );
};

/** Zoho Books Connector: Bi-directional double-entry cloud synchronization engine */
export const IconZohoBooks: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Zoho Books Live Integration',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M4 6.5C4 5.11929 5.11929 4 6.5 4H17.5C18.8807 4 20 5.11929 20 6.5V17.5C20 18.8807 18.8807 20 17.5 20H6.5C5.11929 20 4 18.8807 4 17.5V6.5Z" />
      <path d="M8 8L16 16M16 8L8 16" strokeWidth={1.5} />
      <circle cx="8" cy="8" r="1.5" fill={stroke} />
      <circle cx="16" cy="16" r="1.5" fill={stroke} />
    </svg>
  );
};

// --------------------------------------------------------------------------
// 3. WORKFLOW, TASKS, APPROVALS & PROJECTS
// --------------------------------------------------------------------------

/** Projects: Interlocking structural crystalline cubes representing construction milestones */
export const IconProjects: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Projects',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M12 2.5L20 7V17L12 21.5L4 17V7L12 2.5Z" />
      <path d="M12 2.5V12M12 12L20 7M12 12L4 7M12 12V21.5" />
      <circle cx="12" cy="12" r="1.5" fill={stroke} />
    </svg>
  );
};

/** Tasks: Precision industrial checklist tile with status aperture */
export const IconTasks: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Tasks & Workload',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <rect x="3.5" y="4" width="17" height="16" rx="3" />
      <path d="M8 12.5L10.5 15L16 9.5" strokeWidth={1.8} />
      <path d="M8 7.5H16" strokeWidth={1.2} strokeDasharray="1 1" />
    </svg>
  );
};

/** Approvals: Dual-vector executive authorization seal */
export const IconApprovals: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Approvals',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M12 2.5L15 5.5H19V9.5L22 12.5L19 15.5V19.5H15L12 22.5L9 19.5H5V15.5L2 12.5L5 9.5V5.5H9L12 2.5Z" />
      <path d="M9 12.5L11.5 15L16 10" strokeWidth={1.8} />
    </svg>
  );
};

// --------------------------------------------------------------------------
// 4. INDUSTRIAL, SITE, FLEET & WORKFORCE ICONS
// --------------------------------------------------------------------------

/** Transportation & Fleet: Heavy industrial construction transit vehicle */
export const IconFleet: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Fleet & Logistics',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M2 5.5H14.5V16.5H2V5.5Z" />
      <path d="M14.5 9H18.5L22 12.5V16.5H14.5V9Z" />
      <circle cx="6.5" cy="18.5" r="2.5" fill={stroke} fillOpacity={0.25} />
      <circle cx="18.5" cy="18.5" r="2.5" fill={stroke} fillOpacity={0.25} />
      <path d="M9 18.5H16" />
    </svg>
  );
};

/** Sites & Construction: Structural girder & spatial geodetic pin */
export const IconSites: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Sites & Plants',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M12 2C8.13401 2 5 5.13401 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13401 15.866 2 12 2Z" />
      <circle cx="12" cy="9" r="3" fill={stroke} fillOpacity={0.2} />
      <path d="M9.5 9H14.5M12 6.5V11.5" strokeWidth={1.2} />
    </svg>
  );
};

/** Inventory & Materials: Layered modular container stack with optical RFID scan line */
export const IconInventory: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Inventory & Materials',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M3.5 7L12 2.5L20.5 7L12 11.5L3.5 7Z" />
      <path d="M3.5 7V17L12 21.5V11.5" />
      <path d="M20.5 7V17L12 21.5" />
      <path d="M8 9.5L16 13.5" strokeWidth={1.2} strokeDasharray="2 1" />
    </svg>
  );
};

/** Human Resources & Workforce: Organic team cluster with biometric nodal links */
export const IconHR: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Human Resources',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <circle cx="12" cy="7" r="3.5" />
      <path d="M5.5 20.5C5.5 16.9101 8.41015 14 12 14C15.5899 14 18.5 16.9101 18.5 20.5" />
      <path d="M18.5 7C19.8807 7 21 8.11929 21 9.5C21 10.8807 19.8807 12 18.5 12" strokeWidth={1.2} />
      <path d="M22 18C22 16.5 21 15 19.5 14.5" strokeWidth={1.2} />
    </svg>
  );
};

/** Attendance & Biometrics: Spatial bio-pulse gate */
export const IconAttendance: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Attendance & Rosters',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7V12L15.5 14" />
      <path d="M8 3.5C9.2 2.6 10.5 2 12 2" strokeWidth={2} />
      <circle cx="12" cy="12" r="1.5" fill={stroke} />
    </svg>
  );
};

/** Customers & Relationships (CRM): Interlocked client nexus */
export const IconCRM: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Relationships & CRM',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M16 11C18.2091 11 20 9.20914 20 7C20 4.79086 18.2091 3 16 3C13.7909 3 12 4.79086 12 7C12 9.20914 13.7909 11 16 11Z" />
      <path d="M8 15C10.2091 15 12 13.2091 12 11C12 8.79086 10.2091 7 8 7C5.79086 7 4 8.79086 4 11C4 13.2091 5.79086 15 8 15Z" />
      <path d="M8 15C4.68629 15 2 17.6863 2 21H14C14 17.6863 11.3137 15 8 15Z" />
      <path d="M16 11C17.8 11.2 21.5 12.3 22 17" strokeWidth={1.2} />
    </svg>
  );
};

// --------------------------------------------------------------------------
// 5. DOCUMENTS, FILES, ANALYTICS & CHARTS
// --------------------------------------------------------------------------

/** Documents & Blueprints: Industrial contract sheet with technical fold */
export const IconFiles: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Files & Documents',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M14 2.5H6C4.89543 2.5 4 3.39543 4 4.5V19.5C4 20.6046 4.89543 21.5 6 21.5H18C19.1046 21.5 20 20.6046 20 19.5V8.5L14 2.5Z" />
      <path d="M14 2.5V8.5H20" />
      <path d="M8 13.5H16M8 17H13" strokeWidth={1.5} />
    </svg>
  );
};

/** Single File: Technical document with folded corner */
export const IconFile: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'File',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M14 2.5H6C4.89543 2.5 4 3.39543 4 4.5V19.5C4 20.6046 4.89543 21.5 6 21.5H18C19.1046 21.5 20 20.6046 20 19.5V8.5L14 2.5Z" />
      <path d="M14 2.5V8.5H20" />
    </svg>
  );
};

/** Download: Arrow down to tray */
export const IconDownload: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Download',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
};

/** Analytics & Charts Library: Multi-frequency waveform with coordinate anchors */
export const IconCharts: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Analytics & Charts Library',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M3 20.5H21" />
      <path d="M5.5 17.5V12.5M10 17.5V8.5M14.5 17.5V14.5M19 17.5V5.5" strokeWidth={2} />
      <path d="M5.5 10.5L10 6.5L14.5 11.5L19 3.5" strokeWidth={1.3} strokeDasharray="2 1" />
      <circle cx="19" cy="3.5" r="1.5" fill={stroke} />
    </svg>
  );
};

/** Nature Library: Fibonacci organic leaf with quantum coordinate lattice */
export const IconNature: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Nature Library (169 Principles)',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M12 21.5C12 21.5 20.5 18 20.5 10C20.5 5.58172 17 2 12 2C7 2 3.5 5.58172 3.5 10C3.5 18 12 21.5 12 21.5Z" />
      <path d="M12 2V21.5" />
      <path d="M12 7.5L17.5 11M12 12.5L16.5 16M12 7.5L6.5 11M12 12.5L7.5 16" strokeWidth={1.3} />
    </svg>
  );
};

// --------------------------------------------------------------------------
// 6. SYSTEM, NAVIGATION, CONTROLS & ACCESSIBLE STATUS
// --------------------------------------------------------------------------

/** Search / Cmd+K Spotlight: Precision collimator optic with focal ring */
export const IconSearch: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Search OS',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <circle cx="11" cy="11" r="7.5" />
      <path d="M16.5 16.5L21.5 21.5" strokeWidth={2} />
      <circle cx="11" cy="11" r="2" fill={stroke} fillOpacity={0.3} />
    </svg>
  );
};

/** Notifications & Attention: Resonant beacon bell with pulse wavefront */
export const IconBell: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Notifications',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M18 8.5C18 5.46243 15.3137 3 12 3C8.68629 3 6 5.46243 6 8.5C6 14.5 3.5 16.5 3.5 16.5H20.5C20.5 16.5 18 14.5 18 8.5Z" />
      <path d="M13.73 20.5C13.35 21.16 12.72 21.6 12 21.6C11.28 21.6 10.65 21.16 10.27 20.5" />
      <circle cx="12" cy="3" r="1" fill={stroke} />
    </svg>
  );
};

/** Settings & Engine Preferences: Hex-machined kinetic actuator hub */
export const IconSettings: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Settings',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" />
      <path d="M19.4 15A1.65 1.65 0 0 0 19.73 16.82L19.79 16.88C20.35 17.44 20.35 18.36 19.79 18.92C19.23 19.48 18.31 19.48 17.75 18.92L17.69 18.86A1.65 1.65 0 0 0 15.87 18.53A1.65 1.65 0 0 0 14.87 20.04V20.13C14.87 20.91 14.24 21.54 13.46 21.54H10.54C9.76 21.54 9.13 20.91 9.13 20.13V20.04A1.65 1.65 0 0 0 8.13 18.53A1.65 1.65 0 0 0 6.31 18.86L6.25 18.92C5.69 19.48 4.77 19.48 4.21 18.92C3.65 18.36 3.65 17.44 4.21 16.88L4.27 16.82A1.65 1.65 0 0 0 4.6 15A1.65 1.65 0 0 0 3.09 14H3C2.22 14 1.59 13.37 1.59 12.59V9.67C1.59 8.89 2.22 8.26 3 8.26H3.09A1.65 1.65 0 0 0 4.6 7.26A1.65 1.65 0 0 0 4.27 5.44L4.21 5.38C3.65 4.82 3.65 3.9 4.21 3.34C4.77 2.78 5.69 2.78 6.25 3.34L6.31 3.4A1.65 1.65 0 0 0 8.13 3.73A1.65 1.65 0 0 0 9.13 2.22V2.13C9.13 1.35 9.76 0.72 10.54 0.72H13.46C14.24 0.72 14.87 1.35 14.87 2.13V2.22A1.65 1.65 0 0 0 15.87 3.73A1.65 1.65 0 0 0 17.69 3.4L17.75 3.34C18.31 2.78 19.23 2.78 19.79 3.34C20.35 3.9 20.35 4.82 19.79 5.38L19.73 5.44A1.65 1.65 0 0 0 19.4 7.26A1.65 1.65 0 0 0 20.91 8.26H21C21.78 8.26 22.41 8.89 22.41 9.67V12.59C22.41 13.37 21.78 14 21 14H20.91A1.65 1.65 0 0 0 19.4 15Z" />
    </svg>
  );
};

/** Synchronize / Orbit Cycle (with animated state) */
export const IconSync: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Synchronize',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M21.5 2.5V8.5H15.5" />
      <path d="M2.5 21.5V15.5H8.5" />
      <path d="M2.5 12C2.5 6.75329 6.75329 2.5 12 2.5C16.1417 2.5 19.6465 5.15175 20.9419 8.88725" />
      <path d="M21.5 12C21.5 17.2467 17.2467 21.5 12 21.5C7.85827 21.5 4.35354 18.8483 3.05811 15.1127" />
    </svg>
  );
};

/** Offline State (Tardigrade Cryptobiosis Shield) */
export const IconOfflineShield: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Tardigrade Offline Mode',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M12 2.5L3.5 6.5V12.5C3.5 18 12 21.5 12 21.5C12 21.5 20.5 18 20.5 12.5V6.5L12 2.5Z" />
      <circle cx="12" cy="11.5" r="3" fill={stroke} fillOpacity={0.2} />
      <path d="M9 11.5H15" strokeWidth={1.5} />
    </svg>
  );
};

/** Verified / Success State: Non-green Crisp Sky & Lapis Seal */
export const IconCheck: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state = 'success',
  color,
  strokeWidth = 1.75,
  label = 'Verified / Complete',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M20 6.5L9 17.5L4 12.5" strokeWidth={2.2} />
    </svg>
  );
};

/** Alert / Warning / Critical Attention */
export const IconAlert: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state = 'warning',
  color,
  strokeWidth = 1.75,
  label = 'Attention Required',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M12 2.5L21.5 19.5H2.5L12 2.5Z" />
      <path d="M12 9V14" strokeWidth={2} />
      <circle cx="12" cy="17" r="1" fill={stroke} />
    </svg>
  );
};

/** Calendar & Scheduling */
export const IconCalendar: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Schedule',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <rect x="3" y="4.5" width="18" height="16.5" rx="2.5" />
      <path d="M16 2.5V5.5M8 2.5V5.5M3 9.5H21" />
      <circle cx="8" cy="14" r="1" fill={stroke} />
      <circle cx="12" cy="14" r="1" fill={stroke} />
      <circle cx="16" cy="14" r="1" fill={stroke} />
    </svg>
  );
};

/** Google Sheets / Data Export */
export const IconSheets: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Export to Google Sheets',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M14 2.5H6C4.89543 2.5 4 3.39543 4 4.5V19.5C4 20.6046 4.89543 21.5 6 21.5H18C19.1046 21.5 20 20.6046 20 19.5V8.5L14 2.5Z" />
      <path d="M14 2.5V8.5H20" />
      <rect x="7.5" y="12" width="9" height="6.5" rx="1" strokeWidth={1.2} />
      <path d="M7.5 15.25H16.5M12 12V18.5" strokeWidth={1.2} />
    </svg>
  );
};

/** Chevron Navigation */
export const IconChevronRight: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  strokeWidth = 1.75,
  label = 'Navigate',
  ariaHidden = true,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    role="img"
    aria-label={label}
    aria-hidden={ariaHidden}
    className={`karm-icon ${className}`}
    {...props}
  >
    <path d="M9 18L15 12L9 6" />
  </svg>
);

/** Chevron Down */
export const IconChevronDown: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  strokeWidth = 1.75,
  label = 'Expand',
  ariaHidden = true,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    role="img"
    aria-label={label}
    aria-hidden={ariaHidden}
    className={`karm-icon ${className}`}
    {...props}
  >
    <path d="M6 9L12 15L18 9" />
  </svg>
);

/** Folder */
export const IconFolder: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Folder',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M22 19.5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7.5a2 2 0 0 1 2-2h5l2-2h9a2 2 0 0 1 2 2z" />
    </svg>
  );
};

/** Drag Grip Handle */
export const IconGrip: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  strokeWidth = 1.75,
  label = 'Drag to reorder',
  ariaHidden = true,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    role="img"
    aria-label={label}
    aria-hidden={ariaHidden}
    className={`karm-icon ${className}`}
    {...props}
  >
    <circle cx="9" cy="12" r="1" fill="currentColor" />
    <circle cx="15" cy="12" r="1" fill="currentColor" />
    <circle cx="9" cy="7" r="1" fill="currentColor" />
    <circle cx="15" cy="7" r="1" fill="currentColor" />
    <circle cx="9" cy="17" r="1" fill="currentColor" />
    <circle cx="15" cy="17" r="1" fill="currentColor" />
  </svg>
);

/** Arrow Up */
export const IconArrowUp: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  strokeWidth = 1.75,
  label = 'Move up',
  ariaHidden = true,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    role="img"
    aria-label={label}
    aria-hidden={ariaHidden}
    className={`karm-icon ${className}`}
    {...props}
  >
    <path d="M18 15L12 9L6 15" />
  </svg>
);

/** Arrow Down */
export const IconArrowDown: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  strokeWidth = 1.75,
  label = 'Move down',
  ariaHidden = true,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    role="img"
    aria-label={label}
    aria-hidden={ariaHidden}
    className={`karm-icon ${className}`}
    {...props}
  >
    <path d="M6 9L12 15L18 9" />
  </svg>
);

/** Export */
export const IconExport: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Export',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" />
      <path d="M7 10L12 15L17 10" />
      <path d="M12 15V3" />
    </svg>
  );
};
export const IconDashboard: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Dashboard',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
};

/** Analytics / Charts */
export const IconAnalytics: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Analytics',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M3 20.5H21" />
      <path d="M5.5 17.5V12.5M10 17.5V8.5M14.5 17.5V14.5M19 17.5V5.5" strokeWidth={2} />
      <path d="M5.5 10.5L10 6.5L14.5 11.5L19 3.5" strokeWidth={1.3} strokeDasharray="2 1" />
      <circle cx="19" cy="3.5" r="1.5" fill={stroke} />
    </svg>
  );
};

/** Data Matrices / Grid */
export const IconGrid: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Data Matrices',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
};

/** Systems / DNS */
export const IconDns: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Systems',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v6M12 15v6M3 12h6M15 12h6" strokeWidth={2} />
      <circle cx="12" cy="12" r="3" fill={stroke} fillOpacity={0.2} />
    </svg>
  );
};

/** Person / User */
export const IconPerson: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Person',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
};

/** Power / Logout */
export const IconPower: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Power',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v6" />
      <path d="M9 12l3 3 3-3" strokeWidth={2} />
    </svg>
  );
};

/** Bolt / Lightning */
export const IconBolt: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Lightning',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M13 2L3 14h9l-1 8 10-10h-9l1-8z" />
    </svg>
  );
};

/** Trending Up */
export const IconTrendingUp: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Trending Up',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M23 6l-7 7-5-5-6 6" />
    </svg>
  );
};

/** Psychology / AI */
export const IconPsychology: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Psychology / AI',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M12 2a10 10 0 1 0 10 10" />
      <path d="M12 16v-4M12 8h.01" />
      <path d="M16 12a4 4 0 1 1-8 0" />
    </svg>
  );
};

/** Lightbulb */
export const IconLightbulb: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Lightbulb',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2v6" />
      <path d="M12 22v-6" />
      <circle cx="12" cy="12" r="4" />
      <path d="M8 14a4 4 0 1 1 8 0" />
    </svg>
  );
};

/** Auto Awesome / Magic */
export const IconAutoAwesome: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Auto Awesome',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M12 2l2.5 7.5L22 9.5l-7 5 2 7.5L12 16.5l-7-5 7-5L2 9.5l7.5-2.5z" />
    </svg>
  );
};

/** Verified User */
export const IconVerifiedUser: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Verified User',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
      <path d="M16 6l2 2 4-4" strokeWidth={2} />
    </svg>
  );
};

/** Arrow Upward */
export const IconArrowUpward: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Arrow Upward',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M18 15L12 9L6 15" />
      <path d="M12 3v18" strokeWidth={1.5} />
    </svg>
  );
};

/** More Vert */
export const IconMoreVert: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'More Options',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <circle cx="12" cy="5" r="1.5" fill={stroke} />
      <circle cx="12" cy="12" r="1.5" fill={stroke} />
      <circle cx="12" cy="19" r="1.5" fill={stroke} />
    </svg>
  );
};

/** Arrow Forward */
export const IconArrowForward: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Arrow Forward',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
};

/** Notifications */
export const IconNotifications: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Notifications',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M18 8.5C18 5.46243 15.3137 3 12 3C8.68629 3 6 5.46243 6 8.5C6 14.5 3.5 16.5 3.5 16.5H20.5C20.5 16.5 18 14.5 18 8.5Z" />
      <path d="M13.73 20.5C13.35 21.16 12.72 21.6 12 21.6C11.28 21.6 10.65 21.16 10.27 20.5" />
      <circle cx="12" cy="3" r="1" fill={stroke} />
    </svg>
  );
};

/** Terminal */
export const IconTerminal: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Terminal',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M4 12l6 6 6-6" />
      <path d="M4 12h16" />
      <circle cx="20" cy="12" r="3" fill={stroke} fillOpacity={0.2} />
    </svg>
  );
};
export const IconArrowLeft: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Arrow Left',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
};

/** Arrow Right */
export const IconArrowRight: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Arrow Right',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
};

/** Expand / Fullscreen */
export const IconExpand: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Expand',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
};
export const IconMapPin: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Map Pin',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" fill={stroke} />
    </svg>
  );
};

/** Truck */
export const IconTruck: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Truck',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M10 18h.01" />
      <path d="M18 19h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 13.37 10H6a1 1 0 0 0-1 .924L4 17.4" />
      <circle cx="17" cy="19" r="2" />
      <circle cx="5" cy="19" r="2" />
    </svg>
  );
};

/** Building 2 */
export const IconBuilding2: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Building',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </svg>
  );
};

/** Lock State */
export const IconLock: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Locked',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
};

/** Unlock State */
export const IconUnlock: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Unlocked',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      <path d="M12 17v-5" />
      <path d="M9 14h6" />
    </svg>
  );
};

// --------------------------------------------------------------------------
// ADDITIONAL MISSING ICONS FOR COMPLETE MODULE COVERAGE
// --------------------------------------------------------------------------

/** Messages / Communications: Speech bubble with telemetry pulse */
export const IconMessages: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Messages',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      <path d="M12 15v-6M9 12h6" strokeWidth={1.2} />
    </svg>
  );
};

/** Suppliers / Vendors: Factory with supply line */
export const IconSuppliers: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Suppliers',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M3 20V10a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v10" />
      <path d="M7 16v4M11 16v4M15 16v4" />
      <path d="M17 14h6a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-6" />
      <path d="M19 22v-4" strokeDasharray="2 2" />
    </svg>
  );
};

/** Reports / Analytics: Structured document with data hierarchy */
export const IconReports: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Reports',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
};

/** Filters / Query Refinement: Sieve / funnel with precision slots */
export const IconFilters: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Filters',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
      <line x1="12" y1="22" x2="12" y2="15.5" />
      <polyline points="5 18 12 15 19 18" />
      <circle cx="12" cy="8" r="2" fill={stroke} fillOpacity={0.3} />
    </svg>
  );
};

/** Warning / Caution: Geometric alert prism with resonant edges */
export const IconWarning: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Warning',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
};

/** Success / Completion: Closed circuit with harmonic resonance */
export const IconSuccess: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Success',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
};

/** Error / Failure: Broken circuit with dissonance marker */
export const IconError: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Error',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
};

/** Loading / Sync: Rotating harmonic spiral */
export const IconLoading: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Loading',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
};

/** Pressed State: Compressed geometric form */
export const IconPressed: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Pressed',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <path d="M9 12h6" strokeWidth={2} />
    </svg>
  );
};

/** Selected State: Confirmed geometric closure */
export const IconSelected: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Selected',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
};

/** Disabled State: Muted geometric ghost */
export const IconDisabled: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Disabled',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <rect x="4" y="4" width="16" height="16" rx="2" strokeDasharray="4 2" />
      <line x1="4" y1="4" x2="20" y2="20" strokeWidth={1.2} />
    </svg>
  );
};

/** Flux Thinking: Living tetrahedron pulse */
export const IconFluxThinking: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Flux Thinking',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M12 2.5L15.5 8.5L22 12L15.5 15.5L12 21.5L8.5 15.5L2 12L8.5 8.5L12 2.5Z" />
      <circle cx="12" cy="12" r="1.5" fill={stroke} fillOpacity={0.4} />
      <path d="M12 6V9M12 15V18M6 12H9M15 12H18" strokeWidth={1.2} />
    </svg>
  );
};

/** Flux Responding: Living tetrahedron with violet resonance */
export const IconFluxResponding: React.FC<KarmIconProps> = ({
  size = 20,
  className = '',
  state,
  color,
  strokeWidth = 1.75,
  label = 'Flux Responding',
  ariaHidden,
  ...props
}) => {
  const stroke = resolveIconColor(state, color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      aria-hidden={ariaHidden ?? !label}
      className={resolveIconClasses(state, className)}
      {...props}
    >
      <path d="M12 2.5L15.5 8.5L22 12L15.5 15.5L12 21.5L8.5 15.5L2 12L8.5 8.5L12 2.5Z" />
      <circle cx="12" cy="12" r="2.5" fill={stroke} fillOpacity={0.35} />
      <path d="M12 5V19M5 12H19" strokeWidth={1.2} />
    </svg>
  );
};

/** Alias for backward compatibility */
export const IconFluxAI = IconFlux;
export const IconBlackHole = IconAlert;
export const IconJellyfish = IconFiles;
export const IconTardigrade = IconOfflineShield;
export const IconSlimeMold = IconProjects;
export const IconCoralGrowth = IconCharts;
export const IconAntColony = IconTasks;
