 # Feature Specification

 **Last verified against repository:** 2026-07-27

 ## Training Configuration

 - **Status**: Complete
 - **Expected behavior**: User can adjust contract time (3–20s), hold time (1–30s), relax time (3–20s), and repetitions per set (1–50) via stepper controls.
 - **Current implementation**: `ConfigPanel` component renders four `Stepper` controls with increment/decrement buttons. Ranges defined in `CONFIG_RANGE` constant. Disabled during active training (`disabled={isActive}`). Updates are instant via `updateConfig()`.
 - **Edge cases**: Clamping on min/max ensures values cannot go out of range. Controls disabled during running/paused states.
 - **Acceptance**: All ranges match `CONFIG_RANGE` values. Defaults from `DEFAULT_CONFIG`: 3s contract, 3s hold, 3s relax, 10 repetitions. These 10 repetitions together form one set. The internal `rounds` property is retained for compatibility.

 ## Start

 - **Status**: Complete
 - **Expected behavior**: Begins the training session. Resets all counters. Enters ready phase (5s breathing preparation), then contract phase of round 1. Emits `training-ready` then `round-start` then enters first `stage-enter` (contract).
 - **Current implementation**: `start()` in `useKegelEngine` increments sessionId, resets counters, sets status to `running`, emits voice events, enters contract phase via `enterPhase('contract')`, and starts the tick interval.
 - **Edge cases**: `voice.unlock()` (preloads audio context) is called by the App's `handleStart` before calling engine `start()`.
 - **Acceptance**: Engine state status becomes 'running', phase becomes 'contract', currentRound becomes 1.

 ## Pause

 - **Status**: Complete
 - **Expected behavior**: Pauses the training timer. Current phase time is preserved. Stops voice playback and clears pending countdowns.
 - **Current implementation**: `pause()` sets status to 'paused', records `pauseStartedAt`. Engine tick skips processing when status is not 'running'. VoiceController stops playback and clears queue on pause event.
 - **Edge cases**: Cannot pause if already paused or idle. Timing correction on resume accounts for pause duration exactly.
 - **Acceptance**: `state.status` becomes 'paused'. Phase remaining time stops decreasing.

 ## Resume

 - **Status**: Complete
 - **Expected behavior**: Resumes training from exactly where it was paused. Phase remaining time is preserved.
 - **Current implementation**: `resume()` calculates `pauseDuration = performance.now() - pauseStartedAt`, adds it to `phaseStartedAt` and `totalPausedMs`. Sets status back to 'running'. Emits `resumed` voice event.
 - **Edge cases**: Cannot resume if not paused. Resume does not replay the full stage prompt.
 - **Acceptance**: `state.status` becomes 'running'. `phaseRemainingMs` continues from where it was.

 ## Stop

 - **Status**: Complete
 - **Expected behavior**: Immediately ends the training session. Resets to idle state. Stops all voice playback and clears the voice queue.
 - **Current implementation**: `stop()` calls `stopTick()`, emits `stopped` voice event, resets engine internals to `createInitialEngine()`, sets rendering state to idle.
 - **Edge cases**: Stop transitions to idle instantly (no cooldown animation). Stopped event has highest priority in VoiceController.
 - **Acceptance**: Engine returns to idle. Renders "准备开始". All voice silenced.

 ## Repetitions and Sets

 - **Status**: Complete
 - **Expected behavior**: Each repetition progresses contract → hold → relax. After the configured repetitions are complete, the user enters the feedback phase for completion review. The repetition count is displayed in TimerDisplay and TrainingStatus.
 - **Current implementation**: `advance()` cycles through phases. The internal round counter increments at the end of relax before re-entering contract. When `nextRound >= config.rounds`, the engine enters feedback and emits `completed`.
 - **Edge cases**: `rounds = 1` works: one full repetition then feedback. When the user finishes the result view, the engine returns to idle.
 - **Acceptance**: Repetitions count correctly; the UI consistently uses repetition count; completion view shows one-set summary. The last repetition triggers the one-set completion view.

 ## Contract

 - **Status**: Complete
 - **Expected behavior**: First phase of each round. Duration equals `config.contractTime` seconds. MuscleSphere renders contract animation. Voice says "收紧" (concise) or "轻轻收紧盆底肌，并向上提" (guided).
 - **Current implementation**: Entered via `enterPhase('contract')` after round-start or after relax phase of previous round. Voice event `stage-enter` with stage 'contract' emitted with phase remaining milliseconds. Countdown events emitted during last N seconds.
 - **Edge cases**: If contract time is 0 (not possible from UI — min is 3) but handled by tick logic: if duration = 0, `advance()` fires immediately.
 - **Acceptance**: Contract phase animates and voices correctly.

 ## Hold

 - **Status**: Complete
 - **Expected behavior**: Second phase of each round. Duration equals `config.holdTime` seconds. MuscleSphere transitions from contract to hold (maintains contraction with tremor animation). Voice says "保持" (concise) or "保持张力，继续自然呼吸" (guided).
 - **Current implementation**: Entered via `advance()` when contract phase completes. Hold variants on MuscleSphere layers include tremor micro-motion on fibers, core, and fascia.
 - **Edge cases**: Hold time min is 1 second. Countdown works during hold.
 - **Acceptance**: Hold phase animates with tremor. Voice announces correctly.

 ## Relax

 - **Status**: Complete
 - **Expected behavior**: Third and final phase of each round. Duration equals `config.relaxTime` seconds. MuscleSphere animates release overshoot and return to neutral. Voice says "放松" (concise) or "缓慢释放，让肌肉完全放松" (guided).
 - **Current implementation**: Entered via `advance()` when hold phase completes. Relax transition uses stage-duration-dependent timing (max(0.6s, stageDuration * 0.75)).
 - **Edge cases**: Overshoot bounds: relax scale from ~0.82 to ~1.015 temporarily before settling at 1.0. Core overshoot: 0.72 → 1.04 → 1.0.
 - **Acceptance**: Relax phase animates release. Voice announces correctly.

 ## Progress

 - **Status**: Partial
 - **Expected behavior**: Users can see overall workout progress (progress bar) and per-stage progress (progress ring on MuscleSphere).
 - **Current implementation**: `ProgressBar` component shows linear progress with spring animation. Progress ring on MuscleSphere shows `stageProgress` as SVG circle stroke-dasharray (shown during running). `TimerDisplay` shows countdown seconds.
 - **Edge cases**: When total duration is 0, progress bar shows 0%. When phase is idle, progress ring not shown.
 - **Missing**: SVG progress ring supports cross-boundary smooth animation; stage transitions no longer cause visual restart.
 - **Acceptance**: Progress tracking works.

 ## MuscleSphere

 - **Status**: Complete
 - **Expected behavior**: 9-layer SVG composited animation showing muscle tissue responding to contract, hold, and relax stages. Respects reduced motion. Supports pause freeze.
 - **Current implementation**: See [MUSCLE_SPHERE_MOTION_SPEC.md](MUSCLE_SPHERE_MOTION_SPEC.md) and [SVG_ASSET_SPEC.md](SVG_ASSET_SPEC.md).
 - **Edge cases**: Reduced motion simplifies hold → contract (no tremor). Pause freezes each layer at stable contracted/relaxed target.
 - **Acceptance**: All four stages animate correctly.

 ## Voice Assistance

 - **Status**: Complete
 - **Expected behavior**: See [VOICE_ASSISTANT_SPEC.md](VOICE_ASSISTANT_SPEC.md).
 - **Current implementation**: 3 modes (off, sound-only, coach), zh-CN and en-US scripts, queue with priority, dedup, expiry, pause/stop clearing, haptic integration, localStorage persistence. Legacy 5-mode values migrate to coach automatically.

 ## Settings Persistence

 - **Status**: Complete
 - **Expected behavior**: Voice settings survive page reload. Training config does not persist (starts from defaults each time).
 - **Current implementation**: `loadVoiceSettings()` / `saveVoiceSettings()` in `voiceSettings.ts` use localStorage key `kegel.voice-settings.v1`. Validation on read: per-field type/range/enum checking. Storage blocked or corrupt handled gracefully (returns defaults).
 - **Edge cases**: localStorage disabled → returns defaults, writes silently fail.
 - **Acceptance**: Voice settings persist across page reloads.

 ## Reduced Motion

 - **Status**: Complete
 - **Expected behavior**: When user enables "Reduce motion" in OS accessibility settings, MuscleSphere simplifies: hold → contract (removes tremor), layer animations snap to first keyframe only.
 - **Current implementation**: `useReducedMotion()` from Framer Motion. `reducedStage()` maps hold→contract. `reducedLayerTarget()` extracts first value from each keyframe array. `reducedContainerTarget()` similarly.
 - **Edge cases**: Works on first load (hook returns correct value immediately). CSS transitions disabled.
 - **Acceptance**: Reduced motion respected.

 ## Haptics

 - **Status**: Partial
 - **Expected behavior**: Device vibrates on contract (40ms), relax (25ms), and completion ([35,80,35]) when haptics enabled and device supports vibration.
 - **Current implementation**: `HapticAdapter.trigger()` checks `navigator.vibrate` availability and settings toggle before vibrating.
 - **Edge cases**: Vibration not available → silently ignored. Toggle off → no vibration.
 - **Missing**: No vibration on round-start (intentional — too much vibration would be disruptive). HapticAdapter handles 3 event types currently (contract, relax, completion).
 - **Acceptance**: Haptics fire on supported devices when toggled on.

 ## Error and Unsupported-Platform Behavior

 - **Status**: Partial
 - **Expected behavior**: When APIs are unavailable (speech synthesis, audio context, vibration, localStorage, wake lock), the application degrades gracefully without crashing.
 - **Current implementation**: Every adapter has `isSupported()` and fallback logic. VoiceSettingsPanel shows warning when speech unsupported. Wake lock acquisition catches errors silently.
 - **Missing**: No explicit unsupported-browser error page or overlay. If nothing works, the timer still runs but without voice/animation on some layers.
 - **Acceptance**: Core timer functionality always works. Voice/animation/haptics degrade gracefully.
