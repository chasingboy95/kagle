 # MuscleSphere Motion Specification

 **Last verified against repository:** 2026-07-23

 ## Overview

 `MuscleSphere.tsx` renders a 9-layer SVG composited animation representing pelvic floor muscle tissue. The component accepts `stage` (idle/contract/hold/relax), `stageProgress`, `paused`, `showProgressRing`, `stageDurationMs`, and `size` props. It uses Framer Motion for all animation.

 ## Design Principles (Enforced in Code)

 1. **No hue-rotate** — color shifting via hue-rotate creates an unnatural neon/game orb appearance. Use brightness, saturate, and contrast only.
 2. **No neon or game-energy-orb aesthetic** — the visualization should evoke organic muscle tissue.
 3. **No large global rotation** — the container does not rotate. Per-layer rotation is limited to subtle angles (≤5°).
 4. **No synchronized animation on every layer** — layer animation periods and phase offsets are deliberately varied.
 5. **Ripple mainly appears during relax** — the ripple layer is most visible during relaxation.
 6. **Hold trembling is limited to fibers, core, and fascia** — these three layers carry micro-motion during hold.
 7. **Progress ring is optional and visually subordinate** — thin conic-gradient ring with muted gray tones.

 ## Nine SVG Layers (Z-Order Bottom to Top)

 | # | Layer | Z-index | Role |
 |---|-------|---------|------|
 | 1 | shadow | `z-0` | Depth, tissue thickness, lift height |
 | 2 | aura | `z-10` | Overall energy and tension |
 | 3 | ripple | `z-20` | Breathing rhythm and release wave |
 | 4 | fascia | `z-30` | Outer connective tissue wrap and elasticity |
 | 5 | fluid | `z-40` | Internal soft tissue flow |
 | 6 | fibers | `z-50` | Muscle fiber contraction and tension |
 | 7 | core | `z-60` | Power concentration in the center |
 | 8 | highlight | `z-70` | Glass-like surface curvature and gloss |
 | 9 | particles | `z-80` | Subtle vitality and directional energy |

 ## Stage Parameters and Animation

 ### Idle (Resting)

 Gentle breathing motion. All layers have slow, asynchronous oscillation.

 | Layer | Scale animation | Opacity | Period |
 |-------|----------------|---------|--------|
 | Container | 1.0, y: 0 | — | Spring settle |
 | Shadow | 1.0, y: 8, blur 3px | 0.34 | Spring settle |
 | Aura | 0.99→1.03→0.99 | 0.18→0.28→0.18 | 5s |
 | Ripple | 1.0 | 0.04 (barely visible) | — |
 | Fascia | 1→1.008→1, rotate: 0→0.5→-0.3→0 | 0.58 | 8s |
 | Fluid | ScaleX/Y varied, x/y ~±1px, rotate ±0.4° | 0.74 | 5.5s |
 | Fibers | 1.0 | 0.6 | — |
 | Core | 0.99→1.03→0.99, filter brightness/saturate | 0.78→0.88→0.78 | 3.2s |
 | Highlight | 1→1.015→1 | 0.38→0.48→0.38 | 4.5s |
 | Particles | 1→1.018→1, rotate 0→0.8→0, x/y ±~0.8px | 0.32→0.46→0.32 | 6s |

 ### Contract (Active Squeeze)

 Concentric inward motion. Outer layers compress more than inner layers.

 - Container: scale 0.92, y: -12 (lift upward)
 - Effective screen scale (container × layer scale):
   - Fascia: 0.92 × 0.91 ≈ 0.84
   - Fluid: 0.92 × 0.88/0.93 (scaleX/Y) ≈ 0.81/0.86
   - Fibers: 0.92 × 0.82 ≈ 0.75
   - Core: 0.92 × 0.72 ≈ 0.66 (most compressed)
 - Transition: `CUBIC_EASE` (0.7s, bezier [0.22, 1, 0.36, 1])

 ### Hold (Sustain)

 Maintain contracted position with micro-tremor on selected layers.

 - Container: maintains 0.92 scale, y: -12
 - Tremor layers: fibers (0.9s cycle, x deviation ±~0.7px), core (1.2s cycle, scale 0.72→0.74), fascia (1.6s cycle, scale 0.91→0.915)
 - Other layers: static contracted pose
 - Tremor uses irregular keyframe sequences (e.g., `x: [0, 0.35, -0.45, 0.2, 0]`) to avoid mechanical vibration feel

 ### Relax (Release)

 Three-point release: contracted → overshoot → settle.

 - Container: scale [0.92, 1.015, 1], y: [-12, 1, 0]
 - Transition duration: `max(0.6, stageDurationMs/1000 * 0.75)` seconds
 - Time nodes: `[0, 0.65, 1]` — 65% for active release, 35% for overshoot damping
 - Overshoot limits per layer:
   - Container: 1.015 (1.5% overshoot)
   - Aura: 1.04
   - Ripple: 1.18 (most visible wave)
   - Core: 1.04
   - Particles: 1.03
   - Fibers: 1.025
 - The overshoot ensures the release does not appear to stop abruptly.

 ## Transition Parameters

 - **CUBIC_EASE**: `{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }` — used for contract and hold entry.
 - **SOFT_SPRING**: `{ type: 'spring', stiffness: 60, damping: 20, mass: 1.45 }` — used for idle-to-contract and relax-to-idle settling.
 - **Relax transition**: Duration scales with stage length (floor 0.6s). Ease is same cubic-bezier.

 ## Reduced Motion Behavior

 - `useReducedMotion()` from Framer Motion.
 - Hold stage simplified to contract (no tremor animation).
 - All layer keyframe series collapsed to first value only (no looping breathing).
 - Container animation collapsed to first keyframe value.

 ## Pause Behavior

 - When `paused={true}`, all layers animate to a stable contracted or relaxed target pose.
 - `PAUSED_CONTAINER_TARGET` defines per-stage target values.
 - `pausedLayerTarget()` maps each layer to its static contracted/relaxed pose.
 - No continuous animation runs during pause.
 - On resume, variants reattach and animation continues from current position.

 ## Progress Ring

 - Implemented as a conic-gradient `div` with 2px padding over a dark inner circle.
 - Colors: `rgba(148,163,184, 0.08)` for filled portion, `rgba(148,163,184, 0.02)` for unfilled.
 - Only shown when `showProgressRing === true` (App sets this when `state.status === 'running'`).
 - Limitation: conic-gradient cannot animate smoothly across the 0→360 boundary; stage transitions cause visual restart.

 ## Performance Constraints

 - `willChange: 'transform, opacity, filter'` set on fibers, core, fascia (continuous hold animation).
 - `willChange: 'transform, opacity'` set on shadow, ripple (stage transitions).
 - Other layers use only `willChange: 'transform'` or none.
 - All layers have `backfaceVisibility: 'hidden'` to prevent flicker in Safari.
 - Size default: 288px (can be overridden via `size` prop, used at 320px in original design doc).

 ## Current Implementation Gaps

 1. **No inline fiber paths**: `fibers.svg` is a static SVG. A TODO block in the component describes future inline per-fiber contraction with center-point formula `C - P_i` and amplitude 4–12px.
 2. **Container borderRadius animation absent**: The original design doc included `borderRadius` variation for organic shape deformation. Current implementation does not animate border radius.
 3. **Aura color shifting limited**: Removed `hue-rotate` from aura. Only `saturate` and `brightness` remain.
 4. **Ripple component overlap**: `src/components/Ripple.tsx` is a separate background ripple effect (two concentric `motion.div` elements) that is NOT rendered by MuscleSphere. It exists in the component tree but is not imported by App.tsx. Investigate whether it is dead code or intended for future use.
 5. **Relax duration scaling**: Uses `stageDurationMs * 0.75` capped at min 0.6s. This is applied to container scale/y transitions only. Layer-specific relax durations are fixed at 1.8s for most layers, regardless of stage duration.
 6. **Optional ambient glow background**: App.tsx has a `motion.div` with radial gradient and slow ambient animation. Not part of MuscleSphere, but contributes to the visual ecosystem.
 7. **CUBIC_EASE bezier array type cast**: `[0.22, 1, 0.36, 1] as [number, number, number, number]` is used throughout due to Framer Motion's array overload. This is a type-level workaround, not a logic issue.
 8. **PAUSED_CONTAINER_TARGET for relax is copied incorrectly**: The `relax` entry in `PAUSED_CONTAINER_TARGET` appears to be a copy-paste of `auraVariants.relax` — likely a bug. During pause in relax stage, the container should maintain a relaxed pose, not animate through aura-like opacity/filter keyframes.
 9. **Fibers variant filter uses `contrast(1.08)` in contract, but no filter in relax entry**: The `relax` variant for fibers does not animate filter back to default — it transitions opacity and scale but filter stays at whatever the browser interpolates. This is likely unintentional but may not be visually noticeable.
