#!/bin/sh
set -eu

if [ "$#" -ne 1 ] || [ ! -d "$1" ]; then
  printf 'Usage: DATABASE_URL=postgres://... %s BACKUP_DIRECTORY\n' "$0" >&2
  exit 2
fi
if [ -z "${DATABASE_URL:-}" ]; then
  printf 'DATABASE_URL is required. The rehearsal restores into a new temporary database.\n' >&2
  exit 2
fi

backup_dir=$1
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
for command in node psql createdb dropdb pg_restore tar sha256sum; do
  command -v "$command" >/dev/null 2>&1 || {
    printf '%s is required for a restore rehearsal.\n' "$command" >&2
    exit 1
  }
done
for file in database.dump.enc app-data.tar.gz.enc manifest.txt SHA256SUMS; do
  if [ ! -f "$backup_dir/$file" ]; then
    printf 'Backup is missing %s.\n' "$file" >&2
    exit 1
  fi
done

(cd "$backup_dir" && sha256sum --check SHA256SUMS)

restore_db="karm_restore_$(date -u +%s)_$$"
temporary=$(mktemp -d)
database_created=false
cleanup() {
  if [ "$database_created" = true ]; then
    dropdb --if-exists --maintenance-db="$DATABASE_URL" "$restore_db" >/dev/null || {
      printf 'Could not remove the temporary restore database %s.\n' "$restore_db" >&2
      return 1
    }
  fi
  rm -rf -- "$temporary"
}
trap cleanup EXIT
trap 'exit 1' HUP INT TERM

target_url=$(DATABASE_URL="$DATABASE_URL" TARGET_DB="$restore_db" node -e '
  const url = new URL(process.env.DATABASE_URL);
  url.pathname = `/${process.env.TARGET_DB}`;
  process.stdout.write(url.toString());
')
createdb --maintenance-db="$DATABASE_URL" "$restore_db"
database_created=true
node "$script_dir/backup-crypto.mjs" decrypt "$backup_dir/database.dump.enc" "$temporary/database.dump"
node "$script_dir/backup-crypto.mjs" decrypt "$backup_dir/app-data.tar.gz.enc" "$temporary/app-data.tar.gz"
grep -qx 'format=1' "$backup_dir/manifest.txt"
pg_restore --exit-on-error --no-owner --no-acl --dbname="$target_url" "$temporary/database.dump"

table_count=$(psql "$target_url" --no-psqlrc --tuples-only --no-align --set=ON_ERROR_STOP=1 \
  --command="SELECT count(*) FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema')")
if [ "$table_count" -lt 1 ]; then
  printf 'The database restore completed but contains no application tables.\n' >&2
  exit 1
fi

while IFS= read -r entry; do
  case "$entry" in
    /*|../*|*/../*|*/..)
      printf 'App-data archive contains an unsafe path.\n' >&2
      exit 1
      ;;
  esac
done <<EOF
$(tar -tzf "$temporary/app-data.tar.gz")
EOF
mkdir "$temporary/app-data"
tar -xzf "$temporary/app-data.tar.gz" --no-same-owner -C "$temporary/app-data"
if [ -z "$(find "$temporary/app-data" -type f -print -quit)" ]; then
  printf 'The app-data restore contains no files.\n' >&2
  exit 1
fi
if [ ! -f "$temporary/app-data/flux/users.json" ]; then
  printf 'The app-data restore is missing Flux user records.\n' >&2
  exit 1
fi

printf 'Restore rehearsal passed: %s database tables restored and encrypted app data extracted to a temporary directory.\n' "$table_count"
