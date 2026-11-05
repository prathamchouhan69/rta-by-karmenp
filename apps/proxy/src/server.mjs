import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { createAuth, createLoginLimiter } from './auth.mjs';
import { nextDailyRunAt, runDueAutomations, validateAutomationInput } from './automation-engine.mjs';
import { evaluateGoal, GoalValidationError, updateGoalActual, validateGoalInput } from './goal-engine.mjs';
import { convertMeasurementText } from './measurements.mjs';
import { createStore } from './store.mjs';
import { createWriteApprovalToken, isValidWriteApproval } from './write-approval.mjs';
import { ZohoApiError, ZohoBooksClient, selectZohoOrganization, validateZohoConfig } from './zoho-client.mjs';
import { extname, dirname, join, resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const entities = {
  contacts: { path: 'contacts', singular: 'contact', collection: 'contacts' },
  items: { path: 'items', singular: 'item', collection: 'items' },
  taxes: { path: 'settings/taxes', singular: 'tax', collection: 'taxes' },
  invoices: { path: 'invoices', singular: 'invoice', collection: 'invoices' },
  estimates: { path: 'estimates', singular: 'estimate', collection: 'estimates' },
  salesorders: { path: 'salesorders', singular: 'salesorder', collection: 'salesorders' },
  deliverychallans: { path: 'deliverychallans', singular: 'deliverychallan', collection: 'deliverychallans' },
  creditnotes: { path: 'creditnotes', singular: 'creditnote', collection: 'creditnotes' },
  customerpayments: { path: 'customerpayments', singular: 'customerpayment', collection: 'customerpayments' },
  purchaseorders: { path: 'purchaseorders', singular: 'purchaseorder', collection: 'purchaseorders' },
  bills: { path: 'bills', singular: 'bill', collection: 'bills' },
  vendorcredits: { path: 'vendorcredits', singular: 'vendorcredit', collection: 'vendorcredits' },
  vendorpayments: { path: 'vendorpayments', singular: 'vendorpayment', collection: 'vendorpayments' },
  expenses: { path: 'expenses', singular: 'expense', collection: 'expenses' },
  journals: { path: 'journals', singular: 'journal', collection: 'journals' },
  bankaccounts: { path: 'bankaccounts', singular: 'bankaccount', collection: 'bankaccounts' },
  banktransactions: { path: 'banktransactions', singular: 'banktransaction', collection: 'banktransactions' }
};

const reports = {
  profitandloss: 'reports/profitandloss',
  balancesheet: 'reports/balancesheet',
  cashflow: 'reports/cashflow',
  agedreceivables: 'reports/agedreceivables',
  agedpayables: 'reports/agedpayables',
  taxsummary: 'reports/taxsummary'
};
const listQueryKeys = new Set([
  'page', 'per_page', 'sort_column', 'sort_order', 'search_text', 'status',
  'contact_type', 'customer_id', 'vendor_id', 'invoice_id', 'account_id',
  'date_start', 'date_end', 'filter_by', 'item_id', 'tax_id'
]);
const computedFields = new Set(['total', 'sub_total', 'tax_total', 'balance', 'round_off', 'tax_amount']);
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const failure = (c, status, code, message) => c.json({ ok: false, error: { code, message } }, status);
export const serviceBase = (env = process.env) => {
  const mode = (env.ZOHO_MODE ?? 'mock').toLowerCase();
  if (!['mock', 'live'].includes(mode)) throw new Error('ZOHO_MODE must be "mock" or "live"');
  if (env.NODE_ENV === 'production' && !env.DATABASE_URL) {
    throw new Error('Production deployments require DATABASE_URL for durable storage');
  }
  const host = env.HOST ?? '127.0.0.1';
  const isLoopback = ['127.0.0.1', 'localhost', '::1'].includes(host);
  const authRequired = !isLoopback || mode === 'live' || Boolean(env.SETUP_CODE || env.SESSION_SECRET);
  if (Boolean(env.SETUP_CODE) !== Boolean(env.SESSION_SECRET)) throw new Error('Configure both SETUP_CODE and SESSION_SECRET, or neither');
  if (authRequired && (!env.SETUP_CODE || !env.SESSION_SECRET)) throw new Error('Non-local and live deployments require SETUP_CODE and SESSION_SECRET');
  const auth = createAuth({ setupCode: env.SETUP_CODE, secret: env.SESSION_SECRET, required: authRequired });
  const zoho = mode === 'live' ? new ZohoBooksClient(env) : null;
  return { mode, host, auth, zoho, env };
};

const config = serviceBase();
const store = await createStore(
  config.env.DATA_DIR ?? resolve(dirname(fileURLToPath(import.meta.url)), '../.data'),
  config.env.DATABASE_URL,
  { seedPracticeData: config.mode === 'mock' },
);
const app = new Hono();
const loginLimiter = config.env.DATABASE_URL
  ? {
      beginAttempt: (key) => store.beginLoginAttempt(key, { maxAttempts: 8, windowMs: 60_000 }),
      clear: (key) => store.clearLoginAttempts(key),
    }
  : createLoginLimiter();
const inFlightWrites = new Map();
let loginLimitCleanupCounter = 0;

app.use('*', async (c, next) => {
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'no-referrer');
  c.header('Cache-Control', 'no-store');
  const isFrontendRequest = Boolean(config.env.STATIC_ROOT) && !c.req.path.startsWith('/api/');
  c.header(
    'Content-Security-Policy',
    isFrontendRequest
      ? "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
      : "default-src 'none'; frame-ancestors 'none'",
  );
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  c.header('X-Frame-Options', 'DENY');

  const origin = c.req.header('Origin');
  if (origin && config.env.APP_ORIGIN && origin !== config.env.APP_ORIGIN) {
    return failure(c, 403, 'ORIGIN_NOT_ALLOWED', 'This origin is not allowed');
  }
  if (origin && config.env.APP_ORIGIN === origin) {
    c.header('Access-Control-Allow-Origin', origin);
    c.header('Vary', 'Origin');
    c.header('Access-Control-Allow-Headers', 'Authorization, Content-Type, Idempotency-Key, X-Confirm-Action');
    c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  }
  if (c.req.method === 'OPTIONS') return c.body(null, 204);
  await next();
});

app.use('/api/v1/*', async (c, next) => {
  const isHealth = c.req.path === '/api/v1/health';
  const isLogin = c.req.path === '/api/v1/auth/session' && c.req.method === 'POST';
  if (isHealth || isLogin || !config.auth.required) return next();
  const authorization = c.req.header('Authorization') ?? '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!config.auth.verifyToken(token)) return failure(c, 401, 'AUTHENTICATION_REQUIRED', 'Sign in to use this API');
  await next();
});

app.onError((error, c) => {
  if (error instanceof ZohoApiError) return failure(c, error.status, error.code, error.message);
  if (error instanceof SyntaxError) return failure(c, 400, 'INVALID_JSON', 'Request body must be valid JSON');
  console.error('API request failed');
  return failure(c, 500, 'INTERNAL_ERROR', 'The server could not complete the request');
});

app.notFound((c) => failure(c, 404, 'NOT_FOUND', 'API route not found'));

app.get('/api/v1/health', async (c) => {
  try {
    await store.health?.();
  } catch {
    console.error('Persistent storage health check failed');
    return failure(c, 503, 'STORAGE_UNAVAILABLE', 'Persistent storage is unavailable');
  }
  return c.json({
    ok: true,
    data: {
      mode: config.mode,
      service: 'karm-proxy',
      authenticated: config.auth.required,
      zohoConfigured: config.mode === 'live'
    }
  });
});

