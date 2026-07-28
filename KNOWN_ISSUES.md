# Known Issues

**Last updated:** 2026-07-28

## P1 — Functional Issues

### iOS PWA haptic audio fallback stayed suspended

- **Status**: Resolved in code; real-device revalidation pending (2026-07-28)
- **Severity**: High
- **Affected area**: `src/voice/HapticAdapter.ts`, `src/voice/VoiceController.ts`
- **Description**: The fallback `AudioContext` was not included in the start-button unlock path, so iOS could reject its later resume attempt from a timer-driven stage event. Silent voice mode also discarded events before haptic routing.
- **Resolution**: Lazily create and resume the fallback context from `voice.unlock()` on start/resume/restart, route haptics independently of audible guidance, and deduplicate repeated events.

### PAUSED_CONTAINER_TARGET relax entry is incorrect

- **Status**: Resolved (2026-07-23)
- **Severity**: Medium
- **Affected area**: `src/components/MuscleSphere.tsx`, `PAUSED_CONTAINER_TARGET` relax variant
- **Description**: The `relax` entry in `PAUSED_CONTAINER_TARGET` appears to be a copy-paste from `auraVariants.relax` (contains `scale: [0.94, 1.04, 1]`, `opacity: [0.34, 0.15, 0.2]`, `filter: [...]` with a transition). When pausing during relax stage, the container would animate through aura-like keyframes instead of settling at a stable relaxed pose.
- **Reproduction**: Pause during relax phase. The container div (not just the aura layer) animates through aura's relax keyframes.
- **Resolution**: Replaced the copied keyframe object with the stable relaxed target `scale: 1, y: 0`.

### fibers variant relax does not animate filter back to default

- **Status**: Open
- **Severity**: Low
- **Affected area**: `src/components/MuscleSphere.tsx`, `fibersVariants.relax`
- **Description**: The relax variant for fibers transitions `scale`, `opacity`, and `filter` but the filter is missing from the relax entry's transition — it will be interpolated by browser but the explicit key doesn't animate `filter` back to default. This is likely unintentional but may not be visually noticeable.
- **Reproduction**: Visual inspection during contract→relax transition on fibers layer.
- **Workaround**: None needed.
- **Planned resolution**: Add explicit filter animation to fibersVariants.relax.

## P2 — Architectural Issues

### Three copies of SVG assets with inconsistencies

- **Status**: Resolved (2026-07-28)
- **Severity**: Medium
- **Affected area**: `src/assets/muscle-sphere/`, `assets/muscle-sphere/`, `public/muscle-sphere/`
- **Description**: SVG files exist in three locations. Four files differ between `src/assets/muscle-sphere/` and `assets/muscle-sphere/`: fascia.svg, fibers.svg, fluid.svg, highlight.svg. The `src/` copy is the authoritative one (used by imports). The other two directories risk confusion and stale copies.
- **Workaround**: Only edit SVGs in `src/assets/muscle-sphere/`.
- **Resolution**: Duplicate `assets/muscle-sphere/` and `public/muscle-sphere/` directories no longer exist; only `src/assets/muscle-sphere/` remains.

### AGENTS.md describes wrong project architecture

- **Status**: Open
- **Severity**: Medium
- **Affected area**: `AGENTS.md`
- **Description**: AGENTS.md describes the project as a single-file vanilla HTML/CSS/JS application. The actual project is a React + TypeScript + Vite application with component tree, hooks, and a voice module.
- **Workaround**: Follow `docs/ARCHITECTURE.md` for accurate understanding.
- **Planned resolution**: Rewrite AGENTS.md to match current architecture.
- **Status**: Resolved (2026-07-28)
- **Resolution**: AGENTS.md has been rewritten to describe the actual React + TypeScript + Vite architecture.

### Ripple component not imported

