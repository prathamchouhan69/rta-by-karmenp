# Flux backend

The server behind Flux, the single AI agent inside RTA by KARM. Node.js 22 or newer.

Flux means flow. This server does the real work; the app only shows it. It:

- answers questions about the open screen using data it fetches itself from Zoho Books under the signed-in user's role;
- can read text from public HTTPS pages on an operator-configured exact-host allowlist using agent-browser; browser access is read-only and never logs in or interacts with page controls;
- runs the 12-advisor Advisory Board;
- turns one sentence into a document draft, checks HSN/SAC and GSTIN, and creates a **draft** in Zoho Books only after an explicit approval;
- builds the 8:00 AM IST briefing from verified sources and says plainly what it could not verify;
- keeps a tamper-evident audit log of every AI action and approval.

## The rules the code enforces (each one has a test)

| Rule | Where |
|---|---|
| Money figures come from Zoho Books exactly as Zoho sent them (kept as text, trailing zeros intact) | `src/zoho/money.js` |
| Flux never does ledger arithmetic; the writer refuses `total`, `sub_total`, tax, status and send fields | `src/zoho/writer.js` |
| Reading and writing use separate Zoho credentials; writes are **off** unless switched on; the writer can only create a draft (no update, delete, send or payment method exists) | `src/config.js`, `src/zoho/` |
| Every write needs a single-use, 5-minute approval token bound to the exact payload; one changed character voids it | `src/approvals/` |
| The role that may approve is checked by the server (accountants approve G1; only the owner approves G2) | `src/security/roles.js` |
| No model is hard-coded; models are discovered or pinned by the owner | `src/models/registry.js`, `npm run scan` |
| Free-only by default; a paid model needs per-call approval; if a gateway silently answers with a paid model, the answer is **discarded** and an alert is audited | `src/models/costGuard.js`, `router.js` |
| PAN, Aadhaar, bank, card and password details are stripped before any model sees text, and never stored in audit or memory | `src/util/redact.js` |
| Customer data goes only to a provider you have marked as vetted (T1 or T2) | `router.js` |
| Figures in an answer that are not in the evidence are labelled `[uncertain: ...]` | `src/checks/numberGuard.js` |
| HSN/SAC is never invented: with no source the answer is "Needs verification" and no code | `src/hsn/hsn.js` |
| Text from Zoho or documents is data, not instructions; a model cannot call a tool outside its allow-list | `src/checks/injection.js`, `src/agents/` |
| Public web reading is disabled by default, restricted to exact operator-allowlisted HTTPS hosts, isolated from user browser state, capped at two pages per answer, and page text is untrusted evidence | `src/agents/browserReader.js`, `src/config.js` |
| Every agent needs a contract, a tool allow-list, a budget and an autonomy level; L3 (act alone) is refused | `src/agents/registry.js` |

## Set up

1. `cp .env.example .env`, then fill in three different random secrets (the file shows the command).
2. `npm run user:add` and create the owner account. Add accountant, staff or viewer accounts the same way.
3. `npm start`. Check `http://localhost:8787/health`.
4. Put the server behind HTTPS (any Node host; terminate TLS at the host or a proxy) and set `FLUX_ALLOWED_ORIGINS` to the exact origin of your KARM app.
5. To enable public-page reading, set `FLUX_BROWSER_ALLOWED_DOMAINS` to comma-separated exact hosts (for example `www.gst.gov.in,cbic-gst.gov.in`). Wildcards, IPs, ports, paths, query strings, and reserved/local hostnames are rejected. Keep this list to trusted public sites and use outbound network controls for stronger isolation; agent-browser's domain filter is not an OS firewall.

