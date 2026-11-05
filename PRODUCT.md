# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Inferred from the supplied product prompts and workspace documents: KARM Enterprises staff handling day-to-day customer, vendor, invoice, payment, bill, expense, and reporting work.

## Product Purpose

Inferred from the supplied product prompts: KARM OS is the business-facing workspace for day-to-day work. Zoho Books remains the accounting system and source of truth; success means helping staff access and update supported business records without duplicating accounting calculations.

## Positioning

The product connects operational work to the organization's Zoho Books records rather than replacing the accounting system. This positioning is inferred from `.source/prompts/Prompts /text 5.txt` and `DECISIONS.md`.

## Operating Context

Staff use the web app to review and work with customer/vendor records, invoices and other supported accounting documents, payments, expenses, and reports. The backend currently has local practice mode and a configured Zoho Books integration.

## Capabilities and Constraints

- The backend API is versioned at `/api/v1`; see `docs/BACKEND-API.md`.
- Zoho Books owns calculated totals, tax, balance, and other accounting results; the frontend must display received values and must not calculate money.
- Live Zoho reads have been verified for the configured organization, items, and taxes. Live write workflows have not been accepted against the owner's organization.
- The current API authentication is a single owner setup code exchanged for a short-lived bearer token; do not expose credentials in client bundles or logs.
- Production storage, multi-user roles, and deployment are not yet established.
- Goals & Execution stores KARM goal plans locally and calculates progress/feasibility from explicitly entered, dated actuals. It must not present these inputs as automatically verified Zoho data or write goals to Zoho.
- Flux currently provides a source-labeled, rule-based briefing and bounded data Q&A over loaded invoice, goal, and KARM task records. It is not model-backed; provider credentials, consent, and orchestration are not configured.
- KARM tasks are owner-assigned internal records. They do not execute external actions or write to Zoho Books.
- Document preparation currently saves only unsent KARM drafts (meeting notes, follow-up drafts, and operations checklists); it does not send or post them.
- Daily automations are bounded to creating internal task records at an India-time schedule. They are idempotent per scheduled occurrence and do not call external systems.
- Live Zoho write APIs require a short-lived approval token bound to the exact request and idempotency key, issued by the non-mutating write-preview route. The UI presents a human confirmation before submitting a write.

## Brand Commitments

The product name is KARM OS / RTA by KARM. The supplied KARM mark is the existing brand asset; preserve its transparency and render it in a light color on dark surfaces. The user-selected Figma Home Command Center (desktop and iPhone artboards) is the visual reference for the workspace shell and dashboard composition.

## Evidence on Hand

- `docs/KARM_3D_Logo_High_Resolution.pdf` — supplied KARM logo.
- `docs/FRONTEND-REDESIGN.md` — approved product content and operating constraints.
- `docs/BACKEND-API.md` — current backend contract.
- `reference-video-guides/` — approved UI and motion directions.
- Figma file `YhhdOL9hTCGNsgmeFB92vp`, nodes `6:23984` and `6:24609` — inspected desktop and iPhone Home Command Center artboards.
- `apps/web/src/references.ts` — the nature, physics, math, and Tesla reference catalog shown by the frontend.
- `apps/web/src/charts.ts` — the chart-reference catalog; chart previews are concepts, not business data.
- Available practice records and verified Zoho read routes are listed in the backend code and tests.

## Product Principles

1. Keep Zoho Books as the accounting source of truth.
2. Show financial values as supplied; never recreate accounting arithmetic in the UI.
3. Distinguish live data, practice data, offline state, and unavailable capabilities.
4. Protect organization credentials and gate consequential writes.

## Accessibility & Inclusion

The web interface should work with keyboard, touch, screen readers, responsive layouts, and reduced-motion preferences. These requirements are inferred from the repository's existing reference implementation guidance.
