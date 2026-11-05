# Video 10 — Clickable severity donut

## My question and answer

**Question:** How should the segmented donut and selection behavior be used?

**My direction:** Use a segmented donut with clickable filtering wherever the
app shows a severity breakdown.

## Implementation guide

- Use this only when the product has real severity categories and counts.
- Make each segment selectable and filter the corresponding records; provide a
  clear way to reset the filter.
- Pair colors with category labels and accessible names.
- Do not reinterpret unrelated categories as severity or manufacture
  severity data.
- Keep segment styling aligned to the KARM palette.
