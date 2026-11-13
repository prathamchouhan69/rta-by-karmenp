#!/bin/sh
set -eu

umask 077

backup_root=${BACKUP_ROOT:-backups}
data_dir=${DATA_DIR:-/data}
encryption_key=${BACKUP_ENCRYPTION_KEY:-}
stamp=$(date -u +%Y%m%dT%H%M%SZ)
backup_dir="$backup_root/karm-$stamp"
mkdir -p "$backup_root"

if [ -e "$backup_dir" ]; then
  printf 'Backup destination already exists: %s\n' "$backup_dir" >&2
  exit 1
fi

temporary=$(mktemp -d "$backup_root/.karm-$stamp.tmp.XXXXXX")
cleanup() {
  rm -rf -- "$temporary"
}
trap cleanup EXIT
trap 'exit 1' HUP INT TERM

if [ -n "${DATABASE_URL:-}" ]; then
  pg_dump --format=custom --no-owner --no-acl --dbname="$DATABASE_URL" --file="$temporary/database.dump"
else
  pg_dump --format=custom --no-owner --no-acl --dbname="${PGDATABASE:-postgres}" --file="$temporary/database.dump"
fi

tar -czf "$temporary/app-data.tar.gz" -C "$data_dir" .
if [ "${#encryption_key}" -lt 32 ]; then
  printf 'BACKUP_ENCRYPTION_KEY must be set to at least 32 characters.\n' >&2
  exit 1
fi
node /scripts/backup-crypto.mjs encrypt "$temporary/database.dump" "$temporary/database.dump.enc"
node /scripts/backup-crypto.mjs encrypt "$temporary/app-data.tar.gz" "$temporary/app-data.tar.gz.enc"
rm -f -- "$temporary/database.dump" "$temporary/app-data.tar.gz"
printf 'format=1\ncreated_at=%s\n' "$stamp" >"$temporary/manifest.txt"
(cd "$temporary" && sha256sum database.dump.enc app-data.tar.gz.enc manifest.txt >SHA256SUMS)
chmod 600 "$temporary"/*
mv -n -- "$temporary" "$backup_dir"

if [ -e "$temporary" ]; then
  printf 'Backup destination was created concurrently: %s\n' "$backup_dir" >&2
  exit 1
fi

trap - EXIT HUP INT TERM
printf 'Database and app-data backup created: %s\n' "$backup_dir"

# Off-site replication
replicate_backup() {
  local src_dir="$1"
  local dst_prefix="$2"

  # AWS S3
  if [ -n "${BACKUP_S3_BUCKET:-}" ] && command -v aws >/dev/null 2>&1; then
    printf 'Replicating to S3: s3://%s/%s\n' "$BACKUP_S3_BUCKET" "$dst_prefix"
    aws s3 sync "$src_dir" "s3://$BACKUP_S3_BUCKET/$dst_prefix" \
      --storage-class "${BACKUP_S3_STORAGE_CLASS:-STANDARD_IA}" \
      --no-progress \
      --only-show-errors
  fi

  # Google Cloud Storage
  if [ -n "${BACKUP_GCS_BUCKET:-}" ] && command -v gsutil >/dev/null 2>&1; then
    printf 'Replicating to GCS: gs://%s/%s\n' "$BACKUP_GCS_BUCKET" "$dst_prefix"
    gsutil -m rsync -r "$src_dir" "gs://$BACKUP_GCS_BUCKET/$dst_prefix"
  fi

  # Azure Blob Storage
  if [ -n "${BACKUP_AZURE_CONTAINER:-}" ] && command -v az >/dev/null 2>&1; then
    printf 'Replicating to Azure Blob: %s/%s\n' "$BACKUP_AZURE_CONTAINER" "$dst_prefix"
    az storage blob upload-batch \
      --destination "$BACKUP_AZURE_CONTAINER" \
      --source "$src_dir" \
      --pattern "*" \
      --overwrite false \
      --auth-mode login
  fi

  # Rclone (supports many backends)
  if [ -n "${BACKUP_RCLONE_REMOTE:-}" ] && command -v rclone >/dev/null 2>&1; then
    printf 'Replicating via rclone: %s:%s\n' "$BACKUP_RCLONE_REMOTE" "$dst_prefix"
    rclone sync "$src_dir" "$BACKUP_RCLONE_REMOTE:$dst_prefix" \
      --progress \
      --transfers 4 \
      --checkers 8
  fi
}

# Replicate to all configured destinations
if [ -n "${BACKUP_S3_BUCKET:-}${BACKUP_GCS_BUCKET:-}${BACKUP_AZURE_CONTAINER:-}${BACKUP_RCLONE_REMOTE:-}" ]; then
  replicate_backup "$backup_dir" "karm/$(basename "$backup_dir")"
  printf 'Off-site replication completed\n'
fi

# Cleanup old local backups (keep retention)
find "$backup_root" -mindepth 1 -maxdepth 1 -type d -name 'karm-*' -mtime "+${BACKUP_RETENTION_DAYS:-30}" -exec rm -rf -- {} +

# Cleanup old off-site backups (if supported by backend)
# Note: Implement lifecycle policies in cloud console for automatic cleanup