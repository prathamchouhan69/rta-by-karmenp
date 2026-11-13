# Runbook: Gateway Down

## Symptoms
- `/healthz` returns 5xx or times out
- `/readyz` returns 503
- Alert: `KarmGatewayDown` firing

## Diagnosis
1. Check service status:
   ```bash
   sudo systemctl status karm-gateway
   sudo journalctl -u karm-gateway -n 100 --no-pager
   ```

2. Check Docker containers:
   ```bash
   docker compose ps
   docker compose logs app --tail=100
   ```

3. Check resource usage:
   ```bash
   docker stats --no-stream
   free -h
   df -h /
   ```

4. Check if port is bound:
   ```bash
   ss -tlnp | grep 8787
   ```

## Common Causes & Fixes

### Container Crashed (OOM)
```bash
# Check for OOM kills
dmesg -T | grep -i "out of memory"
# Fix: Increase memory limit in docker-compose.prod.yml
```

### Database Connection Exhausted
```bash
# Check connections
docker compose exec db psql -U karm -d karm -c "SELECT count(*) FROM pg_stat_activity;"
# Fix: Restart pgbouncer or increase pool size
```

### Flux Backend Not Starting
```bash
# Check Flux logs
docker compose logs app | grep -i flux
# Fix: Check FLUX_* env vars, ensure Flux port 8788 is free
```

### Port Conflict
```bash
# Find process on port 8787
lsof -i :8787
# Fix: Kill conflicting process or change port
```

## Recovery Steps
1. **Quick restart**: `sudo systemctl restart karm-gateway`
2. **Full rebuild**: `docker compose up -d --force-recreate --build app`
3. **Rollback**: `docker tag karm-os:previous karm-os:latest && docker compose up -d --no-deps app`

## Escalation
If not resolved in 15 min:
- Page on-call engineer
- Check status page
- Consider failing over to DR region

## Post-Incident
- Update runbook with new findings
- Add monitoring for root cause
- Schedule post-mortem