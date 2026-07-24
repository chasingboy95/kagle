# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- Training Ready Phase: 5-second preparation phase with breathing animation and countdown before the first contraction.
- Training Feedback Lifecycle: 6-second completion celebration phase with release animation after the last relaxation.
- READY_DURATION_MS (5000) and FEEDBACK_DURATION_MS (6000) constants for lifecycle timing.
- `ready` and `feedback` voice script keys for stage-enter speech in coach mode (zh-CN and en-US).
- `ready` and `feedback` MuscleSphere animation variants with slow breathing and release-to-calm transitions.
- `ready` and `feedback` display phase timing in `calcDisplayPhaseTiming` for TimerDisplay rendering.
- Unit tests for ready/feedback phase timing, action hints, and countdown events.
- Updated ADR-005 with the extended training lifecycle design.
- Three explicit voice-assistance choices: 静音, 节奏提示, and 语音教练.
- Independent final 3-second or 5-second countdown for both audible modes.
- Automatic migration from legacy `concise`, `guided`, and `countdown` mode values to `coach`.
- Delayed sustain coaching cue around 35% into the hold phase.
- Unit coverage for mode migration, coach/rhythm routing, countdown independence, recording fallback, and sustain cancellation.
- Seven packaged Mandarin coach recordings for ready, contraction start, contraction sustain, release, pause, resume, and completion.
- Collapsible training-plan panel with a compact `contract-hold-relax × rounds` summary.

### Changed

- Training state machine: `start()` now enters `ready` phase instead of `contract`.
- Training state machine: last `relax` transitions to `feedback` (6s) before `finished`, instead of going directly to `finished`.
- Total session duration now includes READY_DURATION_MS and FEEDBACK_DURATION_MS.
- `actionHint` and `phaseHint` accept and return values for `ready` and `feedback` phases.
- App.tsx hint text now uses `actionHint(state.phase)` for all running phases.
- Replaced the previous five-mode voice selector with three behaviorally distinct modes.
- Countdown is now an enhancement rather than a voice mode.
- The settings panel no longer exposes unsupported concise/guided variants, next-stage announcements, pitch, or language switching.
- Fixed Mandarin prompts now use the new `public/audio/zh-CN/` recording set.
- Recorded playback failure now falls back to system speech before a non-verbal cue.
- The sustain prompt no longer plays immediately on entering the internal hold phase.
- Default voice settings now use coach mode with countdown and round announcements disabled.
- Countdown feedback now uses soft ascending synthesized tones instead of the legacy spoken-number MP3 files.
- Rhythm cues now use distinct two-note contraction and release patterns, with quieter single-note sustain feedback.
- The training-plan panel now matches the voice-assistance accordion style and is collapsed by default.
- Service-worker navigation requests now use network-first loading so deployments do not retain stale hashed asset references.

### Fixed

- Coach and guided selections no longer produce identical behavior under different labels.
- Countdown no longer implicitly selects guided scripts.
- Rhythm mode no longer plays full coach sentences.
- Rhythm mode cue keys now match the coach-oriented cue model, restoring audible feedback.
- GitHub Pages audio paths remain `BASE_URL` aware.
- Service-worker cache writes no longer reuse an already-consumed `Response` body.
- New service-worker versions clear obsolete caches, activate immediately, and refresh the page once after taking control.
- Added the modern `mobile-web-app-capable` metadata while retaining iOS-specific metadata.

### Verification Pending

- Full test, build, and lint commands have not yet been rerun after this refactor.
- iOS and Android real-device audio QA remains outstanding.
- The collapsible training-plan panel has not yet received component or real-device interaction testing.
- The new service-worker update and stale-cache recovery path still needs deployment verification on GitHub Pages.