app.post('/api/v1/auth/session', async (c) => {
  if (!config.auth.required) return failure(c, 409, 'AUTH_DISABLED', 'Authentication is disabled for this local practice server');
  const socketAddress = c.env?.incoming?.socket?.remoteAddress ?? 'unknown';
  const forwardedAddress = c.req.header('X-Forwarded-For')?.split(',')[0]?.trim();
  const clientAddress = config.env.TRUST_PROXY === 'true' && forwardedAddress && isIP(forwardedAddress)
    ? forwardedAddress
    : socketAddress;
  const rateLimitKey = createHmac('sha256', config.env.SESSION_SECRET).update(clientAddress).digest('hex');
  if (!await loginLimiter.beginAttempt(rateLimitKey)) return failure(c, 429, 'LOGIN_RATE_LIMITED', 'Too many sign-in attempts; try again shortly');
  if (config.env.DATABASE_URL && ++loginLimitCleanupCounter % 100 === 0) {
    await store.pruneLoginAttempts(10 * 60_000);
  }
  const body = await readBody(c);
  if (!body.ok) return failure(c, body.status, body.code, body.message);
  if (!config.auth.authenticateSetupCode(body.value.setup_code)) {
    return failure(c, 401, 'INVALID_CREDENTIALS', 'The sign-in code is incorrect');
  }
  await loginLimiter.clear(rateLimitKey);
  return c.json({ ok: true, data: config.auth.issueToken() });
});

app.get('/api/v1/organization', async (c) => {
  if (!config.zoho) return c.json({ ok: true, data: { name: 'Karm Enterprises', mode: 'practice' } });
  const payload = await config.zoho.request('GET', 'organizations', { includeOrganization: false });
  const organization = selectZohoOrganization(payload.organizations, config.env.ZOHO_ORG_ID);
  if (!organization) return failure(c, 502, 'ZOHO_ORGANIZATION_NOT_FOUND', 'The configured Zoho organization was not returned by the authenticated account');
  return c.json({ ok: true, data: organization });
});

app.get('/api/v1/news', (c) => c.json({
  ok: true,
  data: [{ title: config.mode === 'mock' ? 'Practice mode is active' : 'Zoho Books is connected', url: '/settings', source: 'KARM OS' }]
}));

app.get('/api/v1/audit', async (c) => {
  const limit = Number(c.req.query('limit') ?? 100);
  if (!Number.isInteger(limit) || limit < 1 || limit > 500) return failure(c, 400, 'INVALID_LIMIT', 'limit must be an integer from 1 to 500');
  return c.json({ ok: true, data: await store.listAudit(limit) });
});

app.get('/api/v1/search', async (c) => {
  const q = c.req.query('q')?.trim() ?? '';
  if (q.length < 2 || q.length > 100) return failure(c, 400, 'INVALID_QUERY', 'q must contain 2 to 100 characters');
  if (config.zoho) {
    const [contacts, items, invoices] = await Promise.all([
      config.zoho.request('GET', 'contacts', { query: { search_text: q, per_page: 50 } }),
      config.zoho.request('GET', 'items', { query: { search_text: q, per_page: 50 } }),
      config.zoho.request('GET', 'invoices', { query: { search_text: q, per_page: 50 } })
    ]);
    return c.json({ ok: true, data: { contacts: contacts.contacts ?? [], items: items.items ?? [], invoices: invoices.invoices ?? [] } });
  }
  const [contacts, items, invoices] = await Promise.all([
    store.list('contacts', { search_text: q }),
    store.list('items', { search_text: q }),
    store.list('invoices', { search_text: q })
  ]);
  return c.json({ ok: true, data: { contacts: contacts.contacts, items: items.items, invoices: invoices.invoices } });
});

app.get('/api/v1/goals', async (c) => {
  const result = await store.list('goals', { per_page: 200 });
  return c.json({ ok: true, data: result.goals.map((goal) => evaluateGoal(goal)) });
});

app.post('/api/v1/goals/feasibility', async (c) => {
  const body = await readBody(c);
  if (!body.ok) return failure(c, body.status, body.code, body.message);
  try {
    return c.json({ ok: true, data: evaluateGoal(body.value) });
  } catch (error) {
    if (error instanceof GoalValidationError) return failure(c, 422, 'INVALID_GOAL', error.message);
    throw error;
  }
});

app.post('/api/v1/goals', async (c) => {
  const body = await readBody(c);
  if (!body.ok) return failure(c, body.status, body.code, body.message);
  let goal;
  try {
    goal = validateGoalInput(body.value);
  } catch (error) {
    if (error instanceof GoalValidationError) return failure(c, 422, 'INVALID_GOAL', error.message);
    throw error;
  }
  const key = c.req.header('Idempotency-Key');
  const idempotency = validateIdempotencyKey(key);
  if (!idempotency.ok) return failure(c, idempotency.status, idempotency.code, idempotency.message);
  return performIdempotentWrite(c, 'create:goals', key, goal, async () => {
    const created = await store.create('goals', { ...goal, progressHistory: [{ value: goal.currentValue, date: goal.currentDate }] });
    await store.recordAudit({ action: 'goal_created', resource: 'goals', resource_id: created.goal_id, result: 'success' });
    return { status: 201, body: { ok: true, data: evaluateGoal(created) } };
  });
});

app.post('/api/v1/goals/:id/progress', async (c) => {
  const id = c.req.param('id');
  const body = await readBody(c);
  if (!body.ok) return failure(c, body.status, body.code, body.message);
  const existing = await store.get('goals', id);
  if (!existing) return failure(c, 404, 'NOT_FOUND', 'Goal not found');
  const key = c.req.header('Idempotency-Key');
  const idempotency = validateIdempotencyKey(key);
  if (!idempotency.ok) return failure(c, idempotency.status, idempotency.code, idempotency.message);
  let updatedGoal;
  try {
    updatedGoal = updateGoalActual(existing, body.value.value, body.value.date);
  } catch (error) {
    if (error instanceof GoalValidationError) return failure(c, 422, 'INVALID_PROGRESS', error.message);
    throw error;
  }
  return performIdempotentWrite(c, `progress:goals:${id}`, key, body.value, async () => {
    const progressHistory = [...(Array.isArray(existing.progressHistory) ? existing.progressHistory : []), {
      value: updatedGoal.currentValue,
      date: updatedGoal.currentDate,
    }].slice(-500);
    const updated = await store.update('goals', id, { ...updatedGoal, progressHistory });
    await store.recordAudit({ action: 'goal_progress_updated', resource: 'goals', resource_id: id, result: 'success' });
    return { status: 200, body: { ok: true, data: evaluateGoal(updated) } };
  });
});

app.get('/api/v1/flux/briefing', async (c) => {
  return c.json({ ok: true, data: await loadFluxBriefing() });
});

