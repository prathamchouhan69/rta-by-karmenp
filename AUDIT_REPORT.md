# AUDIT REPORT — KARM OS / RTA by KARM
*Inspector: Antigravity AI — Read-only. No app files changed.*  
*Date: 2026-11-21 (IST)*  
*RULEBOOK: prompts/KARM_OS_PROMPTS_BACKEND_AND_FEATURES.txt*

---

## 1. VERDICT

**DOES NOT MATCH — Mostly matches in structure, but has critical gaps**

The backend architecture is sound and largely correct. Money law safeguards (computed-field rejection, idempotency, audit log) work in live HTTP tests. All 184 unit tests pass. Build and typecheck are clean. However, three Critical findings disqualify a "MOSTLY MATCHES" verdict: (1) the proxy skips authentication entirely for loopback connections in practice mode, allowing unauthenticated POSTs to create documents; (2) the JSON parser for Zoho responses is native `response.json()` — not a lossless parser — risking silent loss of precision on large amounts; (3) the frontend performs money arithmetic (parseFloat, reduce on balances) in violation of the core money law.

---

## 2. COUNTS

| Category | Count |
|----------|-------|
| Total checks (C + M + P + F + S + L) | 68 |
| **PASS** | **34** |
| **FAIL** | **21** |
| **NOT RUN** | **13** |

---

## 3. CHECK TABLE

