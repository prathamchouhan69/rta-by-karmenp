# KARM production gateway

`apps/gateway` is the single production entry point. It serves the `flux-ui` Next.js
interface, the hardened `/api/v1` proxy API, and the complete Flux API without
collapsing either backend's security model.

```
Browser
  │  one origin, one Flux session
  ▼
KARM gateway :8787
  ├─ /api/v1/*            → proxy (Hono, in-process)      Zoho execution plane
  ├─ /api/v1/flux/*       → compatibility BFF            unifies Flux + proxy
  ├─ /flux/*              → Flux HTTP API :8788          AI + identity plane
  ├─ /api/auth/*          → flux-ui Next.js :3000        login/logout/session
  ├─ /api/flux/*          → flux-ui Next.js :3000        authenticated UI proxy
  ├─ / and /_next/*       → flux-ui Next.js :3000        Next.js interface
  ├─ /healthz /readyz     → liveness / dependency health
  └─ /metrics             → Prometheus (token or loopback)
```

When `FLUX_UI_URL` is unset, the gateway keeps the legacy static `STATIC_ROOT` fallback.
Production sets `FLUX_UI_URL=http://127.0.0.1:3000` and runs the built Next.js server
next to the gateway.

Flux keeps its own RBAC, approval gates, model router, cost guard, audit chain,
briefings, documents, advisory board, and user store. The gateway does not replace
those controls. It translates the proxy owner session into a Flux session for API
clients and the legacy static app; `flux-ui` uses its own Flux password login.

## Routes

| Route | Backend | Auth |
|---|---|---|
| `/api/v1/*` | Proxy | Proxy bearer token (unless local auth is disabled) |
| `/api/v1/flux/status` | Gateway BFF | Proxy bearer token |
| `/api/v1/flux/briefing` | Gateway BFF → Flux + proxy | Proxy bearer token |
| `/api/v1/flux/ask` | Gateway BFF → Flux, deterministic fallback | Proxy bearer token |
| `/flux/health` | Flux | Public |
| `/flux/v1/auth/login` | Flux | Public |
| `/flux/v1/*` | Flux | Flux bearer token, or a proxy token bridged by the gateway |
| `/flux/v1/me` | Flux | Same bridge; returns the mapped Flux role and permissions |
| `/` and `/_next/*` | flux-ui Next.js | Flux session cookie; pages redirect to `/login` |
| `/api/auth/*` | flux-ui Next.js | Public login/logout; session cookie |
| `/api/flux/*` | flux-ui Next.js → Flux | Flux session cookie |
| `/api/system/*` | flux-ui Next.js | Flux session cookie |
| `/healthz` | Gateway | Public |
| `/readyz` | Gateway | Public; checks proxy storage/Zoho config and Flux |
| `/metrics` | Gateway | `METRICS_TOKEN`, or loopback only when unset |

The BFF is deliberately narrow. All advanced Flux endpoints remain available under
`/flux/v1/*` with the original Flux contract, so future UI work and external clients
can use the full API.

## Auth bridge

1. The owner signs in at `POST /api/v1/auth/session` with `SETUP_CODE`.
2. The proxy returns its 12-hour HMAC bearer token.
3. On a Flux request, the gateway verifies that token and mints a 12-hour Flux session
   for `FLUX_OWNER_ID` (default `owner`).
4. Flux checks the minted token against its own `FLUX_AUTH_SECRET`, loads the Flux user,
   and applies Flux RBAC and per-user rate limits.
5. Audit rows are attributed to the real Flux user.

`flux-ui` uses direct Flux password login: its `/api/auth/login` route calls Flux
`/v1/auth/login` and stores the Flux token in an httpOnly cookie. Production therefore
requires `FLUX_OWNER_PASSWORD` (at least 12 characters) for the owner account. When
that variable is set, the gateway keeps the existing owner password in sync with it
without rewriting the hash when it already matches. The proxy setup-code bridge
remains available for API clients and the legacy static app.

Additional Flux users can be created with:

```bash
FLUX_DATA_DIR=/data/flux node apps/flux/scripts/add-user.js
```

Proxy/Zoho access remains single-owner by design. Additional Flux users can use chat,
the advisory board, memory, documents, and briefings according to their role, but the
Zoho execution plane is still the owner's. Do not grant Zoho credentials to other
users until the proxy has a real multi-user identity model.

The Flux owner can manage those Flux accounts through the owner-only API:

- `GET /flux/v1/users` lists account IDs, roles, and active state without credential data.
- `POST /flux/v1/users` creates an account with an existing Flux role and a password of
  at least 12 characters.
- `POST /flux/v1/users/:id/role` changes a role and invalidates that account's sessions.
- `POST /flux/v1/users/:id/active` activates or deactivates an account; deactivation
  immediately revokes its sessions.
- `POST /flux/v1/users/:id/password` resets another account's password and revokes its
  sessions. Passwords are never returned or written to the audit log.

The API prevents self-deactivation and prevents removing the final active owner. The
configured gateway owner cannot be deactivated or demoted. The proxy setup code remains
the gateway owner's recovery path; rotating `SETUP_CODE` and
`SESSION_SECRET` invalidates all proxy sessions.

