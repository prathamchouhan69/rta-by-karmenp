# KARM OS - Production Deployment Automation

This directory contains all automation scripts and configurations for deploying and operating KARM OS in production.

## Directory Structure

```
deploy/
├── systemd/              # Systemd service and timer units
│   ├── karm-gateway.service      # Main gateway service
│   ├── karm-backup.service       # Backup service (runs via timer)
│   ├── karm-backup.timer         # Daily backup timer
│   ├── karm-health-monitor.service  # Health check service
│   ├── karm-health-monitor.timer    # 5-minute health check timer
│   ├── karm-log-rotate.service    # Log rotation service
│   ├── karm-log-rotate.timer      # Daily log rotation timer
│   ├── karm-db-maintenance.service # Database maintenance service
│   ├── karm-db-maintenance.timer   # Weekly DB maintenance timer
│   ├── karm-verify-backups.service # Backup verification service
│   └── karm-verify-backups.timer   # Weekly backup verification timer
├── daemon.json           # Docker daemon configuration
├── deploy.sh             # Master deployment script
└── README.md             # This file
```

## Quick Start

### 1. Prerequisites

- Docker 24+ with Compose v2
- Node.js 22+
- PostgreSQL 17 (via Docker)
- Domain name with DNS pointing to server
- User in `docker` group

### 2. Deploy

```bash
# Clone repository
git clone https://github.com/your-org/rta-by-karmenp.git /opt/karm-os
cd /opt/karm-os

# Run deployment script (interactive)
sudo ./deploy/deploy.sh

# Or set environment variables for non-interactive
REPO_URL=https://github.com/your-org/rta-by-karmenp.git \
BRANCH=main \
./deploy/deploy.sh
```

### 3. Configure Secrets

Edit `/opt/karm-os/.env.production` with all required secrets:

```bash
# Required (auto-generated with validate-env.mjs --fix)
POSTGRES_PASSWORD=
CADDY_DOMAIN=app.example.net
SETUP_CODE=
SESSION_SECRET=
FLUX_AUTH_SECRET=
FLUX_APPROVAL_SECRET=
FLUX_AUDIT_KEY=
FLUX_OWNER_PASSWORD=

# Optional but recommended
OPENROUTER_API_KEY=
BACKUP_ENCRYPTION_KEY=
METRICS_TOKEN=
```

### 4. Start Services

```bash
# Start main gateway
sudo systemctl start karm-gateway

# Check status
sudo systemctl status karm-gateway
sudo journalctl -u karm-gateway -f
```

## Automated Tasks

All timers are enabled by default:

| Task | Schedule | Service |
|------|----------|---------|
| Backup | Daily (random 1h) | `karm-backup.timer` |
| Health Check | Every 5 min | `karm-health-monitor.timer` |
| Log Rotation | Daily (random 2h) | `karm-log-rotate.timer` |
| DB Maintenance | Weekly (random 3h) | `karm-db-maintenance.timer` |
| Backup Verification | Weekly (random 4h) | `karm-verify-backups.timer` |

### Manual Execution

```bash
# Run backup now
sudo systemctl start karm-backup

# Run health check now
sudo systemctl start karm-health-monitor

# Run log rotation now
sudo systemctl start karm-log-rotate

# Run DB maintenance now
sudo systemctl start karm-db-maintenance

# Verify backups now
sudo systemctl start karm-verify-backups
```

## Monitoring

### Health Check Endpoints

- `GET /healthz` - Liveness probe
- `GET /readyz` - Readiness probe (checks proxy, Flux, UI)
- `GET /metrics` - Prometheus metrics (token-protected)
- `GET /api/v1/health` - Proxy health
- `GET /flux/health` - Flux backend health

### Logs

```bash
# Gateway logs
sudo journalctl -u karm-gateway -f

# Docker container logs
docker compose logs -f app
docker compose logs -f db

# Automated task logs
sudo journalctl -u karm-backup -f
sudo journalctl -u karm-health-monitor -f
```

### Prometheus Metrics

Key metrics exposed at `/metrics`:

- `karm_gateway_requests_total` - Request counters
- `karm_gateway_request_duration_seconds` - Latency histograms
- `karm_proxy_health` - Proxy health status
- `karm_flux_health` - Flux health status
- `karm_flux_audit_entries` - Audit log entries
- `karm_flux_models` - Registered models count

## Backup & Restore

### Automated Backup

