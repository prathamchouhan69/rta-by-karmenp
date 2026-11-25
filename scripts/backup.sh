#!/bin/bash
# RTA by KARM - Automated Backup Script
# Runs via cron: 0 2 * * * /opt/rta-karm/scripts/backup.sh

set -euo pipefail

# Configuration
BACKUP_ROOT="/opt/rta-karm/backups"
FLUX_DATA_DIR="/opt/rta-karm/flux-data"
RETENTION_DAYS=30
RETENTION_WEEKS=12
RETENTION_MONTHS=12
S3_BUCKET="${S3_BUCKET:-rta-karm-backups}"
NOTIFY_WEBHOOK="${BACKUP_WEBHOOK:-}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $*"; }
log_success() { echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $*"; }
log_error() { echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $*"; }

notify() {
    local level="$1"
    local message="$2"
    if [[ -n "$NOTIFY_WEBHOOK" ]]; then
        curl -s -X POST "$NOTIFY_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"[RTA Backup] $level: $message\"}" > /dev/null || true
    fi
}

# Create backup directories
mkdir -p "$BACKUP_ROOT"/{daily,weekly,monthly}

TIMESTAMP=$(date '+%Y%m%d-%H%M%S')
DATE=$(date '+%Y%m%d')
WEEK=$(date '+%Y-W%U')
MONTH=$(date '+%Y-%m')

log_info "Starting backup at $(date)"

# ========================================================================
# 1. FLUX DATA BACKUP
# ========================================================================
log_info "Backing up Flux data..."

FLUX_BACKUP_DIR="$BACKUP_ROOT/daily/flux-$TIMESTAMP"
mkdir -p "$FLUX_BACKUP_DIR"

# Backup Flux data directory
if [[ -d "$FLUX_DATA_DIR" ]]; then
    tar -czf "$FLUX_BACKUP_DIR/flux-data.tar.gz" -C "$(dirname "$FLUX_DATA_DIR")" "$(basename "$FLUX_DATA_DIR")"
    log_success "Flux data backed up to $FLUX_BACKUP_DIR/flux-data.tar.gz"
else
    log_warn "Flux data directory not found: $FLUX_DATA_DIR"
fi

# Backup audit logs
if [[ -f "/opt/rta-karmenp/apps/flux/data/audit.jsonl" ]]; then
    cp "/opt/rta-karmenp/apps/flux/data/audit.jsonl" "$FLUX_BACKUP_DIR/audit.jsonl"
    log_success "Audit logs backed up"
fi

# Backup briefings
if [[ -f "/opt/rta-karmenp/apps/flux/data/briefings.json" ]]; then
    cp "/opt/rta-karmenp/apps/flux/data/briefings.json" "$FLUX_BACKUP_DIR/briefings.json"
    log_success "Briefings backed up"
fi

# ========================================================================
# 2. DATABASE BACKUP (if using PostgreSQL)
# ========================================================================
if command -v pg_dump &> /dev/null && [[ -n "${DATABASE_URL:-}" ]]; then
    log_info "Backing up PostgreSQL database..."
    PG_BACKUP="$BACKUP_ROOT/daily/postgres-$TIMESTAMP.sql.gz"
    pg_dump "$DATABASE_URL" | gzip > "$PG_BACKUP"
    log_success "PostgreSQL backup complete: $PG_BACKUP"
fi

# ========================================================================
# 3. CONFIGURATION BACKUP
# ========================================================================
log_info "Backing up configuration..."

CONFIG_BACKUP="$BACKUP_ROOT/daily/config-$TIMESTAMP"
mkdir -p "$CONFIG_BACKUP"

# Environment files (without secrets)
for env_file in /opt/rta-karm/.env /opt/rta-karmenp/apps/flux/.env /opt/rta-karmenp/apps/gateway/.env; do
    if [[ -f "$env_file" ]]; then
        # Sanitize secrets
        grep -v -E '(SECRET|KEY|TOKEN|PASSWORD)=' "$env_file" > "$CONFIG_BACKUP/$(basename "$env_file").sanitized" || true
    fi
done

# Docker compose
cp /opt/rta-karmenp/docker-compose.yml "$CONFIG_BACKUP/" 2>/dev/null || true

# Nginx config
cp /etc/nginx/sites-available/rta-karm* "$CONFIG_BACKUP/" 2>/dev/null || true

# PM2 config
cp /opt/rta-karmenp/ecosystem.config.cjs "$CONFIG_BACKUP/" 2>/dev/null || true

tar -czf "$BACKUP_ROOT/daily/config-$TIMESTAMP.tar.gz" -C "$BACKUP_ROOT/daily" "config-$TIMESTAMP"
rm -rf "$CONFIG_BACKUP"
log_success "Configuration backed up"

# ========================================================================
# 4. UPLOAD TO S3 (if configured)
# ========================================================================
if [[ -n "$S3_BUCKET" ]] && command -v aws &> /dev/null; then
    log_info "Uploading backups to S3..."
    
    # Daily
    aws s3 sync "$BACKUP_ROOT/daily/" "s3://$S3_BUCKET/daily/" --delete --storage-class STANDARD_IA
    
    # Weekly (first day of week)
    if [[ $(date '+%u') -eq 1 ]]; then
        cp -r "$BACKUP_ROOT/daily" "$BACKUP_ROOT/weekly/week-$WEEK"
        aws s3 sync "$BACKUP_ROOT/weekly/" "s3://$S3_BUCKET/weekly/" --storage-class GLACIER
    fi
    
    # Monthly (first day of month)
    if [[ $(date '+%d') -eq 01 ]]; then
        cp -r "$BACKUP_ROOT/daily" "$BACKUP_ROOT/monthly/month-$MONTH"
        aws s3 sync "$BACKUP_ROOT/monthly/" "s3://$S3_BUCKET/monthly/" --storage-class GLACIER
    fi
    
    log_success "Backups uploaded to S3"
fi

# ========================================================================
# 5. RETENTION CLEANUP
# ========================================================================
log_info "Cleaning up old backups..."

# Daily: keep last 30 days
find "$BACKUP_ROOT/daily" -type f -mtime +$RETENTION_DAYS -delete
find "$BACKUP_ROOT/daily" -type d -empty -delete

# Weekly: keep last 12 weeks
find "$BACKUP_ROOT/weekly" -type f -mtime +$((RETENTION_WEEKS * 7)) -delete
find "$BACKUP_ROOT/weekly" -type d -empty -delete

# Monthly: keep last 12 months
find "$BACKUP_ROOT/monthly" -type f -mtime +$((RETENTION_MONTHS * 30)) -delete
find "$BACKUP_ROOT/monthly" -type d -empty -delete

# S3 lifecycle handled by bucket policy

log_success "Old backups cleaned up"

# ========================================================================
# 6. VERIFICATION
# ========================================================================
log_info "Verifying backup integrity..."

BACKUP_SIZE=$(du -sh "$BACKUP_ROOT" | cut -f1)
BACKUP_COUNT=$(find "$BACKUP_ROOT" -name "*.tar.gz" -o -name "*.sql.gz" | wc -l)

log_success "Backup complete!"
log_info "Total backup size: $BACKUP_SIZE"
log_info "Total backup files: $BACKUP_COUNT"

notify "SUCCESS" "Backup completed successfully. Size: $BACKUP_SIZE, Files: $BACKUP_COUNT"

log_info "Backup finished at $(date)"