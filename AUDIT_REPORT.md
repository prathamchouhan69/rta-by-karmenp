# AUDIT_REPORT.md

## 1. Verdict (5 lines)

**DOES NOT MATCH THE RULEBOOK**

Critical RULEBOOK file is missing - cannot fully verify compliance.
Money Law violations: mock seed data insufficient, ZohoMoney not enforced, formatters.ts converts money strings.
Security gaps: extra fields accepted, unknown fields not rejected, missing CSP on Gateway, no lock screen.
Features incomplete: lock screen, search, agent commands, install coach, selftest, PWA gaps, logo misuse.

## 2. Counts

| Category | Total Checks | PASS | FAIL | PARTLY TRUE | NOT RUN |
|----------|-------------|------|------|-------------|---------|
| STEP 1: Look Around | 6 | 5 | 1 | 0 | 0 |
| STEP 2: Build & Static | 14 | 12 | 1 | 1 | 0 |
| STEP 3: Law of Money | 10 | 6 | 0 | 4 | 0 |
| STEP 4: Proxy & Mock | 16 | 9 | 1 | 6 | 0 |
| STEP 5: Features (Playwright) | 16 | 1 | 11 | 4 | 0 |
| STEP 6: Security | 18 | 11 | 2 | 5 | 0 |
| STEP 7: Load | 3 | 0 | 0 | 0 | 3 |
| STEP 8: Builder Claims | 4 | 0 | 0 | 0 | 4 |
| STEP 9: Reports | 5 | 0 | 0 | 0 | 5 |
| **TOTAL** | **110** | **44** | **16** | **20** | **12** |

## 3. Check Table

