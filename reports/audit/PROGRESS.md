# Audit Progress Tracker

## STEP 1 - LOOK AROUND
- [x] Environment checks run and saved to reports/audit/ENVIRONMENT.md
- [x] Folder tree listed
- [x] Required paths checked
- [x] STATUS.md, BUGS.md, DECISIONS.md read
- [x] Builder claims documented
- [x] **CRITICAL FINDING**: RULEBOOK (prompts/KARM_OS_PROMPTS_BACKEND_AND_FEATURES.txt) is MISSING

## STEP 2 - BUILD AND STATIC CHECKS
- [x] C1: npm ci - NOT RUN (lockfile out of sync)
- [x] C2: npm run typecheck - PASS
- [x] C3: npm run lint - PASS (runs typecheck, no separate linter)
- [x] C4: npm run build - PASS
- [x] C5: npm run test - PASS (184 tests, 0 fail)
- [x] C6: npm run scan:money - PASS (75 source files, 93 files checked, 0 problems)
- [x] C7: Scanner self-test - PASS (25/25 bad fixtures caught, 15/15 good fixtures passed)
- [x] C8: tsconfig strictness - PASS (strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes)
- [x] C9: Version pinning - PASS (all project package.json have exact versions)
- [x] C10: TODO/FIXME/lorem grep - PASS (none in source, only in test fixtures)
- [x] C11: Hard-coded secrets grep - PASS (none in source, only in test fixtures)
- [x] C12: .gitignore check - PASS
- [x] C13: .env.example fake values - PASS
- [x] C14: npm run dev smoke test - PASS (servers running and responding)

## STEP 3 - THE LAW OF MONEY
- [x] M1: Lossless JSON parser location - PASS (zoho-client.mjs:13-17)
- [x] M2: Money fields as exact text via curl - PASS ("64944.84", "100.00")
- [x] M3: Golden invoice INV-KE-270031 - PASS (raw "64944.84", formatted "₹64,944.84")
- [x] M4: Money math grep in web/shared - PARTLY TRUE (formatters.ts takes number input - potential violation if Zoho string converted to number)
- [x] M5: ZohoMoney type creation location - PARTLY TRUE (type exists but not used/enforced by proxy)
- [x] M6: POST with money fields rejected 422 - PASS (COMPUTED_FIELD error)
- [x] M7: "Total will be calculated by Zoho Books" visible - PASS (ZohoRawInvoicingModal.tsx:234)
- [x] M8: App never chooses document numbers - PASS (from Zoho/mock only)
- [x] M9: Mock not imported by web/proxy - PASS
- [x] M10: "Lives in Zoho Books" tiles - PASS (LivesInZohoBooksTile.tsx)

## STEP 4 - PROXY AND MOCK
- [x] P1: Route existence table - PASS (17 entities + additional routes)
- [x] P2: Contract test all routes - PASS (all routes return expected responses)
- [x] P3: Idempotency tests - PASS (same key = same doc, different keys = different docs)
- [x] P4: POST without Idempotency-Key rejected - PASS (422 IDEMPOTENCY_REQUIRED)
- [x] P5: 401 refresh once retry once - PASS (zoho-client.mjs retries once on 401)
- [x] P6: 429/500/slow reply handling - PASS (friendly errors, no crash, no duplicate)
- [x] P7: Timeout 15s; retries only GET/keyed POST - PARTLY TRUE (30s timeout, retries all methods on 401)
- [x] P8: Logs no bodies/tokens - PASS
- [x] P9: Audit log records writes - PARTLY TRUE (UTC not Asia/Kolkata, missing device_id/route)
- [x] P10: Login security - PARTLY TRUE (scrypt ✓, bearer tokens not cookies, lockout ✓, CSRF via Idempotency-Key)
- [x] P11: Passkeys/WebAuthn - NOT BUILT
- [x] P12: Security headers - PARTLY TRUE (Proxy has all, Gateway missing CSP)
- [x] P13: Body limit 1MB, unknown fields rejected, no stack traces - PARTLY TRUE (limits ✓, no stack traces ✓, unknown fields NOT rejected)
- [x] P14: Default ZOHO_MODE=mock, PRACTICE MODE banner - PASS
- [x] P15: Mock seed data - FAIL (minimal seed: 3 customers, 0 vendors, 2 items, 1 invoice vs required 25/12/40/120)
- [x] P16: Required docs exist and not empty - PASS

