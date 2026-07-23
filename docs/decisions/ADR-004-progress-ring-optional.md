 # ADR-004: Progress Ring Optional and Visually Subordinate

 ## Status

 Accepted

 ## Context

 The MuscleSphere component includes an optional outer progress ring showing stage completion. Early design mockups used a bright accent-colored ring (violet or green) that competed with the muscle visualization for visual attention.

 The product principle requires the muscle visualization to be the primary focus; the progress ring must not distract.

 ## Decision

 The progress ring is:

 1. **Optional** – only rendered when `showProgressRing` is `true` (controlled by training status: shown during `running`, hidden during `idle` and `paused`).
 2. **Visually subordinate** – uses muted gray tones (`rgba(148,163,184, 0.08)` for filled portion, `rgba(148,163,184, 0.02)` for unfilled).
 3. **Thin** – 2px padding, implemented via a conic-gradient on a wrapper `div`.
 4. **Outside** the animation container – positioned absolutely behind the Sphere but on top of the background.

 ## Alternatives Considered

 1. **Bright accent ring** (violet/indigo gradient) – draws attention away from the muscle animation. Rejected.
 2. **Integrated into SVG** – would require modifying each SVG layer. Rejected for separation of concerns.
 3. **No ring at all** – users lack stage-progress awareness during long holds. Rejected; the ring is useful but kept subtle.

 ## Consequences

 Positive:
 - Ring never competes with the muscle visualization.
 - Simple CSS implementation, no SVG path math required.
 - Easy to remove or replace without touching animation logic.

 Negative:
 - Conic gradient cannot animate smoothly across the 0→360 boundary. The `stageProgress` value resets on each stage transition, creating an animation discontinuity. This is acceptable for the MVP because the ring's purpose is static stage awareness, not smooth progress indication.

 ## Follow-up

 If smooth cross-boundary animation is desired, replace conic-gradient with an SVG `<circle>` using `stroke-dasharray` + `stroke-dashoffset`.
