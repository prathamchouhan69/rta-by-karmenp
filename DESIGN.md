---
name: KARM OS
description: A nature-connected operations workspace grounded in verified business records.
colors:
  page: "#05070c"
  sidebar: "#080b12"
  surface: "#12151c"
  surface-raised: "#171a22"
  surface-hover: "#1b2029"
  line: "#282d37"
  line-soft: "#1d222b"
  text: "#e7edf7"
  text-soft: "#a2adbd"
  text-faint: "#718096"
  cyan: "#00d9eb"
  violet: "#bd68f6"
  pink: "#f062b6"
  green: "#22d3a6"
  amber: "#f4ba42"
  rose: "#ff657c"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(23px, 2.5vw, 30px)"
    fontWeight: 640
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "9px"
    fontWeight: 600
    letterSpacing: "0.08em"
rounded:
  sm: "7px"
  md: "10px"
  lg: "14px"
  pill: "20px"
components:
  button-primary:
    backgroundColor: "{colors.cyan}"
    textColor: "#041317"
    rounded: "{rounded.sm}"
    padding: "0 11px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "0 11px"
  input-search:
    backgroundColor: "{colors.sidebar}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "44px"
  navigation-item:
    backgroundColor: "transparent"
    textColor: "{colors.text-soft}"
    rounded: "{rounded.sm}"
    padding: "0 11px"
    height: "44px"
  status-chip:
    backgroundColor: "rgba(244, 186, 66, 0.08)"
    textColor: "{colors.amber}"
    rounded: "{rounded.pill}"
    padding: "0 9px"
  record-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "12px"
---

# Design System: KARM OS

## Overview

**Creative North Star: "The Source-State Field"**

KARM OS is an operations workspace, not a financial system of record. Its three modes preserve one source-grounded product while changing the way people navigate and scan it. The selected Figma Home Command Center informs Classic's dark template identity; Day and Night use distinct layouts and treatments rather than recoloring that template.

The KARM mark remains unchanged. Nature references stay separate from financial facts. The practice/live boundary is always expressed in words, and chart motion reflects only returned records. The Home source topology uses a lazy-loaded WebGL scene whose labels and links still come from the current source mode and loaded record counts; without WebGL, its labeled DOM topology remains visible.

**Key Characteristics:**

- Source-first status, record counts, and attention.
- Three mode-specific compositions with shared routes and interactions.
- Nature references are clearly separated from live business data.
- Keyboard, touch, reduced-motion, and safe-area behavior remain part of the system.

## Mode Differentiation

| Mode | Composition and navigation | Geometry, depth, and color | Motion and data presentation |
|---|---|---|---|
| **Day** | A horizontal workspace band sits above the content. The home source panel and nature reference share the opening row; the attention signal follows. On mobile, navigation remains at the top. | Pale mineral field (`#dce7dc`) with celadon and slate surfaces, teal/indigo signals, alternating clipped corners, and a shallow perspective on the source map. | Invoice counts stay record-backed. Source-map lines reveal during an explicit refresh; the daylight palette carries no simulated data animation. |
| **Night** | A compact vertical icon rail anchors desktop. Source status and the attention signal occupy a split opening row; the data panels form a tighter mosaic. On mobile, navigation becomes a full-width bottom rail. | Deep indigo (`#0c1026`), teal and violet light, luminous map lines, asymmetric surfaces, and a low-contrast KARM watermark. | A short source-line pulse follows refresh. The central source state remains readable without glow, and reduced-motion preferences suppress the animation. |
| **Classic** | A full textual left rail and broad source-status band preserve the selected template identity. The mobile rail becomes a floating dock, keeping the content area distinct from Day and Night. | Near-black template surfaces (`#05070c`, `#12151c`), cyan/violet signals, square data panels, and hairline dividers. | Status charts remain compact and static between source updates; focus and selected states use explicit borders and labels, not color alone. |

All modes share the same React route tree and underlying data. Their navigation, card geometry, hierarchy, and selected module compositions carry through the rest of the routes; the Home layout remains the most differentiated opening. Narrow screens return to a readable single-column flow while retaining distinct navigation and surface geometry. These shared mode treatments do not imply that every route and every loading, empty, error, and interaction state has received a full visual audit.

## Colors

Each mode owns a separate palette. Accents identify state and category instead of decorating every container.

### Mode palettes

- **Day:** mineral/sage page and panel surfaces, dark slate text, teal active state, indigo reference state, and amber practice/attention state.
- **Night:** deep indigo surfaces, pale text, bioluminescent teal active state, soft violet reference state, and amber practice/attention state.
- **Classic:** the template's near-black surfaces with cyan active/live cues, violet reference identity, green connected state, and amber practice/attention state.

### Primary

- **Signal cyan/teal:** Active actions, keyboard focus, selected navigation, and live-data cues; the exact shade is mode-specific.

### Secondary

