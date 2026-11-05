#!/bin/sh
set -eu

interval=${BACKUP_INTERVAL_SECONDS:-86400}
retention=${BACKUP_RETENTION_DAYS:-30}
case "$interval" in ''|*[!0-9]*) printf 'BACKUP_INTERVAL_SECONDS must be an integer.\n' >&2; exit 1 ;; esac
case "$retention" in ''|*[!0-9]*) printf 'BACKUP_RETENTION_DAYS must be an integer.\n' >&2; exit 1 ;; esac
if [ "$interval" -lt 60 ] || [ "$retention" -lt 1 ]; then
  printf 'Backup interval must be at least 60 seconds and retention at least 1 day.\n' >&2
  exit 1
fi

while :; do
  /bin/sh /scripts/backup-all.sh
  find "${BACKUP_ROOT:-backups}" -mindepth 1 -maxdepth 1 -type d -name 'karm-*' -mtime "+$retention" -exec rm -rf -- {} +
  sleep "$interval"
done
