 # Voice Assistant Specification

 **Last verified against repository:** 2026-07-23

 ## Overview

 The voice assistance module provides audio and haptic guidance synchronized with the training engine. It is implemented in `src/voice/` with a React binding in `src/hooks/useVoiceAssistant.ts`. It uses Web Speech API for speech, Web Audio API for tones, and `navigator.vibrate` for haptics.

 ## Guiding Principles

 - MuscleSphere must remain visual-only. The voice module must not enter or be referenced by `MuscleSphere.tsx`.
 - The voice module must not own an independent training timer. All voice events must originate from the training engine.
 - No microphone, voice recognition, audio upload, or remote TTS.

 ## Voice Modes

 | Mode | Speech | Tone Cues | Haptics | Countdown Numbers |
 |------|--------|-----------|---------|-------------------|
 | `off` | None | None | None | None |
 | `sound-only` | None | Yes | Yes | None |
 | `concise` | Yes (short) | Fallback only | Yes | None |
 | `guided` | Yes (full instruction) | Fallback only | Yes | None |
 | `countdown` | Yes (guided) | Fallback only | Yes | Yes (last 3 or 5s) |

 - **Implementation status**: All 5 modes are implemented and switchable via the settings panel.
 - **Edge case**: `sound-only` mode only plays tones via `AudioFileAdapter`, never speaks. `SpeechSynthesisAdapter.speak()` is a no-op in this mode.

 ## Settings

 Settings are stored in `VoiceSettings` interface (`src/voice/types.ts`) and persisted via localStorage under key `kegel.voice-settings.v1`.

 | Setting | Type | Default | Range |
 |---------|------|---------|-------|
 | `enabled` | boolean | `true` | — |
 | `mode` | enum | `'concise'` | off, sound-only, concise, guided, countdown |
 | `language` | enum | `'zh-CN'` | zh-CN, en-US |
 | `volume` | number | `0.7` | 0–1 |
 | `rate` | number | `0.95` | 0.5–1.5 (UI), 0.5–2 (validation) |
 | `pitch` | number | `1` | 0–2 |
 | `voiceName` | string | undefined | Optional — exact voice name |
 | `countdownFrom` | union | `3` | 0 (off), 3 (last 3s), 5 (last 5s) |
 | `announceRound` | boolean | `true` | — |
 | `announceNextStage` | boolean | `false` | — |
 | `hapticsEnabled` | boolean | `true` | — |

 - **Implementation status**: All settings are stored and loaded. Validation (`validateVoiceSettings`) performs per-field type/enum/range checking. Invalid fields fall back independently.
 - **Edge case**: `rate` UI slider is restricted to 0.5–1.5, but validation allows 0.5–2 for programmatic flexibility.

 ## Event Model

 The training engine emits `VoiceEvent` objects:

 ```typescript
 type VoiceEvent =
   | { type: 'training-ready' }
   | { type: 'stage-enter'; stage: MuscleStage }
   | { type: 'countdown'; stage: MuscleStage; seconds: number }
   | { type: 'round-start'; round: number; totalRounds: number }
   | { type: 'paused' }
   | { type: 'resumed' }
   | { type: 'completed' }
   | { type: 'stopped' };
 ```

 Each event is accompanied by a `VoiceEventContext`:

 ```typescript
 interface VoiceEventContext {
   sessionId: number;
   round: number;
   now: number;
   stageEndsAt: number;
   sequence?: number;
 }
 ```

 **Implementation status**: All 8 event types are emitted by the engine and handled by the controller.

 ## Queue Priorities

 | Event Type | Priority |
 |------------|----------|
 | `paused` | 500 (highest) |
 | `stopped` | 500 |
 | `stage-enter` | 400 |
 | `training-ready` | 300 |
 | `completed` | 300 |
 | `round-start` | 300 |
 | `resumed` | 300 |
 | `countdown` | 200 (lowest) |

 Queue is sorted by priority descending, then by creation time ascending.

 ## Deduplication Rules

 - Each event gets a deterministic ID: `session-{id}:round-{round}:{type}:{detail}`.
 - Example: `session-2:round-1:contract:countdown:3`.
 - `seen` set stores all processed IDs; duplicates are dropped silently.
 - `stage-enter` clears previous stage-enter and countdown items from queue.
 - `paused` stops playback and clears the queue.
 - `stopped` stops playback and clears the queue.

 **Implementation status**: All dedup rules are implemented and tested (see VoiceController.test.ts).

 ## Expiration Rules

 - All items expire at `context.now + 30_000` (30 seconds).
 - Countdown items expire at `context.stageEndsAt` (end of current stage).
 - Expired items are filtered on `drain()` before each playback.

 ## Pause/Resume/Stop Behavior

 - **Pause**: `stage-enter` event triggers `stopPlayback()` (calls `speechSynthesis.cancel()`) and `removeStageItems()` (removes pending stage-enter and countdown items). Then `paused` event is enqueued.
 - **Resume**: `resumed` event is enqueued for standard play.
 - **Stop**: `stopped` event triggers `stopPlayback()` and clears the entire queue, then enqueues the stopped event itself.
 - **On pause, the current utterance is stopped**. The application does not attempt mid-sentence resume; instead it plays "继续训练" / "Continue training" on resume.

 **Implementation status**: All implemented. Note: `SpeechSynthesisAdapter.pause()`/`resume()` are implemented but never called by `VoiceController` due to the mid-sentence-inconsistency problem.

 ## Web Speech API Constraints

 - Voice quality varies across browsers and OS versions.
 - `getVoices()` loads asynchronously; voices list may be empty on first call.
 - `voiceschanged` event listener is registered to refresh the cache.
 - Voice selection prefers exact `voiceName` match, then language match, then browser default.
 - iOS Safari requires user gesture before first `speak()` — handled via `voice.unlock()` on start/preview.
 - `cancel()` is used for stop/pause; `pause()`/`resume()` are available but unreliable.
 - `SpeechSynthesisAdapter.isSupported()` returns `false` when API is unavailable (server-side rendering, old browsers, some Firefox configs).

 ## Haptic Integration

 - Contract: `navigator.vibrate(40)` — 40ms pulse.
 - Relax: `navigator.vibrate(25)` — 25ms brief tap.
 - Complete: `navigator.vibrate([35, 80, 35])` — 35ms pulse, 80ms gap, 35ms pulse.
 - Only fires when `settings.hapticsEnabled === true` and `navigator.vibrate` is available.
 - No haptics for round-start, countdown, pause, resume, or stop (intentional — minimal vibration).

 ## Accessibility

 - Voice provides an alternative channel for stage information (visual already present).
 - Haptics provide an additional channel for contract/relax/completion events.
 - Settings panel uses semantic form elements: `<select>`, `<input type="range">`, `<fieldset>`, `<legend>`.
 - Disabled controls are visibly dimmed and not interactive.
 - Preview button lets users test voice without starting a workout.
 - Unsupported-browser warning ("当前浏览器不支持语音合成") shown when speech API is unavailable.

 ## Privacy

 - No microphone access required or requested.
 - No audio data recorded or transmitted.
 - Voice settings stored in localStorage only.
 - No analytics or tracking.

 ## Unsupported-Platform Fallback

 | API Unavailable | Behavior |
 |-----------------|----------|
 | `speechSynthesis` | Mode falls back to sound-only; warning shown in panel |
 | `AudioContext` | Tones silently skipped; speech still works if available |
 | `navigator.vibrate` | Haptics silently skipped |
 | `localStorage` | Settings read/write silently fail; defaults used |
 | `WakeLock` | Training continues without screen lock |
 | All audio APIs | Timer still works; visual cues remain |

 ## Current Implementation Status

 All voice module functionality is implemented and tested:

 - [x] 5 voice modes
 - [x] zh-CN and en-US scripts (en-US scripts defined but language selector not exposed in MVP UI)
 - [x] Priority queue with dedup and expiry
 - [x] Pause/stop queue clearing
 - [x] Stage-enter replaces pending stage-enter/countdown items
 - [x] Countdown dedup
 - [x] Haptic integration
 - [x] Settings persistence with validation
 - [x] Preview functionality
 - [x] Unsupported-API fallback
 - [x] VoiceSettingsPanel UI
 - [x] 4 test files (11 tests) all passing

 ## Planned Pre-recorded Audio Upgrade Path

 The `AudioFileAdapter` is named for file-based playback but currently synthesizes tones via Web Audio API. The `VoicePlaybackAdapter` interface allows replacing `AudioFileAdapter` with a file-based implementation without changing `VoiceController`.

 ```typescript
 export interface VoicePlaybackAdapter {
   preload(): Promise<void>;
   speak(options: SpeakOptions): Promise<void>;
   playCue(cue: SoundCue): Promise<void>;
   stop(): void;
   pause(): void;
   resume(): void;
   isSupported(): boolean;
 }
 ```

 A future `PreRecordedAudioAdapter` would implement the same interface, loading `.mp3` or `.wav` files from `public/audio/` instead of synthesizing tones.
