 # ADR-002: SVG Layer Architecture for MuscleSphere

 ## Status

 Accepted

 ## Context

 MuscleSphere needs to animate a pelvic floor muscle visualization through four stages (idle, contract, hold, relax). The original design document (盆底肌动画设计文档.md) proposed pure-SVG layer compositing with Framer Motion, but included `hue-rotate` filters, container rotation, `borderRadius` animation, and large rotation angles on some layers.

 During implementation these were removed or reduced to align with the product's restrained, medical-health aesthetic.

 ## Decision

 The current implementation uses nine stacked SVG `<img>` elements, each controlled independently by Framer Motion `motion.img` with per-layer Variants.

 Key design rules (enforced in code):

 1. **No hue-rotate** – color shifting via hue-rotate creates an unnatural neon/game-energy-orb appearance. Use brightness, saturate, and contrast only.
 2. **No neon or game-energy-orb aesthetic** – the visualization should evoke organic muscle tissue, not science fiction.
 3. **No large global rotation** – the container does not rotate. Per-layer rotation is limited to subtle angles (≤5°).
 4. **No synchronized animation on every layer** – layer animation periods and phase offsets are deliberately varied to avoid a collective "breathing ball" effect.
 5. **Ripple mainly appears during relax** – the ripple layer is most visible during relaxation (scale overshoot + opacity pulse). During contract it fades out.
 6. **Hold trembling is limited to fibers, core, and fascia** – these three layers carry micro-motion during the hold phase. Other layers hold static.
 7. **Progress ring is optional and visually subordinate** – a thin conic-gradient ring outside the sphere; uses muted gray tones, not bright accent colors.

 ## Alternatives Considered

 1. **Inline SVG with animated path attributes** – provides precise per-fiber control but increases complexity. The `fibers.svg` layer is annotated with a TODO for future inline migration.
 2. **Canvas/WebGL rendering** – unsuitable for this level of detail given the small number of layers; over-engineering for the MVP.

 ## Consequences

 Positive:
 - Layer isolation means each SVG can be authored and debugged independently.
 - Framer Motion handles Reduced Motion and Spring physics automatically.
 - No WebGL or canvas setup overhead.

 Negative:
 - Nine simultaneous `motion.img` elements may stress low-end devices during hold tremor animations.
 - `willChange` is manually set on animation-critical layers (fibers, core, fascia, shadow, ripple) to hint GPU composition.

 ## Follow-up

 Consider replacing `fibers.svg` with an inline React SVG component that renders individual fiber paths with deterministic center-point contraction (see TODO in MuscleSphere.tsx).