## Unified briefing and assistant

`GET /api/v1/flux/briefing`:

- fetches the proxy briefing for KARM goals/tasks and practice records;
- fetches Flux's Zoho-backed briefing when `FLUX` read credentials are configured,
  running it first if today's briefing does not exist;
- uses Flux's verified/partial/could-not-verify status for Zoho sections;
- keeps one overdue count, one attention list, and one recomputed health profile;
- falls back to the proxy briefing with an explicit `engine.degraded` marker.

`POST /api/v1/flux/ask`:

- routes deterministic measurement conversions to the formula engine first;
- sends everything else to Flux `/v1/chat`;
- normalizes Flux evidence, verification, warnings, audit id, and model name;
- falls back to the proxy's deterministic assistant only when no model gateway is
  configured or Flux fails, and labels the response with `engine.name`.

No response is presented as model-backed when it is not.

## Local single-port run

```bash
npm ci
npm run build
ZOHO_MODE=mock FLUX_OWNER_PASSWORD=karm-local-dev-owner npm start
```

`npm start` runs the built `flux-ui` server on `127.0.0.1:3000`, the gateway on
`127.0.0.1:8787`, and Flux on `127.0.0.1:8788`. Open `http://127.0.0.1:8787` and sign
in as `owner` with the password above. Flux secrets are derived from the proxy session
secret in development only. Production requires all three secrets.

Hot-reload development runs the same topology with source watchers:

```bash
ZOHO_MODE=mock npm run dev
# gateway :8787, flux-ui :3000, Flux :8788, mock Zoho :4010
```

The default local owner password is `karm-local-dev-owner`. The gateway keeps the
existing owner password in sync with `FLUX_OWNER_PASSWORD`, so the default works even
when `apps/gateway/.data/flux/users.json` already exists.

## Container deployment

1. `cp .env.production.example .env.production` and replace every placeholder.
2. Generate three different Flux secrets of at least 32 characters.
3. Set `FLUX_OWNER_PASSWORD` to at least 12 characters; the interface signs in with it.
4. Generate a separate `BACKUP_ENCRYPTION_KEY` of at least 32 characters.
5. Keep `ZOHO_MODE=mock` for the first smoke test.
6. Point `CADDY_DOMAIN` at this host in DNS and allow inbound TCP ports 80/443
   (plus UDP 443 for HTTP/3).
7. `docker compose --env-file .env.production up --build -d`
8. Verify over the configured HTTPS origin:
   - `https://$CADDY_DOMAIN/healthz`
   - `https://$CADDY_DOMAIN/readyz`
   - `https://$CADDY_DOMAIN/api/v1/health`
   - `https://$CADDY_DOMAIN/flux/health`
   - owner sign-in in `flux-ui`, then Briefing & advisor board.
9. Scrape `/metrics` with `Authorization: Bearer $METRICS_TOKEN`.
10. Start scheduled encrypted database and app-file backups with
   `docker compose --profile ops up -d backup`. Backups are stored under `backups/`,
   excluded from Git, encrypted with AES-256-GCM, and retained for
   `BACKUP_RETENTION_DAYS`. Keep `BACKUP_ENCRYPTION_KEY` separate from backup files.
11. Rehearse a restore into a temporary database and temporary directory with
   `DATABASE_URL=... BACKUP_ENCRYPTION_KEY=... scripts/restore-rehearsal.sh backups/<backup-folder>`.

The Caddy container obtains and renews the HTTPS certificate automatically after DNS
and ports 80/443 are correct. `APP_ORIGIN` is derived from `CADDY_DOMAIN` and must be
an exact public HTTPS origin. Do not expose port 8787 publicly.

The app container runs read-only with a writable `/data` volume for Flux's audit,
approvals, users, briefings, and the proxy JSON fallback. Production accounting data
stays in PostgreSQL. Each scheduled backup stores an AES-256-GCM-encrypted PostgreSQL
dump and `/data` archive together, with checksums. The restore rehearsal verifies both
without overwriting the live database or app-data volume. Keep the encryption key
separate from backup files and store a copy of backups off-host.

## Verification

```bash
npm run verify
```

`npm test -w apps/gateway` covers the auth bridge, Flux RBAC, unified status, briefing
fallback, measurement routing, chat fallback, static fallback, interface proxying,
readiness, and metrics. The proxy, Flux, `flux-ui`, shared, and money-scan suites run
from the root `npm test` command.

## Operational limits

- The proxy owner session has no revocation list. Rotate `SETUP_CODE` and
  `SESSION_SECRET` to invalidate all owner sessions.
- The proxy has no roles. Flux roles apply to Flux routes only.
- The gateway is one Node process. Run one instance per `/data` volume; Flux's store is
  a JSON file store, not a shared multi-writer database.
- `/metrics` and `/healthz` are unauthenticated by design. Keep the app port loopback
  or behind the reverse proxy.
- Live Zoho writes remain opt-in and require the proxy's preview + approval token. The
  gateway does not add a write path.
