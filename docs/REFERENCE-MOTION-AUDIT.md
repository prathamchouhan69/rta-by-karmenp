# Reference and motion audit

This audit records what was inspected and how the first representative slice translates it. It does not claim exhaustive frame-by-frame review.

## Inventory

All 14 supplied MP4s decoded successfully at 1280×720. The review used a ten-point motion-change scan plus representative frames near 0%, 30%, 60%, and 90% of each timeline. The outer screen frame remained generally fixed; observed changes were inside the recorded canvas. Exact easing, hover/selection triggers, physical material, and light behavior cannot be established reliably from these screen recordings.

| File | Timeline observations | Inspection / limits |
|---|---|---|
| `2026-10-20 15-39-05.mp4` (46.77s) | A dark inset panel becomes prominent near 14.1s; small yellow/magenta marks appear around 28.1s; the panel mostly clears by 42.2s. | Screen-bound changes; no dependable easing curve identified. |
| `2026-10-20 15-45-18.mp4` (28.33s) | Busy opening gives way to a mostly blank canvas around 2.9s; it holds through 22.7s and returns to the opening view by 25.6s. | Long quiet hold; return is a viewport/state change, not a verified user trigger. |
| `2026-10-20 15-46-03.mp4` (18.90s) | Change begins near 3.8s; dark blocks and bright accents are visible by 5.7s; red/pink forms develop through 11.4s and settle around 15–17s. | Central composition changes inside a steady frame. |
| `2026-10-20 15-47-07.mp4` (29.17s) | A transition near 5.9s reveals a green field-like graphic by 8.8s; it holds with small changes through 26.3s. | Stable frame and deliberate hold; exact trigger/easing unknown. |
| `2026-10-20 15-48-02.mp4` (32.53s) | High-contrast full-canvas change near 3.3s; a red flower/cluster-like form is visible around 19.6s and holds through 29.3s. | Screen transition and held central form; no reliable camera movement observed. |
| `2026-10-20 15-50-16.mp4` (13.47s) | The view becomes sparse and pale around 2.8s, stays mostly quiet through 10.8s, then returns to the opening by 12.2s. | Quiet hold; no fine-grained interaction state identified. |
| `2026-10-20 15-51-11.mp4` (29.57s) | Canvas changes near 3.0s; a green layered field appears around 8.9s; it clears/changes around 14.8–17.8s; opening framing returns by 26.7s. | Multiple screen-state changes; exact intermediate trigger unknown. |
| `2026-10-20 15-52-51.mp4` (16.30s) | Mostly blank canvas appears around 3.3s, holds through 13.1s, and returns to the opening near 14.7s. | Long hold and abrupt return; not copied literally. |
| `2026-10-20 15-55-45.mp4` (14.20s) | Pale canvas appears around 2.9s; a small red accent is visible in the central area during the 4–11s hold; opening returns near 12.8s. | Sparse state; no reliable easing or camera choreography identified. |
| `2026-10-20 15-59-55.mp4` (23.17s) | Central form starts near 4.7s and is clear by 7.0s; full-canvas changes around 14.0s and 18.6s interrupt it; it reappears near 20.9s. | Reveal/hold punctuated by viewport changes. |
| `2026-10-20 16-00-58.mp4` (18.63s) | Multicolor central form appears around 3.8s and changes shape through 5.7–11.3s; opening view returns near 16.8s. | Shape changes inside a steady screen frame; exact geometry is not treated as an asset to copy. |
| `2026-10-20 16-02-42.mp4` (31.27s) | Green terrain-like field appears around 3.2s, remains largely steady through about 25s, and the opening view returns around 28.2s. | Stable focal field; no exact timing curve inferred. |
| `2026-10-20 16-06-09.mp4` (8.87s) | Red/orange abstract form appears around 2.7s, changes through roughly 7.2s, then the opening view returns around 8.0s. | Short reveal/change/return sequence. |
| `2026-10-20 16-10-46.mp4` (16.83s) | Multicolor graphic appears around 3.4s, shifts subtly through about 13.5s, then the opening view returns around 15.2s. | Subtle internal change within a steady outer frame. |

The contact sheet `reference-video-guides/all-reference-previews-contact-sheet.jpg` was inspected as a still-image index only; it is not evidence of motion review.

The selected Figma file `YhhdOL9hTCGNsgmeFB92vp`, desktop node `6:23984` and iPhone node `6:24609`, was inspected through screenshots and metadata. The desktop reference combines a dark rail, source-status relationship map, dense metric panels, chart/table areas, and a nature reference; the mobile artboard stacks the content and uses bottom navigation. The variable-definition response was empty and the motion-context response contained no animated nodes. Those responses do not establish unavailable component variants or motion.

No reference asset or complete scene was copied. Rights were not independently assessed; implementation uses the user's provided materials as direction and preserves the existing KARM logo.

## Reference-to-component map

