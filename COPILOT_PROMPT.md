# RTA by KARM — Frontend Build Prompt for GitHub Copilot

Build the complete, working RTA by KARM frontend in `apps/web` (React 19 + TypeScript + Vite). Replace the existing frontend entirely. Connect to the existing backend gateway at http://localhost:8787/api/v1. Use the unique creative design language, typography, and iconography described below.

## Backend API
- Base URL: http://localhost:8787/api/v1
- Auth: Bearer token via POST /api/v1/auth/session (setup-code JWT → Flux RBAC bridge)
- Health: GET /api/v1/health
- Resources: /api/v1/contacts, /api/v1/invoices, /api/v1/items, /api/v1/taxes, /api/v1/audit, /api/v1/flux/* (status, briefing, ask), /flux/* (proxied to Flux)
- Mock Zoho available at http://localhost:4010

## Design Language
Unique, premium, futuristic, nature-connected Business OS. Alive, intelligent, organic, calm, powerful, scientific, expressive, memorable. Avoid generic SaaS dashboards, corporate admin panels, generic charts/cards/icons/typography. Use creative composition, depth, layering, motion, organic shapes, data-driven visuals, nature-inspired metaphors. Each screen has its own visual personality within one unified design system.

## Typography
Modern, clean, confident, premium, intelligent, slightly expressive, human, futuristic, organic, creative, highly readable. Main UI type: clear, calm, neutral, highly legible. Display type: bold, confident, futuristic, expressive, premium, memorable. Data type: precise, technical, scientific, monospaced for IDs/values/timestamps. Strong hierarchy. Sentence case for buttons/titles/labels. Uppercase only for short overlines/badges/category labels.

## Iconography
Modern, clean, playful but premium, organic, futuristic, expressive, intelligent, calm, precise. Light/refined, geometric but organic, friendly but professional. Nature-inspired forms + business meaning + scientific precision. Subtle motion (gentle pulses for live status, slow rotation for processing, expanding rings for notifications, growing branches for progress, reverse growth for recovery, arc movement for connection, particle drift for nature). Respect reduced-motion.

## Creativity per screen
- Home Dashboard: living Business OS command center, animated charts/KPIs/progress rings/timelines/nature motion.
- Impossible Nature Library: living archive of 169 references (nature/science/math/Tesla/cosmic intelligence), organic cards, subtle motion.
- Reference Detail: small universe of intelligence — scientific meaning, business meaning, connected data/chart, motion concept, optional 3D concept.
- Business OS Dashboard: powerful, data-rich, animated revenue/profit/cash-flow/project/task/customer/fleet/risk visuals.
- Projects: animated timelines, progress, dependencies, risks, milestones.
- Files: living network, organic connection lines, version history, recovery visuals.
- Tasks: active/distributed, movement, status energy, priorities, assignees, workflow motion.
- Accounting: money alive/flowing — animated cash-flow, income, expenses, profit, receivables, payables, risk.
- Transportation: directional/intelligent — routes, live maps, fleet energy, delivery performance, efficiency.
- HR: people/teams connected/growing — headcount, attendance, performance, payroll, training, retention.
- Relationships: living business network — pipeline motion, connection lines, customer health, referrals, renewal.
- Charts Library: beautiful, understandable, alive.
- Settings: calm, safe, personal, precise.

## Merging References & Charts
References and charts may be merged into one combined workflow visual when they connect to the same workflow, data, or action. Each merged visual shows a small subtle "Inspired by [Ref1], [Ref2], [Chart1], [Chart2]." label at the bottom. All 169 references and all 95 charts must still be represented somewhere. No reference or chart may disappear. Do not merge randomly.

Examples of good merges:
- Tesla Coil + Electric Eel + Cash-Flow Chart + Receivables Aging → live accounting money-flow visual
- Immortal Jellyfish + Tardigrade + Recovery History + Sync Health → recovery/resilience visual
- Slime Mold + Ant Colony + Route Efficiency + Task Distribution → smart routing/workload visual
- Black Hole + Time Dilation + Risk Concentration + Receivables Aging → risk/delay visual
- Coral Growth + Fibonacci Spiral + S-Curve → growth visual
- Mycorrhizal Network + Starling Murmuration + Referral Source → network/referral visual
- Honeybee Waggle Dance + Ant Colony + Task Distribution → task direction visual
- Firefly + Pulsar + Notification Trend → notification visual
- Quantum Probability Cloud + Cash-Flow Forecast → forecast visual
- Natural Fractal Branching + File Network Graph → file hierarchy visual
- Resurrection Plant + Recovery History → recovery visual
- Axolotl + Training Completion → training visual
- Bioluminescent Plankton + Activity Trend → activity visual
- Yeti Crab + Data Growth → data growth visual
- Gravitational Waves + Activity Trend → activity pulse visual

## All 169 References
Immortal Jellyfish, Tardigrade, Tardigrade Cryptobiosis, Mantis Shrimp Punch, Mantis Shrimp Vision, Peacock Mantis Shrimp Club, Bombardier Beetle, Electric Eel, Electric Eel Hunting, Anglerfish Lure, Deep-Sea Anglerfish Males, Barreleye Fish, Dragonfish Black Skin, Dragonfish Transparent Teeth, Vampire Squid, Giant Siphonophore, Siphonophore Length, Comb Jelly Rainbow Light, Comb Jelly Ancient Lineage, Box Jellyfish Eyes, Hydra Regeneration, Planarian Regeneration, Planarian Memory, Axolotl Regeneration, Axolotl Transplants, Deer Antler Regrowth, Sea Star Regeneration, Sea Cucumber Organ Ejection, Lizard Tail Autotomy, Octopus Arm Regrowth, Octopus RNA Editing, Cuttlefish Camouflage, Cuttlefish Colorblind Camouflage, Mimic Octopus, Chameleon Tongue, Gecko Feet, Basilisk Lizard, Flying Fish, Mudskipper, Saharan Silver Ant, Namib Desert Beetle, Naked Mole Rat, Antarctic Icefish, Icefish Antifreeze Blood, Arctic Woolly Bear Caterpillar, Wood Frog Freeze Tolerance, Painted Turtle Oxygen-Free Survival, Brine Shrimp Cysts, Resurrection Plant, Desert Snail Aestivation, Spiny Mouse Regeneration, Zebrafish Heart Repair, Salamander Retina Regrowth, High-Altitude Deer Mice, Tibetan Adaptation, Bioluminescent Plankton, Bioluminescent Bay, Milky Sea, Firefly Squid, Foxfire Fungus, Ghost Mushroom, Deep-Sea Bioluminescence, Anglerfish Bacterial Symbiosis, Lanternfish Light Show, Synchronous Fireflies, Coral Spawning, Horseshoe Crab, Horseshoe Crab Blood, Coelacanth, Tuatara Third Eye, Ginkgo Survivor Tree, Welwitschia, Pando, Armillaria Fungus, Mycorrhizal Network, Slime Mold Maze Solving, Slime Mold Memory, Ant Colony Intelligence, Termite Mound Climate Control, Weaver Bird Nest, Bowerbird Gallery, Lyrebird Mimicry, Bird-of-Paradise Display, Peacock Spider Dance, Orchid Mantis, Ophrys Orchid Mimicry, Corpse Flower, Fig-Wasp Coevolution, Cordyceps Control, Parasitic Wasp Mind Control, Sacculina Barnacle, Toxoplasma Behavior Change, Viral Gene Insertion, Cyanobacteria Oxygen Revolution, Hydrothermal Vent Life, Chemosynthesis, Giant Tube Worm, Yeti Crab Farming, Whale Fall Ecosystem, Brinicle, Underwater Brine Lake, Methane Seep Ecosystem, Deep Subsurface Microbes, Rock-Deep Microbes, Extremophile Life, Fibonacci Spiral, Golden Angle Phyllotaxis, Romanesco Fractal, Natural Fractal Branching, Starling Murmuration, Honeybee Waggle Dance, Tesla Coil Arcs, Rotating Magnetic Field, Wireless Power Transmission, Resonance, Plasma Globe Filaments, High-Frequency Discharge, Schrodinger's Cat, EPR Paradox, Quantum Zeno Effect, Double-Slit Experiment, Delayed-Choice Experiment, Quantum Eraser, Quantum Entanglement, Quantum Superposition, Quantum Tunneling, Heisenberg Uncertainty Principle, Wave-Particle Duality, Quantum Probability Cloud, Bose-Einstein Condensate, Superfluid Helium, Superconductor Meissner Effect, Antimatter Annihilation, Neutrino Passage, Time Dilation, Twin Paradox, Length Contraction, Relativity of Simultaneity, Gravitational Lensing, Black Hole Event Horizon, Spaghettification, Gravitational Waves, Black Hole Merger, Neutron Star Density, Pulsar Lighthouse, Magnetar, Hawking Radiation, Information Paradox, Cosmological Horizon, Dark Matter, Dark Energy, Fast Radio Burst, Cosmic Microwave Background, Saturn Hexagon, Diamond Rain, Enceladus Geysers, Europa Subsurface Ocean, Titan Methane Lakes, Rogue Planet, Zeno's Achilles Paradox, Zeno's Dichotomy Paradox, Russell's Paradox, Banach-Tarski Paradox, Cantor's Infinity, Hilbert's Hotel, Godel Incompleteness, Halting Problem, Simpson's Paradox, Four Color Theorem.

## All 95 Charts
KPI Scorecard, Revenue Trend Line, Profit & Loss Waterfall, Cash-Flow Chart, Cash-Flow Forecast, Sales Funnel Chart, Customer Cohort Retention Chart, Unit Economics Chart, Department Budget vs Actual Chart, Employee Productivity Chart, OKR Progress Chart, Inventory Turnover Chart, Customer Lifetime Value Chart, Gantt Chart, S-Curve, Cash-Flow S-Curve, Earned Value Chart, Resource Histogram, Material Consumption Chart, Productivity Chart, Quality-Control Chart, Safety Incident Chart, Delay Analysis Chart, Progress Payment Chart, Equipment Utilization Chart, Income Statement Waterfall, Accounts-Receivable Aging Chart, Accounts-Payable Aging Chart, Budget vs Actual Chart, Expense Breakdown Donut, Profit-Margin Trend Chart, Working-Capital Chart, Debt-to-Equity Trend Chart, Tax Provision Chart, Bank Reconciliation Status Chart, Fixed-Asset Depreciation Chart, Risk Concentration Chart, On-Time Delivery Chart, Fleet Utilization Chart, Cost per Mile/Kilometer Chart, Delivery Performance Chart, Route Efficiency Chart, Driver Performance Chart, Vehicle Maintenance Chart, Fuel Consumption Chart, Load Capacity Chart, Shipment Status Chart, Carrier Performance Chart, Transportation Cost Trend Chart, Headcount Trend Chart, Hiring Funnel Chart, Time-to-Hire Chart, Attrition Chart, Retention Cohort Chart, Attendance and Absence Chart, Performance Distribution Chart, Payroll Cost Chart, Training Completion Chart, Overtime Chart, Diversity Chart, Succession Coverage Chart, Sales Pipeline Chart, Lead-Source Chart, Referral Source Chart, Win-Loss Chart, Customer Health Score Chart, Customer Retention Chart, Customer Lifetime Value Chart, Account Growth Chart, Complaint and Resolution Chart, Meeting and Follow-Up Chart, Partner Performance Chart, Net Promoter Score Chart, Renewal and Churn Chart, Sync Health Chart, System Health Chart, System Performance Chart, Activity Trend Chart, Alert Trend Chart, Notification Trend Chart, Audit History Chart, Recovery History Chart, Deletion History Chart, Storage Usage Chart, Data Growth Chart, File Network Graph, Template Usage Chart, Data Quality Chart, Access Control Chart, Integration Status Chart, Automation Performance Chart, Task Distribution Chart, Task Status Chart, Task Completion Chart, Task Due Trend Chart.

## All 25 Screens
Home Dashboard, Impossible Nature Library, Reference Detail, Business OS Dashboard, Projects, Files, Tasks, Accounting, Transportation, Human Resources, Relationships, Charts Library, Settings, plus auth, onboarding, 404, offline, sync status, notifications, audit log, recovery, search, and profile.

## Requirements
1. All 169 references visible, searchable, filterable (Nature/Tesla/Physics/Math), openable detail pages, editable notes with autosave, connected to module/data/chart, navigation to related entities.
2. All 95 charts visible, searchable, filterable (by module), openable detail, real interactive chart (Recharts/D3), time range/filters/settings, title/subtitle/units/legend/data source/nature-ref link/export, loading/empty/error/success/offline states.
3. Each reference detail shows: scientific explanation, nature meaning, app meaning, connected module, connected data, connected chart, motion concept, optional 3D concept, note (autosave).
4. Each chart detail shows: rendered chart, connected nature reference, data source, business module, link to reference, link to module.
5. Merge references+charts into combined workflow visuals where they share a workflow/data/action. Show small subtle "Inspired by ..." label at bottom.
6. Connect to backend APIs where available; mock data only for missing endpoints, clearly marked.
7. Responsive: desktop, tablet, iPhone. Accessible. Reduced-motion aware.
8. Unique creative design language — not generic SaaS. Gen Z typography + iconography as described.
9. Do NOT create checklists, plans, or design docs only. Build the real working app.

## Tech Stack
- React 19 + TypeScript + Vite 6
- Recharts + D3 for charts
- Existing API client in apps/web/src/api.ts (rebuild it)
- Gateway at :8787, mock Zoho at :4010
- Figma MCP available in VS Code for design extraction
- Penpot/UXPin/GitKraken for design workflow

## Implementation Order
1. Scaffold app shell, routing, layout, design system (tokens, typography, icons, theme).
2. Build data layer: references.json, charts.json with all entries + connections.
3. Build Impossible Nature Library + Reference Detail pages.
4. Build Charts Library + Chart Detail pages.
5. Build all business module screens (Home, Projects, Files, Tasks, Accounting, Transportation, HR, Relationships, Settings).
6. Wire backend connections + mock data fallbacks.
7. Add merged workflow visuals with "Inspired by" labels.
8. Add states (loading/empty/error/success/offline), responsive, accessibility.
9. Validate: typecheck, lint, build.

Start building now. Do not ask for confirmation. Do not produce a plan document. Produce working code.

## Figma Design Files
- Main design: https://www.figma.com/design/t0T2Ry09mv78knURrgyU2l/koibhikuchbhi--Community-?m=auto&t=euBtDZ4AP2VeEubS-1
- Secondary (visual elements only): https://www.figma.com/design/t6CmPQj1XhIe7SweN4mfpB/rrrrtaaaaaaaa--Community-?m=auto&t=euBtDZ4AP2VeEubS-1

Use Figma MCP (`#get_design_context <frame-url>`) to extract design tokens. Use few visual elements from secondary. Use Penpot, UXPin, GitKraken as primary workflow tools; Figma only when required.

## Color Constraint

Use the MINIMUM amount of green. Green should be an accent only, never the dominant color. Prefer deep teals, indigos, ambers, cyans, and neutrals. Reserve green for subtle nature accents (max ~5% of any screen).

## Theme Modes (3)
The app must support 3 theme modes, switchable by the user:
1. **Light** — clean, bright, daytime-friendly.
2. **Dark** — based on the color theme from the Figma shared URLs (extract via Figma MCP). Deep, premium, nighttime-friendly.
3. **Aurora** — a nature-inspired mode with bioluminescent accents, deep organic greens/teals, and glowing data visuals. Name it "Aurora" (or rename if a better name fits). Use this as the signature RTA by KARM mode.

Each mode must theme all components, charts, references, and visuals. Persist the user's choice in localStorage. Respect system preference on first load.

## Iconography — Reference-Driven
When a nature reference perfectly fits an icon's meaning, use that reference as the icon's visual inspiration (e.g., Tardigrade for resilience/offline, Immortal Jellyfish for recovery/undo, Slime Mold for smart routing, Ant Colony for task distribution, Tesla Coil for live scanning/connection, Electric Eel for financial energy/alerts, Black Hole for risk, Fibonacci Spiral for growth, Mycorrhizal Network for connections/referrals, Honeybee Waggle Dance for task direction, Firefly for notifications, Pulsar for live status, Quantum Probability Cloud for forecasting, Natural Fractal Branching for file hierarchy). Map each icon to its most fitting reference. Keep the icon subtle and premium — the reference is the inspiration, not a literal illustration.

## Typography & Creativity — Reference-Driven
Let nature references inspire typography and creative elements too: Fibonacci Spiral and Golden Angle for layout/grid rhythm; Romanesco Fractal and Natural Fractal Branching for hierarchical structure; Starling Murmuration for dynamic text flow; Coral Spawning for reveal animations; Bioluminescent Plankton for glow accents on key data. Typography should feel alive and organic while remaining highly readable. Creative elements (dividers, progress indicators, loading states, empty states) should draw from reference metaphors.

## Typography Direction (Gen Z — Full)
Feel: modern, clean, confident, premium, intelligent, slightly expressive, human, futuristic, organic, creative, highly readable, suitable for business data and long working sessions. Not childish, not overly corporate, not generic.

Main UI type: clear, calm, neutral, highly legible, comfortable for reading data/tasks/files/projects/reports, modern without being cold or boring.

Display type: bold, confident, futuristic, slightly expressive, premium, memorable, suitable for major headings, dashboard heroes, important business moments.

Data type: precise, technical, scientific, clear, monospaced — for reference numbers, IDs, values, chart values, timestamps, technical details.

Rules: strong visual hierarchy; make important numbers/alerts/insights powerful; secondary info calm and supportive; reference names unique and memorable; chart labels and data values precise and trustworthy; headings bold but not aggressive; body text effortless; hierarchy between display/headings/body/captions/overlines/data; sentence case for buttons/titles/labels; uppercase only for short overlines/badges/category labels; comfortable paragraphs; no all-caps long text; avoid long italic blocks; don't rely on color alone for hierarchy; readable during motion; works on desktop/tablet/iPhone; accessibility + strong contrast.

## Iconography Direction (Gen Z — Full)
Feel: modern, clean, playful but premium, organic, futuristic, slightly expressive, intelligent, calm, precise, easy to understand, suitable for business OS. Not childish, not overly corporate, not generic.

Style: light and refined, geometric but organic, friendly but professional, scientific but human, futuristic but calm, consistent, instantly recognizable at small sizes, beautiful at large sizes.

Combine: nature-inspired forms + business meaning + scientific precision + subtle motion + clear visual metaphors + living intelligence.

Meaning examples: recovery = regeneration/reversal/healing/restoration; offline = protected/resilient/self-contained; connection = alive/linked/energetic; risk = concentrated/powerful/urgent; task = organized/active/distributed; file = structured/connected/living; money = energetic/valuable/flowing; transport = directional/efficient/moving; people = collaborative/human/connected; chart = analytical/growing/insightful.

Behavior: clear default/hover/focus/active/selected/disabled/loading/error/success states; understandable without animation; subtle motion only when improving understanding; gentle pulses (live status), slow rotation (processing), expanding rings (notifications), growing branches (progress), reverse growth (recovery), arc movement (connection), particle drift (nature), fade+scale (selection); don't animate everything at once; respect reduced-motion.

Accessibility: accessible label for every icon-only button; text label or tooltip for meaningful icons; no color-only meaning; strong contrast; large touch targets; clear selected/disabled/error states.

## iPhone 16 Pro — Dynamic Island Bar
On iPhone, place a top bar styled like the Dynamic Island live-activity area:
- Left side: a live-scanning Zoho data visual using a Tesla rotating-field animation (rotating magnetic field / Tesla coil arcs) that pulses while Zoho data is being scanned/synced. This replaces the old Flux icon position.
- Right side (opposite): a single Flux icon that ALSO acts as the search entry (tapping it opens global search). Flux and search share one icon in one place — no separate search icon.
- Near the left scanning visual, keep a small breadcrumb/location chip showing the current folder/file/document (tappable to navigate up).
- Both visuals must be small, subtle, premium, and consistent with the active theme mode. Respect safe areas/notch. On tablet: compact form. On desktop: move into top nav.

## Background Watermark
Use the KARM logo (`/karm-logo-watermark.png`, source: `KARM_Logo_Transparent_High_Quality.png`) as a background watermark at 6.5% opacity on all major screens. When the background is dark, switch to a white/light version of the logo. Position it centered or bottom-right, large, subtle, non-interactive (pointer-events: none). It must never interfere with readability or interactions.

## Figma Design Extraction (REQUIRED FIRST STEP)
Before writing any UI code, run in Copilot Chat:
  #get_design_context https://www.figma.com/design/t0T2Ry09mv78knURrgyU2l/koibhikuchbhi--Community-?m=auto&t=6FQfWKFhaw3sY1LO-1
  #get_variable_defs https://www.figma.com/design/t0T2Ry09mv78knURrgyU2l/koibhikuchbhi--Community-?m=auto&t=6FQfWKFhaw3sY1LO-1
Extract colors, typography, spacing, and component structure. Use these as the base design tokens. Then apply the unique creative design language, theme modes, and reference-driven iconography on top. Only fall back to invented styling where Figma doesn't provide it.

## Delete Old Frontend (FIRST)
Before building, completely delete the existing frontend: remove all contents of `apps/web/src/`, `apps/web/dist/`, and any leftover generated files. There must be NO trace of the old frontend (old pages, old components, old styles, old assets). Start from a truly blank `apps/web/src/`. Do not reuse, import, or reference any old code. Verify `git status` shows the old files deleted before creating new ones.

## Additional Design References (paths on this machine)
- /home/rtabykarm/Desktop/fffffiiiiigggggmmmmmma
- /home/rtabykarm/Desktop/Figma.desktop
- /home/rtabykarm/Desktop/ANIMATIONS_MOTION_PROMPT.txt
- /home/rtabykarm/Downloads/WhatsApp Image 2026-11-06 at 5.04.02 PM.jpeg
- /home/rtabykarm/Downloads/WhatsApp Image 2026-11-06 at 5.04.11 PM.jpeg
- /home/rtabykarm/Downloads/KARM-Consolidated-Set.pdf
- /home/rtabykarm/Downloads/Fluxtext(1).txt
- /home/rtabykarm/Desktop/karm-live-screens
- /home/rtabykarm/Desktop/KARM_OS_Design_Tool_Import
- /home/rtabykarm/Desktop/RTA-by-KARM-offline.html
- /home/rtabykarm/Desktop/KARM_OS_All_Screens_Figma_Board.svg

## Master Agent Prompt (use as the system-level instruction for any AI agent)
You are an expert Principal Full-Stack Engineer, Systems Architect, and UI/UX Motion Specialist. Execute the complete build, architecture audit, design system calibration, and live backend wiring of "RTA by KARM / KARM OS" into a production-grade web app in this repository. Follow all instructions with zero deviations. Do not ask for confirmation on small design/implementation steps.

PROJECT: rta-by-karmenp. Frontend: React 19 + TS + Vite. Backend: Express/Node gateway on /api/v1 port 8787. Core specs in PRODUCT.md, DESIGN.md, BUGS.md, DECISIONS.md.

DESIGN SYSTEM "OBSIDIAN TELEMETRY / SOURCE-STATE FIELD": Deep Field Page #05070c/#10131a, Dark Obsidian surfaces #12151c/#161a24, cards #171a22/#1b2029, dividers rgba(255,255,255,0.08)/#282d37. Signal Cyan #00f0ff/#00d9eb, Bioluminescent Teal #22d3a6, Research Violet #bd68f6, Attention Amber #f4ba42, Alert Rose #ff657c. ABSOLUTE: no garish magenta/fuchsia; toned pink only where required; max 5% green. Typography: Inter/System Sans (UI), Space Grotesk (display/hero), JetBrains Mono (data/IDs/timestamps). KARM spiral mark watermark at 6.5% opacity, white/light monochrome in dark mode.

169 REFERENCES + 95 CHARTS merged into workflow visuals. Examples: Tesla Coil+Electric Eel+Cash-Flow+Receivables Aging (financial energy); Slime Mold+Ant Colony+Route Efficiency+Task Distribution (logistics); Starling Murmuration+Axolotl+Cohort Retention (workforce); Immortal Jellyfish+Tardigrade+Recovery History+Sync Health (resilience); Black Hole+Time Dilation+Risk Concentration (risk). Each merged visual shows small "Inspired by ..." label. All 169+95 must be represented. Index in data/references.json and data/charts.json.

25 SCREENS: Splash/Auth/Onboarding, Home Command Center (Tesla rotating-field pulse, 6-node Source-State topology, Health Gauge, 10 Nature KPI cards), Impossible Nature Library (169 refs, search, 4 category filters, 5 visual-direction modes per ref), Reference Detail (autosave notes 800ms), Charts Library (95 charts), Chart Detail (live data toggle, time ranges 30D/90D/6MO/YTD, CSV export), Business OS Dashboard, Projects & Living S-Curve, Project Detail, Files & Vault (Fractal Branching), Tasks & Workforce (Ant Colony swarm), Accounting & Zoho Books (live reconciliation, overdue badges, payment triggers), Invoice Detail, Transportation & Fleet (Slime mold routing), Fleet Detail, HR & Talent (Starling murmuration), Employee Detail, Relationships & CRM (Mycorrhizal network), Client Detail, Flux Assistant & Universal Search (Cmd+K), Notifications & Dispatch Log, Audit & Traceability Log, Settings & Mode Switcher (Day/Night/Classic), My Selections & Favorites, Offline & Sync Recovery State.

MOTION: Dynamic Island header (Tesla rotating-field pulse during sync, Flux search respiration pulse), Recharts/SVG path draw-in on load, KPI count-up, milestone pop-in. Honor prefers-reduced-motion.

BACKEND: Base URL http://localhost:8787/api/v1. Endpoints: /health, /contacts, /invoices, /items, /taxes, /audit, /flux/briefing, /flux/ask, /flux/status. Practice vs Live mode indicator (PRACTICE SANDBOX vs LIVE ZOHO SYNC). Fall back to mock fixtures when offline. Zoho Grounding Rule: display totals as returned by Zoho; never recalculate taxes/balances client-side.

EXECUTION: Audit apps/web vs DASHBOARD-AUDIT.md; clean outdated styles; build all 25 pages responsive (Desktop min-w 1280px, iPhone 390px, bottom dock ≥44px touch targets); integrate MCP server (scripts/mcp-server.js, .mcp.json); run typecheck/build; deliver runnable via npm run dev.

This prompt works for any AI agent (Copilot, Claude, etc.). Follow zero deviations. Do not ask for confirmation on small steps.

