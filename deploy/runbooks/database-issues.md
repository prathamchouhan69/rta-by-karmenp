# Runbook: Database Issues

## Symptoms
- `/readyz` shows proxy/flux unhealthy
- Slow queries, timeouts
- Alert: `KarmPostgresHighConnections`, `KarmPostgresDown`, `KarmPostgresReplicationLag`

## Diagnosis
1. Check PostgreSQL status:
   ```bash
   docker compose exec db pg_isready -U karm -d karm
   docker compose logs db --tail=100
   ```

2. Check connections:
   ```bash
   docker compose exec db psql -U karm -d karm -c "
   SELECT state, count(*) FROM pg_stat_activity GROUP BY state;
   SELECT * FROM pg_stat_activity WHERE state = 'active' AND query_start < now() - interval '5 minutes';
   "
   ```

3. Check replication:
   ```bash
   docker compose exec db psql -U karm -d karm -c "
   SELECT * FROM pg_stat_replication;
   "
   ```

4. Check disk space:
   ```bash
   docker compose exec db df -h /var/lib/postgresql/data
   ```

5. Check long-running queries:
   ```bash
   docker compose exec db psql -U karm -d karm -c "
   SELECT pid, now() - query_start AS duration, query
   FROM pg_stat_activity
   WHERE state != 'idle' AND query_start < now() - interval '1 minute'
   ORDER BY duration DESC;
   "
   ```

## Common Fixes

### Too Many Connections
```bash
# Kill idle connections
docker compose exec db psql -U karm -d karm -c "
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle' AND state_change < now() - interval '10 minutes';
"
# Restart pgbouncer
docker compose restart pgbouncer
```

### Long-Running Query
```bash
# Cancel specific query
docker compose exec db psql -U karm -d karm -c "SELECT pg_cancel_backend(<pid>);"
# Or terminate
docker compose exec db psql -U karm -d karm -c "SELECT pg_terminate_backend(<pid>);"
```

### Replication Lag
```bash
# Check replica status
docker compose exec db psql -U karm -d karm -c "
SELECT client_addr, state, sync_state, pg_wal_lsn_diff(sent_lsn, replay_lsn) AS lag_bytes
FROM pg_stat_replication;
"
# If lag > 1GB, consider restarting replica or checking network
```

### Disk Full
```bash
# Check table sizes
docker compose exec db psql -U karm -d karm -c "
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;
"
# Vacuum
docker compose exec db psql -U karm -d karm -c "VACUUM ANALYZE;"
# Or run maintenance script
node scripts/db-maintenance.mjs --all
```

## Recovery
1. **Restart DB**: `docker compose restart db`
2. **Full restart**: `docker compose down db && docker compose up -d db`
3. **Restore from backup**: See `restore-from-backup.md`

## Escalation
- Page DBA if data corruption suspected
- If RPO at risk, initiate DR failover

## Prevention
- Run `db:maintain` weekly via timer
- Monitor connection pool usage
- Set up pg_stat_statements for query analysis