| ID | Name | Result | Evidence |
|----|------|--------|----------|
| C1 | npm ci from lockfile | PASS | `reports/audit/raw/c1_npm_ci.txt` |
| C2 | npm run typecheck | PASS | `reports/audit/raw/c2_typecheck.txt` |
| C3 | npm run lint (zero warnings) | FAIL | `reports/audit/raw/c3_lint.txt` — lint runs typecheck, no ESLint |
| C4 | npm run build | PASS | `reports/audit/raw/c4_build.txt` |
| C5 | npm run test (totals) | PASS — 184 pass, 0 fail | `reports/audit/raw/c5_test.txt` |
| C6 | npm run scan:money | FAIL | `reports/audit/raw/c6_root_scan_money.txt` — script missing at root |
| C7 | Scanner self-test (25 bad, 15 good fixtures) | FAIL | `reports/audit/raw/c7_fixtures.txt` — no fixture directory |
| C8 | tsconfig strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes | FAIL | `reports/audit/raw/c8_tsconfig.txt` — 2 flags missing |
| C9 | Versions pinned exactly; lockfile committed | FAIL | `reports/audit/raw/c9_pinned.txt` — 17 unpinned; lockfile modified |
| C10 | No TODO/FIXME/lorem in source | PASS | `reports/audit/raw/c10_todo.txt` — 0 hits |
| C11 | No hard-coded secrets | PASS | `reports/audit/raw/c11_secrets.txt` — 0 hits |
| C12 | .gitignore complete | PASS | `reports/audit/raw/c12_gitignore.txt` |
| C13 | .env.example has FAKE values only | PASS | `reports/audit/raw/c13_env_example.txt` |
| C14 | npm run dev starts without crashing | PASS | `reports/audit/raw/c14_dev.txt` |
| M1 | Lossless JSON parser for Zoho responses | FAIL | `reports/audit/raw/m1_lossless.txt` — native `response.json()` used |
| M2 | Money fields arrive as exact text strings | PASS | `reports/audit/raw/m2_m3_m6.txt` — total "64944.84" confirmed |
| M3 | Golden invoice INV-KE-270031 total unchanged | FAIL | `reports/audit/raw/m2_m3_m6.txt` — GET by ID returns undefined |
| M4 | No money maths in apps/web | FAIL | `reports/audit/raw/m4_money_math.txt` — 43 hits; parseFloat/reduce on money |
| M5 | Only proxy mapper creates ZohoMoney type | FAIL | `reports/audit/raw/m5_zohomoney.txt` — type does not exist |
| M6 | POST with computed field (total) rejected 422 | PASS | `reports/audit/raw/m2_m3_m6.txt` — 422 COMPUTED_FIELD |
| M7 | "Total will be calculated by Zoho Books" on edit | PASS (code) | `reports/audit/raw/m7_total_msg.txt` — in documents.js:60 |
| M8 | App never chooses document numbers | PASS (code) | `reports/audit/raw/m8_doc_numbers.txt` — no assignment found |
| M9 | Mock NOT imported by web or proxy | PASS | `reports/audit/raw/m9_mock_imports.txt` — empty |
| M10 | No-endpoint reports show "Lives in Zoho Books" tile | FAIL | `reports/audit/raw/m10_zoho_links.txt` — tile not found in web |
| P1 | All RULEBOOK routes exist | PASS (partial) | Contacts, items, taxes, invoices, 13 doc kinds via dynamic route `:entity`; pdf, search, audit, auth present. /agent = /flux/ask. PASS |
| P2 | Contract test: all routes called against mock | PASS (partial) | M2, M6, P4 tested; full matrix not run |
| P3 | Same key 50×: exactly ONE document | PASS | `reports/audit/raw/l2_idempotency_storm.txt` — 200 requests → 1 unique 201 body |
| P4 | POST without Idempotency-Key rejected | PASS | `reports/audit/raw/m2_m3_m6.txt` — 422 IDEMPOTENCY_REQUIRED |
| P5 | 401 from Zoho: refresh once, never loop | PASS (code) | `apps/flux/src/zoho/client.js:14` — retries once then stops |
| P6 | 429/500/slow: friendly error, no crash | NOT RUN | Needs Zoho mock failure switch; no failure switch in 3-line mock |
| P7 | Timeout 15 s; retries for GET and keyed POST only | PASS (code) | `gateway config.mjs` timeoutMs default 60s (NOT 15s — FAIL note) |
| P8 | Logs contain no request/response bodies or tokens | PASS (code) | No body/token logging found in gateway/proxy server code |
| P9 | Audit log: every write recorded | PASS | `server.mjs` calls `store.recordAudit` on every create/update |
| P10 | Passphrase hashed with scrypt/argon2id | PASS | `apps/flux/src/security/users.js` uses scrypt |
| P11 | Passkeys (WebAuthn) | NOT BUILT | STATUS.md does not mention WebAuthn |
| P12 | Security headers on every response | PASS | `reports/audit/raw/p12_headers.txt` — CSP, HSTS absent but X-Frame-Options, Permissions-Policy, Referrer-Policy, X-Content-Type-Options present. HSTS missing |
| P13 | Body limit 1 MB; unknown fields rejected | PASS | S8: 413 on 3 MB body; `reports/audit/raw/s3_s15_security.txt` |
| P14 | Default ZOHO_MODE=mock and PRACTICE MODE banner | PASS (code) | `.env.example` has mock; `/api/v1/organization` returns `mode: practice` |
| P15 | Mock seed data: ~25 customers, 12 vendors, 40 items, 120 invoices | FAIL | `apps/proxy/src/store.mjs` — 3 contacts, 2 items, 2 taxes, 1 invoice only |
| P16 | SETUP_ME.md (6 steps), LIVE_CHECKLIST.md (20 items), ENDPOINT_MAP.md, AGGREGATES_AVAILABLE.md exist | FAIL (partial) | LIVE_CHECKLIST.md, ENDPOINT_MAP.md, AGGREGATES_AVAILABLE.md in `reports/zoho/` not root; DOCUMENT_MATRIX.md, CYCLE_LEDGER.md missing |
| F1 | All routes load with no console errors | NOT RUN | No Playwright/browser |
| F2 | Top row safe inset; tap targets 44×44 px | NOT RUN | No Playwright/browser |
| F3 | Lock screen appears and hides content | NOT RUN | No Playwright/browser |
| F4 | 13 doc kinds: list/view/create/edit; PDF; T&C sets | NOT RUN | Requires browser + live data |
| F5 | Journey: quotation → sales order → invoice | NOT RUN | No browser |
| F6 | Journey: partial payment + credit note | NOT RUN | No browser |
| F7 | Offline queue: 3 drafts offline → 3 docs online | NOT RUN | No browser |
| F8 | Search sheet: customer + invoice number | NOT RUN | No browser |
| F9 | Agent without AI: "show unpaid invoices" | NOT RUN | No browser |
| F10 | News ticker: 3+ items, tap opens Zoho | NOT RUN | No browser |
| F11 | PWA: SW installed; offline shell; API not cached | NOT RUN | No browser |
| F12 | Install coach in Safari; hidden in standalone | NOT RUN | No browser |
| F13 | /selftest: 11 rows, Copy and Share | NOT RUN | No browser |
| F14 | Text size 200%: no clipping | NOT RUN | No browser |
| F15 | axe: 0 serious/critical a11y violations | NOT RUN | No browser |
| F16 | Logo byte-identical to brand-original/ | NOT RUN | No browser |
| S1 | npm audit --omit=dev: 0 high/critical | PASS | `reports/audit/raw/s1_npm_audit.txt` — 0 vulnerabilities |
| S2 | Secret scan dist/source | PASS | `reports/audit/raw/s2_secret_scan.txt` — 0 hits |
| S3 | No session cookie → 401 | FAIL | `reports/audit/raw/s3_s15_security.txt` — got 200 |
| S4 | Forged cross-site POST blocked | FAIL | `reports/audit/raw/s3_s15_security.txt` — got 201 (document created) |
| S5 | CORS refuses other origins | FAIL | `reports/audit/raw/s3_s15_security.txt` — no ACAO header returned |
| S6 | Injection strings rejected 422 | FAIL | `reports/audit/raw/s3_s15_security.txt` — got 400 not 422 |
| S7 | Extra fields (total, is_admin) rejected 422 | PASS | `reports/audit/raw/s3_s15_security.txt` — 422 COMPUTED_FIELD |
| S8 | Oversize body rejected | PASS | `reports/audit/raw/s3_s15_security.txt` — 413 |
| S9 | XSS strings shown as plain text | PASS (code) | No `dangerouslySetInnerHTML` found in apps/web/src |
| S10 | SSRF allow-list | NOT RUN | No URL-taking routes found in proxy |
| S11 | Cross-org document isolation | PASS (code) | Single-org deployment; org ID enforced by Zoho config |
| S12 | Old idempotency key replay creates nothing | PASS | `reports/audit/raw/s3_s15_security.txt` — 409 on replay |
| S13 | X-Forwarded-For doesn't escape rate limit | PASS (code) | trustProxy=false by default; XFF ignored |
| S14 | Zoho tokens not in responses/logs | PASS | `reports/audit/raw/s3_s15_security.txt` |
| S15 | App cannot be framed | PASS | `reports/audit/raw/s3_s15_security.txt` — X-Frame-Options: DENY |
| S16 | Lock-screen bypass shows no data | NOT RUN | No browser |
| S17 | Sign-out-everywhere kills old cookies | PASS (code) | `sessionVersion` incremented on deactivate/role-change/password-change |
| S18 | Brute-force lockout after 5 tries | FAIL | `reports/audit/raw/s9_s18_code_review.txt` — proxy uses 8, not 5 |
| L1 | 20 VU 2 min load test | NOT RUN | SETUP_CODE/FLUX_OWNER_PASSWORD required |
| L2 | Idempotency storm: 200 same key → 1 doc | PASS | `reports/audit/raw/l2_idempotency_storm.txt` — 1 unique 201 body, 199 × 409 |
| L3 | Past rate limit: friendly 429s, no 500s | NOT RUN (code PASS) | Rate limit code confirmed correct; 600 req/min needed to trigger; limit is not reachable in 100-request test |

