# Task List

**Last verified against repository:** 2026-07-24

## In Progress

- Verify the simplified voice-assistance modes on real iOS and Android devices.
- Run the complete test, build, and lint commands after the voice-mode refactor.

## Next (Priority Order)

1. **Voice assistance real-device QA**
  - Verify “语音教练” uses the seven new Mandarin recordings.
  - Verify “节奏提示” never speaks full sentences.
  - Verify countdown works independently in both audible modes.
  - Verify the delayed sustain cue is cancelled by pause, stop, or relaxation.
  - Verify recording failure falls back to system speech.

2. **Consolidate SVG asset copies**
  - Remove duplicate SVGs in `assets/muscle-sphere/` and `public/muscle-sphere/`.
  - Keep `src/assets/muscle-sphere/` as the single source of truth.

3. **Add training engine integration tests**
  - Test start, pause, resume, stop, restart, phase timing, and pause compensation.

4. **Add component and E2E tests**
  - Cover `VoiceSettingsPanel` mode selection and countdown controls.
  - Add a complete training-flow smoke test.

## Backlog

- Cross-browser manual testing: desktop Chrome/Safari/Firefox, iOS Safari, Android Chrome.
- Accessibility audit.
- Performance profiling.
- Replace the conic progress ring with an SVG circle if smoother interpolation is needed.
- Add English recorded prompts before exposing a language selector.
- Investigate the unused Ripple component and `hero.png`.
- Evaluate a Web Worker for background-tab timing.

## Blocked

- None currently.

## Completed

- Voice assistance modes simplified to three user-facing choices:
  - 静音 (`off`)
  - 节奏提示 (`sound-only`)
  - 语音教练 (`coach`)
- Legacy `concise`, `guided`, and `countdown` settings migrate automatically to `coach`.
- Countdown is now an independent 0/3/5-second option for both audible modes.
- Fixed Mandarin coach events use the new seven-file recording set.
- Recorded playback failure now falls back to system speech before a non-verbal cue.
- The sustain prompt is delayed to approximately 35% of the hold phase and cancelled when the phase changes.
- Unit tests updated for migration, coach/rhythm behavior, independent countdown, asset routing, speech fallback, and delayed sustain cancellation.
- Sprint 1 continuous training UX.
- Basic PWA support with GitHub Pages subpath handling and iOS standalone metadata.
- Training engine, timer, progress, MuscleSphere animation, settings persistence, wake lock, and GitHub Pages deployment.
