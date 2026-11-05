#!/bin/sh
set -eu

umask 077

backup_path=${1:-"backups/karm-$(date -u +%Y%m%dT%H%M%SZ).dump"}
backup_dir=$(dirname "$backup_path")
mkdir -p "$backup_dir"

if [ -e "$backup_path" ]; then
  printf 'Backup destination already exists: %s\n' "$backup_path" >&2
  exit 1
fi

temporary=$(mktemp "${backup_path}.tmp.XXXXXX")
trap 'rm -f -- "$temporary"' EXIT

if [ -n "${DATABASE_URL:-}" ]; then
  command -v pg_dump >/dev/null 2>&1 || {
    printf 'pg_dump is required when DATABASE_URL is set.\n' >&2
    exit 1
  }
  pg_dump --format=custom --no-owner --no-acl --dbname="$DATABASE_URL" --file="$temporary"
else
  command -v docker >/dev/null 2>&1 || {
    printf 'Set DATABASE_URL or install Docker Compose for the local Compose database.\n' >&2
    exit 1
  }
  compose_env_file=${COMPOSE_ENV_FILE:-.env.production}
  docker compose --env-file "$compose_env_file" exec -T db \
    pg_dump --format=custom --no-owner --no-acl --username=karm --dbname=karm >"$temporary"
fi

chmod 600 "$temporary"
mv -n -- "$temporary" "$backup_path"
if [ -e "$temporary" ]; then
  printf 'Backup destination was created concurrently: %s\n' "$backup_path" >&2
  exit 1
fi
printf 'Database backup created: %s\n' "$backup_path"
