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
