import { signToken, verifyToken } from '../security/tokens.js';
import { can, permissionsFor, ROLES } from '../security/roles.js';
import { validateGstin } from '../checks/gstin.js';
import { fuelTrip } from '../calc/fuel.js';
import { rankDues } from '../calc/ageing.js';
import { istDate } from '../util/time.js';
import { describeConfig } from '../config.js';
import { ADVISORS } from '../agents/advisors.js';
import { estimateCalls } from '../agents/board.js';
import { HttpError } from './server.js';

const SESSION_SEC = 12 * 3600;
const AI = { name: 'ai', max: 30, windowMs: 60000 };

export function buildRoutes(f) {
  const { config, users, approvals, audit, registry, router, usage, hsn, docs, memory, orchestrator, board, briefing, limiter } = f;
  const need = (b, ...keys) => { for (const k of keys) if (b[k] == null || b[k] === '') throw new HttpError(422, 'MISSING_FIELD', `${k} is required`); };
  const R = (method, path, handler, opts) => [method, path, handler, opts];

  const authenticate = async (req) => {
    const h = String(req.headers.authorization || ''); if (!h.startsWith('Bearer ')) return null;
    const t = verifyToken(h.slice(7), config.authSecret, 'session', f.now().getTime()); if (!t) return null;
    const u = users.get(t.sub); if (!u) return null; // deactivated or deleted users lose access at once
    if ((t.ver || 0) !== (u.sessionVersion || 0)) return null;
    return { ...u, can: (p) => can(u.role, p) };
  };

  const routes = [
    R('GET', '/health', async () => ({ ok: true, service: 'flux', time: f.now().toISOString(), config: describeConfig(config) }), { public: true }),
    R('POST', '/v1/auth/login', async ({ body, ip }) => {
      need(body, 'id', 'password'); const k = `login:${ip}:${String(body.id).slice(0, 40)}`;
      const l = limiter.hit(k, 5, 15 * 60000); if (!l.ok) throw new HttpError(429, 'RATE_LIMIT', 'Too many sign-in attempts. Wait and try again.', { retryAfterSec: l.retryAfterSec });
      const u = await users.authenticate(body.id, body.password);
      if (!u) { audit.append({ actor: 'anonymous', action: 'login.failed', data: { id: String(body.id).slice(0, 40), ip } }); throw new HttpError(401, 'BAD_LOGIN', 'Wrong id or password'); }
      limiter.reset(k); audit.append({ actor: u.id, action: 'login.ok', data: { ip } });
      return { token: signToken({ typ: 'session', sub: u.id, role: u.role, ver: u.sessionVersion || 0 }, config.authSecret, SESSION_SEC, f.now().getTime()), expiresInSec: SESSION_SEC, user: { id: u.id, name: u.name, role: u.role }, permissions: permissionsFor(u.role) };
    }, { public: true }),
    R('GET', '/v1/me', async ({ user }) => ({ id: user.id, name: user.name, role: user.role, permissions: permissionsFor(user.role) })),
    R('GET', '/v1/users', async () => ({ users: users.list() }), { permission: 'users:admin' }),
    R('POST', '/v1/users', async ({ user, body }) => {
      need(body, 'id', 'role', 'password');
      if (typeof body.id !== 'string' || !/^[a-z0-9._-]{3,40}$/.test(body.id)) throw new HttpError(422, 'INVALID_ID', 'id must be 3 to 40 lower-case letters, digits, dots, dashes or underscores');
      if (!ROLES.includes(body.role)) throw new HttpError(422, 'INVALID_ROLE', `role must be one of ${ROLES.join(', ')}`);
      if (body.name != null && (typeof body.name !== 'string' || body.name.trim().length > 100)) throw new HttpError(422, 'INVALID_NAME', 'name must be a string of at most 100 characters');
      if (typeof body.password !== 'string' || body.password.length < 12 || body.password.length > 1024) throw new HttpError(422, 'INVALID_PASSWORD', 'password must contain 12 to 1024 characters');
      if (users.getRecord(body.id)) throw new HttpError(409, 'USER_EXISTS', 'User already exists');
      let created;
      try {
        created = await users.create({ id: body.id, name: body.name?.trim(), role: body.role, password: body.password });
      } catch (error) {
        if (error.message === 'User already exists') throw new HttpError(409, 'USER_EXISTS', error.message);
        throw error;
      }
      audit.append({ actor: user.id, action: 'users.created', data: { id: created.id, role: created.role } });
      return created;
    }, { permission: 'users:admin' }),
    R('POST', '/v1/users/:id/active', async ({ params, user, body }) => {
      if (typeof body.active !== 'boolean') throw new HttpError(422, 'INVALID_STATUS', 'active must be a boolean');
      const target = users.getRecord(params.id);
      if (!target) throw new HttpError(404, 'NOT_FOUND', 'User not found');
      if (params.id === user.id && !body.active) throw new HttpError(422, 'SELF_DEACTIVATION', 'You cannot deactivate your own account');
      if (params.id === config.ownerId && !body.active) throw new HttpError(422, 'GATEWAY_OWNER_REQUIRED', 'The configured gateway owner account must remain active');
      if (target.role === 'owner' && target.active && !body.active && users.activeOwnerCount() <= 1) {
        throw new HttpError(422, 'LAST_OWNER', 'At least one active owner account must remain');
      }
      const updated = users.setActive(params.id, body.active);
      audit.append({ actor: user.id, action: body.active ? 'users.activated' : 'users.deactivated', data: { id: params.id } });
      return updated;
    }, { permission: 'users:admin' }),
    R('POST', '/v1/users/:id/role', async ({ params, user, body }) => {
      if (!ROLES.includes(body.role)) throw new HttpError(422, 'INVALID_ROLE', `role must be one of ${ROLES.join(', ')}`);
      if (params.id === user.id) throw new HttpError(422, 'SELF_ROLE_CHANGE', 'You cannot change your own role');
      const target = users.getRecord(params.id);
      if (!target) throw new HttpError(404, 'NOT_FOUND', 'User not found');
      if (params.id === config.ownerId && body.role !== 'owner') throw new HttpError(422, 'GATEWAY_OWNER_REQUIRED', 'The configured gateway owner must keep the owner role');
      if (target.active && target.role === 'owner' && body.role !== 'owner' && users.activeOwnerCount() <= 1) {
        throw new HttpError(422, 'LAST_OWNER', 'At least one active owner account must remain');
      }
      const updated = users.setRole(params.id, body.role);
      audit.append({ actor: user.id, action: 'users.role_changed', data: { id: params.id, role: body.role } });
      return updated;
    }, { permission: 'users:admin' }),
    R('POST', '/v1/users/:id/password', async ({ params, user, body }) => {
      need(body, 'password');
      if (params.id === user.id) throw new HttpError(422, 'USE_ACCOUNT_RECOVERY', 'Use owner recovery procedures for your own account');
      if (!users.getRecord(params.id)) throw new HttpError(404, 'NOT_FOUND', 'User not found');
      if (typeof body.password !== 'string' || body.password.length < 12 || body.password.length > 1024) throw new HttpError(422, 'INVALID_PASSWORD', 'password must contain 12 to 1024 characters');
      const updated = await users.resetPassword(params.id, body.password);
      audit.append({ actor: user.id, action: 'users.password_reset', data: { id: params.id } });
      return { id: updated.id, reset: true };
    }, { permission: 'users:admin' }),

    R('POST', '/v1/chat', async ({ user, body }) => { need(body, 'message'); return orchestrator.answer({ actor: user, message: body.message, context: body.context || null, deep: !!body.deep, verify: !!body.verify }); }, { permission: 'chat', limit: AI }),

    R('GET', '/v1/board/advisors', async () => ({ advisors: ADVISORS.map(({ id, title, scope }) => ({ id, title, scope })) }), { permission: 'board' }),
    R('POST', '/v1/board/estimate', async ({ body }) => { const ids = board.resolveIds(body.advisors || 'all'); return { advisors: ids, estimatedCalls: estimateCalls(ids), policy: config.costPolicy }; }, { permission: 'board' }),
    R('POST', '/v1/board/run', async ({ user, body }) => { need(body, 'question'); return board.meet({ question: body.question, ids: body.advisors || 'all', evidenceText: String(body.evidence || '').slice(0, 6000), actor: user, confirmedCalls: body.confirmedCalls ?? null }); }, { permission: 'board', limit: { name: 'board', max: 6, windowMs: 60000 } }),
    R('POST', '/v1/board/tasks', async ({ user, body }) => { need(body, 'meeting'); return { proposals: board.toTaskProposals(body.meeting, user) }; }, { permission: 'board' }),

    R('POST', '/v1/documents/draft', async ({ user, body }) => { need(body, 'instruction'); return docs.draftFromText(body.instruction, user, { docType: body.docType || 'invoice' }); }, { permission: 'documents:draft', limit: AI }),
    R('GET', '/v1/documents', async () => ({ documents: docs.list() }), { permission: 'documents:draft' }),
    R('GET', '/v1/documents/:id', async ({ params }) => docs.get(params.id) || (() => { throw new HttpError(404, 'NOT_FOUND', 'Document not found'); })(), { permission: 'documents:draft' }),
    R('PATCH', '/v1/documents/:id', async ({ params, user, body }) => docs.update(params.id, body, user), { permission: 'documents:draft' }),
    R('POST', '/v1/documents/:id/revert', async ({ params, user, body }) => { need(body, 'version'); return docs.revert(params.id, Number(body.version), user); }, { permission: 'documents:draft' }),
    R('POST', '/v1/documents/:id/propose', async ({ params, user }) => docs.propose(params.id, user), { permission: 'documents:propose' }),
    R('GET', '/v1/documents/:id/pdf', async ({ params }) => { const d = docs.get(params.id); if (!d?.zoho?.id || d.docType !== 'invoice') throw new HttpError(404, 'NOT_FOUND', 'No Zoho invoice exists for this draft yet'); return { raw: await f.reader.invoicePdf(d.zoho.id), type: 'application/pdf' }; }, { permission: 'read:zoho' }),
    R('POST', '/v1/documents/text', async ({ user, body }) => { need(body, 'kind', 'instruction'); return docs.writeText({ kind: body.kind, instruction: body.instruction, facts: body.facts || '', actor: user }); }, { permission: 'documents:draft', limit: AI }),

    R('POST', '/v1/hsn/resolve', async ({ body }) => { need(body, 'item'); return hsn.resolve(body.item, { statedRate: body.statedRate ?? null }); }, { permission: 'read:zoho' }),
    R('POST', '/v1/hsn/confirm', async ({ user, body }) => hsn.confirm({ ...body, actor: user }), { permission: 'hsn:confirm' }),
    R('GET', '/v1/hsn/mappings', async () => ({ mappings: hsn.list() }), { permission: 'read:zoho' }),

    R('GET', '/v1/proposals', async ({ query }) => ({ proposals: approvals.list(query.status) }), { permission: 'proposals:read' }),
    R('GET', '/v1/proposals/:id', async ({ params }) => approvals.get(params.id) || (() => { throw new HttpError(404, 'NOT_FOUND', 'Proposal not found'); })(), { permission: 'proposals:read' }),
    R('POST', '/v1/proposals/:id/approve', async ({ params, user }) => approvals.approve(params.id, user), { permission: 'proposals:read' }),
    R('POST', '/v1/proposals/:id/reject', async ({ params, user, body }) => approvals.reject(params.id, user, body.reason), { permission: 'proposals:read' }),
    R('POST', '/v1/proposals/:id/execute', async ({ params, user, body }) => {
      need(body, 'token'); const p = approvals.get(params.id); if (!p) throw new HttpError(404, 'NOT_FOUND', 'Proposal not found');
      if (p.kind.startsWith('zoho.')) return docs.execute(params.id, body.token, user);
      if (p.kind === 'task.create') { const c = approvals.consume(body.token, { kind: p.kind, gate: p.gate }); const t = f.store.collection('tasks'); const task = { id: c.id, ...c.payload, createdBy: user.id, createdAt: f.now().toISOString(), status: 'open' }; t.put(task.id, task); approvals.complete(c.id, { taskId: task.id }, user.id); return task; }
      throw new HttpError(422, 'NO_EXECUTOR', `Nothing in this build can execute "${p.kind}"`);
    }, { permission: 'proposals:read' }),
    R('GET', '/v1/tasks', async () => ({ tasks: f.store.collection('tasks').all() }), { permission: 'proposals:read' }),

    R('GET', '/v1/briefing/today', async () => briefing.today() || (() => { throw new HttpError(404, 'NOT_FOUND', 'No briefing yet today'); })(), { permission: 'briefing:read' }),
    R('POST', '/v1/briefing/run', async ({ user }) => briefing.run(user.id), { permission: 'read:zoho', limit: { name: 'briefing', max: 6, windowMs: 3600000 } }),
    R('POST', '/v1/briefing/:date/status', async ({ params, user, body }) => { need(body, 'action'); return briefing.setStatus(params.date, body.action, user, body.until); }, { permission: 'briefing:read' }),

    R('GET', '/v1/models', async () => ({ policy: config.costPolicy, providers: Object.fromEntries(['openrouter', 'omniroute'].map((p) => [p, { enabled: router.enabledProviders.includes(p), trust: registry.providerTrust(p) }])), models: registry.all().map(({ key, id, provider, costClass, contextLength, inputModalities, expiresAt }) => ({ key, id, provider, costClass, contextLength, inputModalities, expiresAt })) }), { permission: 'models:read' }),
    R('POST', '/v1/models/sync', async () => router.sync(), { permission: 'models:admin' }),
    R('POST', '/v1/models/pin', async ({ user, body }) => { need(body, 'role'); const r = body.clear ? (registry.clearPin(body.role), { cleared: true }) : registry.setPin(body.role, { primary: body.primary, fallbacks: body.fallbacks || [] }); audit.append({ actor: user.id, action: 'models.pin', data: body }); return r; }, { permission: 'models:admin' }),
    R('POST', '/v1/models/trust', async ({ user, body }) => { need(body, 'provider', 'tier'); registry.setProviderTrust(body.provider, body.tier); audit.append({ actor: user.id, action: 'models.trust', data: body }); return { provider: body.provider, tier: body.tier }; }, { permission: 'models:admin' }),
    R('POST', '/v1/models/classify', async ({ user, body }) => { need(body, 'key'); const m = registry.patch(body.key, { costClass: body.costClass }); audit.append({ actor: user.id, action: 'models.classify', data: body }); return m; }, { permission: 'models:admin' }),
    R('GET', '/v1/models/usage', async () => usage.today(), { permission: 'models:read' }),

    R('GET', '/v1/audit', async ({ query }) => ({ rows: audit.list({ limit: Math.min(Number(query.limit) || 50, 200), before: Number(query.before) || Infinity }) }), { permission: 'audit:read' }),
    R('GET', '/v1/audit/verify', async () => audit.verify(), { permission: 'audit:read' }),

    R('POST', '/v1/tools/fuel', async ({ body }) => fuelTrip(body), { permission: 'tools' }),
    R('POST', '/v1/tools/gstin', async ({ body }) => { need(body, 'gstin'); return validateGstin(body.gstin); }, { permission: 'tools' }),
    R('POST', '/v1/tools/dues', async ({ body }) => { need(body, 'rows'); return rankDues(body.rows, body.asOf || istDate(f.now())); }, { permission: 'tools' }),

    R('GET', '/v1/memory', async () => ({ facts: memory.list() }), { permission: 'memory' }),
    R('POST', '/v1/memory', async ({ user, body }) => memory.add(body.text, user), { permission: 'memory' }),
    R('DELETE', '/v1/memory/:id', async ({ params, user }) => ({ removed: memory.remove(params.id, user) }), { permission: 'memory' }),
  ];
  return { routes, authenticate };
}
