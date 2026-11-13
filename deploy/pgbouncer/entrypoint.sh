#!/bin/bash
set -euo pipefail

# Generate userlist.txt with actual password
if [ -z "${POSTGRES_PASSWORD:-}" ]; then
    echo "ERROR: POSTGRES_PASSWORD not set"
    exit 1
fi

# Generate md5 password: md5(password + username)
PASSWORD_HASH=$(echo -n "${POSTGRES_PASSWORD}karm" | md5sum | cut -d' ' -f1)
sed "s/\${POSTGRES_PASSWORD}/${PASSWORD_HASH}/" /etc/pgbouncer/userlist.txt.template > /etc/pgbouncer/userlist.txt

# Generate pgbouncer.ini with actual values
sed "s/\${POSTGRES_PASSWORD}/${POSTGRES_PASSWORD}/" /etc/pgbouncer/pgbouncer.ini.template > /etc/pgbouncer/pgbouncer.ini

echo "Starting pgbouncer..."
exec pgbouncer /etc/pgbouncer/pgbouncer.ini