app.post('/api/v1/flux/ask', async (c) => {
  const body = await readBody(c);
  if (!body.ok) return failure(c, body.status, body.code, body.message);
  if (typeof body.value.message !== 'string' || body.value.message.trim().length < 2 || body.value.message.trim().length > 500) {
    return failure(c, 422, 'INVALID_MESSAGE', 'message must contain 2 to 500 characters');
  }

  const message = body.value.message.trim();
  const measurement = convertMeasurementText(message);
  if (measurement) {
    await store.recordAudit({
      action: 'flux_measurement_conversion',
      resource: 'flux',
      result: measurement.supported ? 'success' : 'needs_input',
    });
    return c.json({
      ok: true,
      data: {
        answer: measurement.explanation,
        confidence: measurement.confidence,
        dataSources: [{ name: 'Deterministic measurement constants', source: 'Flux measurement engine; no live values assumed' }],
        limitations: measurement.supported ? [] : [measurement.explanation],
        recommendedActions: measurement.supported ? [] : ['Provide the missing fixed unit, local factor, analyte, or verified exchange rate and ask again.'],
        draft: null,
        approval: null,
        source: 'Flux Measurement Engine',
        modelConfigured: false,
        evidence: [],
        scope: measurement.supported ? 'Formula-based unit conversion' : 'Conversion requires additional verified context',
        measurement,
      },
    });
  }
  const data = await loadFluxBriefing();
  const result = buildFluxAnswer(message, data, body.value.context);

  return c.json({
    ok: true,
    data: {
      answer: result.answer,
      confidence: result.confidence,
      dataSources: result.dataSources,
      limitations: result.limitations,
      recommendedActions: result.recommendedActions,
      draft: result.draft,
      approval: result.approval,
      source: result.source ?? 'Deterministic KARM data assistant',
      modelConfigured: false,
      evidence: result.evidence,
      scope: result.scope ?? `Based on ${data.sources.map((source) => `${source.name} (${source.records})`).join(', ')}.`,
      health: result.health,
    },
  });
});

app.get('/api/v1/tasks', async (c) => {
  const result = await store.list('tasks', { per_page: 200 });
  return c.json({ ok: true, data: result.tasks ?? [] });
});

app.post('/api/v1/tasks', async (c) => {
  const body = await readBody(c);
  if (!body.ok) return failure(c, body.status, body.code, body.message);
  const task = validateTaskInput(body.value);
  if (!task.ok) return failure(c, 422, 'INVALID_TASK', task.message);
  const key = c.req.header('Idempotency-Key');
  const idempotency = validateIdempotencyKey(key);
  if (!idempotency.ok) return failure(c, idempotency.status, idempotency.code, idempotency.message);
  return performIdempotentWrite(c, 'create:tasks', key, task.value, async () => {
    const created = await store.create('tasks', { ...task.value, status: 'open', createdAt: new Date().toISOString() });
    await store.recordAudit({ action: 'task_created', resource: 'tasks', resource_id: created.task_id, result: 'success' });
    return { status: 201, body: { ok: true, data: created } };
  });
});

app.post('/api/v1/tasks/:id/status', async (c) => {
  const id = c.req.param('id');
  const body = await readBody(c);
  if (!body.ok) return failure(c, body.status, body.code, body.message);
  if (!['open', 'in_progress', 'done', 'cancelled'].includes(body.value.status)) {
    return failure(c, 422, 'INVALID_TASK_STATUS', 'status must be open, in_progress, done, or cancelled');
  }
  const key = c.req.header('Idempotency-Key');
  const idempotency = validateIdempotencyKey(key);
  if (!idempotency.ok) return failure(c, idempotency.status, idempotency.code, idempotency.message);
  return performIdempotentWrite(c, `status:tasks:${id}`, key, body.value, async () => {
    const updated = await store.update('tasks', id, {
      status: body.value.status,
      ...(body.value.status === 'done' ? { completedAt: new Date().toISOString() } : { completedAt: null }),
    });
    if (!updated) return { status: 404, body: { ok: false, error: { code: 'NOT_FOUND', message: 'Task not found' } } };
    await store.recordAudit({ action: `task_${body.value.status}`, resource: 'tasks', resource_id: id, result: 'success' });
    return { status: 200, body: { ok: true, data: updated } };
  });
});

app.get('/api/v1/documents', async (c) => {
  const result = await store.list('documents', { per_page: 200 });
  return c.json({ ok: true, data: result.documents ?? [] });
});

app.post('/api/v1/documents', async (c) => {
  const body = await readBody(c);
  if (!body.ok) return failure(c, body.status, body.code, body.message);
  const document = validateDocumentInput(body.value);
  if (!document.ok) return failure(c, 422, 'INVALID_DOCUMENT', document.message);
  const key = c.req.header('Idempotency-Key');
  const idempotency = validateIdempotencyKey(key);
  if (!idempotency.ok) return failure(c, idempotency.status, idempotency.code, idempotency.message);
  return performIdempotentWrite(c, 'create:documents', key, document.value, async () => {
    const created = await store.create('documents', {
      ...document.value,
      status: 'draft',
      createdAt: new Date().toISOString(),
    });
    await store.recordAudit({ action: 'document_draft_created', resource: 'documents', resource_id: created.document_id, result: 'success' });
    return { status: 201, body: { ok: true, data: created } };
  });
});

app.get('/api/v1/automations', async (c) => {
  const result = await store.list('automations', { per_page: 200 });
  return c.json({ ok: true, data: result.automations ?? [] });
});

app.post('/api/v1/automations', async (c) => {
  const body = await readBody(c);
  if (!body.ok) return failure(c, body.status, body.code, body.message);
  const automation = validateAutomationInput(body.value);
  if (!automation.ok) return failure(c, 422, 'INVALID_AUTOMATION', automation.message);
  const key = c.req.header('Idempotency-Key');
  const idempotency = validateIdempotencyKey(key);
  if (!idempotency.ok) return failure(c, idempotency.status, idempotency.code, idempotency.message);
  return performIdempotentWrite(c, 'create:automations', key, automation.value, async () => {
    const now = new Date();
    const created = await store.create('automations', {
      ...automation.value,
      action: 'create_internal_task',
      timezone: 'Asia/Kolkata',
      nextRunAt: nextDailyRunAt(automation.value.scheduleTime, now),
      createdAt: now.toISOString(),
    });
    await store.recordAudit({ action: 'automation_created', resource: 'automations', resource_id: created.automation_id, result: 'success' });
    return { status: 201, body: { ok: true, data: created } };
  });
});

app.post('/api/v1/automations/:id/enabled', async (c) => {
  const id = c.req.param('id');
  const body = await readBody(c);
  if (!body.ok) return failure(c, body.status, body.code, body.message);
  if (typeof body.value.enabled !== 'boolean') return failure(c, 422, 'INVALID_AUTOMATION_STATUS', 'enabled must be a boolean');
  const key = c.req.header('Idempotency-Key');
  const idempotency = validateIdempotencyKey(key);
  if (!idempotency.ok) return failure(c, idempotency.status, idempotency.code, idempotency.message);
  return performIdempotentWrite(c, `enabled:automations:${id}`, key, body.value, async () => {
    const existing = await store.get('automations', id);
    if (!existing) return { status: 404, body: { ok: false, error: { code: 'NOT_FOUND', message: 'Automation not found' } } };
    const now = new Date();
    const updated = await store.update('automations', id, {
      enabled: body.value.enabled,
      ...(body.value.enabled ? { nextRunAt: nextDailyRunAt(existing.scheduleTime, now) } : {}),
    });
    await store.recordAudit({ action: `automation_${body.value.enabled ? 'enabled' : 'paused'}`, resource: 'automations', resource_id: id, result: 'success' });
    return { status: 200, body: { ok: true, data: updated } };
  });
});

