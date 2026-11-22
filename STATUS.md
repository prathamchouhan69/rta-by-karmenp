# KARM OS status

## Backend

The current checkout is configured for practice mode: the root `.env` has `ZOHO_MODE=mock`, Zoho credentials are empty, and `apps/proxy/.env` is not present. A live Zoho connection was verified earlier in a different local configuration, but it is not reproducible from this working copy until the OAuth values are supplied again. No accounting records were created, updated, emailed, or voided during that verification.

The API also has a practice-mode data store, resource routes for the documented accounting entities, basic search/report routes, single-owner bearer authentication for live/non-local use, durable idempotency reservations, audit metadata, and safeguards for calculated totals and invoice voiding.
Owner login throttling allows eight consecutive attempts per client address per minute and resets on successful authentication. `POST /api/v1/auth/session` now sets an HttpOnly, `SameSite=Strict` `karm_session` cookie (marked `Secure` when `APP_ORIGIN` is HTTPS) and still returns the 12-hour bearer token for API clients. Authenticated requests accept either the cookie or `Authorization: Bearer`, and `POST /api/v1/auth/signout` clears the cookie.

The Goals & Execution page supports locally stored business goals, deterministic feasibility previews, dated progress updates, daily action prompts, and weekly/monthly/quarterly checkpoints. The engine requires explicit baseline/current values, dates, an owner, target bands, and metric units; missing history or weekly capacity is shown as uncertain rather than guessed. Goal data stays in KARM storage and does not create Zoho records.

Flux includes a rule-based source-grounded briefing/advisor board and owner-assigned KARM tasks with idempotent creation and status updates. Goal actions can be explicitly added to that queue. KARM also stores unsent meeting, follow-up, and operations-checklist drafts, and supports India-time daily automations bounded to creating internal tasks. Q&A operates only on returned invoice, goal, and task records; no model provider or paid inference is configured. Live accounting writes require a ten-minute approval token bound to the exact request and idempotency key. The advisor board recommends human review and never executes actions.

## Unified gateway and Flux integration

`apps/gateway` is the single production entry point on port 8787. It routes `/api/v1/*` to the hardened proxy in-process and routes `/flux/*` to the complete Flux HTTP API on loopback. Flux keeps its own RBAC, users, models, advisory board, approval gates, cost guard, and HMAC-chained audit log; the gateway does not collapse or bypass those controls.

The gateway bridges the owner's proxy bearer token into a minted Flux session for `FLUX_OWNER_ID` (default `owner`) for API clients. Direct Flux password login remains available at `POST /flux/v1/auth/login`. Every Flux request still runs through Flux RBAC and per-user rate limits. Proxy/Zoho execution remains single-owner until the proxy has a real multi-user identity model.

Gateway routes:

- `GET /api/v1/flux/status` — gateway, proxy, Flux, audit-chain, model, and access status.
- `GET /api/v1/flux/briefing` — merges Flux's Zoho-backed verified/partial/unverified briefing with the proxy's KARM goals/tasks, without double-counting overdue invoices, and recomputes one health profile.
- `POST /api/v1/flux/ask` — routes deterministic measurements to the formula engine, otherwise to Flux `/v1/chat`, normalizes evidence/verification/audit metadata, and labels the deterministic proxy assistant as a fallback when no model gateway is configured.

`/healthz`, `/readyz`, `/metrics` (token-protected), request IDs, rate limiting, security headers, timeouts, and graceful shutdown are in place. See `docs/GATEWAY.md` for the full contract.

An earlier single-port smoke test passed against the running gateway with a real Zoho organization in `live` mode. That configuration is not present in this checkout; the current runtime was re-verified in practice mode through the gateway:

- `/readyz`, proxy health, and Flux health — OK.
- Owner login and Flux RBAC bridge — owner session resolved with `*` permissions.
- Flux audit chain — verified, 1 entry at test time.
- Unified briefing — engine `flux`, `zohoReadable: true`, `degraded: false`, counts `{ invoices: 20, overdueInvoices: 1, goals: 0, openTasks: 0 }`, 1 attention signal.
- Measurement conversion and assistant fallback — both labelled correctly.
- `/metrics` — Prometheus output present.

Verification:

