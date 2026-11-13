# Runbook: Backup Verification Failed

## Symptoms
- Alert: `KarmBackupFailed` or `KarmBackupStale`
- `npm run backup:verify` or `verify-backups.mjs` fails

## Diagnosis
1. Check backup service logs:
   ```bash
   sudo journalctl -u karm-backup -n 50 --no-pager
   sudo journalctl -u karm-verify-backups -n 50 --no-pager
   ```

2. Check backup directory:
   ```bash
   ls -la /opt/karm-os/backups/
   ls -la /opt/karm-os/backups/karm-*/
   ```

3. Run verification manually:
   ```bash
   node scripts/verify-backups.mjs --latest-only
   ```

4. Check encryption key:
   ```bash
   echo $BACKUP_ENCRYPTION_KEY | wc -c  # Should be >= 32
   ```

## Common Issues

### Missing/Corrupt Backup Files
```bash
# Check each backup has all 4 files
for d in /opt/karm-os/backups/karm-*/; do
  echo "=== $d ==="
  ls -la "$d"
  (cd "$d" && sha256sum -c SHA256SUMS 2>&1 || echo "CHECKSUM FAIL")
done
```

### Encryption Key Mismatch
```bash
# Verify key in .env.production matches backup
grep BACKUP_ENCRYPTION_KEY /opt/karm-os/.env.production
# If changed, old backups can't be decrypted - need key rotation procedure
```

### Database Restore Fails
```bash
# Test restore manually
DATABASE_URL=postgresql://karm:password@localhost:5432/karm \
./scripts/restore-rehearsal.sh /opt/karm-os/backups/karm-<timestamp>
```

### Disk Space on Backup Volume
```bash
df -h /opt/karm-os/backups
# Clean old backups if needed
find /opt/karm-os/backups -name 'karm-*' -mtime +30 -exec rm -rf {} \;
```

### pg_dump Version Mismatch
```bash
# Check pg_dump version in backup container
docker compose run --rm backup pg_dump --version
# Should match PostgreSQL server version
```

## Recovery
1. **Force new backup**: `sudo systemctl start karm-backup`
2. **Fix encryption key**: Update `.env.production` and restart backup timer
3. **Manual backup**: `docker compose --profile ops run --rm backup`

## RPO/RTO
- RPO: 24 hours (daily backups)
- RTO: < 4 hours (restore rehearsal validates)
- If backup failed > 24h: CRITICAL - page immediately

## Prevention
- Weekly verification timer catches issues early
- Monitor backup size trends
- Alert on backup duration > 30 min