app.post('/api/v1/write-previews', async (c) => {
  const body = await readBody(c);
  if (!body.ok) return failure(c, body.status, body.code, body.message);
  const operation = body.value.operation;
  const request = body.value.request;
  const idempotencyKey = body.value.idempotencyKey;
  if (typeof operation !== 'string' || !isRecord(request)) return failure(c, 422, 'INVALID_WRITE_PREVIEW', 'operation and request are required');
  const idempotency = validateIdempotencyKey(idempotencyKey);
  if (!idempotency.ok) return failure(c, idempotency.status, idempotency.code, idempotency.message);
  if (!isPreviewOperationSupported(operation)) return failure(c, 422, 'INVALID_WRITE_PREVIEW', 'This operation cannot be previewed');
  const invalid = validateWriteBody(request);
  if (invalid) return failure(c, 422, invalid.code, invalid.message);
  const expiresAt = Date.now() + 10 * 60_000;
  const token = config.zoho
    ? createWriteApprovalToken(config.env.SESSION_SECRET, operation, store.requestFingerprint(request), idempotencyKey, expiresAt)
    : null;
  await store.recordAudit({ action: 'write_previewed', resource: operation.split(':')[1], result: 'preview' });
  return c.json({
    ok: true,
    data: {
      operation,
      expiresAt: new Date(expiresAt).toISOString(),
      approvalToken: token,
      requiresExplicitApproval: true,
      mode: config.mode,
    },
  });
});

app.get('/api/v1/reports/:report', async (c) => {
  const report = c.req.param('report');
  const path = reports[report];
  if (!path) return failure(c, 404, 'REPORT_NOT_SUPPORTED', 'That report is not supported by this API');
  if (!config.zoho) return c.json({ ok: true, data: { report, mode: 'practice', available: false, message: 'Reports require a connected Zoho Books organization' } });
  const query = {};
  for (const key of ['date_start', 'date_end', 'filter_by', 'account_id', 'period']) {
    const value = c.req.query(key);
    if (value) query[key] = value;
  }
  const payload = await config.zoho.request('GET', path, { query });
  await store.recordAudit({ action: 'read_report', resource: report, result: 'success' });
  return c.json({ ok: true, data: payload });
});

app.all('/api/v1/:entity', async (c) => {
  const entity = c.req.param('entity');
  const resource = entities[entity];
  if (!resource) return failure(c, 404, 'RESOURCE_NOT_SUPPORTED', 'That resource is not supported');
  if (c.req.method === 'GET') {
    const query = getListQuery(c);
    if (!query.ok) return failure(c, query.status, query.code, query.message);
    const payload = config.zoho
      ? await config.zoho.request('GET', resource.path, { query: query.value })
      : await store.list(entity, query.value);
    const rows = payload[resource.collection] ?? payload.data ?? [];
    return c.json({ ok: true, data: rows, ...(payload.page_context ? { meta: payload.page_context } : {}) });
  }
  if (c.req.method === 'POST') {
    const body = await readBody(c);
    if (!body.ok) return failure(c, body.status, body.code, body.message);
    const invalid = validateWriteBody(body.value);
    if (invalid) return failure(c, 422, invalid.code, invalid.message);
    const key = c.req.header('Idempotency-Key');
    const idempotency = validateIdempotencyKey(key);
    if (!idempotency.ok) return failure(c, idempotency.status, idempotency.code, idempotency.message);
    const approvalError = requireWriteApproval(c, `create:${entity}`, body.value, key);
    if (approvalError) return approvalError;
    return performIdempotentWrite(c, `create:${entity}`, key, body.value, async () => {
      const payload = config.zoho
        ? await config.zoho.request('POST', resource.path, { body: body.value })
        : { [resource.singular]: await store.create(entity, body.value) };
      const created = payload[resource.singular] ?? payload.data ?? payload;
      await store.recordAudit({ action: 'create', resource: entity, resource_id: idOf(created), idempotency_key: key, result: 'success' });
      return { status: 201, body: { ok: true, data: created } };
    });
  }
  return failure(c, 405, 'METHOD_NOT_ALLOWED', 'This method is not supported for that resource');
});

app.all('/api/v1/:entity/:id', async (c) => {
  const entity = c.req.param('entity');
  const id = c.req.param('id');
  const resource = entities[entity];
  if (!resource) return failure(c, 404, 'RESOURCE_NOT_SUPPORTED', 'That resource is not supported');
  if (c.req.method === 'GET') {
    const payload = config.zoho
      ? await config.zoho.request('GET', `${resource.path}/${encodeURIComponent(id)}`)
      : await store.get(entity, id);
    const item = config.zoho ? (payload[resource.singular] ?? payload.data ?? payload) : payload;
    if (!item) return failure(c, 404, 'NOT_FOUND', 'Record not found');
    return c.json({ ok: true, data: item });
  }
  if (c.req.method === 'PUT') {
    const body = await readBody(c);
    if (!body.ok) return failure(c, body.status, body.code, body.message);
    const invalid = validateWriteBody(body.value);
    if (invalid) return failure(c, 422, invalid.code, invalid.message);
    const key = c.req.header('Idempotency-Key');
    const idempotency = validateIdempotencyKey(key);
    if (!idempotency.ok) return failure(c, idempotency.status, idempotency.code, idempotency.message);
    const approvalError = requireWriteApproval(c, `update:${entity}:${id}`, body.value, key);
    if (approvalError) return approvalError;
    return performIdempotentWrite(c, `update:${entity}:${id}`, key, body.value, async () => {
      const payload = config.zoho
        ? await config.zoho.request('PUT', `${resource.path}/${encodeURIComponent(id)}`, { body: body.value })
        : await store.update(entity, id, body.value);
      const updated = config.zoho ? (payload[resource.singular] ?? payload.data ?? payload) : payload;
      if (!updated) return { status: 404, body: { ok: false, error: { code: 'NOT_FOUND', message: 'Record not found' } } };
      await store.recordAudit({ action: 'update', resource: entity, resource_id: id, idempotency_key: key, result: 'success' });
      return { status: 200, body: { ok: true, data: updated } };
    });
  }
  return failure(c, 405, 'METHOD_NOT_ALLOWED', 'This method is not supported for that resource');
});

app.post('/api/v1/invoices/:id/email', async (c) => {
  const id = c.req.param('id');
  const body = await readBody(c, true);
  if (!body.ok) return failure(c, body.status, body.code, body.message);
  const key = c.req.header('Idempotency-Key');
  const idempotency = validateIdempotencyKey(key);
  if (!idempotency.ok) return failure(c, idempotency.status, idempotency.code, idempotency.message);
  const approvalError = requireWriteApproval(c, `email:invoices:${id}`, body.value, key);
  if (approvalError) return approvalError;
  return performIdempotentWrite(c, `email:invoices:${id}`, key, body.value, async () => {
    if (!config.zoho && !(await store.get('invoices', id))) {
      return { status: 404, body: { ok: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } } };
    }
    const payload = config.zoho
      ? await config.zoho.request('POST', `invoices/${encodeURIComponent(id)}/email`, { body: body.value })
      : { message: 'Invoice email queued in practice mode', invoice_id: id };
    await store.recordAudit({ action: 'email', resource: 'invoices', resource_id: id, idempotency_key: key, result: 'success' });
    return { status: 200, body: { ok: true, data: payload } };
  });
});

