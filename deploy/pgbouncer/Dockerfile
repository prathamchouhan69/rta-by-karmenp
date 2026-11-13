FROM pgbouncer:1.23

# Install md5sum for password hashing
RUN apt-get update && apt-get install -y --no-install-recommends coreutils && rm -rf /var/lib/apt/lists/*

COPY pgbouncer.ini /etc/pgbouncer/pgbouncer.ini.template
COPY userlist.txt.template /etc/pgbouncer/userlist.txt.template

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]