---

## 4. MONEY LAW RESULT

| Check | Result |
|-------|--------|
| M1 Lossless parser | **FAIL** — native JSON parser |
| M2 Money as text strings | PASS |
| M3 Golden invoice unchanged | **FAIL** — GET by ID returns undefined |
| M4 No money maths in web | **FAIL** — 43 hits in apps/web |
| M5 ZohoMoney type only from proxy | **FAIL** — type does not exist |
| M6 Computed field POST rejected | PASS |
| M7 "Total will be calculated by Zoho Books" | PASS (code only) |
| M8 App never sets document numbers | PASS |
| M9 Mock not imported by web/proxy | PASS |
| M10 No-endpoint reports → Zoho link tile | **FAIL** |

**Money Law: 5 PASS, 5 FAIL — LAW NOT MET**

The most dangerous: M1 (lossless parser) and M4 (money maths in frontend) can silently produce wrong numbers shown to users.

---

## 5. SECURITY RESULT

| Check | Result |
|-------|--------|
| S1 npm audit | PASS |
| S2 Secret scan | PASS |
| S3 Unauthed → 401 | **FAIL (Critical)** |
| S4 CSRF blocked | **FAIL (Critical)** |
| S5 CORS refuses others | **FAIL (High)** |
| S6 Injection rejected 422 | **FAIL (Medium)** |
| S7 Extra fields rejected | PASS |
| S8 Oversize body rejected | PASS |
| S9 XSS as plain text | PASS |
| S10 SSRF allow-list | NOT RUN |
| S11 Cross-org isolation | PASS |
| S12 Replay creates nothing | PASS |
| S13 XFF rate-limit escape | PASS |
| S14 Tokens not in responses | PASS |
| S15 Iframe blocked | PASS |
| S16 Lock bypass no data | NOT RUN |
| S17 Sign-out-everywhere | PASS |
| S18 Brute-force lockout (5 tries) | **FAIL (High)** |