app.post('/api/v1/invoices/:id/status/:status', async (c) => {
  const id = c.req.param('id');
  const status = c.req.param('status');
  if (!['sent', 'void', 'draft', 'open'].includes(status)) return failure(c, 400, 'INVALID_STATUS_ACTION', 'Supported invoice status actions are sent, void, draft, and open');
  const body = await readBody(c, true);
  if (!body.ok) return failure(c, body.status, body.code, body.message);
  const key = c.req.header('Idempotency-Key');
  const idempotency = validateIdempotencyKey(key);
  if (!idempotency.ok) return failure(c, idempotency.status, idempotency.code, idempotency.message);
  const approvalError = requireWriteApproval(c, `status:invoices:${id}:${status}`, body.value, key);
  if (approvalError) return approvalError;
  if (status === 'void' && !config.zoho && c.req.header('X-Confirm-Action') !== `void-invoice:${id}`) {
    return failure(c, 428, 'CONFIRMATION_REQUIRED', `Set X-Confirm-Action: void-invoice:${id} to confirm this destructive action`);
  }
  return performIdempotentWrite(c, `status:invoices:${id}:${status}`, key, body.value, async () => {
    let payload;
    if (config.zoho) {
      payload = await config.zoho.request('POST', `invoices/${encodeURIComponent(id)}/status/${status}`, { body: body.value });
    } else {
      const updated = await store.update('invoices', id, { status });
      if (!updated) return { status: 404, body: { ok: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } } };
      payload = { invoice: updated };
    }
    await store.recordAudit({ action: `status:${status}`, resource: 'invoices', resource_id: id, idempotency_key: key, result: 'success' });
    return { status: 200, body: { ok: true, data: payload.invoice ?? payload.data ?? payload } };
  });
});

if (config.env.STATIC_ROOT) {
  const staticHandler = serveStatic({
    root: config.env.STATIC_ROOT,
    onFound: (path, c) => {
      c.header('Cache-Control', path.includes('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache');
    },
  });
  app.get('*', async (c, next) => {
    if (c.req.path.startsWith('/api/')) return next();
    return staticHandler(c, async () => {
      if (extname(c.req.path)) return next();
      c.header('Cache-Control', 'no-cache');
      return c.html(await readFile(join(config.env.STATIC_ROOT, 'index.html'), 'utf8'));
    });
  });
}

async function readBody(c, optional = false) {
  const contentType = c.req.header('Content-Type') ?? '';
  if (optional && !contentType) return { ok: true, value: {} };
  if (!contentType.toLowerCase().includes('application/json')) {
    return { ok: false, status: 415, code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Send a JSON request body' };
  }
  const contentLength = Number(c.req.header('Content-Length') ?? 0);
  if (contentLength > 1_000_000) return { ok: false, status: 413, code: 'BODY_TOO_LARGE', message: 'Request body exceeds 1 MB' };
  const reader = c.req.raw.body?.getReader();
  if (!reader) return { ok: false, status: 400, code: 'INVALID_JSON', message: 'Request body must be valid JSON' };
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 1_000_000) {
      await reader.cancel().catch(() => {});
      return { ok: false, status: 413, code: 'BODY_TOO_LARGE', message: 'Request body exceeds 1 MB' };
    }
    chunks.push(value);
  }
  const raw = Buffer.concat(chunks, size).toString('utf8');
  let value;
  try { value = JSON.parse(raw); } catch { return { ok: false, status: 400, code: 'INVALID_JSON', message: 'Request body must be valid JSON' }; }
  if (!isRecord(value)) return { ok: false, status: 422, code: 'INVALID_BODY', message: 'Request body must be a JSON object' };
  return { ok: true, value };
}

function validateWriteBody(body) {
  const stack = [body];
  while (stack.length) {
    const current = stack.pop();
    for (const [key, value] of Object.entries(current)) {
      if (computedFields.has(key)) {
        return { code: 'COMPUTED_FIELD', message: `Computed field "${key}" must be supplied by Zoho Books, not the client` };
      }
      if (isRecord(value)) stack.push(value);
      else if (Array.isArray(value)) for (const entry of value) if (isRecord(entry)) stack.push(entry);
    }
  }
  return null;
}

function validateTaskInput(body) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const owner = typeof body.owner === 'string' ? body.owner.trim() : '';
  const dueDate = body.dueDate === undefined || body.dueDate === '' ? undefined : body.dueDate;
  if (title.length < 3 || title.length > 120) return { ok: false, message: 'title must contain 3 to 120 characters' };
  if (description.length > 1000) return { ok: false, message: 'description must be 1000 characters or fewer' };
  if (!owner || owner.length > 80) return { ok: false, message: 'owner must contain 1 to 80 characters' };
  if (dueDate !== undefined && (typeof dueDate !== 'string' || !isValidDate(dueDate))) {
    return { ok: false, message: 'dueDate must be a valid YYYY-MM-DD calendar date' };
  }
  const sourceType = body.sourceType === undefined ? 'manual' : body.sourceType;
  const sourceId = body.sourceId === undefined ? undefined : body.sourceId;
  if (!['manual', 'goal', 'invoice', 'other'].includes(sourceType)) return { ok: false, message: 'sourceType must be manual, goal, invoice, or other' };
  if (sourceId !== undefined && (typeof sourceId !== 'string' || sourceId.length > 120)) return { ok: false, message: 'sourceId must be 120 characters or fewer' };
  return {
    ok: true,
    value: {
      title,
      description,
      owner,
      ...(dueDate ? { dueDate } : {}),
      sourceType,
      ...(sourceId ? { sourceId } : {}),
    },
  };
}

