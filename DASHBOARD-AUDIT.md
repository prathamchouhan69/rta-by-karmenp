# RTA by KARM frontend audit

## Scope and evidence

The active frontend in this repository is `apps/flux-ui`, a Next.js App Router application that proxies authenticated requests to the Flux service. The route and data review covered its current app pages, `apps/flux/src/http/routes.js`, `apps/flux/src/http/extendedRoutes.js`, `.impeccable/design.json`, and `docs/REFERENCE-MOTION-AUDIT.md`.

The requested `rta-by-karm-frontend.full.json` was not present in the repository. The active UI now contains an inventory of 169 nature/physics/math references and 95 chart concepts, with five visual directions for each reference (845 directions total). These inventory counts do not imply verified scientific explanations or live/real chart feeds: scientific explanations and operational chart data remain limited, and the visual directions are concepts rather than source material.

## Current dashboard

`apps/flux-ui/src/components/dashboard.tsx` now uses existing, authenticated backend endpoints:

| Dashboard content | Endpoint | Data treatment |
|---|---|---|
| Today's briefing | `GET /v1/briefing/today` | Shows the backend's verified/unverified section states; a missing briefing is an explicit empty state. |
| Build briefing action | `POST /v1/briefing/run` | Available only when the session includes `read:zoho`; the backend remains authoritative. |
| Pending approvals | `GET /v1/proposals?status=pending` | Shows pending proposal records; an empty list is described as no work waiting, not a system health claim. |
| Saved work distribution | `GET /v1/tasks` | The dashboard chart counts task records by their current stored status. It is explicitly a snapshot, not a time series. An empty list and a failed request have distinct states. |
| Live-source status | `GET /v1/live/status` | Displays backend-reported availability and alternatives. The current backend reports live feeds as not configured. |

Quick actions now target existing app routes instead of paths that had no page in this Next.js workspace. The shell navigation is similarly limited to implemented pages. The new `/approvals` page lists pending proposals and separates approval from execution: approval tokens stay in page memory, and execution requires a second, explicit confirmation. `/settings` is a source-status page backed by the live-status endpoint, not a claim that general account settings are implemented.

## Visual system and responsive behavior

- The existing responsive app shell, side navigation, mobile drawer, and bottom navigation remain in place.
- The header mood control now cycles among **dark**, **light**, and **classic**. The selected mood is stored in the existing `flux_theme` cookie; server rendering recognizes all three values.
- Classic uses a paper/ink palette; the other two palettes retain the existing dark and light treatments.
- The task snapshot chart uses the actual task response and textual labels/counts alongside bars, so status meaning is not conveyed by color alone.
- Existing keyboard focus, reduced-motion rules, accessible headings, loading/error/empty UI, and touch-sized controls remain the baseline.

The reference motion audit records inspection of 14 supplied clips and selected Figma nodes; it describes restrained screen-bound motion and a desktop/mobile composition. The current inventory supplies the 169 reference names, 95 chart concepts, and 845 reference visual directions; it does not supply verified scientific explanations or real chart feeds for every entry.

## Current routes in `apps/flux-ui`

Implemented pages: `/`, `/chat`, `/money`, `/cash-flow`, `/wealth`, `/startup`, `/economy`, `/radar`, `/documents`, `/schemes`, `/local`, `/automations`, `/meeting`, `/approvals`, `/settings`, `/tasks`, `/references`, `/references/[id]`, `/selections`, `/charts`, and `/charts/[id]`. These pages use existing backend routes as detailed in [BACKEND-INTEGRATION-MAP.md](BACKEND-INTEGRATION-MAP.md); not all are live-data feeds (for example, `/cash-flow` is a caller-provided scenario and `/schemes` is a curated static directory). `/references`, `/selections`, and `/charts` use the local inventory; `/tasks` reads saved task records.

Several additional backend capabilities have no corresponding page in this frontend yet, including construction calculators/material-price management, health profile and wellness tools, general curated knowledge and Jugaad, board meetings, OCR, audit/model administration, and user administration. The document workflow is surfaced at `/documents`; see the integration map for its current scope and remaining limitations.

`apps/web` is a separate legacy workspace in this worktree. It is a static demo, does not use the Flux API, fails its TypeScript check (`Reference` and `Chart` are unresolved), and has no test files. It is not the active frontend and is excluded from the root build, typecheck, test, Docker, and Compose paths. It was not repaired or restored as part of this audit.

## Remaining design and product work

1. Provide the full frontend JSON/spec and any associated source material to validate the reference explanations, chart definitions, and data feeds; the existing inventory counts alone do not substantiate those details.
2. Define which charts are business metrics versus reference/educational material, and identify an authorized backend source, date range, units, and empty/error behavior for each operational chart.
3. Build dedicated pages for supported backend domains that are still backend-only, with their permission, validation, source, and approval constraints.
4. Perform browser-level visual and interaction review at agreed desktop/mobile sizes against the complete design reference. The current verification is a production build/typecheck, not a claim of exhaustive visual QA.