- `npm test -w apps/proxy` — 50 tests covering proxy, auth, Zoho client, persistence, approval tokens, Flux, tasks, and goals.
- `npm test -w apps/flux` — 117 tests covering Flux RBAC, approvals, audit, router, briefing, board, and tools.
- `npm test -w apps/gateway` — 15 tests covering gateway integration, the auth bridge, briefing merge, readiness, and metrics.
- `npm test` — all four suites (proxy 50, Flux 117, gateway 15, scripts 2).
- `npm run typecheck` and `npm run typecheck -w apps/web` — proxy, gateway, and web type checks.
- `npm run build` — production builds for `apps/web`, proxy, gateway, and mock Zoho.
- `npm run test:e2e` — local HTTP practice journey.
- `docker compose --env-file .env.production config` — Compose configuration validates.
- `npm run verify` — type checks, lint, unit tests, production builds, and E2E smoke.
- Live Zoho OAuth and authenticated read-only organization, item, and tax requests — successful in the earlier local configuration; live credentials are not present in this checkout.
- No live Zoho writes, outbound email, scheduled jobs, or model-provider calls were performed.

## Repository state

`apps/web` is the current React/Vite frontend. It runs locally with `npm run dev:web` at `http://127.0.0.1:3000` and proxies `/api` and `/flux` to the gateway on `127.0.0.1:8787`. Most screens still read bundled mock data; the only live calls are `/api/v1/auth/session`, `/api/v1/news`, and `/api/v1/write-previews`, and the UI does not call Flux chat or briefing endpoints. The earlier Next.js `apps/flux-ui` was removed in `3c1679e` and is not in the current tree.

The production path is API-only. `apps/gateway` serves no static files, the Docker image does not copy `apps/web/dist`, Compose defines no web service, and Caddy proxies only to `app:8787`, so `GET /` and `GET /login` return 404 in the container. `npm run build` still builds `apps/web`, but no deployment wiring serves it.

Recent commits in this checkout:

- `648e64d` — added the ESLint flat config, fixed lint issues, and synced the lockfile.
- `31651c7` — Money Law compliance and backend/frontend bug fixes.
- `8b52cd8` — deep frontend bug fixes and PWA improvements.
- `1a86b16` — Jugaad Advisor confidence scoring and multi-problem support.
- `16ebbce` — added the current `apps/web` frontend and reference assets.
- `3c1679e` — removed the earlier frontend applications, including `apps/flux-ui`, and the static-serving deployment path.

## Still required before production

- Decide the production frontend path. The container currently serves only the API, and `apps/web` is local-development only and mostly mock-data driven. Either deploy `apps/web` as a separate static site with its API/Flux origin configured, or keep the API-only deployment and build a client against the documented contract.
- Docker Engine 29.9.3 and Compose v5.7.0 are installed, but the current user cannot access `/var/run/docker.sock` without sudo. The Compose file validates with `docker compose config`; the image build and full Compose run were not executed in this session. On a Docker host with socket access: copy `.env.production.example`, set all secrets (including three distinct `FLUX_*` secrets and a 12+ character `FLUX_OWNER_PASSWORD`), build, and run `scripts/smoke-gateway.mjs`.
- Configure one model gateway (`OPENROUTER_API_KEY` or OmniRoute) to move Flux from deterministic fallback to model-backed chat, briefing research, and advisory board. Until then `providers: []` and `models: 0` are reported honestly by the API.
- Configure HTTPS ingress in front of `127.0.0.1:8787`, set `APP_ORIGIN` to the exact public origin, and enable `TRUST_PROXY` only if the reverse proxy overwrites `X-Forwarded-For`.
- Rehearse a PostgreSQL restore into a separate database and a `/data` volume restore (Flux audit/users/briefings), then store backups encrypted off-host.
- Complete live Zoho acceptance for each enabled write, report, and status action. No live accounting writes or destructive actions have been attempted.
- Review OAuth scopes with the account owner and move to a least-privilege set where Zoho exposes the needed endpoint coverage.
- Add proxy user accounts, roles, token revocation, and recovery if more than one person needs Zoho execution access. Current proxy authentication is still a single owner setup code.

See `docs/GATEWAY.md`, `docs/BACKEND-API.md`, and `SETUP_ME.md` for the architecture, API contract, and deployment setup.
