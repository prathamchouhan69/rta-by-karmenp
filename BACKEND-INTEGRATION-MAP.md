# Flux UI backend integration map

## Request path and trust boundary

The browser UI is `apps/flux-ui`. Its `api()` helper sends same-origin requests to `/api/flux/<path>`; the Next.js route handler proxies them to the configured Flux backend and forwards the authenticated session. The backend remains responsible for authorization and validation. UI permission checks only hide or disable unavailable controls; they are not a security boundary.

The dashboard, approvals workspace, and source-status page were connected to existing read/action routes. No backend route or schema was added for this UI work.

## Pages and API calls

| Frontend page | Backend API calls | Notes |
|---|---|---|
| `/` dashboard | `GET /v1/briefing/today`; `POST /v1/briefing/run`; `GET /v1/proposals?status=pending`; `GET /v1/tasks`; `GET /v1/live/status` | Briefing generation checks `read:zoho`; proposal/task/live reads check their respective backend permissions. The task chart is derived only from `GET /v1/tasks`. |
| `/tasks` | `GET /v1/tasks` | Read-only view of task records already stored by Flux. The task-status chart groups these records by their current stored status; this is a snapshot, not a historical trend. |
| `/references` | — | Browses the local inventory of 169 reference entries and their five visual directions each (845 directions total); no scientific explanation feed is connected. |
| `/selections` | — | Shows favorites and notes stored in this browser's local storage; no backend sync. |
| `/charts` | `GET /v1/tasks` for the Task Status Chart; `GET /v1/briefing/today` for the Accounts-Receivable Aging Chart; other entries use local inventory or caller-provided scenario inputs | The inventory contains 95 chart concepts, not 95 live feeds. The Task Status Chart visualizes Flux-stored task records. The Accounts-Receivable Aging Chart derives counts from overdue `daysOverdue` values, not balances; source evidence may include balances, but they are not summed or graphed. Other chart entries should not be read as real-time business data unless a source is explicitly identified. |
| `/chat` | `POST /v1/chat` | Sends the user's prompt and optional chat controls/context. Backend chat permission, limits, and model policy apply. |
| `/money` | `POST /v1/money/plan`, `/v1/money/goal`, `/v1/money/expense-review`; `POST /v1/finance/emi`, `/v1/finance/emergency-fund`, `/v1/finance/debt-plan` | Deterministic calculations from caller-provided inputs; not imported account balances. |
| `/cash-flow` | `POST /v1/finance/cash-flow` | Cash-flow forecast from caller-provided scenario inputs; not synced account data or a projection based on observed transactions. |
| `/wealth` | `POST /v1/wealth/net-worth`, `/v1/wealth/compound`, `/v1/wealth/retirement-gap` | Caller-provided scenarios; no market return prediction. |
| `/startup` | `POST /v1/startup/snapshot`, `/v1/startup/runway`, `/v1/startup/burn-multiple`, `/v1/startup/dilution` | Caller-provided company metrics. |
| `/economy` | `POST /v1/economy/brief` | Evaluates submitted events; default form content is sample input, not a live feed. |
| `/radar` | `POST /v1/radar/opportunities` | Evaluates submitted alerts; default form content is sample input, not a retrieved tender/opportunity. |
| `/documents` | `GET /v1/documents`, `/v1/documents/:id`; `POST /v1/documents/draft`, `/v1/documents/:id/revert`, `/v1/documents/:id/propose`; `PATCH /v1/documents/:id`; `POST /v1/hsn/confirm`; `GET /v1/documents/:id/pdf` | A surfaced document-draft workflow: review/edit drafts, restore versions, confirm HSN details, and create a proposal for a separate approval/execution flow. It does not publish or execute documents directly. It does not use `POST /v1/documents/text` or `GET /v1/hsn/mappings`. |
| `/schemes` | `GET /v1/opportunities/schemes`; `POST /v1/opportunities/schemes/search` | Curated static directory and backend keyword search only. Both require `knowledge:read`. Explicitly not live; listings do not establish eligibility or current availability, and details require verification at official sources. The optional guidance endpoint is not currently consumed. |
| `/local` | `POST /v1/local/insights` | Evaluates submitted local observations; it does not fetch local news. |
| `/automations` | `POST /v1/automations/business`; `POST /v1/automations/health` | Evaluates submitted data into drafts/reminders; the route itself does not execute proposals. |
| `/meeting` | `POST /v1/meeting/structure` | Structures text supplied by the user. |
| `/approvals` | `GET /v1/proposals?status=pending`; `POST /v1/proposals/:id/approve`; `POST /v1/proposals/:id/reject`; `POST /v1/proposals/:id/execute` | Approve and execute are separate user actions. Execute requires the short-lived, single-use token returned by approve and an additional confirmation. The token is held in page memory only. Backend gate/role checks still apply; reload clears the token. An approved proposal remains approved if its token is lost/expired; create a fresh proposal or follow the operator's recovery process rather than assuming it executed. |
| `/settings` | `GET /v1/live/status` | Shows backend source configuration and official-source links; this is a status page, not general settings management. |

