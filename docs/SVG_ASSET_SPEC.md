 # SVG Asset Specification

 **Last verified against repository:** 2026-07-23

 ## General Rules

 All SVG assets in this project must follow:

 - Pure SVG (no embedded raster images).
 - Transparent background.
 - `512×512` viewBox (`viewBox="0 0 512 512"`).
 - Center at `(256, 256)` — all shapes should be positioned relative to this center.
 - Gradients defined in `<defs>`.
 - Meaningful group IDs (e.g., `<g id="fiber-bundle-a">`) for potential future inline reference.
 - No raster content (`<image>` with JPEG/PNG).
 - No bitmap filters (`<feGaussianBlur>`, `<feDropShadow>`, etc.).
 - No baked-in shadow (shadow is a separate layer controlled by the animation engine).
 - Each SVG must be an independently animatable layer (no two major visual elements in one file).

 ## Asset Inventory

 There are three locations containing copies of the nine SVG files:

 1. **`src/assets/muscle-sphere/`** — Imported by `MuscleSphere.tsx` (the source of truth for the build).


 **⚠️ The root and `src/` copies have differences.** Verified on 2026-07-23:
 - fascia.svg: differs between root and src copies
 - fibers.svg: differs between root and src copies
 - fluid.svg: differs between root and src copies (src has `id="fluidGradA"`, root has `id="tissueGradCore"`)
 - highlight.svg: differs between root and src copies

 ## Layer-by-Layer Specification

 ### aura.svg

 | Property | Value |
 |----------|-------|
 | File path (src) | `src/assets/muscle-sphere/aura.svg` |
 | Purpose | Outermost glow representing overall energy |
 | Expected group ID | Not present (no `<g id>`) — improvement opportunity |
 | Comment header | `<!-- 1. AURA -->` |
 | Current quality | Good; uses radial gradient with pink tones |
 | Known modifications | Replace `stop-color="#FF8FA3"` with mute palette; add group ID |

 ### core.svg

 | Property | Value |
 |----------|-------|
 | File path (src) | `src/assets/muscle-sphere/core.svg` |
 | Purpose | Central power core, deepest contraction |
 | Expected group ID | Not present |
 | Comment header | `<!-- 5. CORE -->` |
 | Current quality | Good; concentric ring structure with radial gradients |
 | Known modifications | Add group ID `id="core"` |

 ### fascia.svg

 | Property | Value |
 |----------|-------|
 | File path (src) | `src/assets/muscle-sphere/fascia.svg` |
 | Purpose | Outer connective tissue layer |
 | Expected group ID | Not present |
 | Comment header | `<!-- 2. FASCIA -->` (src copy) |
 | Current quality | Good; network of curved paths with linear gradient stroke |
 | Known modifications | **Differs between root and src copies** — reconcile. Add group ID. |

 ### fibers.svg

 | Property | Value |
 |----------|-------|
 | File path (src) | `src/assets/muscle-sphere/fibers.svg` |
 | Purpose | Individual muscle fiber paths |
 | Expected group ID | `id="fibers"` with individual `<g>` for each fiber bundle |
 | Comment header | `<!-- 4. FIBERS -->` (src copy) |
 | Current quality | **Differs between root and src copies**. Root copy uses `stop-color="#C97086"`, src uses `#D97C93`. |
 | Known modifications | Future: convert to inline React SVG component with per-fiber contraction (see TODO in MuscleSphere.tsx). For now, add group ID. |

 ### fluid.svg

 | Property | Value |
 |----------|-------|
 | File path (src) | `src/assets/muscle-sphere/fluid.svg` |
 | Purpose | Internal soft tissue, fluid-like fill |
 | Expected group ID | Not present |
 | Comment header | `<!-- 3. FLUID -->` (src copy) |
 | Current quality | **Differs significantly**: src has gradient `id="fluidGradA"`, root has `id="tissueGradCore"`. Src uses `stop-color="#E0FBFF"`, root uses `#F2B4BC`/`#E092A0`. The src copy appears to be the correct version (blue-ish fluid) as the root has pink tissue colors that belong to other layers. |
 | Known modifications | Reconcile root copy with src copy. Add group ID. |

 ### highlight.svg

 | Property | Value |
 |----------|-------|
 | File path (src) | `src/assets/muscle-sphere/highlight.svg` |
 | Purpose | Glass-like surface reflection |
 | Expected group ID | Not present |
 | Comment header | `<!-- 8. HIGHLIGHT -->` (src copy) |
 | Current quality | **Differs between root and src copies.** Src uses `stop-opacity="0.55"` at 0%, root uses `0.5`. Src has three stops, root has two. |
 | Known modifications | Reconcile copies. Add group ID. |

 ### particles.svg

 | Property | Value |
 |----------|-------|
 | File path (src) | `src/assets/muscle-sphere/particles.svg` |
 | Purpose | Floating particle motes, subtle vitality |
 | Expected group ID | Not present |
 | Comment header | `<!-- 7. PARTICLES -->` (src and root have different numbering: root says 7, src says 7 as well — consistent) |
 | Current quality | Good; multiple small circles with radial gradient |
 | Known modifications | Add group ID `id="particles"` |

 ### ripple.svg

 | Property | Value |
 |----------|-------|
 | File path (src) | `src/assets/muscle-sphere/ripple.svg` |
 | Purpose | Ripple/wave rings for relax and breathing |
 | Expected group ID | Not present |
 | Comment header | `<!-- 6. RIPPLES -->` (src and root both say 6) |
 | Current quality | Good; concentric circles with linear gradient stroke |
 | Known modifications | Add group ID `id="ripple"` |

 ### shadow.svg

 | Property | Value |
 |----------|-------|
 | File path (src) | `src/assets/muscle-sphere/shadow.svg` |
 | Purpose | Drop shadow beneath the sphere |
 | Expected group ID | Not present |
 | Comment header | `<!-- 9. SHADOW -->` |
 | Current quality | Good; single blurred ellipse with radial gradient |
 | Known modifications | Add group ID `id="shadow"` |

 ## SVG Issues Summary

 2. **Inconsistent file contents**: fascia.svg, fibers.svg, fluid.svg, and highlight.svg differ between root and src directories. The src copies appear to be the newer versions (correct comment numbering, adjusted colors).
 3. **Missing group IDs**: None of the SVGs have `<g id="...">` attributes. This limits future inline manipulation and debugging.
 4. **Missing semantic structure**: Layers could benefit from consistent `id` attributes on major shapes for potential CSS or JS targeting.
 5. **Comment numbering inconsistency**: Some SVGs have `<!-- N. NAME -->` comments with inconsistent numbering between root and src copies.
 6. **`script_content.txt`**: Stray file at repository root (32 lines). Not related to SVGs but worth noting as repository cleanliness issue.
