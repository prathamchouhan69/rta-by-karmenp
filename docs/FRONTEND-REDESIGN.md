# KARM frontend corrective redesign

## Verified state before implementation

- The workspace had no `apps/web`, `index.html`, Vite entry point, or frontend routes.
- `STATUS.md` and `KARM-application-source.zip` both confirmed that the previous frontend
  was absent; the archive contains only proxy, mock, shared, and report files.
- The backend contract exposes practice-mode health, contacts, items, taxes, invoices,
  search, news, and audit endpoints. The new slice keeps those contracts unchanged.
- The user approved 14 numbered reference-video directions. Their app mapping and
  implementation status are recorded in the guide below; the numbering follows the
  user's review and does not imply a one-to-one mapping to local filenames or timestamps.

## Representative slice

Reachable at the web app root:

- Main navigation and the Day / Night / Classic mode selector.
- Dashboard overview with receivables signals.
- Cashflow contour chart with 7/30/90-day filters over explicitly illustrative mock
  history; the chart does not represent live Zoho activity.
- Receivables table with real values matching the proxy's practice data.
- Detail drawer for an invoice, including a staged payment path.
- New invoice action and navigation state.

## Mode differentiation matrix

| Dimension | Day | Night | Classic |
|---|---|---|---|
| Composition | Airy bento desk with asymmetric signal strip | Signal room with floating orbital attention map | Dense ledger register with document-first hierarchy |
| Navigation | Compact left rail | Same semantic rail, darker command-room treatment | Serif-led, paper-like register treatment |
| Geometry | Rounded panels and the K-shaped particle mark | Deep surfaces and a dotted receivables status chart | Warm paper panels, tighter table rhythm |
| Material | Ivory paper, indigo and brass accents | Obsidian, violet and brass accents | Parchment, indigo and brass accents |
| Chart | Contour line chart with translucent area | Same line chart on dark surfaces | Same line chart with restrained contrast |
| Motion | Interaction-driven particle response and invoice detail drawer | Same brief, interaction-driven feedback | Same brief, interaction-driven feedback |
| Background | Warm daylight neutral | Near-black control room | Aged ledger neutral |

No green is used in the mode palettes, charts, statuses, or accents.

## Reference-video implementation guide

This is the approved mapping from the user's 14 reference-video directions to KARM OS.
“Implemented” means the current Today dashboard has a corresponding interaction or
visual treatment; “Deferred” means there is no matching product surface or trustworthy
data source yet. Apply the ideas only where the named product context exists. Keep KARM's
indigo-and-brass identity, real product data, and existing navigation behavior; do not
recreate reference assets or infer unapproved details from a clip.