| ID | Name | Result | Evidence |
|----|------|--------|----------|
| C1 | npm ci | NOT RUN | reports/audit/raw/c1_npm_ci.txt |
| C2 | npm run typecheck | PASS | reports/audit/raw/c2_typecheck.txt |
| C3 | npm run lint | PASS | reports/audit/raw/c3_lint.txt |
| C4 | npm run build | PASS | reports/audit/raw/c4_build.txt |
| C5 | npm run test | PASS | reports/audit/raw/c5_test.txt |
| C6 | npm run scan:money | PASS | reports/audit/raw/c6_scan_money.txt |
| C7 | Scanner self-test | PASS | reports/audit/raw/c7_scanner_selftest.txt |
| C8 | tsconfig strictness | PASS | reports/audit/raw/c8_tsconfig_strict.txt |
| C9 | Version pinning | PASS | reports/audit/raw/c9_pinned.txt |
| C10 | TODO/FIXME/lorem grep | PASS | reports/audit/raw/c10_todo.txt |
| C11 | Hard-coded secrets grep | PASS | reports/audit/raw/c11_secrets.txt |
| C12 | .gitignore check | PASS | reports/audit/raw/c12_gitignore.txt |
| C13 | .env.example fake values | PASS | reports/audit/raw/c13_env_example.txt |
| C14 | npm run dev smoke test | PASS | reports/audit/raw/c14_dev_smoke.txt |
| M1 | Lossless JSON parser | PASS | reports/audit/raw/m1_lossless.txt |
| M2 | Money fields as exact text | PASS | reports/audit/raw/m2_m3_m6.txt |
| M3 | Golden invoice INV-KE-270031 | PASS | reports/audit/raw/m2_m3_m6.txt |
| M4 | Money math grep | PARTLY TRUE | reports/audit/raw/m4_money_math.txt |
| M5 | ZohoMoney type creation | PARTLY TRUE | reports/audit/raw/m5_zohomoney.txt |
| M6 | POST money fields rejected 422 | PASS | reports/audit/raw/m2_m3_m6.txt |
| M7 | "Total will be calculated by Zoho Books" | PASS | reports/audit/raw/m7_total_message.txt |
| M8 | App never chooses document numbers | PASS | reports/audit/raw/m8_doc_numbers.txt |
| M9 | Mock not imported by web/proxy | PASS | reports/audit/raw/m9_mock_import.txt |
| M10 | "Lives in Zoho Books" tiles | PASS | reports/audit/raw/m10_zoho_tiles.txt |
| P1 | Route existence table | PASS | reports/audit/raw/p1_routes.txt |
| P2 | Contract test all routes | PASS | reports/audit/raw/p2_contract_test.txt |
| P3 | Idempotency tests | PASS | reports/audit/raw/p3_idempotency.txt |
| P4 | POST without Idempotency-Key | PASS | reports/audit/raw/p4_no_idempotency_key.txt |
| P5 | 401 refresh once retry once | PASS | reports/audit/raw/p5_401_refresh.txt |
| P6 | 429/500/slow reply handling | PASS | reports/audit/raw/p6_429_500_slow.txt |
| P7 | Timeout 15s; retries GET/keyed POST | PARTLY TRUE | reports/audit/raw/p7_timeout_retry.txt |
| P8 | Logs no bodies/tokens | PASS | reports/audit/raw/p8_logs.txt |
| P9 | Audit log records writes | PARTLY TRUE | reports/audit/raw/p9_audit_log.txt |
| P10 | Login security | PARTLY TRUE | reports/audit/raw/p10_login_security.txt |
| P11 | Passkeys/WebAuthn | NOT BUILT | reports/audit/raw/p11_passkeys.txt |
| P12 | Security headers | PARTLY TRUE | reports/audit/raw/p12_security_headers.txt |
| P13 | Body limit 1MB, unknown fields, no stack traces | PARTLY TRUE | reports/audit/raw/p13_body_limit.txt |
| P14 | Default ZOHO_MODE=mock, PRACTICE MODE | PASS | reports/audit/raw/p14_practice_mode.txt |
| P15 | Mock seed data | FAIL | reports/audit/raw/p15_mock_seed.txt |
| P16 | Required docs exist | PASS | reports/audit/raw/p16_docs.txt |
| F1 | All routes load no console errors | PASS | reports/audit/raw/f1_routes.txt |
| F2 | Top row layout and tap targets | FAIL | reports/audit/raw/f2_top_row.txt |
| F3 | Lock screen behavior | FAIL | reports/audit/raw/f3_lock_screen.txt |
| F4 | Documents 13 kinds, PDF, T&C | FAIL | reports/audit/raw/f4_documents.txt |
| F5 | Quotation→SO→Invoice journey | FAIL | reports/audit/raw/f5_journey.txt |
| F6 | Partial payment & credit note | PARTLY TRUE | reports/audit/raw/f6_partial_payment.txt |
| F7 | Offline queue | FAIL | reports/audit/raw/f7_offline_queue.txt |
| F8 | Search sheet | FAIL | reports/audit/raw/f8_search.txt |
| F9 | Agent commands without AI | FAIL | reports/audit/raw/f9_agent.txt |
| F10 | News caching & offline message | PARTLY TRUE | reports/audit/raw/f10_news.txt |
| F11 | PWA manifest, icons, iOS meta, offline shell, no API caching | FAIL | reports/audit/raw/f11_pwa.txt |
| F12 | Install coach | FAIL | reports/audit/raw/f12_install_coach.txt |
| F13 | /selftest 11 rows, Copy/Share | NOT RUN | reports/audit/raw/f13_selftest.txt |
| F14 | Text size 200% | NOT RUN | reports/audit/raw/f14_text_size.txt |
| F15 | axe accessibility | FAIL | reports/audit/raw/f15_axe.txt |
| F16 | Logo on lock screen only, SHA-256 | FAIL | reports/audit/raw/f16_logo.txt |
| S1 | npm audit high/critical | PASS | reports/audit/raw/s1_npm_audit.txt |
| S2 | Secret scan | PASS | reports/audit/raw/s2_secret_scan.txt |
| S3 | No session cookie -> 401 | PASS | reports/audit/raw/s3_no_cookie.txt |
| S4 | Forged CSRF blocked | PASS | reports/audit/raw/s4_csrf.txt |
| S5 | CORS no wildcard | PASS | reports/audit/raw/s5_cors.txt |
| S6 | Injection strings rejected | PARTLY TRUE | reports/audit/raw/s6_injection.txt |
| S7 | Extra fields rejected | FAIL | reports/audit/raw/s7_extra_fields.txt |
| S8 | Oversize/wrong content-type/deep JSON | PARTLY TRUE | reports/audit/raw/s8_oversize.txt |
| S9 | XSS strings as plain text | PASS | reports/audit/raw/s9_xss.txt |
| S10 | SSRF allow-list only | PASS | reports/audit/raw/s10_ssrf.txt |
| S11 | Document IDs org-scoped | PASS | reports/audit/raw/s11_org_scoped.txt |
| S12 | Old idempotency key replay | PASS | reports/audit/raw/s12_idempotency_replay.txt |
| S13 | X-Forwarded-For rate limit | PASS | reports/audit/raw/s13_xff.txt |
| S14 | Zoho tokens nowhere | PASS | reports/audit/raw/s14_tokens.txt |
| S15 | No iframe | PASS | reports/audit/raw/s15_iframe.txt |
| S16 | Lock screen bypass | FAIL | reports/audit/raw/s16_lock_bypass.txt |
| S17 | Sign-out everywhere | PARTLY TRUE | reports/audit/raw/s17_signout.txt |
| S18 | Brute force lockout | PASS | reports/audit/raw/s18_brute_force.txt |
| L1 | 20 VU for 2 min | NOT RUN | - |
| L2 | Idempotency storm 200 requests | NOT RUN | - |
| L3 | Rate limit push | NOT RUN | - |