function validateDocumentInput(body) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const documentType = body.documentType;
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  const linkedRecordId = body.linkedRecordId === undefined || body.linkedRecordId === '' ? undefined : body.linkedRecordId;
  if (title.length < 3 || title.length > 120) return { ok: false, message: 'title must contain 3 to 120 characters' };
  if (!['meeting_note', 'follow_up_draft', 'operations_checklist'].includes(documentType)) {
    return { ok: false, message: 'documentType must be meeting_note, follow_up_draft, or operations_checklist' };
  }
  if (content.length < 1 || content.length > 20_000) return { ok: false, message: 'content must contain 1 to 20000 characters' };
  if (linkedRecordId !== undefined && (typeof linkedRecordId !== 'string' || linkedRecordId.length > 120)) {
    return { ok: false, message: 'linkedRecordId must be 120 characters or fewer' };
  }
  return {
    ok: true,
    value: {
      title,
      documentType,
      content,
      ...(linkedRecordId ? { linkedRecordId } : {}),
      externalAction: false,
    },
  };
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function buildPrathamAdvisorAnswer(message) {
  const normalized = message.toLowerCase();
  const isDailyPlan = /\b(daily|today|plan|schedule|morning|night|gym|fitness|income|cash|money|work|habit|sleep)\b/.test(normalized);
  const isGrowthPlan = /\b(net worth|₹?1,?50,?000|1.5 lakh|income target|40x|business plan|growth|wealth)\b/.test(normalized);
  const planIntro = 'Pratham advisor mode is operating from the current profile: ₹3,750/month net today versus a ₹1,50,000/month target, which is a 40x gap, so the plan must raise margin, win rate, and quote volume together.';
  const moneyPlan = [
    'This week: send 20 quoted offers, follow up on every quote within 24 hours, and keep supplier credit only for orders with a confirmed buyer and margin.',
    'Every sales/operations call must answer one question: what is the order size, payment terms, and closure date?',
    'Protect cash: no large stock or heavy cost without a concrete order; every proposal must be checked against margin and payment risk.',
  ];
  const healthPlan = [
    'Gym first: complete a 45- to 60-minute session before 7 PM today, then keep the next two days at the same time to build a repeatable habit.',
    'Nutrition: keep protein at 105-115 g/day, reduce sugar and tea/coffee load, and use the protein powder as a deliberate support, not a reward.',
    'Sleep: move bedtime earlier in 20-30 minute steps toward a fixed 11:30 PM-12:00 AM target, with no daytime nap longer than 20-30 minutes.',
  ];
  const answer = [
    planIntro,
    isDailyPlan || isGrowthPlan ? 'Reality first: this is not a quick-fix income plan; it is a disciplined sales-and-health system.' : 'Reality first: do not chase a fantasy goal. The strategy is to improve margin, win rate, and consistency at the same time.',
    'Daily operating system: three money tasks, one fitness task, one admin task. Keep the order as income work first, fitness second, learning third.',
    ...moneyPlan.map((line) => `• ${line}`),
    ...healthPlan.map((line) => `• ${line}`),
    'Decision rule: if an activity does not lead to rupees or health in the next 30 days, it is not the priority.',
  ].join('\n');

  return {
    answer,
    confidence: 'medium',
    dataSources: [{ name: 'Pratham personal advisor profile', source: 'Structured operating brief', recordId: 'pratham-profile' }],
    limitations: [
      'This advisor mode is intentionally grounded in the supplied Pratham brief and does not claim live market or financial data that is not available.',
      'Any price, tender, or health decision still needs current facts, owner confirmation, and medical guidance where relevant.',
    ],
    recommendedActions: [
      'Set today’s three money tasks before noon and block the gym session into the calendar before 5 PM.',
      'Track quote count, follow-up count, money work hours, gym completion, and sleep target in one simple log.',
      'Reassess the target after 7 days using actual quote wins, net margin, and real cash flow instead of emotion.',
    ],
    draft: 'Pratham advisor plan: 3 money tasks, 1 fitness task, 1 admin task. Start with quote follow-up and gym before anything else.',
    approval: null,
    source: 'Pratham personal advisor',
    scope: 'Guidance based on the supplied personal business and health brief, not a live external finance feed.',
  };
}

function buildFluxHealthProfile(data = {}) {
  const overdue = Number(data.counts?.overdueInvoices ?? 0);
  const goalRiskCount = Array.isArray(data.goalStatuses)
    ? data.goalStatuses.filter((goal) => ['behind', 'at_risk', 'needs_inputs'].includes(goal.status)).length
    : 0;
  const openTasks = Number(data.counts?.openTasks ?? 0);
  const sourceCoverage = Array.isArray(data.sources)
    ? data.sources.reduce((total, item) => total + Number(item.records ?? 0), 0)
    : 0;

  const score = Math.min(100, Math.max(0, Math.round(100 - overdue * 12 - goalRiskCount * 14 - Math.max(0, openTasks - 2) * 6 + Math.min(15, sourceCoverage / 10))));

  let riskLevel = 'low';
  if (score < 35) riskLevel = 'critical';
  else if (score < 55) riskLevel = 'high';
  else if (score < 75) riskLevel = 'medium';

  const nextBestActions = [];
  if (overdue > 0) {
    nextBestActions.push(`Clear ${overdue} overdue invoice issue${overdue === 1 ? '' : 's'} before taking on new commitments.`);
  }
  if (goalRiskCount > 0) {
    nextBestActions.push(`Reconfirm ${goalRiskCount} goal${goalRiskCount === 1 ? '' : 's'} with the owner and review the assumptions behind the slippage.`);
  } else {
    nextBestActions.push('Keep the goal rhythm stable; review the target only when the current week closes or the assumptions change.');
  }
  if (openTasks > 0) {
    nextBestActions.push(`Reduce the queue by giving ownership to the ${Math.min(3, openTasks)} highest-impact task${Math.min(3, openTasks) === 1 ? '' : 's'} that are still open.`);
  } else {
    nextBestActions.push('The queue is light; use the next block for conversion, margin, or learning work rather than more admin.');
  }

  const summary = overdue > 0 || goalRiskCount > 0 || openTasks > 0
    ? `Flux sees ${overdue} overdue invoice signal${overdue === 1 ? '' : 's'}, ${goalRiskCount} goal risk${goalRiskCount === 1 ? '' : 's'}, and ${openTasks} active task${openTasks === 1 ? '' : 's'} in the current operating snapshot.`
    : 'Flux is stable right now: there are no active blockers in the currently loaded source set.';

  return {
    score,
    riskLevel,
    summary,
    nextBestAction: nextBestActions[0],
    nextBestActions: nextBestActions.slice(0, 3),
    sourceCoverage,
  };
}

