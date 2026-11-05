const P = {
  owner: ['*'],
  accountant: ['chat', 'read:zoho', 'web:read', 'board', 'documents:draft', 'documents:propose', 'hsn:confirm', 'approve:G1', 'briefing:read', 'tools', 'memory', 'proposals:read', 'models:read'],
  staff: ['chat', 'tools', 'memory', 'briefing:read'],
  viewer: ['briefing:read'],
};
export const ROLES = Object.keys(P);
export const can = (role, perm) => !!P[role] && (P[role].includes('*') || P[role].includes(perm));
export const permissionsFor = (role) => (P[role] || []).slice();