### Connect Zoho Books (India data centre by default)
In the Zoho API Console create a **Self Client** for reading and generate a refresh token with the scopes `ZohoBooks.invoices.READ`, `ZohoBooks.contacts.READ`, `ZohoBooks.settings.READ`, `ZohoBooks.bills.READ`. Put its three values in `ZOHO_READ_*` and your organisation id in `ZOHO_ORG_ID`. For drafts, create a **second** Self Client with only `ZohoBooks.invoices.CREATE` (add `ZohoBooks.estimates.CREATE`, `ZohoBooks.purchaseorders.CREATE`, `ZohoBooks.creditnotes.CREATE`, `ZohoBooks.deliverychallans.CREATE` only if you want those types), put it in `ZOHO_WRITE_*`, and set `ZOHO_WRITE_ENABLED=true`. Test against a separate Zoho test organisation first.

### Connect models
Set `OPENROUTER_API_KEY` (and/or `OMNIROUTE_BASE_URL`). Then, as owner: `POST /v1/models/sync`, mark the provider vetted with `POST /v1/models/trust` once you have read its terms, and optionally pin roles with `POST /v1/models/pin`. Until a provider is vetted, anything involving customer data is refused (public questions still work).

## API (all JSON; sign in at `POST /v1/auth/login`, send `Authorization: Bearer <token>`)

| Area | Endpoints |
|---|---|
| Health, sign-in | `GET /health` (public), `POST /v1/auth/login`, `GET /v1/me` |
| Chat | `POST /v1/chat` `{message, context:{screen, recordId}, deep, verify}` |
| Board | `GET /v1/board/advisors`, `POST /v1/board/estimate`, `POST /v1/board/run`, `POST /v1/board/tasks` |
| Documents | `POST /v1/documents/draft`, `GET/PATCH /v1/documents/:id`, `POST /v1/documents/:id/revert`, `POST /v1/documents/:id/propose`, `GET /v1/documents/:id/pdf`, `POST /v1/documents/text` |
| HSN/SAC | `POST /v1/hsn/resolve`, `POST /v1/hsn/confirm`, `GET /v1/hsn/mappings` |
| Approvals | `GET /v1/proposals`, `POST /v1/proposals/:id/approve`, `.../reject`, `.../execute` `{token}` |
| Briefing | `GET /v1/briefing/today`, `POST /v1/briefing/run`, `POST /v1/briefing/:date/status` `{action: save, snooze, dismiss, open}` |
| Models | `GET /v1/models`, `POST /v1/models/sync`, `.../pin`, `.../trust`, `.../classify`, `GET /v1/models/usage` |
| Audit | `GET /v1/audit`, `GET /v1/audit/verify` |
| Tools | `POST /v1/tools/fuel`, `/gstin`, `/dues`; public page reading is available to Flux chat only when `FLUX_BROWSER_ALLOWED_DOMAINS` is configured; `GET/POST/DELETE /v1/memory` |

## Checks

`npm test` runs 85 automated tests against a pretend Zoho Books and a pretend model gateway, including real HTTP and a real server process. `npm run scan` fails on unapproved runtime dependencies, hard-coded models, key-like strings, forbidden names, placeholder code, over-long files or Zoho writes outside the writer.

## Honest limits

- **Not yet tested against live services.** Zoho Books and the model gateways are simulated in the tests. Before real use, run against a Zoho test organisation and check: the draft POST accepts a JSON body, `accept=pdf` returns a PDF, and the list filters behave as expected.
- **Plug-in points, not shipped:** the research source for market news, schemes, tenders and prices (so those briefing sections say "Could not verify"), and an official HSN/SAC lookup (so codes stay "Needs verification" until you confirm one).
- **Not built:** finalising (G3) and sending (G4) executors, the exact-decimal totals preview (Option B), voice, OCR, a database server (data is JSON files under `FLUX_DATA_DIR`; one server process only), push delivery to the iPhone, and the app screens that call this API.
- Free models have small daily limits and unreviewed terms; that is why customer data is blocked until you vet a provider.
- Public web reading uses the agent-browser CLI's text reader and does not launch a persistent browser. It accepts only HTTPS URLs on the exact configured host allowlist, rejects query strings and fragments, sends no Flux cookies or credentials, limits output and reads to two pages per answer, and returns bounded page text as untrusted data. No click, form, download, login, or write commands are exposed.