- **Status**: Open
- **Severity**: Low
- **Affected area**: `src/components/Ripple.tsx`
- **Description**: `Ripple.tsx` renders two concentric `motion.div` elements with breathing animation. It is not imported by `App.tsx` or any other component. It may be dead code or intended for future integration into MuscleSphere.
- **Workaround**: None.
- **Planned resolution**: Investigate and either integrate or remove.

### useInterval hook unused

- **Status**: Open
- **Severity**: Low
- **Affected area**: `src/hooks/useInterval.ts`
- **Description**: A generic `setInterval` hook exists but is not imported anywhere. The engine manages its own interval via ref.
- **Workaround**: None.
- **Planned resolution**: Remove or document intended use.

### stray `script_content.txt` file

- **Status**: Open
- **Severity**: Low
- **Affected area**: `script_content.txt` at repository root
- **Description**: A 32-line text file with unknown origin and purpose. Not referenced by any code.
- **Workaround**: None.
- **Status**: Resolved (2026-07-28)
- **Resolution**: `script_content.txt` has been removed.

### `hero.png` unreferenced

- **Status**: Open
- **Severity**: Low
- **Affected area**: `src/assets/hero.png`
- **Description**: PNG image file at `src/assets/hero.png` is not imported or referenced by any component.
- **Workaround**: None.
- **Status**: Resolved (2026-07-28)
- **Resolution**: `src/assets/hero.png` no longer exists in the repository.

## P3 — Design/UX Issues

### Progress ring conic-gradient cannot animate smoothly

- **Status**: Open (accepted limitation per ADR-004)
- **Severity**: Low
- **Affected area**: `src/components/MuscleSphere.tsx`, progress ring
- **Description**: Conic-gradient restarts from 0° on each stage transition. No smooth animation across the 0→360 boundary.
- **Workaround**: Use progress bar (linear) for overall progress tracking.
- **Planned resolution**: Replace with SVG `stroke-dasharray` circle if smooth animation is desired.

### English voice scripts defined but not selectable

- **Status**: Open
- **Severity**: Low
- **Affected area**: `src/voice/voiceScripts.ts`, `src/components/VoiceSettingsPanel.tsx`
- **Description**: en-US scripts are defined in voiceScripts.ts and the setting model includes `language: VoiceLanguage`, but VoiceSettingsPanel does not have a language selector.
- **Workaround**: None (en-US is not usable from the UI).
- **Planned resolution**: Add language picker to VoiceSettingsPanel.

### Dynamic round and en-US speech still depend on platform TTS

- **Status**: Open
- **Severity**: Low
- **Affected area**: `src/voice/VoiceController.ts`, `src/voice/SpeechSynthesisAdapter.ts`
- **Description**: Packaged MP3 files cover fixed zh-CN prompts only. Dynamic round announcements and all en-US speech still depend on browser/OS voices, so availability and quality vary by platform.
- **Workaround**: Use fixed zh-CN prompts or sound-only mode where platform speech is unreliable.
- **Planned resolution**: Evaluate packaged or deterministically generated assets if these variants require consistent voices.

### HTML audio playback can be blocked by autoplay policy

- **Status**: Open
- **Severity**: Medium
- **Affected area**: `src/voice/PreRecordedAudioAdapter.ts`
- **Description**: Browsers may reject `HTMLAudioElement.play()` until audio has been unlocked by a user gesture. Start/preview are user-initiated and preload assets, and preview attempts playback immediately, but device policies differ.
- **Workaround**: Start training or use preview through an explicit tap; failed local playback falls back to a tone when available.
- **Planned resolution**: Validate and document behavior through the cross-device manual test matrix.

### Pre-generated voice assets are not automatically reproducible

- **Status**: Open
- **Severity**: Low
- **Affected area**: `public/audio/voice/`
- **Description**: The 18 Mandarin neural-TTS MP3 files are checked in, but their generation provider/workflow is not automated in the repository. Script changes require manual regeneration and review.
- **Workaround**: Regenerate affected files manually with the documented 24 kHz, 48 kbps mono format.
- **Planned resolution**: Document a reproducible licensed generation workflow if ongoing script iteration requires it.

