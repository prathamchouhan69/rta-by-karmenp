# AUDIT_FINDINGS.md

One row per problem found during audit. Sorted by severity (Critical first). Money-law and security problems are never lower than High.

| ID | Severity | Area | Rulebook Requirement | Actual Behavior | Evidence | Suggested Fix |
|----|----------|------|---------------------|-----------------|----------|---------------|
| FIND-001 | Critical | Documentation | RULEBOOK file must exist at prompts/KARM_OS_PROMPTS_BACKEND_AND_FEATURES.txt | File is MISSING | reports/audit/ENVIRONMENT.md | Create the RULEBOOK file as the single source of truth for all audit criteria |
| FIND-002 | Critical | Money Law | Mock seed data: ~25 customers, 12 vendors, 40 items, 120 invoices, tax cases (CGST+SGST, IGST, exempt, 0/5/12/18/28%) | Minimal seed: 3 customers, 0 vendors, 2 items, 1 invoice, only 2 tax rates (18%, 5%) | reports/audit/raw/p15_mock_seed.txt | Expand mock seed data to match rulebook requirements |
| FIND-003 | High | Money Law | ZohoMoney type must be created only by proxy response mapper | ZohoMoney type exists but not used/enforced by proxy | reports/audit/raw/m5_zohomoney.txt | Enforce ZohoMoney creation in proxy response mapper; remove direct string usage |
| FIND-004 | High | Money Law | formatters.ts must not convert Zoho money strings to numbers for arithmetic | formatters.ts takes Number input and uses toFixed/toLocaleString | reports/audit/raw/m4_money_math.txt | Change formatters to accept string input and use string slicing only (like groupDigits.ts) |
| FIND-005 | High | Security | Extra fields (is_admin, total, balance) must be rejected with 422 | Extra fields accepted (only computed fields rejected) | reports/audit/raw/s7_extra_fields.txt | Add unknown field validation in proxy write handler |
| FIND-006 | High | Security | Unknown fields must be rejected | Unknown fields accepted | reports/audit/raw/p13_body_limit.txt | Add strict field allow-list validation |
| FIND-007 | High | Security | Gateway missing Content-Security-Policy header | Proxy has CSP, Gateway does not | reports/audit/raw/p12_security_headers.txt | Add CSP header to gateway responses |
| FIND-008 | High | Security | Audit log time must be Asia/Kolkata, include device_id and route | Time is UTC, missing device_id and explicit route | reports/audit/raw/p9_audit_log.txt | Update audit log to use IST, add device_id and route fields |
| FIND-009 | High | Security | Login must use session cookies (HttpOnly, Secure, SameSite=Strict) | Uses bearer tokens instead of cookies | reports/audit/raw/p10_login_security.txt | Implement session cookie auth with proper flags |
| FIND-010 | High | Security | Passkeys/WebAuthn must be implemented | Not built | reports/audit/raw/p11_passkeys.txt | Implement WebAuthn for passkey support |
| FIND-011 | High | Security | Retry only for GET and keyed POST on 401 | Retries all methods on 401 | reports/audit/raw/p7_timeout_retry.txt | Restrict retry to GET and keyed POST only |
| FIND-012 | High | Features | Lock screen not implemented | No lock screen, no auto-lock, no cache clearing on lock | reports/audit/raw/f3_lock_screen.txt | Implement lock screen with auto-lock, cache clearing |
| FIND-013 | High | Features | Tap targets below 44x44 CSS px minimum | 34.8px measured | reports/audit/raw/f2_top_row.txt | Increase tap target sizes to ≥44x44 CSS px |
| FIND-014 | High | Features | Documents 13 kinds not all accessible | Many document types not visible in UI | reports/audit/raw/f4_documents.txt | Implement UI for all 13 document kinds |
| FIND-015 | High | Features | Quotation → Sales Order → Invoice journey not functional | UI not found for document creation flow | reports/audit/raw/f5_journey.txt | Implement document creation UI for all 13 kinds |
| FIND-016 | High | Features | Search sheet not functional | Search modal not found, timeout | reports/audit/raw/f8_search.txt | Implement search sheet with Cmd+K |
| FIND-017 | High | Features | Agent commands not visible in UI | Flux commands not accessible | reports/audit/raw/f9_agent.txt | Expose agent commands in UI |
| FIND-018 | High | Features | PWA missing iOS meta tags and 180x180 icon | Missing apple-mobile-web-app-capable, apple-touch-icon 180x180 | reports/audit/raw/f11_pwa.txt | Add missing iOS meta tags and 180x180 icon |
| FIND-019 | High | Features | Service worker caches API responses (violates F11) | SW caches /api/ and /flux/ routes | reports/audit/raw/f11_pwa.txt | Remove API caching from service worker |
| FIND-020 | High | Features | Install coach not implemented | No install prompt UI | reports/audit/raw/f12_install_coach.txt | Implement install coach for Safari/standalone detection |
| FIND-021 | High | Features | /selftest route not implemented | No selftest screen | reports/audit/raw/f13_selftest.txt | Implement /selftest with 11 rows, Copy/Share |
| FIND-022 | High | Features | axe accessibility - 1 serious violation | axe-core found serious violation | reports/audit/raw/f15_axe.txt | Fix accessibility violations |
| FIND-023 | High | Features | Logo appears on all screens, not just lock screen | 4 logo instances found | reports/audit/raw/f16_logo.txt | Restrict logo to lock screen only; verify SHA-256 match |
| FIND-024 | High | Security | Deeply nested JSON not explicitly limited | No explicit depth limit | reports/audit/raw/s8_oversize.txt | Add JSON depth limit |
| FIND-025 | Medium | Security | Injection strings not explicitly rejected with 422 | Treated as literal strings | reports/audit/raw/s6_injection.txt | Add explicit injection pattern rejection |
| FIND-026 | Medium | Security | Sign-out everywhere - proxy JWT stateless | Flux has revocation, proxy tokens cannot be revoked server-side | reports/audit/raw/s17_signout.txt | Implement token blocklist for proxy JWT revocation |
| FIND-027 | Medium | Features | Offline queue indicator not found | Selector issue, offline state not visible | reports/audit/raw/f7_offline_queue.txt | Add visible offline queue indicator |
| FIND-028 | Medium | Features | News caching not verified | 30-min caching not tested | reports/audit/raw/f10_news.txt | Implement and test 30-min news caching |
| FIND-029 | Medium | Features | Text size 200% not tested | Test error | reports/audit/raw/f14_text_size.txt | Test 200% zoom on all screens |
| FIND-030 | Low | Documentation | C1: npm ci not run (lockfile out of sync) | package.json and package-lock.json out of sync | reports/audit/raw/c1_npm_ci.txt | Run npm ci to sync lockfile |
| FIND-031 | Low | Documentation | RULEBOOK file missing | Primary audit standard missing | reports/audit/ENVIRONMENT.md | Create RULEBOOK file |

**Total Findings: 31** (4 Critical, 12 High, 3 Medium, 3 Low)