### Dashboard snapshot semantics

`GET /v1/tasks` is a read-only route over Flux's stored task collection; it returns saved task records, currently written by the task-proposal execution path. It does not create or update tasks. Both `/tasks` and the Task Status Chart use this endpoint. The chart groups records by the `status` field returned by the backend (or “Unspecified” if absent). Its bars are normalized to the loaded list and communicate current proportions only. No historical or fabricated trend values are used.

`GET /v1/live/status` currently returns `LIVE_DATA_NOT_CONFIGURED` and identifies seven domains (economy, currency, tenders, schemes, news, market prices, and local intelligence) as unavailable from a live feed. The UI presents that honestly and does not infer a live status from a configured endpoint.

## Backend capabilities not yet surfaced by `apps/flux-ui`

These routes exist in the Flux backend but the current Next.js pages do not yet provide full workflows for them:

| Capability | Existing backend routes |
|---|---|
| Board/advisor workflow | `GET /v1/board/advisors`; `POST /v1/board/estimate`, `/v1/board/run`, `/v1/board/tasks` |
| HSN | `POST /v1/hsn/resolve`, `/v1/hsn/confirm`; `GET /v1/hsn/mappings` |
| Finance | `POST /v1/finance/gst`, `/v1/finance/loan-eligibility`, `/v1/finance/break-even`, `/v1/finance/working-capital`, `/v1/finance/health-score`, `/v1/finance/valuation`, `/v1/finance/unit-economics`, `/v1/finance/tax-awareness`; `GET /v1/finance/investment-awareness` |
| Construction and material prices | `GET /v1/construction/project-types`, `/v1/material-prices`, `/v1/material-prices/trend`, `/v1/material-prices/compare`, `/v1/material-prices/project-impact`; `POST /v1/construction/estimate`, `/v1/construction/concrete-mix`, `/v1/construction/steel-weight`, `/v1/construction/project-profit`, `/v1/construction/price-impact`, `/v1/material-prices`; `DELETE /v1/material-prices/:id` |
| Health | `GET`, `PUT`, and `DELETE /v1/health/profile`; `GET /v1/health/vitals`, `/v1/health/insights`; `POST /v1/health/vitals`, `/v1/health/bmi`, `/v1/health/bmr`, `/v1/health/tdee`, `/v1/health/water-target`, `/v1/health/macros`, `/v1/health/vitals-check`, `/v1/health/emergency-check`, `/v1/health/lifestyle-plan`, `/v1/health/heat-guidance` |
| Knowledge and Jugaad | `GET /v1/knowledge/stats`, `/v1/knowledge/categories`, `/v1/knowledge/search`, `/v1/knowledge/:id`; `POST /v1/knowledge/search`, `/v1/knowledge/recommend`, `/v1/jugaad/advise` |
| Other discovery tools | `POST /v1/economy/price-trend`, `/v1/radar/trends`; `GET /v1/ocr/status`; `POST /v1/ocr/extract`; `GET /v1/measurements/units`; `POST /v1/measurements/convert`, `/v1/measurements/parse` |
| Administration and operations | `GET /v1/me`, `/v1/users`, `/v1/models`, `/v1/models/usage`, `/v1/audit`, `/v1/audit/verify`, `/v1/memory`; `POST /v1/users`, `/v1/users/:id/active`, `/v1/users/:id/role`, `/v1/users/:id/password`, `/v1/models/sync`, `/v1/models/pin`, `/v1/models/trust`, `/v1/models/classify`, `/v1/memory`; `DELETE /v1/memory/:id` |

The names and access rules above follow the route registrations in `apps/flux/src/http/routes.js` and `apps/flux/src/http/extendedRoutes.js`. Availability of an endpoint does not imply the corresponding UI workflow is complete or that the caller has permission.
The documents workflow covers selected endpoints only; document-from-text drafting and HSN mapping lookup remain unsurfaced. The schemes page does not consume the optional `/v1/opportunities/schemes/guidance` endpoint.

## Validation notes

- The dashboard/API integration uses only routes already registered by Flux.
- Empty results, missing briefing, and request failures are represented separately where the UI consumes these reads.
- The UI does not calculate accounting totals from live Zoho records or present example JSON as fetched data.
- The backend source status currently says live feeds are not configured.
- The legacy `apps/web` frontend is not the active Next.js app and remains separately incomplete in this worktree.
