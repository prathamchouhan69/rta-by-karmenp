# KARM backend API

Base path: `/api/v1`. Successful responses use `{ "ok": true, "data": ... }`; errors use `{ "ok": false, "error": { "code": "...", "message": "..." } }`.

The production gateway also serves the complete Flux API under `/flux/v1/*` with Flux's own error envelope (`{ "error": { "code": "...", "message": "...", "requestId": "..." } }`) and its own RBAC. The gateway bridges the owner's proxy bearer token into a Flux session; direct Flux password login remains available. See `docs/GATEWAY.md`.

The backend runs in `mock` mode by default and binds to loopback. Live mode requires Zoho OAuth credentials and a configured organization ID. Live or non-loopback deployments require owner authentication; remote deployments must use an HTTPS reverse proxy. Live APIs must be tested against the target Zoho organization before production use.

## Session and health

| Method | Route | Purpose |
|---|---|---|
| GET | `/health` | Service/mode status; never returns secrets |
| POST | `/auth/session` | Exchange `{ "setup_code": "..." }` for a 12-hour bearer token |
| GET | `/organization` | Practice organization or configured Zoho organization |
| GET | `/news` | Current practice/live connection status |
| GET | `/audit?limit=100` | Recent local audit events; limit 1–500 |

In live mode, `/organization` returns only the configured organization ID; if that ID is not present in the authenticated Zoho account, the API returns `ZOHO_ORGANIZATION_NOT_FOUND` instead of displaying another organization.

When authentication is enabled, send `Authorization: Bearer <access_token>`. The session endpoint is rate-limited. Use an HTTPS reverse proxy for remote deployments.

The owner login accepts eight attempts per client address per minute. A successful login clears that client's counter. Production stores these counters in PostgreSQL so all app instances share the limit; local development keeps an in-memory limiter. By default the client address is the socket peer. Set `TRUST_PROXY=true` only when a trusted reverse proxy overwrites `X-Forwarded-For` with the actual client address. Apply an additional rate limit at the public reverse proxy.

## Accounting resources

These resources support `GET /{resource}`, `GET /{resource}/{id}`, `POST /{resource}`, and `PUT /{resource}/{id}`:

`contacts`, `items`, `taxes`, `invoices`, `estimates`, `salesorders`, `deliverychallans`, `creditnotes`, `customerpayments`, `purchaseorders`, `bills`, `vendorcredits`, `vendorpayments`, `expenses`, `journals`, `bankaccounts`, and `banktransactions`.

List routes accept only documented filters such as `page`, `per_page` (1–200), `sort_column`, `sort_order` (`asc` or `desc`), `search_text`, `status`, `contact_type`, `customer_id`, `vendor_id`, and date/account identifiers. Sort columns are restricted to safe field names; unsupported list parameters are ignored. Tax reads use Zoho's `/settings/taxes` route.

All create/update/action writes require a unique `Idempotency-Key` (1–128 alphanumeric characters plus `. _ : -`). Reusing a key with a different body returns `409`. The key is reserved durably before a write; if an upstream timeout leaves its outcome uncertain, replay returns `IDEMPOTENCY_PENDING` rather than risking a duplicate—check the Zoho record before retrying with a new key. Computed totals/balances/taxes are rejected; Zoho Books remains responsible for money calculations. Resource bodies use Zoho Books' normal request fields.

For live writes, first call `POST /write-previews` with `{ "operation": "create:invoices", "request": { ... }, "idempotencyKey": "..." }`. Operations are restricted to supported create/update and invoice email/status actions. The preview returns a short-lived approval token bound to the exact operation, request fingerprint, and idempotency key; after an explicit human review, send it as `X-Confirm-Action` with that exact write. Live writes without a valid matching token return `428 CONFIRMATION_REQUIRED`. Previewing does not execute or queue the write. The token expires after ten minutes, and the same approval cannot be transferred to a different request or idempotency key.

Invoice actions:

| Method | Route | Safety |
|---|---|---|
| POST | `/invoices/{id}/email` | Idempotency key required; live mode also requires a matching preview approval |
| POST | `/invoices/{id}/status/{sent\|open\|draft}` | Idempotency key required; live mode also requires a matching preview approval |
| POST | `/invoices/{id}/status/void` | Idempotency key and matching live preview approval required; practice mode additionally requires `X-Confirm-Action: void-invoice:{id}` |

No general delete route is exposed.

## Search and reports

- `GET /search?q=...` searches contacts, items, and invoices; `q` must be 2–100 characters.
- `GET /reports/{name}` supports `profitandloss`, `balancesheet`, `cashflow`, `agedreceivables`, `agedpayables`, and `taxsummary`. Report dates and filters are forwarded to Zoho when supported; mock mode reports that live report data is unavailable rather than fabricating financial figures.

## Goals and execution

| Method | Route | Purpose |
|---|---|---|
| GET | `/goals` | List locally stored goals with deterministic progress and feasibility fields |
| POST | `/goals/feasibility` | Validate a goal and return a non-persisting feasibility preview |
| POST | `/goals` | Persist a goal in KARM storage; requires `Idempotency-Key` |
| POST | `/goals/{id}/progress` | Record a dated actual; requires `Idempotency-Key` |

