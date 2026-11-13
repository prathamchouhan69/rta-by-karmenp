# KARM OS status

## Backend

The current checkout is configured for practice mode: the root `.env` has `ZOHO_MODE=mock`, Zoho credentials are empty, and `apps/proxy/.env` is not present. A live Zoho connection was verified earlier in a different local configuration, but it is not reproducible from this working copy until the OAuth values are supplied again. No accounting records were created, updated, emailed, or voided during that verification.

The API also has a practice-mode data store, resource routes for the documented accounting entities, basic search/report routes, single-owner bearer authentication for live/non-local use, durable idempotency reservations, audit metadata, and safeguards for calculated totals and invoice voiding.
Owner login throttling allows eight consecutive attempts per client address per minute and resets on successful authentication.

The active interface is `apps/flux-ui`, a mobile-first Next.js App Router application served by the gateway. It covers the briefing dashboard, chat, money, cash flow, wealth, startup, economy, radar, documents, schemes, local, automations, meeting, approvals, settings, tasks, references, selections, and charts. It reads Flux through its own authenticated `/api/flux/*` proxy and displays backend values without client-side money calculations. `apps/web` is a legacy static demo; it is excluded from the root build, typecheck, test, Docker, and Compose paths.

The Goals & Execution page supports locally stored business goals, deterministic feasibility previews, dated progress updates, daily action prompts, and weekly/monthly/quarterly checkpoints. The engine requires explicit baseline/current values, dates, an owner, target bands, and metric units; missing history or weekly capacity is shown as uncertain rather than guessed. Goal data stays in KARM storage and does not create Zoho records.

Flux now includes a persistent-in-shell assistant capsule, a rule-based source-grounded briefing/advisor board, and owner-assigned KARM tasks with idempotent creation and status updates. Goal actions can be explicitly added to that queue. KARM also stores unsent meeting, follow-up, and operations-checklist drafts, and supports India-time daily automations bounded to creating internal tasks. Q&A operates only on returned invoice, goal, and task records; no model provider or paid inference is configured. Live accounting writes require a ten-minute approval token bound to the exact request and idempotency key, in addition to the UI's explicit confirmation. The advisor board recommends human review and never executes actions.

## Unified gateway and Flux integration

`apps/gateway` is the single production entry point on port 8787. It proxies the `flux-ui` Next.js server, routes `/api/v1/*` to the hardened proxy in-process, and routes `/flux/*` to the complete Flux HTTP API on loopback. Flux keeps its own RBAC, users, models, advisory board, approval gates, cost guard, and HMAC-chained audit log; the gateway does not collapse or bypass those controls. `FLUX_UI_URL` enables the interface proxy; without it the gateway keeps the legacy static `STATIC_ROOT` fallback.

`flux-ui` signs in with a direct Flux password (`POST /api/auth/login` → Flux `/v1/auth/login`) and stores the Flux token in an httpOnly cookie. Production therefore requires `FLUX_OWNER_PASSWORD`. The gateway also bridges the owner's proxy bearer token into a minted Flux session for `FLUX_OWNER_ID` (default `owner`) for API clients and the legacy static app. Every Flux request still runs through Flux RBAC and per-user rate limits. Proxy/Zoho execution remains single-owner until the proxy has a real multi-user identity model.

New gateway routes:

- `GET /api/v1/flux/status` — gateway, proxy, Flux, audit-chain, model, and access status for the runtime panel in the Briefing page.
- `GET /api/v1/flux/briefing` — merges Flux's Zoho-backed verified/partial/unverified briefing with the proxy's KARM goals/tasks, without double-counting overdue invoices, and recomputes one health profile.
- `POST /api/v1/flux/ask` — routes deterministic measurements to the formula engine, otherwise to Flux `/v1/chat`, normalizes evidence/verification/audit metadata, and labels the deterministic proxy assistant as a fallback when no model gateway is configured.

`/healthz`, `/readyz`, `/metrics` (token-protected), request IDs, rate limiting, security headers, timeouts, and graceful shutdown are in place. See `docs/GATEWAY.md` for the full contract.

An earlier single-port smoke test passed against the running gateway with a real Zoho organization in `live` mode. That configuration is not present in this checkout; the current runtime was re-verified in practice mode through the gateway with `flux-ui`:

