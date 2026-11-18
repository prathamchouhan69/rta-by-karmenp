// Post-deployment smoke test for the unified gateway. It never prints secrets or tokens.
// Usage:
//   node --env-file=apps/proxy/.env scripts/smoke-gateway.mjs
//   KARM_BASE_URL=https://your-domain.example SETUP_CODE=... node scripts/smoke-gateway.mjs

const base = String(process.env.KARM_BASE_URL || 'http://127.0.0.1:8787').replace(/\/$/, '');
const setupCode = process.env.SETUP_CODE || '';
const metricsToken = process.env.METRICS_TOKEN || '';
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 90_000);
const results = [];

async function call(path, { method = 'GET', body, token, headers = {} } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  return { status: response.status, data, text };
}

function check(name, condition, detail) {
  results.push({ name, ok: Boolean(condition), detail });
  if (!condition) throw new Error(`${name}: ${detail || 'check failed'}`);
}

try {
  const healthz = await call('/healthz');
  check('gateway liveness', healthz.status === 200 && healthz.data?.ok === true, `HTTP ${healthz.status}`);
  const readyz = await call('/readyz');
  check('gateway readiness', readyz.status === 200 && readyz.data?.ok === true, JSON.stringify(readyz.data?.proxy || {}));
  const proxyHealth = await call('/api/v1/health');
  check('proxy health', proxyHealth.status === 200 && proxyHealth.data?.ok === true, `HTTP ${proxyHealth.status}`);
  const fluxHealth = await call('/flux/health');
  check('flux health', fluxHealth.status === 200 && fluxHealth.data?.ok === true, `HTTP ${fluxHealth.status}`);

  if (!setupCode) throw new Error('SETUP_CODE is required for the authenticated smoke checks');
  const login = await call('/api/v1/auth/session', { method: 'POST', body: { setup_code: setupCode } });
  check('owner login', login.status === 200 && login.data?.data?.access_token, `HTTP ${login.status}`);
  const token = login.data.data.access_token;

  const status = await call('/api/v1/flux/status', { token });
  check('unified status', status.status === 200 && status.data?.data?.proxy?.ok === true, `HTTP ${status.status}`);
  check('flux audit chain', status.data?.data?.flux?.audit?.ok === true, JSON.stringify(status.data?.data?.flux?.audit));
  check('flux identity bridge', status.data?.data?.security?.ownerId === (process.env.FLUX_OWNER_ID || 'owner'), 'owner mapping');

  const me = await call('/flux/v1/me', { token });
  check('flux RBAC session', me.status === 200 && me.data?.role === 'owner', `HTTP ${me.status}`);
  const audit = await call('/flux/v1/audit/verify', { token });
  check('flux audit verify endpoint', audit.status === 200 && audit.data?.ok === true, JSON.stringify(audit.data));

  const briefing = await call('/api/v1/flux/briefing', { token });
  check('unified briefing', briefing.status === 200 && briefing.data?.ok === true, `HTTP ${briefing.status}`);
  check('briefing engine labelled', typeof briefing.data?.data?.engine?.name === 'string', JSON.stringify(briefing.data?.data?.engine));
  check('briefing counts', briefing.data?.data?.counts && Number.isInteger(briefing.data.data.counts.overdueInvoices), JSON.stringify(briefing.data?.data?.counts));

  const measurement = await call('/api/v1/flux/ask', {
    method: 'POST', token, body: { message: 'Convert 20 MT TMT steel into kg.' },
  });
  check('deterministic measurement', measurement.status === 200 && measurement.data?.data?.measurement?.supported === true, `HTTP ${measurement.status}`);
  const chat = await call('/api/v1/flux/ask', {
    method: 'POST', token, body: { message: 'What needs attention in this workspace?', context: { page: 'home' } },
  });
  check('assistant answer', chat.status === 200 && typeof chat.data?.data?.answer === 'string' && chat.data.data.answer.length > 10, `HTTP ${chat.status}`);

  const metrics = await call('/metrics', { headers: metricsToken ? { authorization: `Bearer ${metricsToken}` } : {} });
  check('metrics', metrics.status === 200 && metrics.text.includes('karm_gateway_requests_total'), `HTTP ${metrics.status}`);

  console.log(JSON.stringify({
    ok: true,
    base,
    checks: results,
    mode: proxyHealth.data?.data?.mode,
    flux: {
      modelProviders: status.data?.data?.flux?.providers || [],
      models: status.data?.data?.flux?.models ?? 0,
      auditEntries: status.data?.data?.flux?.audit?.count ?? 0,
    },
    briefing: {
      engine: briefing.data?.data?.engine,
      counts: briefing.data.data.counts,
      attention: briefing.data.data.attention?.length ?? 0,
    },
    assistant: {
      engine: chat.data?.data?.engine?.name,
      source: chat.data?.data?.source,
    },
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: error.message, checks: results }, null, 2));
  process.exit(1);
}