| Video | Approved direction | KARM placement and current status | Guidance when extending |
|---|---|---|---|
| 1 | Adapt relevant controls (buttons, checks, toggles, selects, charts) and their motions; keep movement subtle and tied to a tap or state change. | **Partially implemented — Today.** Existing mode buttons, invoice-status filters, metric move controls, and invoice rows have usable states; the dashboard uses KARM indigo and brass. There are no checkboxes, switches, or selects on this screen to restyle. | Reuse the same compact control language when those control types appear. Motion is feedback for interaction, never an idle loop or page-load sequence. |
| 2 | Use a dotted donut chart and time-range filtering where appropriate. | **Partially implemented — Today.** The Receivables at a glance chart is a dotted donut and its category buttons filter the invoice table. Cashflow offers 7/30/90-day ranges over deterministic illustrative mock history, clearly labeled as not live Zoho data. | Keep the sample status visible. Replace the demo series with verified time-series data before presenting it as business activity. |
| 3 | Use layered glass folder/file cards with tilt and open motion in Documents/Crystals only. | **Deferred — no Documents/Crystals browser exists.** The current Documents navigation does not render a document browser. | Apply this material and motion only inside a real Documents/Crystals folder or file browser. Keep file names and actions legible, with tap/keyboard operation and reduced-motion behavior. |
| 4 | Borrow suitable bar- and line-chart visuals, recolored with KARM colors. | **Partially implemented — Today.** The Cashflow contour is the existing line-chart treatment and uses the KARM indigo palette. There is no data-backed bar chart on this surface. | Use the bar treatment only with an actual comparison series; keep line and bar colors within the KARM palette and retain readable labels. |
| 5 | Shape a fluid particle treatment from the KARM logo; respond gently to touch or device tilt, and stay still until interaction. | **Partially implemented — Today.** The K-shaped particle mark rests still and responds to pointer/touch movement and arrow keys. Device-tilt response is not implemented. | Keep the mark interaction-driven. Do not add an idle animation; do not add device-motion access without an explicit product need and an appropriate permission/accessibility design. |
| 6 | Use map tiles and navigation interaction in Routes only. | **Deferred — no Routes screen or route data exists.** | Keep map tiles and route-navigation interaction scoped to a future, data-backed Routes surface; do not place a decorative map on Today. |
| 7 | Show the app's own data in compact, draggable/rearrangeable metric and chart cards on Now and Analytics/Terrain. | **Partially implemented — Today only.** The three existing metric cards can be reordered by drag-and-drop or accessible earlier/later buttons, with a screen-reader position announcement. Their order is temporary and resets on reload. There are no separate Now or Analytics/Terrain screens. | Treat Today as the current dashboard placement, not proof of an Analytics/Terrain feature. Extend to additional surfaces only when they exist and can show their own verified data; do not invent metrics or persist order without a product decision. |
| 8 | Use a navigable circular/depth card carousel where the app presents selectable items. | **Deferred.** Today uses an invoice table and detail drawer; no catalogue or carousel is present. | Consider this for a real, bounded set of selectable items where spatial browsing is useful. Preserve list/table access and keyboard/touch navigation. |
| 9 | Show status dots anywhere tasks or systems show status, but only in compact spaces. | **Implemented — compact Today indicators.** Invoice status badges and the Practice mode indicator use status dots; the receivables donut also encodes invoice statuses. | Keep dots paired with readable status text or another accessible label; do not use color alone or add dots decoratively. |
| 10 | Use a segmented donut with clickable filtering wherever a severity breakdown is shown. | **Adapted — Today invoice statuses, not severity.** The dotted donut's status categories are clickable and filter the matching invoice rows. The app does not currently have severity data. | If a real severity breakdown is added, use its actual severity categories and data. Do not treat invoice status as severity or manufacture severity counts. |
| 11 | Repeat video 3's layered folder/file cards for Documents/Crystals. | **Duplicate of video 3; no additional change.** | Keep one Documents/Crystals implementation of that direction; do not create a second card system. |
| 12 | Reinforce video 4's bar/line chart visual direction. | **Duplicate of video 4; no additional chart requirement.** The user explicitly declined adding tooltips. | Do not add tooltips for this reference. Keep chart visuals tied to appropriate, real data. |
| 13 | Reuse the particle treatment as a loading/waiting/Flux icon where applicable. | **Deferred.** The current screen has no matching loading/waiting state or shared Flux indicator. The interactive logo mark is not a loading animation. | If a genuine asynchronous wait state is added, reuse the KARM particle form as a transient indicator while work is active; stop it when work finishes and respect reduced motion. |
| 14 | Use a 3D-perspective carousel to browse selectable items, styled for KARM. | **Deferred.** No selectable-item carousel surface exists today. This is a separate approved carousel direction, alongside video 8. | Consider it only for a suitable real catalogue/browse flow. Keep selection, orientation, keyboard/touch input, and reduced-motion alternatives clear; do not add perspective to the invoice table. |

### Shared implementation guardrails

- Videos 11 and 12 are reinforcements of videos 3 and 4, respectively—not new features.
- Keep all reference-inspired accents in KARM indigo and brass. Do not borrow the
  reference lime palette.
- The current dashboard is a representative practice-mode slice. A visual treatment is
  not evidence that its displayed metric or chart is live, query-backed, or time-filtered.
- Do not add a Routes, Analytics/Terrain, Crystals, loading, or carousel screen solely to
  accommodate a reference. Wait until that product surface and its real data exist.
- The guide records approved direction, not clip timestamps, extracted assets, or claims
  about unapproved details.
