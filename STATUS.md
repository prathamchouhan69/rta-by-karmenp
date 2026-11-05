# KARM OS status

## Backend

The local API has a live Zoho Books connection configured in `apps/proxy/.env`, which is ignored by Git and restricted to the local owner account. OAuth token exchange succeeded. Authenticated read-only checks succeeded for the configured organization, items, and taxes; the organization ID returned by Zoho matched the configured organization. No accounting records were created, updated, emailed, or voided during connection verification.

The API also has a practice-mode data store, resource routes for the documented accounting entities, basic search/report routes, single-owner bearer authentication for live/non-local use, durable idempotency reservations, audit metadata, and safeguards for calculated totals and invoice voiding.
Owner login throttling allows eight consecutive attempts per client address per minute and resets on successful authentication.

The web app is implemented in `apps/web`: a responsive, Figma-inspired operations dashboard for overview, invoices, customers, vendors, items/taxes, and reports. It uses the `/api/v1` contract, distinguishes practice from live mode, and displays accounting values supplied by the backend without client-side money calculations. The reference file is sign-in limited, so the current implementation follows the visible dark dashboard direction rather than claiming pixel-exact parity.

The Goals & Execution page supports locally stored business goals, deterministic feasibility previews, dated progress updates, daily action prompts, and weekly/monthly/quarterly checkpoints. The engine requires explicit baseline/current values, dates, an owner, target bands, and metric units; missing history or weekly capacity is shown as uncertain rather than guessed. Goal data stays in KARM storage and does not create Zoho records.

Flux now includes a persistent-in-shell assistant capsule, a rule-based source-grounded briefing/advisor board, and owner-assigned KARM tasks with idempotent creation and status updates. Goal actions can be explicitly added to that queue. KARM also stores unsent meeting, follow-up, and operations-checklist drafts, and supports India-time daily automations bounded to creating internal tasks. Q&A operates only on returned invoice, goal, and task records; no model provider or paid inference is configured. Live accounting writes require a ten-minute approval token bound to the exact request and idempotency key, in addition to the UI's explicit confirmation. The advisor board recommends human review and never executes actions.

## Unified gateway and Flux integration

`apps/gateway` is now the single production entry point on port 8787. It serves the built web app, routes `/api/v1/*` to the hardened proxy in-process, and routes `/flux/*` to the complete Flux HTTP API on loopback. Flux keeps its own RBAC, users, models, advisory board, approval gates, cost guard, and HMAC-chained audit log; the gateway does not collapse or bypass those controls.

The gateway bridges the owner's proxy bearer token into a minted Flux session for `FLUX_OWNER_ID` (default `owner`), so the web app signs in once while every Flux request still runs through Flux RBAC and per-user rate limits. Direct Flux password login remains available for additional Flux users. Proxy/Zoho execution remains single-owner until the proxy has a real multi-user identity model.

New gateway routes:

- `GET /api/v1/flux/status` — gateway, proxy, Flux, audit-chain, model, and access status for the runtime panel in the Briefing page.
- `GET /api/v1/flux/briefing` — merges Flux's Zoho-backed verified/partial/unverified briefing with the proxy's KARM goals/tasks, without double-counting overdue invoices, and recomputes one health profile.
- `POST /api/v1/flux/ask` — routes deterministic measurements to the formula engine, otherwise to Flux `/v1/chat`, normalizes evidence/verification/audit metadata, and labels the deterministic proxy assistant as a fallback when no model gateway is configured.

`/healthz`, `/readyz`, `/metrics` (token-protected), request IDs, rate limiting, security headers, timeouts, and graceful shutdown are in place. See `docs/GATEWAY.md` for the full contract.

Live single-port smoke test passed against the running gateway with the real Zoho organization in `live` mode:

- `/readyz`, proxy health, and Flux health — OK.
- Owner login and Flux RBAC bridge — owner session resolved with `*` permissions.
- Flux audit chain — verified, 1 entry at test time.
- Unified briefing — engine `flux`, `zohoReadable: true`, `degraded: false`, counts `{ invoices: 20, overdueInvoices: 1, goals: 0, openTasks: 0 }`, 1 attention signal.
- Measurement conversion and assistant fallback — both labelled correctly.
- `/metrics` — Prometheus output present.

Verification:

- `npm test -w apps/proxy` — 35 proxy, auth, Zoho-client, persistence, approval-token, Flux, task, and goal tests.
- `npm test -w apps/flux` — 79 Flux RBAC, approval, audit, router, briefing, board, and tool tests.
- `npm test -w apps/gateway` — 13 gateway integration and merge tests.
- `npm test` — shared, web, proxy, Flux, and gateway suites.
- `npm run test:e2e` — local HTTP practice journey.
- `npm run scan:money` — money arithmetic guard scan.
- `npm run verify` — type checks, lint, money guard, unit tests, production builds, and E2E smoke.
- Browser smoke check — verified the practice briefing, evidence signals, persistent assistant interaction across navigation, and task creation; preview data was removed afterward.
- Live Zoho OAuth and authenticated read-only organization, item, and tax requests — successful.
- No live Zoho writes, outbound email, scheduled jobs, or model-provider calls were performed.

## Still required before production

- Docker is not installed on this development machine, so the production image and Compose stack were built and reviewed but not executed locally. On a Docker host: copy `.env.production.example`, set all secrets (including three distinct `FLUX_*` secrets), build, run `scripts/smoke-gateway.mjs`, and verify `/readyz` plus the UI.
- Configure one model gateway (`OPENROUTER_API_KEY` or OmniRoute) to move Flux from deterministic fallback to model-backed chat, briefing research, and advisory board. Until then `providers: []` and `models: 0` are reported honestly in the UI.
- Configure HTTPS ingress in front of `127.0.0.1:8787`, set `APP_ORIGIN` to the exact public origin, and enable `TRUST_PROXY` only if the reverse proxy overwrites `X-Forwarded-For`.
- Rehearse a PostgreSQL restore into a separate database and a `/data` volume restore (Flux audit/users/briefings), then store backups encrypted off-host.
- Complete live Zoho acceptance for each enabled write, report, and status action. No live accounting writes or destructive actions have been attempted.
- Review OAuth scopes with the account owner and move to a least-privilege set where Zoho exposes the needed endpoint coverage.
- Add proxy user accounts, roles, token revocation, and recovery if more than one person needs Zoho execution access. Current proxy authentication is still a single owner setup code.

See `docs/GATEWAY.md`, `docs/BACKEND-API.md`, and `SETUP_ME.md` for the architecture, API contract, and deployment setup.

## Reference inspection

The folder includes 14 numbered visual reference guides and 14 raw source clips under `.source/references/`. The text directions and asset inventory are present; frame-by-frame inspection of all source clips has not been completed.