function buildFluxAnswer(message, data, context = {}) {
  const normalized = message.toLowerCase();
  const page = typeof context.page === 'string' ? context.page.toLowerCase() : '';
  const invoiceIssue = data.attention.filter((item) => item.kind === 'overdue_invoice');
  const goalIssue = data.goalStatuses.filter((goal) => ['behind', 'at_risk', 'needs_inputs'].includes(goal.status));
  const taskIssue = data.tasks.filter((task) => ['open', 'in_progress'].includes(task.status));
  const health = buildFluxHealthProfile(data);

  let answer;
  let evidence = data.attention;
  let confidence = 'medium';
  let limitations = ['The available answer is limited to the records returned by the active KARM source set.'];
  let recommendedActions = ['Review the highest-priority record and confirm the human owner before any action.'];
  let draft = null;
  let approval = null;

  if (/(what should i do|what should i do now|next best action|priority|priorit|urgent|health score|score)/.test(normalized)) {
    const actionable = health.nextBestActions.map((item) => `• ${item}`).join('\n');
    answer = `Flux health score: ${health.score}/100 (${health.riskLevel}). ${health.summary}\n\nNext best action: ${health.nextBestAction}\n${actionable}`;
    evidence = data.attention.length ? data.attention : [{ title: 'Operating health overview', source: 'Flux operating layer', recordId: 'flux-health' }];
    confidence = health.riskLevel === 'critical' ? 'high' : 'medium';
    limitations = ['This priority view is based on the current KARM signals only and intentionally avoids guessing external context.'];
    recommendedActions = health.nextBestActions;
    draft = `Priority brief: ${health.nextBestAction}`;
    approval = null;
    return {
      answer,
      confidence,
      dataSources: [{ name: 'Flux operating layer', source: 'Current workspace signals', recordId: 'flux-health' }],
      limitations,
      recommendedActions,
      draft,
      approval,
      source: 'Flux operating layer',
      scope: `Operating health check · ${health.riskLevel} risk`,
      evidence: [{ title: 'Operating health overview', recordId: 'flux-health', source: 'Flux operating layer' }],
      health,
    };
  }

  if (/\b(pratham|personal advisor|advisor mode|fitness|gym|daily plan|income target|net worth|habit|sleep)\b/.test(normalized) || /\b(pratham|advisor)\b/.test(page)) {
    const advisor = buildPrathamAdvisorAnswer(message);
    answer = advisor.answer;
    evidence = [{ title: 'Pratham advisory brief', recordId: 'pratham-profile', source: 'Pratham personal advisor profile', detail: 'Personal operating brief' }];
    confidence = advisor.confidence;
    limitations = advisor.limitations;
    recommendedActions = advisor.recommendedActions;
    draft = advisor.draft;
    approval = advisor.approval;
    return {
      answer,
      confidence,
      dataSources: advisor.dataSources,
      limitations,
      recommendedActions,
      draft,
      approval,
      source: advisor.source,
      scope: advisor.scope,
      evidence: [{ title: 'Pratham advisory brief', recordId: 'pratham-profile', source: 'Pratham personal advisor' }],
      health,
    };
  }

  if (/\b(goal|target|pace|milestone|progress)\b/.test(normalized)) {
    evidence = data.goalStatuses;
    answer = evidence.length
      ? evidence.map((goal) => `${goal.title}: ${goal.status.replaceAll('_', ' ')}, ${goal.progressPercent}% progress.${goal.risks.length ? ` ${goal.risks[0]}` : ''}`).join('\n')
      : 'There are no stored goals to review yet.';
    confidence = goalIssue.length ? 'high' : evidence.length ? 'medium' : 'low';
    recommendedActions = goalIssue.length
      ? goalIssue.slice(0, 3).map((goal) => `Review ${goal.title} and confirm whether delivery assumptions or capacity need to change.`)
      : ['Create or update the goal baseline before making delivery commitments.'];
    limitations = goalIssue.length
      ? ['Goal recommendations are based only on stored KARM goal data and current completion progress.']
      : ['No stored goals are available yet, so the recommendation is intentionally conservative.'];
    draft = goalIssue.length ? `Goal review: focus on ${goalIssue.slice(0, 2).map((goal) => goal.title).join(' and ')} before the next cycle.` : null;
  } else if (/\b(task|todo|work|action|queue)\b/.test(normalized)) {
    evidence = data.tasks;
    answer = evidence.length
      ? evidence.map((task) => `${task.title} — ${task.status}${task.owner ? `, owner: ${task.owner}` : ''}${task.dueDate ? `, due: ${task.dueDate}` : ''}`).join('\n')
      : 'There are no open KARM tasks.';
    confidence = taskIssue.length ? 'high' : evidence.length ? 'medium' : 'low';
    recommendedActions = taskIssue.length
      ? taskIssue.slice(0, 3).map((task) => `Assign or update ${task.title} with the next owner and agreed due date.`)
      : ['Create the task owner, scope, and due date before assigning work.'];
    limitations = evidence.length
      ? ['Task advice is limited to current KARM tasks and does not infer external projects or conversations.']
      : ['No tasks are currently available to prioritise.'];
    draft = taskIssue.length ? `Action queue: ${taskIssue.slice(0, 2).map((task) => task.title).join(' and ')} need follow-up with an owner.` : null;
  } else if (/\b(invoice|overdue|receivable|collection|amount|payment)\b/.test(normalized) || page.includes('accounting')) {
    evidence = invoiceIssue.length ? invoiceIssue : data.attention.filter((item) => item.kind === 'overdue_invoice');
    answer = evidence.length
      ? `${evidence.length} overdue invoice record${evidence.length === 1 ? ' appears' : 's appear'} in the loaded source set:\n${evidence.map((item) => item.detail).join('\n')}`
      : 'No overdue invoices were returned in the loaded source set.';
    confidence = invoiceIssue.length ? 'high' : 'low';
    recommendedActions = invoiceIssue.length
      ? invoiceIssue.slice(0, 3).map((item) => `Review ${item.detail} and confirm the next collection or follow-up step.`)
      : ['Check whether the invoice source set is outdated or whether a new invoice needs to be loaded.'];
    limitations = ['Invoice issues are based only on returned accounting records and do not claim the full ledger status.'];
    draft = invoiceIssue.length ? `Invoice follow-up: confirm collection priorities for ${invoiceIssue.slice(0, 2).map((item) => item.detail).join(' and ')}.` : null;
  } else {
    evidence = data.attention;
    const overdueCount = data.counts.overdueInvoices;
    answer = `From the available records: ${overdueCount} overdue invoice records, ${data.counts.goals} goals, and ${data.counts.openTasks} open tasks. ${evidence.length ? `${evidence.length} item(s) need review.` : 'No goal or invoice attention signals were found in this loaded set.'}`;
    confidence = evidence.length ? 'medium' : 'low';
    recommendedActions = evidence.length
      ? ['Prioritize the most urgent review item, then update the task queue or goal plan before taking any action.']
      : ['Review the loaded source set and add a verified goal or task if the work is not yet in KARM.'];
    limitations = ['This answer is intentionally conservative and intentionally avoids guessing missing business facts.'];
    draft = evidence.length ? 'Operating summary: review the current priority list and confirm decision owners before the next cycle.' : null;
  }

  const dataSources = Array.from(new Map((evidence ?? []).map((item) => [item.recordId ?? item.title ?? item.source, item])).values()).slice(0, 5).map((item) => ({
    name: item.title ?? item.detail ?? item.source ?? 'KARM record',
    recordId: item.recordId ?? undefined,
    source: item.source ?? 'KARM record',
  }));

  const generatedEvidence = (evidence ?? []).map((item) => ({
    title: item.title ?? item.detail ?? item.task_id ?? item.goal_id,
    recordId: item.recordId ?? item.task_id ?? item.goal_id,
    source: item.source ?? 'KARM record',
  }));

  return {
    answer,
    confidence,
    dataSources: dataSources.length ? dataSources : [{ name: 'KARM workspace', source: 'Current workspace records', recordId: undefined }],
    limitations,
    recommendedActions,
    draft,
    approval: null,
    source: 'Flux operating layer',
    scope: data.sources?.[0]?.name ? `Source-grounded records · ${data.sources[0].name}` : 'Source-grounded records',
    evidence: generatedEvidence,
    health,
  };
}

async function loadFluxBriefing() {
  const [invoicePayload, goalsPayload, taskPayload] = await Promise.all([
    config.zoho
      ? config.zoho.request('GET', 'invoices', { query: { per_page: 200 } })
      : store.list('invoices', { per_page: 200 }),
    store.list('goals', { per_page: 200 }),
    store.list('tasks', { per_page: 200 }),
  ]);
  const invoices = invoicePayload.invoices ?? [];
  const goals = (goalsPayload.goals ?? []).map((goal) => evaluateGoal(goal));
  const tasks = taskPayload.tasks ?? [];
  const overdueInvoices = invoices.filter((invoice) => ['overdue', 'over due'].includes(String(invoice.status ?? invoice.invoice_status ?? '').toLowerCase()));
  const openTasks = tasks.filter((task) => !['done', 'cancelled'].includes(String(task.status ?? '').toLowerCase()));
  const accountingSource = config.zoho ? 'Zoho Books' : 'Practice records';
  const attention = [
    ...overdueInvoices.map((invoice) => ({
      kind: 'overdue_invoice',
      title: 'Review overdue invoice',
      detail: `${invoice.invoice_number ?? 'Invoice record'} · ${invoice.customer_name ?? 'Customer not provided'}`,
      recordId: idOf(invoice),
      source: accountingSource,
      action: 'Review the source invoice and confirm the appropriate follow-up.',
    })),
    ...goals.filter((goal) => ['behind', 'at_risk', 'needs_inputs'].includes(goal.status)).map((goal) => ({
      kind: 'goal_attention',
      title: goal.status === 'needs_inputs' ? 'Complete goal inputs' : 'Review goal pace',
      detail: goal.title,
      recordId: goal.goal_id,
      source: 'KARM goal record',
      action: goal.risks[0] ?? 'Review the goal plan with its owner.',
    })),
  ];
  const health = buildFluxHealthProfile({
    counts: { overdueInvoices: overdueInvoices.length, openTasks: openTasks.length },
    goalStatuses: goals.map(({ goal_id, title, status, progressPercent, risks }) => ({ goal_id, title, status, progressPercent, risks })),
    sources: [
      { name: accountingSource, records: invoices.length },
      { name: 'KARM goals', records: goals.length },
      { name: 'KARM tasks', records: tasks.length },
    ],
  });

  return {
    generatedAt: new Date().toISOString(),
    timezone: 'Asia/Kolkata',
    mode: config.mode,
    sources: [
      { name: accountingSource, records: invoices.length, scope: 'Invoices returned by the source (up to 200)' },
      { name: 'KARM goals', records: goals.length, scope: 'Locally stored goal records' },
      { name: 'KARM tasks', records: tasks.length, scope: 'Locally stored task records' },
    ],
    counts: { invoices: invoices.length, overdueInvoices: overdueInvoices.length, goals: goals.length, openTasks: openTasks.length },
    attention,
    goalStatuses: goals.map(({ goal_id, title, status, progressPercent, risks }) => ({ goal_id, title, status, progressPercent, risks })),
    tasks: openTasks.slice(0, 20).map(({ task_id, title, owner, dueDate, status }) => ({ task_id, title, owner, dueDate, status })),
    health,
  };
}

