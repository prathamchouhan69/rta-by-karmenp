const BUCKETS = [5, 10, 25, 50, 100, 250, 500, 1_000, 2_500, 5_000];
const routeId = (part) => (/^\d+$/.test(part) || /^[0-9a-f-]{8,}$/i.test(part) ? ':id' : part);

function routeKey(pathname) {
  const parts = String(pathname || '/').split('/').filter(Boolean);
  if (!parts.length) return '/';
  // Keep the stable prefix, collapse identifiers so metric cardinality cannot explode.
  return `/${parts.slice(0, 4).map(routeId).join('/')}`;
}

function labels(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

export function createMetrics({ now = () => Date.now() } = {}) {
  const startedAt = now();
  let requests = 0;
  let errors = 0;
  let totalMs = 0;
  let maxMs = 0;
  const statuses = new Map();
  const routes = new Map();
  const histogram = new Map(BUCKETS.map((bucket) => [bucket, 0]));

  const observe = ({ method, path, status, ms }) => {
    const elapsed = Number.isFinite(ms) ? Math.max(0, ms) : 0;
    const family = `${Math.floor(Number(status || 0) / 100)}xx`;
    requests += 1;
    totalMs += elapsed;
    maxMs = Math.max(maxMs, elapsed);
    if (Number(status) >= 500) errors += 1;
    statuses.set(family, (statuses.get(family) || 0) + 1);
    const key = `${String(method || 'GET').toUpperCase()} ${routeKey(path)}`;
    const current = routes.get(key) || { count: 0, errors: 0, totalMs: 0 };
    current.count += 1;
    current.totalMs += elapsed;
    if (Number(status) >= 500) current.errors += 1;
    routes.set(key, current);
    for (const bucket of BUCKETS) if (elapsed <= bucket) histogram.set(bucket, histogram.get(bucket) + 1);
  };

  const snapshot = () => ({
    startedAt: new Date(startedAt).toISOString(),
    uptimeSec: Math.max(0, Math.floor((now() - startedAt) / 1000)),
    requests,
    errors,
    avgLatencyMs: requests ? Math.round(totalMs / requests) : 0,
    maxLatencyMs: Math.round(maxMs),
    byStatus: Object.fromEntries(statuses),
    topRoutes: [...routes.entries()]
      .sort((left, right) => right[1].count - left[1].count)
      .slice(0, 12)
      .map(([route, value]) => ({
        route,
        count: value.count,
        errors: value.errors,
        avgLatencyMs: value.count ? Math.round(value.totalMs / value.count) : 0,
      })),
  });

  const prometheus = () => {
    const snap = snapshot();
    const lines = [
      '# HELP karm_gateway_uptime_seconds Seconds since the gateway process started.',
      '# TYPE karm_gateway_uptime_seconds gauge',
      `karm_gateway_uptime_seconds ${snap.uptimeSec}`,
      '# HELP karm_gateway_requests_total Requests handled by the gateway.',
      '# TYPE karm_gateway_requests_total counter',
      `karm_gateway_requests_total ${requests}`,
      '# HELP karm_gateway_errors_total Requests that ended with a 5xx response.',
      '# TYPE karm_gateway_errors_total counter',
      `karm_gateway_errors_total ${errors}`,
      '# HELP karm_gateway_request_duration_seconds Request duration in seconds.',
      '# TYPE karm_gateway_request_duration_seconds histogram',
    ];
    for (const bucket of BUCKETS) {
      lines.push(`karm_gateway_request_duration_seconds_bucket{le="${bucket / 1000}"} ${histogram.get(bucket)}`);
    }
    lines.push(`karm_gateway_request_duration_seconds_bucket{le="+Inf"} ${requests}`);
    lines.push(`karm_gateway_request_duration_seconds_sum ${(totalMs / 1000).toFixed(3)}`);
    lines.push(`karm_gateway_request_duration_seconds_count ${requests}`);
    for (const [family, count] of [...statuses.entries()].sort()) {
      lines.push(`karm_gateway_responses_total{status="${labels(family)}"} ${count}`);
    }
    for (const [route, value] of [...routes.entries()].sort()) {
      lines.push(`karm_gateway_route_requests_total{route="${labels(route)}"} ${value.count}`);
      lines.push(`karm_gateway_route_errors_total{route="${labels(route)}"} ${value.errors}`);
    }
    return `${lines.join('\n')}\n`;
  };

  return { observe, snapshot, prometheus };
}
