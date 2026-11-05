# KARM production gateway

`apps/gateway` is the single production entry point. It serves the built web app, the
hardened `/api/v1` proxy API, and the complete Flux API without collapsing either
backend's security model.

```
Browser
  │  one origin, one owner session
  ▼
KARM gateway :8787
  ├─ /api/v1/*            → proxy (Hono, in-process)      Zoho execution plane
  ├─ /api/v1/flux/*       → compatibility BFF            unifies Flux + proxy
  ├─ /flux/*              → Flux HTTP API :loopback      AI + identity plane
  ├─ /                    → built web app from proxy      React SPA
  ├─ /healthz /readyz     → liveness / dependency health
  └─ /metrics             → Prometheus (token or loopback)
```

Flux keeps its own RBAC, approval gates, model router, cost guard, audit chain,
briefings, documents, advisory board, and user store. The gateway does not replace
those controls. It only translates the owner's proxy session into a Flux session so
the web app does not need a second password prompt.

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

Direct Flux password login still works for additional users created with:

```bash
FLUX_DATA_DIR=/data/flux node apps/flux/scripts/add-user.js
```

Proxy/Zoho access remains single-owner by design. Additional Flux users can use chat,
the advisory board, memory, documents, and briefings according to their role, but the
Zoho execution plane is still the owner's. Do not grant Zoho credentials to other
users until the proxy has a real multi-user identity model.

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
npm run build -w apps/web
APP_ORIGIN=http://127.0.0.1:8787 \
STATIC_ROOT=apps/web/dist \
node --env-file=apps/proxy/.env apps/gateway/src/server.mjs
```

Open `http://127.0.0.1:8787`. `apps/proxy/.env` is loaded only for local development;
production uses container environment variables. Flux secrets are derived from the
proxy session secret in development only. Production requires all three secrets.

Web hot-reload development still works with:

```bash
npm run dev
# web :5173, gateway :8787, mock Zoho
```

## Container deployment

1. `cp .env.production.example .env.production` and replace every placeholder.
2. Generate three different Flux secrets of at least 32 characters.
3. Keep `ZOHO_MODE=mock` for the first smoke test.
4. `docker compose --env-file .env.production up --build -d`
5. Verify:
   - `http://127.0.0.1:8787/healthz`
   - `http://127.0.0.1:8787/readyz`
   - `http://127.0.0.1:8787/api/v1/health`
   - `http://127.0.0.1:8787/flux/health`
   - owner sign-in in the web app, then Briefing & advisor board.
6. Put HTTPS in front of `127.0.0.1:8787`. Set `TRUST_PROXY=true` only when that
   reverse proxy overwrites `X-Forwarded-For`.
7. Scrape `/metrics` with `Authorization: Bearer $METRICS_TOKEN`.
8. Start scheduled backups with `docker compose --profile ops up -d backup`, or run
   `scripts/backup-postgres.sh` from a host with `pg_dump`.

The app container runs read-only with a writable `/data` volume for Flux's audit,
approvals, users, briefings, and the proxy JSON fallback. Production accounting data
stays in PostgreSQL. The Flux audit file is hash-chained and keyed; back up `/data`
together with PostgreSQL.

## Verification

```bash
npm run verify
```

`npm test -w apps/gateway` covers the auth bridge, Flux RBAC, unified status, briefing
fallback, measurement routing, chat fallback, static serving, readiness, and metrics.
The existing proxy, Flux, web, and money-scan suites continue to run unchanged.

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