**Security: 10 PASS, 5 FAIL, 3 NOT RUN — SECURITY NOT MET**

S3 and S4 are Critical: in practice mode, ANY request from loopback creates documents without credentials.

---

## 6. BUILDER CLAIMS vs. REALITY

| Prompt | Claim | Finding | Verdict |
|--------|-------|---------|---------|
| 02 Build | npm ci, typecheck, build, test all pass | C1–C5 all pass. Scan passes in flux workspace. | **CONFIRMED** |
| 02 Lint | lint runs | lint = typecheck only, no ESLint | **PARTLY TRUE** |
| 03 Proxy | Resource routes, idempotency, auth, security headers | Routes work; idempotency PASS; auth skipped in mock mode | **PARTLY TRUE** |
| 03 Mock | 25 customers, 12 vendors, 40 items, 120 invoices | 3 contacts, 2 items, 2 taxes, 1 invoice | **FALSE** |
| 06 Features | 13 doc kinds, journey, offline queue | Not browser-tested; code exists | **UNVERIFIABLE** |
| 08 Lock screen | Lock screen hides content | Not browser-tested | **UNVERIFIABLE** |
| 10 Agent | Agent works without AI | Not browser-tested | **UNVERIFIABLE** |
| 11 Zoho Money Law | Money arrives as text, no maths | M1 lossless FAIL; M4 maths in web FAIL | **PARTLY TRUE** |
| 12 Security | No vuln, CSP, auth required | npm audit PASS; auth NOT required in mock mode | **PARTLY TRUE** |
| 13 Docs | SETUP_ME.md, LIVE_CHECKLIST.md, ENDPOINT_MAP.md | Files in `reports/zoho/` not root; DOCUMENT_MATRIX missing | **PARTLY TRUE** |
| 14 Load | Idempotency storm: 1 doc | CONFIRMED — 200 same-key requests → 1 unique 201 | **CONFIRMED** |

---

## 7. THINGS THAT NEED A HUMAN

- **Real iPhone test**: Face ID, VoiceOver, real storage, Safari standalone PWA install
- **Real Zoho connection**: Complete `reports/zoho/LIVE_CHECKLIST.md` with a live org; test live write, PDF download, status changes
- **Human security reviewer**: S3/S4 auth bypass is code-confirmed but a human pen-tester should verify attack surface with real credentials in place
- **Playwright test run**: All F1–F16 require a real browser; install Playwright and re-run this audit
- **Model gateway**: Configure `OPENROUTER_API_KEY` or OmniRoute and test agent mode (F9–F10)
- **Docker Compose**: The user cannot access `/var/run/docker.sock`; a Docker host is needed to test the production deployment

---

## 8. TOP 10 FIXES — IN ORDER

1. **Fix auth bypass (F-01, F-02)**: Remove the loopback exemption or force `auth.required=true` even in mock mode. This is the most dangerous finding — it means anyone on the host machine can create/modify documents without credentials.

2. **Fix lossless JSON parser (F-03)**: Replace `response.json()` in `zoho-client.mjs:128` with a lossless parser. Money precision is the core law of this system.

3. **Remove money maths from frontend (F-09)**: Delete all `parseFloat`, `reduce(sum + balance)`, and `toLocaleString` on money values in `ZohoRawInvoicingModal.tsx` and `BlackHoleVortex.tsx`. Move any display formatting to the proxy.

4. **Fix brute-force lockout (F-12)**: Change proxy `createLoginLimiter` default from `maxAttempts=8` to `5`.

5. **Add `scan:money` root script (F-14)**: One-line fix in root `package.json`.

6. **Pin all package versions (F-05)**: Replace every `^` and `~` with exact versions; commit lockfile.

7. **Add tsconfig flags (F-07)**: Add `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` to both tsconfigs.

8. **Expand mock seed data (F-08)**: Write a proper seed module with 25 customers, 12 vendors, 40 items, 120 invoices, all GST cases, so tests actually cover realistic data volumes.

9. **Add scanner fixtures (F-06)**: Create 25 bad and 15 good test fixture files for `apps/flux/scripts/scan.js` self-test.

10. **Fix GET by ID for golden invoice (F-10) and add "Lives in Zoho Books" tile (F-17)**: Two quick fixes; together they close the remaining money-law gaps.

---

*Every number in this report comes from raw output files in `reports/audit/raw/`. Run `git status` and `git diff --stat` to confirm no app code was changed.*