| Observation | Original interpretation | Component and verification |
|---|---|---|
| `2026-10-20 15-46-03.mp4` (3.8–17s), `2026-10-20 15-47-07.mp4` (5.9–26.3s), `2026-10-20 15-51-11.mp4` (3–26.7s), and `2026-10-20 16-02-42.mp4` (3.2–28.2s): a fixed screen frame, central field reveal, then a long hold. | Use a modest, one-shot line reveal for the source topology only while a real refresh is in progress. The topology names KARM, the current Books/practice source, and the returned invoice/contact counts; it does not invent connected modules. | Home `health-ecosystem` / `ecosystem-map`; `.is-syncing` animates three lines for 0.9s with 0.12s stagger. The browser check observed the real refresh button become disabled, the class become active, and a `source-trace` animation-end at 0.9s. The rendered practice dashboard showed one invoice and three contacts. |
| Figma desktop `6:23984` and iPhone `6:24609`: persistent navigation, dense source-aware status, and a stacked mobile workspace. | Retain labels and data truth, but give each mode its own navigation placement, shared surface language, and home composition instead of copying the artboard. | Day: top horizontal band, mineral surfaces, and source/reference split. Night: narrow desktop rail, indigo panels, and full-width mobile bottom rail. Classic: full desktop rail, flat template surfaces, and floating mobile dock. Sampled at desktop and mobile breakpoints; captures are visual checks, not a complete per-route state audit. |
| The references show a fixed outer frame with internal fields and holds; there is no evidence for a camera-heavy workflow. | Keep operational controls legible and stationary, but give the source topology a small real 3D object field that uses only the known source categories. | Home `SourceTopology3D` renders a shader-lit central mesh, three source-category links, and 50 decorative reference points. Source identity and count labels remain HTML text; the 50 points are not records, metrics, or 50 documented business concepts. Reduced-motion turns the scene static; unsupported WebGL retains the labeled DOM topology. |
| Across the supplied clips, most motion is a screen-bound reveal, internal shape change, or held state; camera choreography is not substantiated. | Keep route and content stationary during mode changes; use one restrained source-refresh response and a restrained 3D presence rather than perpetual interface choreography. | Global Day/Night/Classic picker, mode-specific route treatments, source-map refresh state, and lazy-loaded source scene. A task form remained on the Tasks route with its entered title and context after a mode switch. |

## Mode differentiation matrix

| Dimension | Day | Night | Classic |
|---|---|---|---|
| Overall composition | Horizontal workspace band; source status paired with nature reference. | Compact icon rail; source status and attention split the opening row. | Full textual left rail; broad status strip precedes the compact record panels. |
| Mobile navigation | Top band. | Edge-to-edge bottom rail. | Floating bottom dock. |
| Surface and geometry | Mineral/celadon, angled panel corners, shallow perspective, and airier connection-page split. | Indigo gradients, asymmetric panels, luminous line work, and compact information placement. | Near-black template surfaces, square panels, hairline dividers, and flat data panels. |
| Typography | System UI; larger editorial heading. | System UI; bright, high-contrast hierarchy. | System UI; compact template-like labels and tabular data. |
| Chart presentation | Real invoice counts shown as status bars. | Same truthful counts in the denser source mosaic. | Same truthful counts in a compact, flat source panel. |
| Background | Pale mineral field and low-contrast logo mark. | Deep indigo field and low-contrast logo mark. | Near-black template field and low-contrast logo mark. |

## Coverage and fidelity status

- **Implemented across shared routes:** persistent mode selection; common theme tokens for operating surfaces, tables, empty states, controls, and Flux panels; three distinct navigation placements; specific mode compositions for Home, source-unavailable modules, Business OS, accounting, tasks, goals, briefings, catalogs, and settings. The Home source field now has a lazy-loaded WebGL scene tied to the existing source categories and mode colors; the labels remain source- and record-derived.
- **Browser spot-check:** Home, Accounting, Projects, Tasks, Goals, and Settings were visited in all three modes at desktop and narrow-window widths. Business OS, Accounting, and module-unavailable states were visually reviewed in desktop captures. WebGL2 rendered in headless Firefox with software-WebGL enabled. The 3D canvas uses a 50-point abstract reference shell, not a 50-concept data map.
- **Reference adaptations:** palette and typography are adapted to the three mode briefs; Figma composition and video scenes are not copied; the logo asset is preserved.
- **Not complete:** the full 80–85% 3D-coverage target has not been measured or met; the 50 abstract points do not stand in for 50 distinct concepts. Most chart entries remain labeled layout previews, not live chart implementations. Loading/error/offline and every chart state have not been compared across every mode, and hardware-accelerated rendering has not been checked.
- **Not verified here:** exact easing or user triggers in the supplied clips, every Figma variant, desktop interaction screenshots, and a complete visualization-by-visualization coverage audit.