## STEP 5 - FEATURES (Playwright tested on iPhone 16 Pro: 402x874, touch, en-IN, Asia/Kolkata)
- [x] F1: All routes load with no console errors - PASS
- [x] F2: Top row layout and tap targets - FAIL (34.8px vs 44px required)
- [x] F3: Lock screen behavior - FAIL (not implemented)
- [x] F4: Documents 13 kinds, PDF, T&C - FAIL (not all visible)
- [x] F5: Quotation -> Sales Order -> Invoice journey - FAIL (UI not found)
- [x] F6: Partial payment and credit note - PARTLY TRUE (UI exists)
- [x] F7: Offline queue - FAIL (selector issue, offline indicator not found)
- [x] F8: Search sheet - FAIL (timeout, search modal not found)
- [x] F9: Agent commands without AI - FAIL (commands not visible)
- [x] F10: News caching and offline message - PARTLY TRUE
- [x] F11: PWA manifest, icons, iOS meta, offline shell, no API caching - FAIL
- [x] F12: Install coach - FAIL (not found)
- [x] F13: /selftest 11 rows, Copy/Share - NOT RUN (route not found)
- [x] F14: Text size 200% - NOT RUN (test error)
- [x] F15: axe accessibility - FAIL (1 serious violation)
- [x] F16: Logo on lock screen only, SHA-256 match - FAIL (4 logos found, should be 0)

## STEP 6 - SECURITY (tested via curl and existing test suite)
- [x] S1: npm audit high/critical - PASS (0 vulnerabilities)
- [x] S2: Secret scan - PASS (0 secrets in source, dist, source maps, logs)
- [x] S3: No session cookie -> 401 - PASS (protected routes return 401 without auth)
- [x] S4: Forged CSRF blocked - PASS (Idempotency-Key required for writes)
- [x] S5: CORS no wildcard with credentials - PASS (only configured origin allowed)
- [x] S6: Injection strings rejected 422 - PARTLY TRUE (input validation prevents injection, but no explicit 422 for injection strings)
- [x] S7: Extra fields rejected 422 - FAIL (extra fields like is_admin are accepted)
- [x] S8: Oversize/wrong content-type/deep JSON rejected - PARTLY TRUE (oversize and wrong content-type rejected, deep JSON not explicitly limited)
- [x] S9: XSS strings as plain text - PASS (React auto-escapes, no dangerouslySetInnerHTML)
- [x] S10: SSRF allow-list only - PASS (allow-lists for Zoho and Flux, localhost/metadata blocked)
- [x] S11: Document IDs org-scoped - PASS (single owner, single org)
- [x] S12: Old idempotency key replay - PASS (returns existing or rejects on fingerprint mismatch)
- [x] S13: X-Forwarded-For rate limit - PASS (validated as IP before use)
- [x] S14: Zoho tokens nowhere - PASS (tokens not in responses, logs, localStorage, IndexedDB, SW cache)
- [x] S15: No iframe - PASS (CSP frame-ancestors 'none', X-Frame-Options: DENY)
- [x] S16: Lock screen bypass - FAIL (no lock screen implemented)
- [x] S17: Sign-out everywhere - PARTLY TRUE (Flux has session revocation, proxy JWT stateless)
- [x] S18: Brute force lockout - PASS (5 attempts, 1 min window)

## STEP 7 - LOAD
- [ ] L1: 20 VU for 2 min
- [ ] L2: Idempotency storm 200 requests
- [ ] L3: Rate limit push

## STEP 8 - COMPARE WITH BUILDER CLAIMS
- [ ] Compare STATUS.md claims with findings
- [ ] Verify raw output files exist
- [ ] Spot-check 3 by re-running
- [ ] Check reports/cycles/ and CYCLE_LEDGER.md

## STEP 9 - WRITE REPORTS
- [ ] AUDIT_FINDINGS.md
- [ ] AUDIT_REPORT.md
- [ ] Final verification (git status clean, all checks have results)

## Final Verification
- [ ] git status clean (only AUDIT_*.md and reports/audit/)
- [ ] Every check has PASS/FAIL/NOT RUN with evidence
- [ ] AUDIT_REPORT.md and AUDIT_FINDINGS.md exist, no secrets
- [ ] PROGRESS.md complete
- [ ] 10-line summary printed