Goal and progress records are stored in KARM's practice/operational store and are never forwarded to Zoho. Goal inputs include the metric, unit, dated baseline and current actuals, minimum/target/stretch values, owner, deadline, and optional weekly capacity. Unsupported units, invalid target ordering, invalid dates, and malformed values are rejected. Feasibility uses exact decimal arithmetic at two fractional digits, labels missing history/capacity, and returns derived daily/weekly pace, trend projection, risks, and dated milestones. The current implementation does not automatically derive goal baselines from Zoho reports or connected project/operations systems; users must enter verified actuals.

Goal creation and progress updates are idempotent and audited without storing request credentials. A preview is non-persistent. Goal plans do not create tasks, send messages, schedule work, or write accounting records.

## Flux briefing, assistant, and tasks

| Method | Route | Purpose |
|---|---|---|
| GET | `/flux/briefing` | Return source counts, rule-based invoice/goal attention signals, goal status, and open task summaries |
| POST | `/flux/ask` | Answer bounded questions from currently available records; deterministic measurement conversions are handled without an AI model or business-data fetch |
| GET | `/tasks` | List locally stored KARM tasks |
| POST | `/tasks` | Create an owner-assigned internal task; requires `Idempotency-Key` |
| POST | `/tasks/{id}/status` | Change a task to `open`, `in_progress`, `done`, or `cancelled`; requires `Idempotency-Key` |
| GET | `/documents` | List locally stored unsent document drafts |
| POST | `/documents` | Save a meeting note, follow-up draft, or operations checklist in KARM; requires `Idempotency-Key` |
| GET | `/automations` | List bounded daily KARM task schedules |
| POST | `/automations` | Schedule creation of an internal task at a daily `HH:mm` time in Asia/Kolkata; requires `Idempotency-Key` |
| POST | `/automations/{id}/enabled` | Enable or pause a daily task schedule; requires `Idempotency-Key` |

The briefing uses at most 200 returned invoices, goals, and tasks, identifies the accounting source as live Zoho Books or practice data, and does not infer unavailable project, people, logistics, market, or compliance facts. The assistant is deterministic record retrieval and summaries, not a model-backed conversational agent. Tasks and drafts are stored in KARM and do not send messages or mutate Zoho Books. Daily automations only create internal task records, are idempotent per scheduled occurrence, and are polled by the running API process every 15 seconds. The UI offers review-task templates for business and Pratham's business/health routine, projects, files/documents, task queue, goals, accounting receivables/payables, transportation, people, and customer/supplier relationships. Templates prefill a task reminder; they do not themselves inspect source systems or execute the described business work. Pause/resume is available in the UI. These surfaces are authenticated under the same API middleware as other protected workspace data.

Flux chat can optionally read text from public HTTPS pages using the agent-browser CLI when `FLUX_BROWSER_ALLOWED_DOMAINS` is configured with exact hostnames. The reader is disabled by default, restricted to those hosts, rejects URLs with query strings/fragments, uses no browser profile or credentials, limits output and reads to two pages per answer, and treats returned text as untrusted evidence. It does not expose browser interaction, login, downloads, or write actions. The domain filter is defense in depth, not an operating-system egress firewall.

The gateway upgrades these two routes to the real Flux plane: `GET /api/v1/flux/briefing` merges Flux's Zoho-backed verified briefing with the proxy's KARM goal/task signals, and `POST /api/v1/flux/ask` routes model-backed questions to Flux `/v1/chat` while retaining the deterministic assistant and measurement engine as labelled fallbacks. Flux's full endpoints — chat, advisory board, documents, proposals, HSN, models, memory, audit and tools — are exposed under `/flux/v1/*`; the gateway does not remove or rewrite that contract. `GET /api/v1/flux/status` returns gateway, proxy, Flux, audit-chain, model and access status for the UI.

Flux also handles deterministic length, mass, volume, area, temperature, pressure, energy, speed, selected medical-unit, and currency conversions in the `/flux/ask` route. Each conversion reports its formula and confidence. US customary volume units must be named explicitly; glasses, bags, bigha, IU, and analyte-dependent concentration conversions require user-supplied context. Currency conversion never fetches or invents a rate: a cross-currency request must include a positive user-provided rate, expressed as target-currency units per source-currency unit. Medical-unit conversions include the general health-information disclaimer and do not diagnose or interpret the result.

## Operational boundaries

- Local mode without `DATABASE_URL` uses a single-process JSON store. Production (`NODE_ENV=production`) requires `DATABASE_URL` and fails at startup rather than falling back to container-local files. PostgreSQL stores practice records, audit events, and atomic idempotency reservations; use a managed database or the included Compose PostgreSQL service.
- Do not set `TRUST_PROXY=true` unless the reverse proxy overwrites (rather than appends to) `X-Forwarded-For`.
- Audit events record action/resource metadata, not request payloads or credentials. Idempotency responses are persisted to replay write results; in live mode those responses can contain Zoho record data, so protect and back up the database according to the organization's data policy.
- Zoho API availability, scopes, report variants, and status actions differ by organization/data center. Verify these against the actual organization before enabling writes.
- The current owner-code login is a first integration boundary, not a complete multi-user identity, recovery, or role-management system. Production rollout still requires TLS/reverse-proxy configuration, tested database backups and restores, monitoring, and live acceptance testing.