### Speech voice listener has no disposal path

- **Status**: Open
- **Severity**: Low
- **Affected area**: `src/voice/SpeechSynthesisAdapter.ts`
- **Description**: The adapter registers a `voiceschanged` listener but does not expose `dispose()` to remove it. The current app creates a long-lived adapter, so practical impact is limited, but repeated construction could retain listeners.
- **Workaround**: Reuse the existing long-lived adapter instance.
- **Planned resolution**: Add disposal only if adapter lifecycle becomes dynamic.

## P4 — Testing Gaps

### No training engine integration tests

- **Status**: Resolved 2026-07-26
- **Severity**: High
- **Affected area**: `src/hooks/useKegelEngine.ts`
- **Resolution**: Fake-clock tests now cover the complete lifecycle, pause/resume compensation, early stop, and completion reset. Playwright covers a complete browser training flow.

### Limited component tests

- **Status**: Open
- **Severity**: Medium
- **Affected area**: All components in `src/components/`
- **Description**: ConfigPanel and TrainingFeedback now have React Testing Library coverage. MuscleSphere and VoiceSettingsPanel still need automated rendering and interaction tests.
- **Workaround**: Manual testing.
- **Planned resolution**: Add Vitest + React Testing Library tests.

### No cross-device voice testing documented

- **Status**: Open
- **Severity**: Medium
- **Affected area**: Voice playback and all features
- **Description**: No completed real-device test matrix is recorded for Chrome, Safari, Firefox, iOS Safari, or Android Chrome. In particular, local MP3 autoplay/unlock, Web Speech fallback, interruption, and output routing still need manual verification.
- **Workaround**: Manual testing per browser.
- **Planned resolution**: Run cross-browser test matrix and document results.

### Background tab timing drift untested

- **Status**: Open
- **Severity**: Medium
- **Affected area**: `src/hooks/useKegelEngine.ts`, timer tick
- **Description**: `setInterval` is throttled by browsers in background tabs (typically 1s min interval). This can cause timing drift. No mitigation implemented.
- **Workaround**: Keep the browser tab active during workouts.
- **Planned resolution**: Evaluate Web Worker or `requestAnimationFrame` with delta-time tracking.

### Hardware sleep during workout

- **Status**: Open
- **Severity**: Low
- **Affected area**: `src/hooks/useKegelEngine.ts`, Wake Lock
- **Description**: Wake Lock API may not prevent sleep on all devices. If device sleeps, elapsed time includes sleep period on resume, potentially skipping phases.
- **Workaround**: None.
- **Planned resolution**: Add sleep-detection and pause-on-wake logic.

## Resolved on 2026-07-24

### Feedback completion controls

- **Status**: Resolved
- **Severity**: Medium
- **Affected area**: `src/hooks/useKegelEngine.ts`, `src/App.tsx`, `src/components/ControlButtons.tsx`
- **Description**: The feedback completion phase previously kept `status: 'running'`, so pause/stop controls remained visible during the completion celebration.
- **Resolution**: Feedback now uses the dedicated `feedback` status while the engine tick still advances it to `finished`; App treats feedback as active for config locking, and ControlButtons hides the running controls.

### Duplicate ready and feedback voice prompts

- **Status**: Resolved
- **Severity**: High
- **Affected area**: `src/hooks/useKegelEngine.ts`, `src/voice/VoiceController.ts`
- **Description**: Ready and feedback lifecycle prompts could be immediately interrupted by matching `stage-enter` events.
- **Resolution**: The engine no longer emits `stage-enter` voice events for ready and feedback; those lifecycle moments use `training-ready` and `completed` prompts only.

### Feedback phase countdown

- **Status**: Resolved
- **Severity**: Medium
- **Affected area**: `src/hooks/useKegelEngine.ts`
- **Description**: Countdown events could be emitted during the completion feedback phase.
- **Resolution**: `getCountdownEvent` now suppresses countdowns for `feedback`, with unit coverage updated.
