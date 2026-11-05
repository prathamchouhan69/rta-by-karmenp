import { signToken, verifyToken } from '../security/tokens.js';
import { can, permissionsFor } from '../security/roles.js';
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
      return { token: signToken({ typ: 'session', sub: u.id, role: u.role }, config.authSecret, SESSION_SEC, f.now().getTime()), expiresInSec: SESSION_SEC, user: u, permissions: permissionsFor(u.role) };
    }, { public: true }),
    R('GET', '/v1/me', async ({ user }) => ({ id: user.id, name: user.name, role: user.role, permissions: permissionsFor(user.role) })),

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