Backups run daily via `karm-backup.timer` and are stored in `/opt/karm-os/backups/`.

Each backup contains:
- `database.dump.enc` - Encrypted PostgreSQL dump
- `app-data.tar.gz.enc` - Encrypted application data
- `manifest.txt` - Backup metadata
- `SHA256SUMS` - Checksums

### Manual Backup

```bash
docker compose --profile ops run --rm backup
```

### Restore Rehearsal (Test Restore)

```bash
# Test restore of latest backup
DATABASE_URL=postgresql://karm:password@localhost:5432/karm \
./scripts/restore-rehearsal.sh /opt/karm-os/backups/karm-20240115T030000Z
```

### Full Restore

```bash
# 1. Stop services
sudo systemctl stop karm-gateway

# 2. Restore database
pg_restore --clean --if-exists --no-owner --no-acl -d postgresql://karm:password@localhost:5432/karm backup_dir/database.dump

# 3. Restore app data
tar -xzf backup_dir/app-data.tar.gz -C /data/app

# 4. Start services
sudo systemctl start karm-gateway
```

## Docker Configuration

### Production Override

Use `docker-compose.prod.yml` for production resource limits:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Daemon Configuration

Copy `deploy/daemon.json` to `/etc/docker/daemon.json` and restart Docker:

```bash
sudo cp deploy/daemon.json /etc/docker/daemon.json
sudo systemctl restart docker
```

## Security Hardening

The systemd services include:

- `NoNewPrivileges=true`
- `PrivateTmp=true`
- `ProtectSystem=strict`
- `ProtectHome=true`
- Capability bounding
- Resource limits (CPU, memory, file descriptors)
- Read-only root filesystem for containers

## Environment Validation

Before deployment, validate your environment:

```bash
# Check for issues
node scripts/validate-env.mjs --env-file=.env.production

# Auto-generate missing secrets
node scripts/validate-env.mjs --fix --env-file=.env.production
```

## CI/CD Pipeline

GitHub Actions workflows in `.github/workflows/`:

- `ci.yml` - Runs on every push/PR: lint, typecheck, test, build, e2e
- `deploy.yml` - Manual deployment to production/staging

### Required GitHub Secrets

```
DEPLOY_HOST          # SSH host for deployment
DEPLOY_USER          # SSH user
DEPLOY_SSH_KEY       # Private SSH key
CADDY_DOMAIN         # Production domain
POSTGRES_PASSWORD    # Database password
SETUP_CODE           # Owner setup code
SESSION_SECRET       # Session secret
FLUX_AUTH_SECRET     # Flux auth secret
FLUX_APPROVAL_SECRET # Flux approval secret
FLUX_AUDIT_KEY       # Flux audit key
FLUX_OWNER_PASSWORD  # Flux owner password
METRICS_TOKEN        # Prometheus token
SLACK_WEBHOOK_URL    # Optional: deployment notifications
```

## Troubleshooting

### Gateway Won't Start

```bash
# Check logs
sudo journalctl -u karm-gateway -n 100

# Check Docker
docker compose logs app

# Verify environment
node scripts/validate-env.mjs --env-file=.env.production
```

### Health Checks Failing

```bash
# Manual health check
curl http://127.0.0.1:8787/readyz | jq .

# Check individual components
curl http://127.0.0.1:8787/healthz
curl http://127.0.0.1:8787/api/v1/health
curl http://127.0.0.1:8787/flux/health
```

### Database Issues

```bash
# Check PostgreSQL
docker compose exec db pg_isready -U karm -d karm

# Run maintenance
node scripts/db-maintenance.mjs --all
```

### Backup Verification Failing

```bash
# Check backup integrity
node scripts/verify-backups.mjs --latest-only

# Check encryption key
echo $BACKUP_ENCRYPTION_KEY | wc -c  # Should be >= 32
```

## Upgrading

```bash
cd /opt/karm-os
git pull origin main
docker compose build
docker compose up -d --no-deps app
# Or use zero-downtime deploy:
sudo systemctl reload karm-gateway
```

## Rollback

```bash
# Rollback to previous image
docker tag karm-os:previous karm-os:latest
docker compose up -d --no-deps app

# Or rollback git and rebuild
git checkout previous-tag
docker compose build
docker compose up -d
```

## Support

- Documentation: `docs/GATEWAY.md`, `docs/BACKEND-API.md`
- Setup guide: `SETUP_ME.md`
- Architecture: `BACKEND-INTEGRATION-MAP.md`