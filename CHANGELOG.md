# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- Training Ready Phase: 5-second preparation phase with breathing animation and countdown before the first contraction.
- Training Feedback Lifecycle: persistent completion result view after the last relaxation.
- READY_DURATION_MS (5000) and FEEDBACK_DURATION_MS (0) constants for lifecycle timing.
- `ready` and `feedback` voice script keys for stage-enter speech in coach mode (zh-CN and en-US).
- `ready` and `feedback` MuscleSphere animation variants with slow breathing and release-to-calm transitions.
- `ready` and `feedback` display phase timing in `calcDisplayPhaseTiming` for TimerDisplay rendering.
- Unit tests for ready/feedback phase timing, action hints, and countdown events.
- Updated ADR-005 with the extended training lifecycle design.
- Three explicit voice-assistance choices: 静音, 节奏提示, and 语音教练.
- Independent final 3-second or 5-second countdown for both audible modes.
- Automatic migration from legacy `concise`, `guided`, and `countdown` mode values to `coach`.
- Unit coverage for mode migration, coach/rhythm routing, countdown independence, recording fallback, prompt timing, and boundary countdown playback.
- Seven packaged Mandarin coach recordings for ready, contraction start, contraction sustain, release, pause, resume, and completion.
- Collapsible training-plan panel with a compact `contract-hold-relax × rounds` summary.
- Persistent completion result view with explicit "再次训练" and "完成" actions.
- Voice settings now include a simplified first-level panel with advanced options tucked away.

### Changed

- Training state machine: `start()` now enters `ready` phase instead of `contract`.
- Training state machine: last `relax` transitions to a persistent `feedback` result view instead of going directly to `finished`.
- Ready and feedback phases now rely on their lifecycle prompts instead of duplicate stage-enter voice prompts.
- Feedback phase now uses a dedicated `feedback` status and waits for user confirmation instead of advancing automatically.
- Total session duration now includes READY_DURATION_MS and active training time; feedback is no longer counted as timed exercise.
- `actionHint` and `phaseHint` accept and return values for `ready` and `feedback` phases.
- `actionHint` now accepts `idle` and returns an empty hint for the idle state.
- App.tsx hint text now uses `actionHint(state.phase)` for all running phases.
- Replaced the previous five-mode voice selector with three behaviorally distinct modes.
- Countdown is now an enhancement rather than a voice mode.
- The settings panel no longer exposes unsupported concise/guided variants, next-stage announcements, pitch, or language switching.
- Fixed Mandarin prompts now use the new `public/audio/zh-CN/` recording set.
- Recorded playback failure now falls back to system speech before a non-verbal cue.
- Contract, hold, and relax coaching prompts now play immediately on phase entry.
- Contract and hold display copy now appears as separate "开始收缩" and "保持住" phases.
- Default voice settings now use coach mode with the final 3-second countdown enabled and round announcements disabled.
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
- Ready and feedback lifecycle prompts are no longer interrupted by duplicate stage-enter prompts.
- Countdown announcements no longer run during the feedback completion phase.
- Final countdown cues are no longer dropped when playback starts near the phase boundary.
- Hold-stage coaching no longer lags behind the phase transition.
- Pause/stop controls no longer appear during the feedback completion celebration.
- Completion feedback no longer overlays stale stage text, timer, progress, or settings controls.
- Removed the unimplemented "查看训练历史" action from the completion feedback card.
- Service-worker cache writes no longer reuse an already-consumed `Response` body.
- New service-worker versions clear obsolete caches, activate immediately, and refresh the page once after taking control.
- Added the modern `mobile-web-app-capable` metadata while retaining iOS-specific metadata.

### Verification Pending

- iOS and Android real-device audio QA remains outstanding.
- The collapsible training-plan panel has not yet received component or real-device interaction testing.
- The new service-worker update and stale-cache recovery path still needs deployment verification on GitHub Pages.

### Verified

- `npm test`
- `npm run build`
- `npm run lint`
