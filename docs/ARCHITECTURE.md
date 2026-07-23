 # Architecture

 **Last verified against repository:** 2026-07-23

 ## High-Level Module Map

 ```
 ┌──────────────────────────────────────────────────────┐
 │                    App.tsx                           │
 │  ┌──────────┐  ┌──────────────┐  ┌───────────────┐  │
 │  │ ConfigPanel│  │ VoiceSettings│  │ ControlButtons│  │
 │  │           │  │   Panel      │  │               │  │
 │  └──────────┘  └──────────────┘  └───────────────┘  │
 │  ┌──────────┐  ┌──────────────┐  ┌───────────────┐  │
 │  │ TimerDisplay│ │ TrainingStatus│ │  ProgressBar   │  │
 │  └──────────┘  └──────────────┘  └───────────────┘  │
 │  ┌────────────────────────────────────────────────┐  │
 │  │                MuscleSphere                    │  │
 │  │  9× motion.img (shadow..particles) + ring      │  │
 │  └────────────────────────────────────────────────┘  │
 │                                                      │
 │  ┌──────────────┐     ┌─────────────────────┐       │
 │  │useKegelEngine│────▶│  useVoiceAssistant   │       │
 │  │  (timing)    │     │  (voice controller)  │       │
 │  └──────┬───────┘     └──────────┬──────────┘       │
 │         │                        │                   │
 │         │ events                 │ settings          │
 │         ▼                        ▼                   │
 │  ┌──────────────────────────────────────────┐        │
 │  │           VoiceController                │        │
 │  │  VoiceQueue  →  SpeechSynthesisAdapter    │        │
 │  │                AudioFileAdapter           │        │
 │  │                HapticAdapter              │        │
 │  └──────────────────────────────────────────┘        │
 └──────────────────────────────────────────────────────┘
 ```

 ## Current Directory Structure

 ```
 /
 ├── index.html                   # Vite entry HTML (13 lines)
 ├── package.json                 # Dependencies: React 19, Framer Motion, Tailwind, Vite
 ├── bun.lock                     # Lockfile
 ├── vite.config.js               # Vite config: base /kagle/, Tailwind, React plugin
 ├── tsconfig.json                # TypeScript strict mode, path aliases @/
 ├── .gitignore
 ├── .oxlintrc.json               # Oxlint rules: React hooks, export components
 ├── .github/workflows/deploy.yml # CI: bun install → build → deploy to gh-pages
 ├── README.md                    # Current: sparse, contains voice architecture notes
 ├── AGENTS.md                    # Outdated: describes app as single vanilla-html file
(reference/outdated)
 ├── script_content.txt           # Stray file (unknown origin)
 │
 ├── src/
 │   ├── main.tsx                 # React entry, render <App />
 │   ├── App.tsx                  # Root component, wires engine + voice + all UI
 │   ├── index.css                # Tailwind import only
 │   ├── vite-env.d.ts            # Vite client type reference
 │   │
 │   ├── types/
 │   │   └── training.ts          # TrainingConfig, EngineState, TrainingStatus, TrainingPhase
 │   │
 │   ├── hooks/
 │   │   ├── useKegelEngine.ts       # Core training state machine + timing
 │   │   ├── useKegelEngine.test.ts  # Tests for getCountdownEvent
 │   │   ├── useVoiceAssistant.ts    # React binding for VoiceController
 │   │   └── useInterval.ts          # Generic setInterval hook (unused by engine)
 │   │
 │   ├── utils/
 │   │   └── time.ts              # formatSeconds, calcTotalDuration, phaseHint, actionHint
 │   │
 │   ├── components/
 │   │   ├── MuscleSphere.tsx     # 9-layer SVG animation (core visual)
 │   │   ├── TimerDisplay.tsx     # Phase name + countdown + round display
 │   │   ├── ProgressBar.tsx      # Linear overall progress bar
 │   │   ├── TrainingStatus.tsx   # Title, streak, round info
 │   │   ├── ControlButtons.tsx   # Start/Pause/Resume/Stop/Restart
 │   │   ├── ConfigPanel.tsx      # Training config steppers
 │   │   ├── VoiceSettingsPanel.tsx # Voice mode/settings UI
 │   │   └── Ripple.tsx           # Separate background ripple effect
 │   │
 │   ├── voice/
 │   │   ├── types.ts             # VoiceEvent, VoiceSettings, VoicePlaybackAdapter, queue types
 │   │   ├── VoiceController.ts   # Priority queue, event dedup, expiry, play scheduling
 │   │   ├── VoiceController.test.ts # Queue, dedup, pause/stop, expiry tests
 │   │   ├── SpeechSynthesisAdapter.ts  # Web Speech API wrapper
 │   │   ├── SpeechSynthesisAdapter.test.ts # Unavailable-API fallback test
 │   │   ├── AudioFileAdapter.ts  # Web Audio API tone synthesis
 │   │   ├── HapticAdapter.ts     # navigator.vibrate wrapper
 │   │   ├── voiceScripts.ts      # zh-CN/en-US concise/guided scripts + resolve functions
 │   │   ├── voiceSettings.ts     # Defaults, validation, localStorage persistence
 │   │   └── voiceSettings.test.ts # Validation and fallback tests
 │   │
 │   └── assets/
 │       ├── hero.png             # Hero image (unused?)
 │       ├── vite.svg             # Vite logo
 │       └── muscle-sphere/       # 9 SVG files (source of truth for build)
 │           ├── aura.svg
 │           ├── core.svg
 │           ├── fascia.svg
 │           ├── fibers.svg
 │           ├── fluid.svg
 │           ├── highlight.svg
 │           ├── particles.svg
 │           ├── ripple.svg
 │           └── shadow.svg
 │
 ├── assets/muscle-sphere/        # Copy of SVGs (may differ from src/ copy)
 ├── public/muscle-sphere/        # Public static copy of SVGs (unreferenced in imports)
 └── dist/                        # Build output (gitignored)
 ```

 ## Main Data Flow

 ```
 User Input (ConfigPanel/ControlButtons)
   │
   ▼
 useKegelEngine  ── state ──▶  App.tsx  ── props ──▶  UI Components
   │                                  │
   │ VoiceEvent                       │
   ▼                                  ▼
 useVoiceAssistant              MuscleSphere (visual-only)
   │ (emit via voice.emit)
   ▼
 VoiceController (queue, dedup, priority, expiry)
   │
   ├─▶ SpeechSynthesisAdapter (Web Speech API)
   ├─▶ AudioFileAdapter (Web Audio tones)
   └─▶ HapticAdapter (navigator.vibrate)
 ```

 ## State Ownership

 | State | Owner | Persists? |
 |-------|-------|-----------|
 | TrainingConfig | `useKegelEngine` (via `useState`) | No (resets on reload) |
 | EngineState | `useKegelEngine` (via `useState`, derived from `EngineInternals` ref) | No |
 | VoiceSettings | `useVoiceAssistant` (via `useState`) | Yes (localStorage `kegel.voice-settings.v1`) |
 | EngineInternals | `useRef` inside `useKegelEngine` | No |
 | VoiceQueue | `VoiceController` instance (ref-held) | No |

 ## Timing Ownership

 - **Authoritative clock**: `performance.now()` used for all phase timing calculations.
 - **Tick**: `setInterval` at 100ms started/stopped by `useKegelEngine`. Only runs when status is 'running'.
 - **Phase transition**: Determined by comparing elapsed time against phase duration. When `elapsed >= duration`, `advance()` is called immediately on that tick.
 - **Pause compensation**: On resume, `phaseStartedAt` is adjusted by the pause duration so that `now - phaseStartedAt` accurately reflects active running time.
 - **Voice countdown**: Derived from `phaseRemainingMs` in `buildState()`, not from an independent timer.

 ## Visual Layer Architecture

 See [MUSCLE_SPHERE_MOTION_SPEC.md](MUSCLE_SPHERE_MOTION_SPEC.md) for detailed layer description.

 ## Voice Architecture

 See [VOICE_ASSISTANT_SPEC.md](VOICE_ASSISTANT_SPEC.md) for detailed voice module description.

 ## Persistence

 - Only voice settings are persisted, in localStorage under key `kegel.voice-settings.v1`.
 - Training configuration is **not persisted** — each page load starts from `DEFAULT_CONFIG`.
 - No backend, no API calls, no user data stored outside localStorage.

 ## Dependency Boundaries

 ```
 useKegelEngine  ────── depends on ──────▶  types/training.ts, utils/time.ts
                           ignores           voice module (except emitting events)

 useVoiceAssistant ──── depends on ──────▶  VoiceController, adapters, voiceSettings, types
                           ignores           training types, engine internals

 MuscleSphere ──────── depends on ──────▶  9 SVG files, framer-motion
                           ignores           training engine, voice module

 VoiceController ───── depends on ──────▶  adapters, voiceScripts, types
                           ignores           React, DOM, training engine
 ```

 ## Known Architectural Risks

 1. **setInterval drift**: `setInterval` accumulates drift over time on background tabs (browsers throttle to 1s+). If a user switches tabs during a workout, timing may lag significantly. Mitigation: not yet addressed. Consider `requestAnimationFrame` or Web Worker timer.
 2. **Three SVG directories**: SVGs exist in `src/assets/muscle-sphere/`, `assets/muscle-sphere/`, and `public/muscle-sphere/` with subtle differences. This is confusing and risks editing the wrong copy.
 3. **Stray files**: `script_content.txt` at repo root with no known purpose.
 4. **useInterval hook unused**: `src/hooks/useInterval.ts` exists but is not imported by any component. The engine manages its own interval via ref.
 5. **Ripple component parallel to MuscleSphere**: `src/components/Ripple.tsx` renders a floating ripple effect that is separate from the `ripple.svg` layer inside MuscleSphere. Having two ripple visualizations may be redundant.
 6. **AGENTS.md is stale**: Describes a single-file vanilla HTML project that no longer exists.
 7. **盆底肌动画设计文档.md is design reference**: Contains the original design with `hue-rotate`, container rotation, and other effects that were intentionally removed during implementation. Should be treated as historical reference, not current spec.

 ## Future Extension Points

 1. **Pre-recorded audio**: `AudioFileAdapter` is already named for file-based playback; `playCue()` currently generates tones via Web Audio but could load `.mp3`/`.wav` files instead.
 2. **Inline fiber SVG**: `MuscleSphere.tsx` has a TODO block describing how to replace `fibers.svg` with an inline React component for per-fiber contraction animation.
 3. **Training history/logging**: The engine already has `sessionId` and event sequence; a subscriber could persist workout data.
 4. **PWA/service worker**: All assets are static; adding a service worker would enable reliable offline use.
 5. **Web Worker timer**: Moving the 100ms tick to a Web Worker would prevent background-tab throttling.