- `/readyz`, proxy health, and Flux health — OK.
- Owner login and Flux RBAC bridge — owner session resolved with `*` permissions.
- Flux audit chain — verified, 1 entry at test time.
- Unified briefing — engine `flux`, `zohoReadable: true`, `degraded: false`, counts `{ invoices: 20, overdueInvoices: 1, goals: 0, openTasks: 0 }`, 1 attention signal.
- Measurement conversion and assistant fallback — both labelled correctly.
- `/metrics` — Prometheus output present.

Current practice-mode single-port smoke test through the gateway:

- `/readyz` reports proxy, Flux, and `flux-ui` all OK.
- Owner login through `flux-ui` returns a Flux session with `*` permissions.
- All 19 interface pages return HTTP 200.
- `/api/v1/health`, `/api/flux/v1/tasks`, and `/api/flux/v1/live/status` return HTTP 200.

Verification:

- `npm test -w apps/proxy` — 50 proxy, auth, Zoho-client, persistence, approval-token, Flux, task, and goal tests.
- `npm test -w apps/flux` — 117 Flux RBAC, approval, audit, router, briefing, board, and tool tests.
- `npm test -w apps/gateway` — 19 gateway integration, interface-proxy, and merge tests.
- `npm test -w apps/flux-ui` — 9 selection and receivables-aging tests.
- `npm test -w packages/shared` — 9 shared-contract tests.
- `npm test` — shared, proxy, Flux, gateway, flux-ui, and script suites.
- `npm run test:e2e` — local HTTP practice journey.
- `npm run scan:money` — money arithmetic guard scan.
- `npm run verify` — type checks, lint, money guard, unit tests, production builds, and E2E smoke.
- Browser smoke check — verified the practice briefing, evidence signals, persistent assistant interaction across navigation, and task creation; preview data was removed afterward.
- Live Zoho OAuth and authenticated read-only organization, item, and tax requests — successful in the earlier local configuration; live credentials are not present in this checkout.
- No live Zoho writes, outbound email, scheduled jobs, or model-provider calls were performed.

## Repository state

The working tree contains substantial uncommitted `flux-ui`, gateway, and documentation work. `apps/web` remains in the repository as a legacy static demo but is no longer part of the root build, typecheck, test, Docker, or Compose paths. Commit the active work before switching branches or cleaning the tree.

## Still required before production

- Docker Engine 29.9.3 and Compose v5.7.0 are installed, but the current user cannot access `/var/run/docker.sock` without sudo. The Compose file validates with `docker compose config`; the image build and full Compose run were not executed in this session. On a Docker host with socket access: copy `.env.production.example`, set all secrets (including three distinct `FLUX_*` secrets and a 12+ character `FLUX_OWNER_PASSWORD`), build, run `scripts/smoke-gateway.mjs`, and verify `/readyz` plus the UI.
- Configure one model gateway (`OPENROUTER_API_KEY` or OmniRoute) to move Flux from deterministic fallback to model-backed chat, briefing research, and advisory board. Until then `providers: []` and `models: 0` are reported honestly in the UI.
- Configure HTTPS ingress in front of `127.0.0.1:8787`, set `APP_ORIGIN` to the exact public origin, and enable `TRUST_PROXY` only if the reverse proxy overwrites `X-Forwarded-For`.
- Rehearse a PostgreSQL restore into a separate database and a `/data` volume restore (Flux audit/users/briefings), then store backups encrypted off-host.
- Complete live Zoho acceptance for each enabled write, report, and status action. No live accounting writes or destructive actions have been attempted.
- Review OAuth scopes with the account owner and move to a least-privilege set where Zoho exposes the needed endpoint coverage.
- Add proxy user accounts, roles, token revocation, and recovery if more than one person needs Zoho execution access. Current proxy authentication is still a single owner setup code.

See `docs/GATEWAY.md`, `docs/BACKEND-API.md`, and `SETUP_ME.md` for the architecture, API contract, and deployment setup.

## Reference inspection

The folder includes 14 numbered visual reference guides and 14 raw source clips under `.source/references/`. The text directions and asset inventory are present; frame-by-frame inspection of all source clips has not been completed.
