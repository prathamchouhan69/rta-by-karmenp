# Runbook: High Latency / Performance Degradation

## Symptoms
- Alert: `KarmGatewayHighLatency` (p95 > 2s)
- Users report slow UI
- `/readyz` slow but passing

## Diagnosis
1. Check current latency:
   ```bash
   curl -w "Total: %{time_total}s\n" -o /dev/null -s http://127.0.0.1:8787/readyz
   ```

2. Check gateway metrics:
   ```bash
   curl -s http://127.0.0.1:8787/metrics | grep -E 'karm_gateway_request_duration|karm_gateway_requests_total'
   ```

3. Check resource usage:
   ```bash
   docker stats --no-stream
   docker compose top app
   ```

4. Check database:
   ```bash
   docker compose exec db psql -U karm -d karm -c "
   SELECT query, mean_exec_time, calls
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   " 2>/dev/null || echo "pg_stat_statements not enabled"
   ```

5. Check Flux backend:
   ```bash
   curl -s http://127.0.0.1:8787/api/v1/flux/status | jq '.data.flux'
   ```

## Common Causes & Fixes

### Database Slow Queries
```bash
# Enable pg_stat_statements if not already
docker compose exec db psql -U karm -d karm -c "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"

# Find slow queries
docker compose exec db psql -U karm -d karm -c "
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 20;
"

# Add missing indexes
# Run EXPLAIN ANALYZE on slow queries
```

### High CPU on Gateway
```bash
# Check Node.js event loop lag
docker compose exec app node -e "
setInterval(() => {
  const start = process.hrtime.bigint();
  setImmediate(() => {
    const lag = Number(process.hrtime.bigint() - start) / 1e6;
    if (lag > 10) console.log('Event loop lag:', lag.toFixed(1), 'ms');
  });
}, 1000);
"

# Fix: Increase CPU limits, optimize code, add caching
```

### Memory Pressure / GC Thrashing
```bash
# Check heap usage
docker compose exec app node -e "console.log(process.memoryUsage())"

# Fix: Increase memory limit, check for memory leaks
```

### Flux Backend Slow
```bash
# Check Flux metrics
curl -s http://127.0.0.1:8787/api/v1/flux/status | jq '.data.flux'

# Check if model calls are slow
curl -s http://127.0.0.1:8787/api/v1/flux/status | jq '.data.flux.usage'

# Fix: Check model gateway latency, enable caching
```

### Rate Limiting
```bash
# Check rate limit hits
curl -s http://127.0.0.1:8787/metrics | grep karm_gateway_rate_limited_total

# Fix: Increase GATEWAY_RATE_LIMIT_MAX or fix client behavior
```

### Network Issues
```bash
# Check container network latency
docker compose exec app ping -c 3 db
docker compose exec app ping -c 3 caddy

# Check host network
ping -c 3 8.8.8.8
```

## Quick Fixes
1. **Restart gateway**: `sudo systemctl restart karm-gateway`
2. **Restart DB**: `docker compose restart db`
3. **Clear caches**: `docker compose exec app npm run cache:clear` (if implemented)
4. **Scale up**: Increase CPU/memory in docker-compose.prod.yml

## Deep Investigation
```bash
# Profile Node.js
docker compose exec app node --inspect=0.0.0.0:9229 src/server.mjs
# Connect with Chrome DevTools

# Trace database
docker compose exec db psql -U karm -d karm -c "SET log_min_duration_statement = 100;"
# Check logs for slow queries
```

## Prevention
- Run load tests before deployments: `npm run load-test -- --duration=120 --rps=20`
- Monitor p95 latency trend in Grafana
- Set up pg_stat_statements in production
- Configure auto-scaling if on Kubernetes

## Escalation
If p95 > 5s for > 10 min:
- Page on-call
- Consider emergency rollback
- Engage backend team for query optimization