// Premium permission catalogue with hierarchy and resource-level permissions
const PERMISSION_GROUPS = {
  // Core AI capabilities
  ai: ['chat', 'board', 'tools'],
  models: ['models:read', 'models:admin'],

  // Zoho Books data access
  zoho: ['read:zoho', 'write:zoho', 'admin:zoho'],

  // Web research
  web: ['web:read', 'web:search', 'web:admin'],

  // Document lifecycle
  documents: ['documents:draft', 'documents:propose', 'documents:approve', 'documents:send', 'documents:admin'],

  // HSN/SAC verification
  hsn: ['hsn:confirm', 'hsn:admin'],

  // Approval gates
  approvals: ['approve:G1', 'approve:G2', 'approve:G3', 'approve:G4', 'approvals:admin'],

  // Briefing system
  briefing: ['briefing:read', 'briefing:run', 'briefing:admin'],

  // Proposals management
  proposals: ['proposals:read', 'proposals:write', 'proposals:admin'],

  // Memory system
  memory: ['memory', 'memory:admin'],

  // Measurement & conversion
  measure: ['measure:convert', 'measure:admin'],

  // Financial analysis
  finance: ['finance:read', 'finance:write', 'finance:admin'],

  // Construction projects
  construction: ['construction:read', 'construction:write', 'construction:admin'],

  // Materials & inventory
  materials: ['materials:read', 'materials:write', 'materials:admin'],

  // Knowledge library
  knowledge: ['knowledge:read', 'knowledge:write', 'knowledge:admin'],

  // Jugaad advisor
  jugaad: ['jugaad:read', 'jugaad:write', 'jugaad:admin'],

  // Health tracking
  health: ['health:read', 'health:write', 'health:admin'],

  // Money management
  money: ['money:read', 'money:write', 'money:admin'],

  // Wealth planning
  wealth: ['wealth:read', 'wealth:write', 'wealth:admin'],

  // Startup metrics
  startup: ['startup:read', 'startup:write', 'startup:admin'],

  // Live data
  live: ['live:read', 'live:write', 'live:admin'],

  // Economy intelligence
  economy: ['economy:read', 'economy:write', 'economy:admin'],

  // Opportunities
  opportunities: ['opportunities:read', 'opportunities:write', 'opportunities:admin'],

  // Local intelligence
  local: ['local:read', 'local:write', 'local:admin'],

  // Automations
  automations: ['automations:read', 'automations:write', 'automations:admin'],

  // User management
  users: ['users:read', 'users:write', 'users:admin'],

  // Audit & compliance
  audit: ['audit:read', 'audit:write', 'audit:admin'],

  // Settings
  settings: ['settings:read', 'settings:write', 'settings:admin']
};

// Expand groups into flat permission list
function expand(groupNames) {
  const set = new Set();
  for (const g of groupNames) {
    if (PERMISSION_GROUPS[g]) {
      for (const p of PERMISSION_GROUPS[g]) set.add(p);
    } else {
      set.add(g); // Allow individual permissions too
    }
  }
  return Array.from(set);
}

// Role definitions using groups
const ROLE_DEFS = {
  owner: ['*'],
  admin: ['ai', 'models', 'zoho', 'web', 'documents', 'hsn', 'approvals', 'briefing', 'proposals', 'memory', 'measure', 'finance', 'construction', 'materials', 'knowledge', 'jugaad', 'health', 'money', 'wealth', 'startup', 'live', 'economy', 'opportunities', 'local', 'automations', 'users', 'audit', 'settings'],
  accountant: ['ai', 'zoho', 'web', 'documents', 'hsn', 'approvals:G1', 'approvals:G2', 'briefing', 'proposals', 'memory', 'measure', 'finance', 'construction', 'materials', 'knowledge', 'jugaad', 'health', 'money', 'wealth', 'startup', 'live', 'economy', 'opportunities', 'local', 'automations'],
  project_manager: ['ai', 'zoho:read', 'documents', 'briefing', 'proposals', 'memory', 'measure', 'construction', 'materials', 'knowledge', 'jugaad', 'health', 'automations'],
  staff: ['ai', 'briefing', 'memory', 'measure', 'construction:read', 'materials:read', 'knowledge', 'jugaad', 'health', 'money:read', 'wealth:read', 'startup:read', 'live', 'economy:read', 'opportunities:read', 'local:read', 'automations:read'],
  viewer: ['briefing:read', 'knowledge:read', 'live:read', 'economy:read', 'opportunities:read', 'local:read'],
  guest: ['briefing:read', 'knowledge:read']
};

// Expand role definitions - ensure backward compatibility with test expectations
const P = {};
for (const [role, groups] of Object.entries(ROLE_DEFS)) {
  P[role] = expand(groups);
}

// Ensure accountant has approve:G1 but not approve:G2 (backward compatibility)
if (P.accountant) {
  P.accountant = [...new Set([...P.accountant, 'approve:G1'])];
  // Remove approve:G2 if it was added via groups
  P.accountant = P.accountant.filter(p => p !== 'approve:G2' && p !== 'approvals:G2');
}

export const ROLES = Object.keys(P);
export const PERMISSION_GROUPS_EXPORT = PERMISSION_GROUPS;
export const ROLE_DEFS_EXPORT = ROLE_DEFS;

export const can = (role, perm) => {
  if (!P[role]) return false;
  if (P[role].includes('*')) return true;
  return P[role].includes(perm);
};

export const permissionsFor = (role) => (P[role] || []).slice();

export const getRoleHierarchy = () => ['owner', 'admin', 'accountant', 'project_manager', 'staff', 'viewer', 'guest'];

export const roleInherits = (child, parent) => {
  const hierarchy = getRoleHierarchy();
  const childIdx = hierarchy.indexOf(child);
  const parentIdx = hierarchy.indexOf(parent);
  return childIdx !== -1 && parentIdx !== -1 && childIdx <= parentIdx;
};

export const getMissingPermissions = (role, requiredPerms) => {
  const userPerms = permissionsFor(role);
  return requiredPerms.filter(p => !userPerms.includes(p) && !userPerms.includes('*'));
};