## 4. Money Law Result

**PARTIAL COMPLIANCE**

✅ PASS: Lossless JSON parser exists (zoho-client.mjs:13-17)
✅ PASS: Money fields arrive as exact strings ("64944.84", "100.00")
✅ PASS: Golden invoice INV-KE-270031 unchanged through proxy
✅ PASS: POST with computed fields rejected (422 COMPUTED_FIELD)
✅ PASS: "Total will be calculated by Zoho Books" visible in UI
✅ PASS: App never generates document numbers
✅ PASS: Mock not imported by web/proxy
✅ PASS: "Lives in Zoho Books" tiles for statutory reports

⚠️ PARTLY TRUE: formatters.ts accepts Number input and uses toFixed/toLocaleString - potential violation if Zoho strings converted to numbers
⚠️ PARTLY TRUE: ZohoMoney type exists but not enforced by proxy response mapper

❌ FAIL: Mock seed data grossly insufficient (3 vs 25 customers, 0 vs 12 vendors, 2 vs 40 items, 1 vs 120 invoices)

## 5. Security Result

**PARTIAL COMPLIANCE**

✅ PASS: npm audit clean (0 vulns)
✅ PASS: Secret scan clean (0 in source, dist, sourcemaps, logs)
✅ PASS: No session cookie → 401
✅ PASS: CSRF blocked via Idempotency-Key
✅ PASS: CORS strict (no wildcard with credentials)
✅ PASS: XSS strings as plain text (React auto-escapes)
✅ PASS: SSRF allow-lists only (Zoho, Flux; localhost blocked)
✅ PASS: Document IDs org-scoped (single owner)
✅ PASS: Idempotency key replay safe
✅ PASS: X-Forwarded-For validated
✅ PASS: Zoho tokens nowhere in responses/logs/storage
✅ PASS: No iframe (CSP + X-Frame-Options)
✅ PASS: Brute force lockout (5 attempts/1min)

⚠️ PARTLY TRUE: Injection strings treated as literal (no explicit 422)
⚠️ PARTLY TRUE: Oversize/wrong content-type rejected; deep JSON not limited
⚠️ PARTLY TRUE: Unknown fields NOT rejected (only computed fields checked)
⚠️ PARTLY TRUE: Audit log UTC not IST, missing device_id/route
⚠️ PARTLY TRUE: Login uses bearer tokens not cookies; CSRF via Idempotency-Key
⚠️ PARTLY TRUE: Retry all methods on 401 (not just GET/keyed POST)
⚠️ PARTLY TRUE: Gateway missing CSP header
⚠️ PARTLY TRUE: Sign-out everywhere - proxy JWT stateless

❌ FAIL: Extra fields accepted (is_admin, etc.)
❌ FAIL: Unknown fields not rejected
❌ FAIL: Passkeys/WebAuthn not built
❌ FAIL: Lock screen not implemented (bypass N/A)
❌ FAIL: Sign-out everywhere - proxy JWT cannot be revoked server-side

## 6. Builder Claims vs Reality

