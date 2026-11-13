// Permission catalogue. `*` is owner-only. Health permissions are always scoped to the signed-in user.
const P = {
  owner: ['*'],
  accountant: [
    'chat', 'read:zoho', 'web:read', 'board', 'documents:draft', 'documents:propose', 'hsn:confirm',
    'approve:G1', 'briefing:read', 'tools', 'memory', 'proposals:read', 'models:read',
    'measure:convert', 'finance:read', 'construction:read', 'materials:read', 'materials:write',
    'knowledge:read', 'jugaad:read', 'health:read', 'health:write',
    'money:read', 'wealth:read', 'startup:read', 'live:read',
    'economy:read', 'opportunities:read', 'local:read', 'automations:read',
  ],
  staff: [
    'chat', 'tools', 'memory', 'briefing:read',
    'measure:convert', 'construction:read', 'materials:read', 'knowledge:read', 'jugaad:read',
    'health:read', 'health:write', 'money:read', 'wealth:read', 'startup:read', 'live:read',
    'economy:read', 'opportunities:read', 'local:read', 'automations:read',
  ],
  viewer: ['briefing:read', 'knowledge:read', 'live:read', 'economy:read', 'opportunities:read', 'local:read'],
};
export const ROLES = Object.keys(P);
export const can = (role, perm) => !!P[role] && (P[role].includes('*') || P[role].includes(perm));
export const permissionsFor = (role) => (P[role] || []).slice();
