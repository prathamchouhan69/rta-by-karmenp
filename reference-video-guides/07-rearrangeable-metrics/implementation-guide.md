# Video 07 — Rearrangeable metric cards

## My question and answer

**Question:** Which data and screens should use the compact draggable cards?

**My direction:** Show the app's own data in compact metric/chart cards that
can be dragged and rearranged, on both **Now** and **Analytics/Terrain**.

## Implementation guide

- Use actual app-owned metrics and chart data; do not fabricate business facts.
- Keep cards compact and scannable, with clear labels, values, units, and time
  context.
- Allow users to rearrange cards on Now and Analytics/Terrain where those
  surfaces exist.
- Provide keyboard-accessible move controls as an alternative to drag.
- Save order only if the product already has an appropriate persistence model;
  otherwise make the temporary behavior clear.
- Do not create a new dashboard or Analytics/Terrain screen solely to match
  this reference.
