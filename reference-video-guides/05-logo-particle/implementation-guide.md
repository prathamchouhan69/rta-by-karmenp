# Video 05 — KARM logo particle motion

## My question and answer

**Question:** How should the fluid particle movement in this reference behave
and relate to the KARM identity?

**My direction:** Shape a fluid particle motion treatment from the KARM logo.
Let it respond gently to touch or device tilt, and keep it still unless the
user interacts; avoid idle looping.

## Implementation guide

- Derive the particle silhouette/flow from the existing KARM logo rather than
  introducing a separate brand mark.
- Keep it at rest until pointer/touch interaction or an explicitly supported
  device-tilt interaction.
- Keep response gentle, brief, and performant; do not animate continuously
  while idle.
- Provide a non-motion alternative and respect reduced-motion preferences.
- Request device-motion permission only if required by the platform and only
  with a clear user-facing reason.
