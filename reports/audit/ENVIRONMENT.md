# Environment Check - STEP 1

## Tool Versions
```
node -v: v26.13.0
npm -v: 11.20.0
git --version: git version 2.53.0
git log --oneline -n 15:
6c82b37 chore: clean stale archives and dev artifacts
3c1679e refactor: remove frontend applications and UI assets
89aa62b chore: sync latest local changes
45124da feat: full automation - monitoring, HA, backup/DR, security, admin CLI, feature flags, canary deploy
75546d9 Update: flux modules, gateway, web frontend scaffold, design refs, prompts
95e1106 Harden production deployment and optimize web loading
754e2ed Publish RTA by Karmenp
9ac148f Initial commit

git status --short:
 M apps/proxy/package.json
 M apps/proxy/src/auth-server.test.mjs
 M apps/proxy/src/auth.mjs
 M apps/proxy/src/server.mjs
 M apps/proxy/src/zoho-client.mjs
 M apps/proxy/tsconfig.json
 M package-lock.json
 M package.json
?? AGGREGATES_AVAILABLE.md
?? AUDIT_FINDINGS.md
?? AUDIT_REPORT.md
?? CYCLE_LEDGER.md
?? DOCUMENT_MATRIX.md
?? ENDPOINT_MAP.md
?? LIVE_CHECKLIST.md
?? apps/web/
?? packages/
?? reports/audit/
?? reports/cycles/
?? tsconfig.json
```

## System Info
```
uname -a: Linux WORKS 7.0.0-43-generic #43-Ubuntu SMP PREEMPT_DYNAMIC Fri Oct 23 13:25:25 UTC 2026 x86_64 GNU/Linux
python3 --version: Python 3.14.4
docker --version: Docker version 29.9.3, build 5457199
```

## Folder Tree (2 levels, skipping node_modules and .git)
```
/home/rtabykarm/Desktop/rta-by-karmenp
├── apps
│   ├── flux
│   ├── gateway
│   ├── proxy
│   └── web
├── deploy
│   ├── falco
│   ├── monitoring
│   ├── pgbouncer
│   ├── runbooks
│   └── systemd
├── docs
├── .github
│   └── workflows
├── packages
│   └── shared
├── reports
│   ├── audit
│   ├── charts
│   ├── cycles
│   ├── raw
│   └── zoho
├── scripts
├── tools
│   └── mock-zoho
└── .zed
```

## Required Paths Existence Check
| Path | Exists? |
|------|---------|
| apps/web | YES |
| apps/proxy | YES |
| tools/mock-zoho | YES |
| packages/shared | YES |
| scripts/ | YES |
| tests/ | NO |
| reports/ | YES |
| STATUS.md | YES |
| DECISIONS.md | YES |
| BUGS.md | YES |
| SETUP_ME.md | YES |
| .env.example | YES |
| package-lock.json | YES |

## Builder Claims (from STATUS.md)
- Backend: Practice mode with ZOHO_MODE=mock, resource routes for accounting entities, search/report routes, single-owner bearer auth, idempotency reservations, audit metadata, safeguards for calculated totals and invoice voiding
- Owner login throttling: 8 attempts per client per minute
- Goals & Execution page with locally stored business goals, deterministic feasibility previews
- Flux: rule-based source-grounded briefing/advisor board, owner-assigned KARM tasks, approval gates, cost guard, HMAC-chained audit log
- Gateway: single production entry point on port 8787, routes /api/v1/* to proxy, /flux/* to Flux HTTP API
- Gateway routes: /api/v1/flux/status, /api/v1/flux/briefing, /api/v1/flux/ask
- Health checks: /healthz, /readyz, /metrics (token-protected), request IDs, rate limiting, security headers, timeouts, graceful shutdown
- Verification: npm test passes for proxy, flux, gateway; npm run test:e2e passes; npm run verify passes
- Frontend applications and design assets removed from repository
- Still required: Docker socket access, model gateway configuration, HTTPS ingress, PostgreSQL restore rehearsal, live Zoho acceptance, OAuth scope review, proxy user accounts/roles

## Critical Finding
**RULEBOOK MISSING**: The file `prompts/KARM_OS_PROMPTS_BACKEND_AND_FEATURES.txt` referenced in the audit prompt does not exist in the repository. This is the standard against which the audit must be performed. Without it, the audit cannot verify compliance with the RULEBOOK.