- **Research violet** (`{colors.violet}`): Nature and chart references, secondary insight, and reference identity.

### Tertiary

- **Pattern pink** (`{colors.pink}`): A secondary metric accent; use sparingly beside cyan and violet.
- **Operational green** (`{colors.green}`): Connected or completed states.
- **Attention amber** (`{colors.amber}`): Practice mode, pending work, and caution.
- **Alert rose** (`{colors.rose}`): Overdue, destructive, or error states.

### Neutral

- **Deep field** (`{colors.page}`): Main page background.
- **Night rail** (`{colors.sidebar}`): Persistent desktop navigation and mobile navigation surface.
- **Working surface** (`{colors.surface}`): Data panels and cards.
- **Raised surface** (`{colors.surface-raised}`): Hovered or emphasized surfaces.
- **Divider** (`{colors.line}` / `{colors.line-soft}`): Separate content without heavy card borders.
- **Primary text** (`{colors.text}`): Headings and key record values.
- **Secondary text** (`{colors.text-soft}`): Supporting copy and table values.
- **Tertiary text** (`{colors.text-faint}`): Metadata; do not use for essential instructions.

**The Source-State Rule.** Color never substitutes for the words “live,” “practice,” “unavailable,” or the source record itself.

## Typography

**Display Font:** System UI stack (`ui-sans-serif`, system UI, Apple system, Segoe UI, sans-serif)  
**Body Font:** The same system UI stack  
**Label/Mono Font:** No separate mono face; tabular figures are reserved for measured values.

**Character:** Neutral and direct, with restrained tracking. Headings establish hierarchy; compact uppercase labels support scanning but never carry critical instructions alone.

### Hierarchy

- **Display** (weight 640, fluid 23–30px, line-height 1.15): Main page titles.
- **Headline** (weight 620, 13–17px): Panel titles and key record sections.
- **Title** (weight 600, 10–12px): Record names and card titles.
- **Body** (weight 400, 13px, line-height 1.5): Default application copy.
- **Label** (weight 600, 8–10px, lightly tracked): Status, category, and metadata labels.

**The Readable Control Rule.** On mobile Safari, form controls use at least 16px text to avoid automatic focus zoom; interactive targets are at least 44px high.

## Layout

Desktop uses a fixed 226px workspace rail and a centered content column capped at 1680px. The home surface uses a record-backed dashboard grid; data-heavy views keep their own horizontal scroll containers rather than forcing page-wide overflow.

At 1080px, dashboard and catalog grids reduce columns. At 760px, the rail becomes a fixed bottom navigation, content becomes a single-column feed, and top and bottom safe areas are respected. The page maintains a 320px minimum width and should not introduce horizontal overflow.

## Elevation & Depth

Depth is primarily tonal: near-black page and rail surfaces, slightly raised panels, and hairline dividers. Shadows are reserved for focused drawers and overlays, where they separate a task surface from the workspace rather than decorate resting cards.

**The Flat-By-Default Rule.** Use surface tone and borders for ordinary hierarchy; reserve shadows for overlays.

## Shapes

Controls and compact cards use gently rounded corners (7–10px); larger dashboard and reference surfaces use 11–14px. Pills are reserved for status and category chips. Borders stay thin and low-contrast except for active focus, selected state, or an actionable warning.

## Components

### Buttons

- Primary actions use signal cyan with dark text; secondary actions use a raised neutral surface.
- Focus uses a clearly visible cyan outline with offset.
- On mobile, controls keep a 44px minimum height without changing the compact desktop density.

### Inputs / Fields

- Search and form fields use a dark neutral fill and a visible focus border.
- Labels remain programmatically associated with their fields; validation and recovery messages use alert/status semantics.
- Mobile text inputs use 16px type to prevent Safari focus zoom.

### Navigation

- Desktop navigation is grouped in a persistent left rail with a textual active state.
- Mobile navigation becomes a horizontally scrollable fixed bottom bar with safe-area padding and concise labels.

### Cards / Containers

- Data cards use a quiet surface and one-pixel divider; hover and focus states clarify interactivity.
- Record metrics always state their source and scope. Concept charts are labeled as previews, not business data.

### Drawers

- Reference and invoice drawers use modal semantics, initial focus, Escape dismissal, trapped Tab navigation, and focus restoration.
- Drawers retain the record source and practice/live boundary alongside any consequential action.

## Do's and Don'ts

### Do:

- **Do** keep Zoho Books as the accounting source of truth.
- **Do** label practice data, unavailable sources, and reference-only charts clearly.
- **Do** preserve the light KARM mark on dark surfaces.
- **Do** keep touch targets, focus behavior, and safe areas usable on mobile Safari.

### Don't:

- **Don't** infer or calculate accounting totals in the frontend.
- **Don't** present catalog counts or concept charts as live business metrics.
- **Don't** hide essential meaning in color, tiny metadata, or hover-only controls.
