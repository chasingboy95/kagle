# Implementation Status

**Last verified against repository:** 2026-07-23

## Status Legend

- **Complete**: Implemented and tested.
- **Partial**: Implemented but has known gaps or missing edge cases.
- **Planned**: Not yet implemented; design exists.
- **Mocked**: Placeholder implementation without real behavior.
- **Blocked**: Cannot proceed due to external dependency.
- **Untested**: Implemented but no automated or documented manual tests.

## Subsystem Status

| Subsystem | Status | Reason |
|-----------|--------|--------|
| **Training Engine** | Partial | State transitions, tick loop, pause compensation, round progression, voice events, and wake lock are implemented; only the countdown helper has automated coverage, so integration behavior is not yet verified. |
| **Timer** | Untested | Phase countdown, round display, and overall progress are implemented but lack integration/component tests. |
| **Rounds** | Untested | Count, cycle, finish detection, and display are implemented but lack integration/component tests. |
| **MuscleSphere** | Untested | The 9-layer SVG animation and four stages are implemented, but there is no automated or documented manual rendering test. See MUSCLE_SPHERE_MOTION_SPEC.md for known gaps. |
| **SVG Assets** | Partial | 9 SVGs exist and render. Missing group IDs. Three copies exist with differences between root and src. Needs cleanup. |
| **Progress Ring** | Partial | Implemented and functional. Known limitation: conic-gradient cannot animate smoothly across stage boundaries. |
| **Ripple Component** | Untested | `src/components/Ripple.tsx` exists but is not imported by `App.tsx`. Possibly dead code or intended for future use. |
| **Voice Controller** | Complete | Queue, priority, dedup, expiry, pause/stop clearing, local-first routing, interruption, and fallback have automated coverage. |
| **Voice Speech Adapter** | Complete | Web Speech API wrapper with an 8-second watchdog for missing `end`/`error`; automated tests cover interruption and timeout recovery. |
| **Pre-recorded Voice Adapter** | Complete | 18 packaged Mandarin MP3 files, `BASE_URL`-aware resolution, preload/play/stop, 8-second timeout, generation-safe interruption, and cue-mapped tone fallback are implemented and automatically tested. Countdown has no cue, so failed countdown audio is skipped silently. |
| **Voice Audio Adapter** | Complete | Web Audio tone synthesis, including fallback after local Mandarin playback failure only when `resolveCue()` maps that event; countdown has no cue fallback. |
| **Voice Haptic Adapter** | Untested | `navigator.vibrate` wrapper is implemented but has no dedicated automated or documented manual test. |
| **Voice Scripts** | Complete | zh-CN and en-US for all event types. Both concise and guided variants. |
| **Voice Settings** | Complete | Persistence, validation, fallback. 3 tests passing. |
| **Voice Settings Panel** | Untested | Full UI is implemented, but it has no component or documented manual test. |
| **localStorage Persistence** | Complete | Voice settings persisted. Training config not persisted (intentional). |
| **Haptics** | Partial | Implemented for contract, relax, complete. No vibration for other events. |
| **Tests** | Partial | Automated coverage includes pre-recorded playback/routing, controller fallback/interruption, Web Speech watchdog, settings, and countdown helpers. No engine integration tests, component tests, E2E tests, or completed cross-device manual QA. |
| **Accessibility** | Partial | ARIA labels on key components. Reduced motion supported. Tab order and screen reader testing not done. |
| **Mobile Responsiveness** | Untested | Tailwind utility classes suggest mobile-first design. No responsive testing documented. |
| **Browser Compatibility** | Untested | Build tooling (Vite, Tailwind) targets modern browsers. No explicit compatibility testing on Safari/Firefox/iOS/Android. |
| **CI/CD** | Complete | GitHub Actions workflow: install → build → deploy to GitHub Pages on push to main. |

## Test Results (2026-07-23)

```text
$ bun run test
✓ 6 files, 64 tests, all passing

$ bun run build
✓ Build successful, 446 modules transformed

$ bun run lint
✓ No lint findings
```

No cross-device manual QA has been completed.

## Subsystem Detail

### Training Engine (`src/hooks/useKegelEngine.ts`)

- 227 lines (excluding test file)
- States: idle → running → paused → finished
- Phases: contract → hold → relax
- Tick: 100ms `setInterval`
- Time source: `performance.now()`
- Voice events: 8 types emitted
- Wake Lock integration
- Tests: 1 countdown helper test

### Voice Module (`src/voice/`)

- Fixed `zh-CN` prompts use 18 MP3 files under `public/audio/voice/` (191,088 bytes / 186.6 KiB).
- `PreRecordedAudioAdapter` handles preload, playback, stop, failures, and an 8-second timeout.
- `VoiceController` uses local Mandarin first and a playback generation to suppress stale fallback after interruption.
- Dynamic round announcements and en-US continue to use `SpeechSynthesisAdapter`, which has an 8-second watchdog.
- Relevant tests: `PreRecordedAudioAdapter.test.ts`, `voiceAssets.test.ts`, `VoiceController.test.ts`, `SpeechSynthesisAdapter.test.ts`, and `voiceSettings.test.ts`.
- Real-device cross-browser/manual audio QA remains outstanding.

### MuscleSphere (`src/components/MuscleSphere.tsx`)

- ~320 lines
- 9 SVG layers
- 4 stages (idle, contract, hold, relax)
- Reduced motion support
- Pause freeze
- Progress ring (conic gradient)
- No automated tests

### SVGs (`src/assets/muscle-sphere/`)

- 9 files
- All comply with 512x512 viewBox
- All use `<defs>` gradients
- None have group IDs
- 3 copies exist across repo
- 4 files differ between root and src copies

### Components

| Component | Lines | Tests | Status |
|-----------|-------|-------|--------|
| MuscleSphere | ~320 | 0 | Untested |
| TimerDisplay | ~50 | 0 | Untested |
| ProgressBar | ~30 | 0 | Untested |
| TrainingStatus | ~40 | 0 | Untested |
| ControlButtons | ~115 | 0 | Untested |
| ConfigPanel | ~100 | 0 | Untested |
| VoiceSettingsPanel | ~155 | 0 | Untested |
| Ripple | ~50 | 0 | Untested (unused) |
| App | ~120 | 0 | Untested |
