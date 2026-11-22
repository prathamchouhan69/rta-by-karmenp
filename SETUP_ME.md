# Configure the KARM backend

## Local practice mode

1. Use Node.js 22 or newer and install the workspace dependencies with `npm ci`.
2. Start the local stack with `ZOHO_MODE=mock npm run dev`. This runs the unified gateway on `127.0.0.1:8787` (with Flux embedded on `127.0.0.1:8788`) and the mock Zoho server on port `4010`.
3. In a second terminal, start the web UI with `npm run dev:web`. Vite serves `apps/web` at `http://127.0.0.1:3000` and proxies `/api` and `/flux` to the gateway on `127.0.0.1:8787`. Most screens currently use bundled mock data; the UI is not part of the container image.
4. Authenticate with user ID `owner` and the local development password `karm-local-dev-owner` unless `FLUX_OWNER_PASSWORD` is set. The gateway keeps the owner password in sync with `FLUX_OWNER_PASSWORD`, so this works even if the data directory already contains an owner.

For a single-port production-style run locally:

```bash
npm run build
ZOHO_MODE=mock FLUX_OWNER_PASSWORD=karm-local-dev-owner npm start
```

`npm start` runs the gateway on `127.0.0.1:8787` and Flux on `127.0.0.1:8788`. The local practice server binds only to loopback and uses sample data. It does not write to Zoho. See `docs/GATEWAY.md` for the gateway contract and auth bridge.

## Connect a Zoho Books organization

Live mode is deliberately disabled until you supply and verify the Zoho OAuth client and organization details.

1. Create a Zoho OAuth client for the correct data center and grant only the Books scopes needed by the workflows you plan to use.
2. Generate an authorization grant and exchange it for a refresh token through the Zoho Accounts OAuth flow. Keep the client secret, grant, and refresh token out of source control, terminal recordings, and chat.
3. Configure `apps/proxy/.env` for local live mode (this file is ignored by Git) or put the corresponding values in a deployment secret manager.
4. Set `HOST=0.0.0.0` only behind HTTPS and a trusted reverse proxy. Configure `APP_ORIGIN`, a unique `SETUP_CODE`, and a cryptographically random `SESSION_SECRET` of at least 32 bytes. `DATA_DIR` is for local practice/live development only; production must use PostgreSQL.
5. Start the API and verify `/api/v1/health`, `/api/v1/organization`, and read-only resources first. Then complete `reports/zoho/LIVE_CHECKLIST.md` with a test record and the organization's approved cleanup policy.

Live mode requires valid Zoho configuration; live and non-loopback deployments require authentication. The proxy authentication contract is a single owner setup code exchanged for a 12-hour bearer token and an HttpOnly `karm_session` cookie; `POST /api/v1/auth/signout` clears the cookie. Flux keeps its own RBAC, users, approvals, and audit chain. The gateway bridges the proxy owner session into Flux for API clients. Additional Flux users can be created with `apps/flux/scripts/add-user.js`, but they do not gain Zoho execution access until the proxy has a real multi-user identity model.

## Container deployment

The repository includes a Docker image and Compose stack that serves only the API from the gateway origin and stores records, idempotency reservations, and audit events in PostgreSQL. It does not build or serve `apps/web`, and there is no web service in Compose.

1. Install Docker Engine with the Compose plugin. Copy `.env.production.example` to `.env.production` and replace every placeholder with unique secrets. The PostgreSQL password must be URL-safe because Compose uses it in `DATABASE_URL`. `FLUX_AUTH_SECRET`, `FLUX_APPROVAL_SECRET`, and `FLUX_AUDIT_KEY` must all be present and different. `FLUX_OWNER_PASSWORD` must be at least 12 characters for the Flux owner account.
2. Keep `ZOHO_MODE=mock` for a protected deployment smoke test. Run `docker compose --env-file .env.production up --build -d`, then verify `http://127.0.0.1:8787/readyz`, `http://127.0.0.1:8787/api/v1/health`, and `http://127.0.0.1:8787/flux/health`.
3. Configure the HTTPS reverse proxy to forward to `127.0.0.1:8787`, apply login rate limiting there, and set `APP_ORIGIN` to the exact public HTTPS origin. Set `TRUST_PROXY=true` only if that proxy overwrites `X-Forwarded-For` with the client IP; otherwise leave it false. Do not expose port 8787 directly to the internet.
4. Before live use, add Zoho OAuth credentials through a secret manager, set `ZOHO_MODE=live`, confirm the configured organization, and complete `reports/zoho/LIVE_CHECKLIST.md`. Flux only reads Zoho unless `ZOHO_WRITE_ENABLED=true` and separate write credentials are supplied. Back up with `scripts/backup-postgres.sh` (or `docker compose --profile ops up -d backup`), store the dump encrypted off-host, and rehearse a restore into a separate database before accepting financial records.

Stop with `docker compose --env-file .env.production down`; the named `postgres-data` and `app-data` volumes are retained. `down -v` deletes the database and Flux audit state and must not be used for routine shutdown. The Compose file provides persistence and a scheduled backup sidecar, not high availability or a multi-user Zoho identity plan. See `docs/GATEWAY.md` for the full architecture and operations contract.

The backup script writes a mode-`0600` custom-format dump and refuses to overwrite an existing destination. For a restore drill, create a separate empty database and use `pg_restore --no-owner --no-acl --dbname="$RESTORE_DATABASE_URL" path/to/backup.dump`; verify the restored data and application against that database before planning any production restore. Never run restore with `--clean` against the active production database as a routine test.
