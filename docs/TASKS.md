# Task List

**Last verified against repository:** 2026-07-27

## In Progress

- Verify the simplified voice-assistance modes on real iOS and Android devices.
- Verify the revised completion view and simplified voice settings on a real mobile device.

## Next (Priority Order)

1. **Voice assistance real-device QA**
  - Verify "语音教练" uses the seven new Mandarin recordings.
  - Verify "节奏提示" never speaks full sentences.
  - Verify countdown works independently in both audible modes.
  - Verify sustain and contraction prompts play promptly on phase entry.
  - Verify recording failure falls back to system speech.

2. **Cross-browser manual testing**: desktop Chrome/Safari/Firefox, iOS Safari, Android Chrome.

## Backlog

- Accessibility audit.
- Performance profiling.
- Replace the conic progress ring with an SVG circle if smoother interpolation is needed.
- Add English recorded prompts before exposing a language selector.
- Investigate the unused Ripple component and `hero.png`.
- Evaluate a Web Worker for background-tab timing.
- Implement TrainingFeedback summary component with session statistics.

## Blocked

- None currently.

## Completed

- [x] **Expanded component coverage**: Added VoiceSettingsPanel tests (mode selector, countdown radios, volume/rate sliders, disable states, unsupported warning) and MuscleSphere tests (rendering for all 6 stages, 9 SVG layers, size prop, progress ring, reduced motion mode).
- [x] Removed hard-coded streak and completion-quality claims until real training history exists.
- [x] Changed completion feedback to show only objective session duration and repetition counts.
- [x] Added GitHub Actions quality gates for tests, lint, TypeScript checks, and production build before deployment.
- [x] Added a reusable `typecheck` package script and completion-summary tests.
- [x] Added fake-clock training-engine integration tests for lifecycle progression, pause/resume compensation, early stop, and completion.
- [x] Added React Testing Library coverage for the plan and completion components.
- [x] Added a Playwright complete-training smoke test and made it a deployment gate.
- [x] Corrected the training-unit terminology: one contract→hold→relax cycle is one repetition, and all configured repetitions together count as one set.
- [x] Updated the plan summary, live progress, voice announcement, settings copy, and completion summary to use repetitions rather than sets.
- [x] Added voice-script tests that prevent repetition announcements from regressing to set/round terminology.
- [x] Applied user-level trial feedback from the GitHub Pages build.
- [x] Changed completion feedback into a persistent result view that hides the training timer, progress, settings, and stage copy.
- [x] Added a completion action so users can leave the result view intentionally.
- [x] Changed the default voice countdown from off to the final 3 seconds for new users.
- [x] Simplified the voice panel so common controls show first and advanced controls are tucked into "高级设置".
- [x] Split contract and hold display copy into "开始收缩" and "保持住" so the UI matches 3-3-3 timing.
- [x] Removed feedback time from total training duration because completion is now user-confirmed rather than timed training.
- [x] Fixed ready and feedback lifecycle prompts so they are not interrupted by duplicate stage-enter speech.
- [x] Prevented countdown announcements during the feedback completion phase.
- [x] Added a short playback grace window so final countdown cues are not dropped at the phase boundary.
- [x] Removed delayed hold prompt scheduling so sustain coaching plays immediately on phase entry.
- [x] Added a dedicated `feedback` status so pause/stop controls are hidden during completion feedback.
- [x] Removed the unimplemented training-history action from the completion card.
- [x] Reran `npm test`, `npm run build`, and `npm run lint` after the lifecycle fixes.
- [x] Training Ready Phase - 5s breathing preparation before first contraction.
- [x] Training Feedback Lifecycle - persistent completion result view after last relaxation.
- [x] Updated state machine: idle → ready → contract → hold → relax → (repeat) → feedback → user confirmation → idle or restart.
- [x] MuscleSphere animations for ready (slow breathing) and feedback (release/calm).
- [x] Voice scripts for ready and feedback stage-enter events.
- [x] Display timing and action hints for both new phases.
- [x] Adjusted total duration to include ready and feedback phases.
- [x] Unit tests for new phase timing, display, and countdown.
- [x] ADR-005 updated with lifecycle design.
- [x] Voice assistance modes simplified to three user-facing choices:
  - 静音 (`off`)
  - 节奏提示 (`sound-only`)
  - 语音教练 (`coach`)
- [x] Legacy `concise`, `guided`, and `countdown` settings migrate automatically to `coach`.
- [x] Countdown is now an independent 0/3/5-second option for both audible modes.
- [x] Fixed Mandarin coach events use the new seven-file recording set.
- [x] Recorded playback failure now falls back to system speech before a non-verbal cue.
- [x] Contract, hold, and relax prompts play immediately on phase entry.
- [x] Unit tests updated for migration, coach/rhythm behavior, independent countdown, asset routing, speech fallback, prompt timing, and boundary countdown playback.
- [x] Sprint 1 continuous training UX.
- [x] Basic PWA support with GitHub Pages subpath handling and iOS standalone metadata.
- [x] Training engine, timer, progress, MuscleSphere animation, settings persistence, wake lock, and GitHub Pages deployment.
