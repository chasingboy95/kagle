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
 | **Training Engine** | Complete | All state transitions implemented. Tick loop, pause compensation, round progression, voice events, wake lock. Engine tests: 1 test for countdown helper. |
 | **Timer** | Complete | Phase countdown, round display, overall progress. Logic in `useKegelEngine` with display via `TimerDisplay` and `ProgressBar`. |
 | **Rounds** | Complete | Count, cycle, finish detection. Display in `TimerDisplay` and `TrainingStatus`. |
 | **MuscleSphere** | Complete | 9-layer SVG animation with all 4 stages. Reduced motion, pause freeze, progress ring. See MUSCLE_SPHERE_MOTION_SPEC.md for known gaps. |
 | **SVG Assets** | Partial | 9 SVGs exist and render. Missing group IDs. Three copies exist with differences between root and src. Needs cleanup. |
 | **Progress Ring** | Partial | Implemented and functional. Known limitation: conic-gradient cannot animate smoothly across stage boundaries. |
 | **Ripple Component** | Untested | `src/components/Ripple.tsx` exists but is not imported by `App.tsx`. Possibly dead code or intended for future use. |
 | **Voice Controller** | Complete | Queue, priority, dedup, expiry, pause/stop clearing. 6 tests passing. |
 | **Voice Speech Adapter** | Complete | Web Speech API wrapper. 1 test for unavailable-API fallback. |
 | **Voice Audio Adapter** | Complete | Web Audio tone synthesis. No dedicated test file (tested via VoiceController tests). |
 | **Voice Haptic Adapter** | Complete | `navigator.vibrate` wrapper. No dedicated test file. |
 | **Voice Scripts** | Complete | zh-CN and en-US for all event types. Both concise and guided variants. |
 | **Voice Settings** | Complete | Persistence, validation, fallback. 3 tests passing. |
 | **Voice Settings Panel** | Complete | Full UI: mode selector, volume, rate, countdown-from, announce-round, haptics, preview, unsupported warning. |
 | **localStorage Persistence** | Complete | Voice settings persisted. Training config not persisted (intentional). |
 | **Haptics** | Partial | Implemented for contract, relax, complete. No vibration for other events. |
 | **Tests** | Partial | 4 test files (11 tests) all passing. Coverage limited to voice and countdown helper. No engine integration tests, no component tests, no E2E tests. |
 | **Accessibility** | Partial | ARIA labels on key components. Reduced motion supported. Tab order and screen reader testing not done. |
 | **Mobile Responsiveness** | Untested | Tailwind utility classes suggest mobile-first design. No responsive testing documented. |
 | **Browser Compatibility** | Untested | Build tooling (Vite, Tailwind) targets modern browsers. No explicit compatibility testing on Safari/Firefox/iOS/Android. |
 | **CI/CD** | Complete | GitHub Actions workflow: install → build → deploy to GitHub Pages on push to main. |
 
 ## Test Results (2026-07-23)
 
 ```text
 $ bun run test
 ✓ 4 files, 11 tests, all passing
 
 $ bun run build
 ✓ Build successful, 444 modules transformed, dist/ output
 
 $ bun run lint
 Not yet run — requires oxlint setup verification
 ```
 
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
 
 - 8 files, ~500 lines total
 - 6 test files in `src/voice/` + 1 in `src/hooks/` for voice assistant
 - Test files: `VoiceController.test.ts`, `SpeechSynthesisAdapter.test.ts`, `voiceSettings.test.ts`
 - All 11 tests passing
 
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
 | MuscleSphere | ~320 | 0 | Complete |
 | TimerDisplay | ~50 | 0 | Complete |
 | ProgressBar | ~30 | 0 | Complete |
 | TrainingStatus | ~40 | 0 | Complete |
 | ControlButtons | ~115 | 0 | Complete |
 | ConfigPanel | ~100 | 0 | Complete |
 | VoiceSettingsPanel | ~155 | 0 | Complete |
 | Ripple | ~50 | 0 | Untested (unused) |
 | App | ~120 | 0 | Complete |