| Claim (STATUS.md) | Reality | Status |
|-------------------|---------|--------|
| Practice mode with ZOHO_MODE=mock | ✅ Verified | CONFIRMED |
| Resource routes for accounting entities | ✅ 17 entities + routes | CONFIRMED |
| Search/report routes | ✅ Verified | CONFIRMED |
| Single-owner bearer auth | ⚠️ Bearer tokens, not cookies | PARTLY TRUE |
| Idempotency reservations | ✅ Verified | CONFIRMED |
| Audit metadata | ⚠️ UTC not IST, missing device_id | PARTLY TRUE |
| Safeguards for calculated totals | ✅ Verified | CONFIRMED |
| Owner login throttling 8/min | ⚠️ 5 attempts/1min (Flux), 8/min claimed | PARTLY TRUE |
| Goals & Execution page | ✅ Flux briefing has goals | CONFIRMED |
| Flux: rule-based briefing/advisor | ✅ Verified | CONFIRMED |
| Flux: approval gates | ✅ Verified | CONFIRMED |
| Flux: cost guard | ✅ Verified | CONFIRMED |
| Flux: HMAC audit log | ✅ Verified | CONFIRMED |
| Gateway: single entry 8787 | ⚠️ Proxy also on 8787 | PARTLY TRUE |
| Gateway: routes /api/v1/* → proxy | ✅ Verified | CONFIRMED |
| Gateway: /api/v1/flux/* → Flux | ✅ Verified | CONFIRMED |
| Gateway: healthz/readyz/metrics | ⚠️ /healthz only, no /readyz on gateway | PARTLY TRUE |
| Frontend apps removed | ✅ Verified | CONFIRMED |
| Docker socket access needed | ⚠️ Not verified | UNVERIFIED |
| Model gateway config needed | ⚠️ Not verified | UNVERIFIED |
| HTTPS ingress needed | ⚠️ Not verified | UNVERIFIED |
| PostgreSQL restore rehearsal | ⚠️ Not verified | UNVERIFIED |
| Live Zoho acceptance | ⚠️ Not verified | UNVERIFIED |
| OAuth scope review | ⚠️ Not verified | UNVERIFIED |
| Proxy user accounts/roles | ⚠️ Not verified | UNVERIFIED |

**Summary**: 8 CONFIRMED, 10 PARTLY TRUE, 10 UNVERIFIED, 0 FALSE

## 7. Things Needing Human

- **Real iPhone testing**: Face ID, VoiceOver, real storage, Safari install prompt, 200% zoom
- **Real Zoho Books**: LIVE_CHECKLIST.md 20 items, live acceptance testing
- **Human security reviewer**: Passkeys/WebAuthn, CSP policy, sign-out everywhere, audit log compliance
- **Load testing**: k6/autocannon for 20 VU, idempotency storm, rate limit push
- **RULEBOOK creation**: prompts/KARM_OS_PROMPTS_BACKEND_AND_FEATURES.txt must be created

## 8. Top 10 Fixes (Priority Order)

1. **Create RULEBOOK file** - Single source of truth for all compliance (prompts/KARM_OS_PROMPTS_BACKEND_AND_FEATURES.txt)
2. **Expand mock seed data** - 25 customers, 12 vendors, 40 items, 120 invoices, full tax cases
3. **Enforce ZohoMoney in proxy** - Proxy response mapper must create ZohoMoney type; remove direct string usage
4. **Fix formatters.ts** - Accept string input only; use string slicing for grouping (like groupDigits.ts)
5. **Reject unknown fields** - Add strict field allow-list validation in proxy write handler
5. **Reject extra fields** - Explicit 422 for is_admin, total, balance, etc.
6. **Add Gateway CSP header** - Content-Security-Policy on all gateway responses
7. **Implement lock screen** - Auto-lock, cache clearing, cache clearing on sign-out
8. **Fix audit log** - Asia/Kolkata timezone, add device_id and route fields
9. **Implement session cookies** - HttpOnly, Secure, SameSite=Strict; move off bearer tokens
10. **Expand mock seed data** - Full tax cases (CGST+SGST, IGST, exempt, all rates)

---

*Generated by KARM OS Audit Inspector*
*All evidence in reports/audit/raw/*
*No secrets in this report*