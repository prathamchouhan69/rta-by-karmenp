# Video 13 — Particle loading/Flux indicator

## My question and answer

**Question:** Where should this particle effect be reused?

**My direction:** Use its particle effect as a loading/waiting/Flux icon
anywhere applicable.

## Implementation guide

- Reuse the KARM-shaped particle motif for a genuine active loading, waiting,
  or Flux state.
- Keep the animation transient: begin only while work is active and stop when
  it finishes or fails.
- Do not use it as an always-on decorative loop.
- Respect reduced motion and provide clear accessible status text.
- Avoid duplicating the interactive logo particle system from video 05.
