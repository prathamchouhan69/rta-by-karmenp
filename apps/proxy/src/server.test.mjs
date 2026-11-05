import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStore } from './store.mjs';

const dataDirectory = await mkdtemp(join(tmpdir(), 'karm-proxy-test-'));
process.env.ZOHO_MODE = 'mock';
process.env.HOST = '127.0.0.1';
process.env.DATA_DIR = dataDirectory;
process.env.STATIC_ROOT = relative(
  process.cwd(),
  resolve(dirname(fileURLToPath(import.meta.url)), '../../../apps/web'),
);
delete process.env.SETUP_CODE;
delete process.env.SESSION_SECRET;
delete process.env.APP_ORIGIN;
const { app, serviceBase } = await import('./server.mjs');

after(async () => {
  await rm(dataDirectory, { recursive: true, force: true });
});

const jsonRequest = (path, method, value, headers = {}) => app.request(path, {
  method,
  headers: { 'Content-Type': 'application/json', ...headers },
  body: JSON.stringify(value)
});
const dateOffset = (offset) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const fields = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const date = new Date(`${fields.year}-${fields.month}-${fields.day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
};
const revenueGoal = () => ({
  title: 'Grow monthly revenue',
  metric: 'monthly_revenue',
  unit: 'INR',
  baseline: '2500000',
  currentValue: '2800000',
  minimumTarget: '3000000',
  target: '3500000',
  stretchTarget: '4000000',
  baselineDate: dateOffset(-30),
  currentDate: dateOffset(0),
  deadline: dateOffset(30),
  owner: 'Workspace owner',
  capacityPerWeek: '200000',
});

describe('practice API', () => {
  it('requires durable database storage in production', () => {
    assert.throws(
      () => serviceBase({ NODE_ENV: 'production', ZOHO_MODE: 'mock', HOST: '0.0.0.0' }),
      /Production deployments require DATABASE_URL/,
    );
    assert.equal(
      serviceBase({ NODE_ENV: 'production', ZOHO_MODE: 'mock', DATABASE_URL: 'postgresql://localhost/karm' }).mode,
      'mock',
    );
  });

  it('reports the active mode without exposing configuration', async () => {
    const response = await app.request('/api/v1/health');
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      ok: true,
      data: { mode: 'mock', service: 'karm-proxy', authenticated: false, zohoConfigured: false }
    });
  });

  it('serves frontend routes from the SPA entry point and preserves API 404s', async () => {
    const page = await app.request('/invoices');
    assert.equal(page.status, 200);
    assert.match(await page.text(), /<div id="root"><\/div>/);
    assert.match(page.headers.get('Content-Security-Policy'), /script-src 'self'/);

    const missingApiRoute = await app.request('/api/v1/not-a-route');
    assert.equal(missingApiRoute.status, 404);
    assert.equal((await missingApiRoute.json()).error.code, 'RESOURCE_NOT_SUPPORTED');
  });

  it('keeps the existing golden invoice response contract', async () => {
    const response = await app.request('/api/v1/invoices');
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.data[0].invoice_number, 'INV-KE-270031');
    assert.equal(body.data[0].total_formatted, '₹64,944.84');
  });

  it('validates pagination and rejects Zoho-calculated money fields', async () => {
    assert.equal((await app.request('/api/v1/invoices?per_page=201')).status, 400);
    assert.equal((await app.request('/api/v1/invoices?sort_order=desc%3Bdrop')).status, 400);
    assert.equal((await app.request('/api/v1/invoices?sort_column=invoice_number%20DESC')).status, 400);
    const response = await jsonRequest('/api/v1/invoices', 'POST', {
      customer_id: 'c1',
      line_items: [{ item_id: 'i1', quantity: '2', rate: '950.00', tax_amount: '342.00' }]
    }, { 'Idempotency-Key': 'computed-field-test' });
    assert.equal(response.status, 422);
    assert.equal((await response.json()).error.code, 'COMPUTED_FIELD');
  });

  it('rejects request bodies larger than the configured limit', async () => {
    const response = await app.request('/api/v1/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: ' '.repeat(1_000_001)
    });
    assert.equal(response.status, 413);
    assert.equal((await response.json()).error.code, 'BODY_TOO_LARGE');
  });

  it('requires idempotency keys and rejects key reuse with a different request', async () => {
    const request = { customer_id: 'c1', line_items: [{ item_id: 'i1', quantity: '1', rate: '950.00' }] };
    const missing = await jsonRequest('/api/v1/invoices', 'POST', request);
    assert.equal(missing.status, 422);
    assert.equal((await missing.json()).error.code, 'IDEMPOTENCY_REQUIRED');

    const first = await jsonRequest('/api/v1/invoices', 'POST', request, { 'Idempotency-Key': 'create-invoice-1' });
    const replay = await jsonRequest('/api/v1/invoices', 'POST', request, { 'Idempotency-Key': 'create-invoice-1' });
    assert.equal(first.status, 201);
    assert.deepEqual(await replay.json(), await first.json());
    const reopenedStore = await createStore(dataDirectory);
    const persistedReplay = await reopenedStore.getIdempotency('create:invoices:create-invoice-1');
    assert.equal(persistedReplay.status, 'complete');

    const conflict = await jsonRequest('/api/v1/invoices', 'POST', { customer_id: 'c2' }, { 'Idempotency-Key': 'create-invoice-1' });
    assert.equal(conflict.status, 409);
    assert.equal((await conflict.json()).error.code, 'IDEMPOTENCY_CONFLICT');
  });

  it('persists practice records and serves detail routes', async () => {
    const created = await jsonRequest('/api/v1/contacts', 'POST', { contact_name: 'Practice customer' }, { 'Idempotency-Key': 'create-contact-1' });
    const body = await created.json();
    assert.equal(created.status, 201);
    const contactId = body.data.contact_id;
    const detail = await app.request(`/api/v1/contacts/${contactId}`);
    assert.equal((await detail.json()).data.contact_name, 'Practice customer');
  });

  it('requires explicit confirmation before voiding an invoice', async () => {
    const response = await jsonRequest('/api/v1/invoices/inv-golden/status/void', 'POST', {}, { 'Idempotency-Key': 'void-invoice-1' });
    assert.equal(response.status, 428);
    assert.equal((await response.json()).error.code, 'CONFIRMATION_REQUIRED');
  });

  it('updates practice invoice status only after confirmed idempotent action', async () => {
    const response = await jsonRequest('/api/v1/invoices/inv-golden/status/void', 'POST', {}, {
      'Idempotency-Key': 'void-invoice-confirmed',
      'X-Confirm-Action': 'void-invoice:inv-golden'
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).data.status, 'void');
    const detail = await app.request('/api/v1/invoices/inv-golden');
    assert.equal((await detail.json()).data.status, 'void');
  });

  it('does not expose destructive delete routes', async () => {
    const response = await app.request('/api/v1/invoices/inv-golden', { method: 'DELETE' });
    assert.equal(response.status, 405);
  });

  it('previews supported writes without executing them', async () => {
    const request = { customer_id: 'c1', line_items: [{ item_id: 'i1', quantity: '1', rate: '950.00' }] };
    const countBefore = (await (await app.request('/api/v1/invoices')).json()).data.length;
    const missingKey = await jsonRequest('/api/v1/write-previews', 'POST', { operation: 'create:invoices', request });
    assert.equal(missingKey.status, 422);
    const preview = await jsonRequest('/api/v1/write-previews', 'POST', {
      operation: 'create:invoices',
      request,
      idempotencyKey: 'preview-invoice-1',
    });
    const body = await preview.json();
    assert.equal(preview.status, 200);
    assert.equal(body.data.requiresExplicitApproval, true);
    assert.equal(body.data.approvalToken, null);
    assert.equal(body.data.mode, 'mock');
    assert.equal((await (await app.request('/api/v1/invoices')).json()).data.length, countBefore);
    const unsupported = await jsonRequest('/api/v1/write-previews', 'POST', {
      operation: 'delete:invoices:inv-golden',
      request: {},
      idempotencyKey: 'preview-delete-1',
    });
    assert.equal(unsupported.status, 422);
  });

  it('previews goal feasibility without persisting it', async () => {
    const response = await jsonRequest('/api/v1/goals/feasibility', 'POST', { ...revenueGoal(), capacityPerWeek: undefined });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.data.status, 'needs_inputs');
    assert.match(body.data.missingInputs[0], /capacity/);
    assert.deepEqual((await (await app.request('/api/v1/goals')).json()).data, []);
  });

  it('creates goals locally, requires idempotency, and tracks actuals without Zoho writes', async () => {
    const missingKey = await jsonRequest('/api/v1/goals', 'POST', revenueGoal());
    assert.equal(missingKey.status, 422);
    assert.equal((await missingKey.json()).error.code, 'IDEMPOTENCY_REQUIRED');

    const request = revenueGoal();
    const createdResponse = await jsonRequest('/api/v1/goals', 'POST', request, { 'Idempotency-Key': 'goal-create-1' });
    const createdBody = await createdResponse.json();
    assert.equal(createdResponse.status, 201);
    assert.equal(createdBody.data.metric, 'monthly_revenue');
    assert.equal(createdBody.data.status, 'at_risk');
    assert.equal(createdBody.data.progressPercent, 30);

    const replay = await jsonRequest('/api/v1/goals', 'POST', request, { 'Idempotency-Key': 'goal-create-1' });
    assert.deepEqual(await replay.json(), createdBody);

    const id = createdBody.data.goal_id;
    assert.ok(id, JSON.stringify(createdBody));
    const progressRequest = { value: '2900000', date: dateOffset(0) };
    const progressHeaders = { 'Idempotency-Key': 'goal-progress-1' };
    const progressResponse = await jsonRequest(`/api/v1/goals/${id}/progress`, 'POST', progressRequest, progressHeaders);
    assert.equal(progressResponse.status, 200, JSON.stringify(await progressResponse.clone().json()));
    assert.equal((await progressResponse.json()).data.currentValue, '2900000');

    const progressReplay = await jsonRequest(`/api/v1/goals/${id}/progress`, 'POST', progressRequest, progressHeaders);
    assert.equal((await progressReplay.json()).data.currentValue, '2900000');
    const listed = await app.request('/api/v1/goals');
    assert.equal((await listed.json()).data[0].currentValue, '2900000');
  });

  it('rejects invalid goal targets and future progress dates', async () => {
    const invalid = await jsonRequest('/api/v1/goals/feasibility', 'POST', { ...revenueGoal(), target: '2000000' });
    assert.equal(invalid.status, 422);
    assert.equal((await invalid.json()).error.code, 'INVALID_GOAL');

    const created = await jsonRequest('/api/v1/goals', 'POST', revenueGoal(), { 'Idempotency-Key': 'goal-create-invalid-progress' });
    const id = (await created.json()).data.goal_id;
    const progress = await jsonRequest(`/api/v1/goals/${id}/progress`, 'POST', {
      value: '2900000',
      date: dateOffset(2),
    }, { 'Idempotency-Key': 'goal-progress-future' });
    assert.equal(progress.status, 422);
    assert.equal((await progress.json()).error.code, 'INVALID_PROGRESS');
  });

  it('builds a source-scoped Flux briefing and answers from returned records', async () => {
    const invoice = await jsonRequest('/api/v1/invoices', 'POST', {
      invoice_number: 'INV-FLUX-TEST',
      customer_id: 'c1',
      status: 'overdue',
    }, { 'Idempotency-Key': 'flux-overdue-invoice' });
    assert.equal(invoice.status, 201);
    const briefingResponse = await app.request('/api/v1/flux/briefing');
    const briefing = await briefingResponse.json();
    assert.equal(briefingResponse.status, 200);
    assert.equal(briefing.data.mode, 'mock');
    assert.equal(briefing.data.sources[0].name, 'Practice records');
    assert.ok(briefing.data.counts.overdueInvoices >= 1);
    const overdue = briefing.data.attention.filter((item) => item.kind === 'overdue_invoice');
    assert.ok(overdue.some((item) => item.detail.startsWith('INV-FLUX-TEST')));

    const answerResponse = await jsonRequest('/api/v1/flux/ask', 'POST', { message: 'Which invoices are overdue?', context: { page: 'accounting' } });
    const answer = await answerResponse.json();
    assert.equal(answerResponse.status, 200);
    assert.match(answer.data.answer, /INV-FLUX-TEST/);
    assert.equal(answer.data.modelConfigured, false);
    assert.ok(['high', 'medium', 'low', 'uncertain'].includes(answer.data.confidence));
    assert.ok(Array.isArray(answer.data.dataSources));
    assert.ok(Array.isArray(answer.data.recommendedActions));
    assert.ok(Array.isArray(answer.data.limitations));
    assert.equal(answer.data.approval, null);
    assert.match(answer.data.scope, /Practice records/);

    const invalid = await jsonRequest('/api/v1/flux/ask', 'POST', { message: 'x' });
    assert.equal(invalid.status, 422);
  });

  it('adds a Pratham personal-advisor mode for daily planning and business-health guidance', async () => {
    const response = await jsonRequest('/api/v1/flux/ask', 'POST', {
      message: 'Build my Pratham advisor daily plan with gym, income work, and focus on the business target.',
      context: { page: 'briefing' },
    });
    assert.equal(response.status, 200, JSON.stringify(await response.clone().json()));
    const payload = await response.json();
    assert.match(payload.data.answer, /₹1,50,000|40x|gym|money tasks/i);
    assert.match(payload.data.source, /Pratham|advisor/i);
    assert.ok(payload.data.recommendedActions.length >= 3);
    assert.ok(payload.data.dataSources.some((source) => /Pratham|profile/i.test(source.name)));
  });

  it('calculates a Flux operating health score and next best action for the current workload', async () => {
    const response = await jsonRequest('/api/v1/flux/ask', 'POST', {
      message: 'What should I do now?',
      context: { page: 'briefing' },
    });
    assert.equal(response.status, 200, JSON.stringify(await response.clone().json()));
    const payload = await response.json();
    assert.equal(typeof payload.data.health.score, 'number');
    assert.ok(['low', 'medium', 'high', 'critical'].includes(payload.data.health.riskLevel));
    assert.ok(payload.data.health.nextBestActions.length >= 2);
    assert.match(payload.data.answer, /Flux health score|Next best action/i);
  });

  it('routes deterministic measurement conversions through Flux without loading business data', async () => {
    const response = await jsonRequest('/api/v1/flux/ask', 'POST', {
      message: 'Convert 20 MT TMT steel into kg.',
    });
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.data.source, 'Flux Measurement Engine');
    assert.equal(payload.data.measurement.supported, true);
    assert.equal(payload.data.measurement.converted, '20,000 kilograms');
    assert.match(payload.data.measurement.formula, /1000/);

    const ambiguous = await jsonRequest('/api/v1/flux/ask', 'POST', {
      message: 'Convert 2 litres into glasses.',
    });
    assert.equal(ambiguous.status, 200);
    const ambiguousPayload = await ambiguous.json();
    assert.equal(ambiguousPayload.data.measurement.supported, false);
    assert.equal(ambiguousPayload.data.confidence, 'uncertain');
    assert.match(ambiguousPayload.data.answer, /capacity varies/i);
  });

  it('creates and tracks internal tasks with owner and valid date requirements', async () => {
    const invalidOwner = await jsonRequest('/api/v1/tasks', 'POST', { title: 'Review records', owner: '' }, { 'Idempotency-Key': 'task-invalid-owner' });
    assert.equal(invalidOwner.status, 422);
    assert.equal((await invalidOwner.json()).error.code, 'INVALID_TASK');
    const invalidDate = await jsonRequest('/api/v1/tasks', 'POST', { title: 'Review records', owner: 'Owner', dueDate: '2026-02-30' }, { 'Idempotency-Key': 'task-invalid-date' });
    assert.equal(invalidDate.status, 422);

    const request = { title: 'Review overdue invoice', owner: 'Workspace owner', dueDate: dateOffset(1), sourceType: 'invoice', sourceId: 'inv-golden' };
    const createdResponse = await jsonRequest('/api/v1/tasks', 'POST', request, { 'Idempotency-Key': 'task-create-1' });
    const created = await createdResponse.json();
    assert.equal(createdResponse.status, 201);
    assert.equal(created.data.status, 'open');
    assert.equal(created.data.sourceId, 'inv-golden');
    const replay = await jsonRequest('/api/v1/tasks', 'POST', request, { 'Idempotency-Key': 'task-create-1' });
    assert.deepEqual(await replay.json(), created);

    const updated = await jsonRequest(`/api/v1/tasks/${created.data.task_id}/status`, 'POST', { status: 'done' }, { 'Idempotency-Key': 'task-status-1' });
    assert.equal(updated.status, 200);
    assert.equal((await updated.json()).data.status, 'done');
    const listed = await app.request('/api/v1/tasks');
    assert.equal((await listed.json()).data[0].status, 'done');
  });

  it('stores document drafts locally and rejects unsupported document types', async () => {
    const invalid = await jsonRequest('/api/v1/documents', 'POST', {
      title: 'Tax classification',
      documentType: 'verified_hsn_lookup',
      content: 'Unverified classification',
    }, { 'Idempotency-Key': 'document-invalid-type' });
    assert.equal(invalid.status, 422);

    const request = {
      title: 'Customer follow-up draft',
      documentType: 'follow_up_draft',
      content: 'Please confirm the delivery date with the workspace owner.',
      linkedRecordId: 'inv-golden',
    };
    const createdResponse = await jsonRequest('/api/v1/documents', 'POST', request, { 'Idempotency-Key': 'document-create-1' });
    const created = await createdResponse.json();
    assert.equal(createdResponse.status, 201);
    assert.equal(created.data.status, 'draft');
    assert.equal(created.data.externalAction, false);
    const replay = await jsonRequest('/api/v1/documents', 'POST', request, { 'Idempotency-Key': 'document-create-1' });
    assert.deepEqual(await replay.json(), created);
    const listed = await app.request('/api/v1/documents');
    assert.equal((await listed.json()).data[0].content, request.content);
  });

  it('creates daily internal-task automations and allows them to be paused', async () => {
    const invalid = await jsonRequest('/api/v1/automations', 'POST', {
      title: 'Review records',
      owner: 'Workspace owner',
      scheduleTime: '26:00',
    }, { 'Idempotency-Key': 'automation-invalid-time' });
    assert.equal(invalid.status, 422);

    const request = {
      title: 'Review goal progress',
      description: 'Check goal actuals and update the team task queue.',
      owner: 'Workspace owner',
      scheduleTime: '09:15',
    };
    const createdResponse = await jsonRequest('/api/v1/automations', 'POST', request, { 'Idempotency-Key': 'automation-create-test' });
    const created = await createdResponse.json();
    assert.equal(createdResponse.status, 201);
    assert.equal(created.data.timezone, 'Asia/Kolkata');
    assert.equal(created.data.action, 'create_internal_task');
    assert.equal(created.data.enabled, true);

    const paused = await jsonRequest(`/api/v1/automations/${created.data.automation_id}/enabled`, 'POST', { enabled: false }, { 'Idempotency-Key': 'automation-pause-test' });
    assert.equal(paused.status, 200);
    assert.equal((await paused.json()).data.enabled, false);
  });
});