function validateIdempotencyKey(key) {
  if (!key) return { ok: false, status: 422, code: 'IDEMPOTENCY_REQUIRED', message: 'Idempotency-Key is required for writes' };
  if (key.length > 128 || !/^[a-zA-Z0-9._:-]+$/.test(key)) {
    return { ok: false, status: 422, code: 'INVALID_IDEMPOTENCY_KEY', message: 'Idempotency-Key must be 1-128 safe characters' };
  }
  return { ok: true };
}

function isPreviewOperationSupported(operation) {
  const [action, entity, ...rest] = operation.split(':');
  if (!entities[entity]) return false;
  if (action === 'create') return rest.length === 0;
  if (action === 'update') return rest.length === 1 && rest[0].length > 0;
  if (action === 'email' && entity === 'invoices') return rest.length === 1 && rest[0].length > 0;
  if (action === 'status' && entity === 'invoices') return rest.length === 2 && rest[0].length > 0 && ['sent', 'void', 'draft', 'open'].includes(rest[1]);
  return false;
}

function requireWriteApproval(c, operation, requestBody, idempotencyKey) {
  if (!config.zoho) return null;
  const token = c.req.header('X-Confirm-Action');
  if (!isValidWriteApproval(config.env.SESSION_SECRET, token, operation, store.requestFingerprint(requestBody), idempotencyKey)) {
    return failure(c, 428, 'CONFIRMATION_REQUIRED', 'Preview this exact write request, then submit its unexpired approval token');
  }
  return null;
}

function getListQuery(c) {
  const query = {};
  for (const [key, value] of new URL(c.req.url).searchParams) {
    if (!listQueryKeys.has(key)) continue;
    if (key === 'per_page' && (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 200)) {
      return { ok: false, status: 400, code: 'INVALID_PAGE_SIZE', message: 'per_page must be an integer from 1 to 200' };
    }
    if (key === 'page' && (!/^\d+$/.test(value) || Number(value) < 1)) {
      return { ok: false, status: 400, code: 'INVALID_PAGE', message: 'page must be a positive integer' };
    }
    if (key === 'sort_order' && !['asc', 'desc'].includes(value.toLowerCase())) {
      return { ok: false, status: 400, code: 'INVALID_SORT_ORDER', message: 'sort_order must be asc or desc' };
    }
    if (key === 'sort_column' && !/^[A-Za-z_][A-Za-z0-9_]{0,63}$/.test(value)) {
      return { ok: false, status: 400, code: 'INVALID_SORT_COLUMN', message: 'sort_column must be a valid field name up to 64 characters' };
    }
    query[key] = value;
  }
  return { ok: true, value: query };
}

async function performIdempotentWrite(c, operation, key, requestBody, run) {
  const scopedKey = `${operation}:${key}`;
  const requestFingerprint = store.requestFingerprint(requestBody);
  const previous = await store.getIdempotency(scopedKey);
  if (previous) {
    if (previous.fingerprint !== requestFingerprint) {
      return failure(c, 409, 'IDEMPOTENCY_CONFLICT', 'This Idempotency-Key was already used with a different request body');
    }
    if (previous.status === 'pending') {
      return failure(c, 409, 'IDEMPOTENCY_PENDING', 'A prior attempt may have reached Zoho; verify its result before retrying with a new key');
    }
    return c.json(previous.response.body, previous.response.status);
  }
  const active = inFlightWrites.get(scopedKey);
  if (active) {
    if (active.fingerprint !== requestFingerprint) {
      return failure(c, 409, 'IDEMPOTENCY_CONFLICT', 'This Idempotency-Key is already being used with a different request body');
    }
    const result = await active.promise;
    return c.json(result.body, result.status);
  }
  const promise = (async () => {
    const reservation = await store.reserveIdempotency(scopedKey, requestBody);
    if (reservation.fingerprint !== requestFingerprint) {
      return { status: 409, body: { ok: false, error: { code: 'IDEMPOTENCY_CONFLICT', message: 'This Idempotency-Key was already used with a different request body' } } };
    }
    if (reservation.status === 'complete') return reservation.response;
    if (reservation.status === 'pending' && !reservation.created) {
      return { status: 409, body: { ok: false, error: { code: 'IDEMPOTENCY_PENDING', message: 'A prior attempt may have reached Zoho; verify its result before retrying with a new key' } } };
    }
    const result = await run();
    await store.saveIdempotency(scopedKey, requestBody, result);
    return result;
  })();
  inFlightWrites.set(scopedKey, { fingerprint: requestFingerprint, promise });
  try {
    const result = await promise;
    return c.json(result.body, result.status);
  } finally {
    inFlightWrites.delete(scopedKey);
  }
}

function idOf(record) {
  if (!record || typeof record !== 'object') return undefined;
  return Object.entries(record).find(([key]) => key.endsWith('_id'))?.[1];
}

async function closeStorage() {
  await store.close?.();
}

export { app, closeStorage };

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  if (config.mode === 'live') validateZohoConfig(process.env);
  const port = Number(process.env.PORT ?? 8787);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer from 1 to 65535');
  const { serve } = await import('@hono/node-server');
  const server = serve({ fetch: app.fetch, hostname: config.host, port });
  const automationTimer = setInterval(() => {
    runDueAutomations(store).catch((error) => console.error(`Scheduled KARM automation failed: ${error.message}`));
  }, 15_000);
  automationTimer.unref();
  runDueAutomations(store).catch((error) => console.error(`Scheduled KARM automation failed: ${error.message}`));
  const shutdown = async () => {
    clearInterval(automationTimer);
    await new Promise((resolveClose) => server.close(resolveClose));
    await store.close?.();
  };
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => {
      shutdown().catch((error) => {
        console.error(`Graceful shutdown failed: ${error.message}`);
        process.exitCode = 1;
      });
    });
  }
  console.log(`KARM API listening on http://${config.host}:${port} (${config.mode} mode)`);
}
