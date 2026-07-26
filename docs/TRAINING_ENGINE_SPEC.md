 # Training Engine Specification

 **Last verified against repository:** 2026-07-24

 ## Overview

 The training engine is implemented in `src/hooks/useKegelEngine.ts`. It is a React hook that encapsulates a state machine with a 100ms tick loop. It owns all training timing and is the authoritative time source for the entire application.

 ## Training States

 ```
          ┌──────────────────────────────┐
          │                              │
          ▼                              │
     ┌─────────┐    start()     ┌─────────┐
     │  idle   │───────────────▶│ running │
     └────┬────┘                └────┬────┘
          │                          │
          │ stop()                   │ pause()
          │       ┌─────────┐        │
          │       │ paused  │◀───────┘
          │       └────┬────┘
          │            │ resume()
          │            ▼
          │       ┌─────────┐
          │       │ running │
          │       └────┬────┘
          │            │ (all repetitions complete)
          │            ▼
          │       ┌──────────┐
          │       │ feedback │
          │       └────┬─────┘
          │            │ finish()
          │            ▼
          └──────▶┌─────────┐
                  │  idle   │
                  └─────────┘
                      │
                      │ restart()
                      ▼
                  ┌─────────┐
                  │ running │ (new session)
                  └─────────┘
 ```

 ## Transition Rules

 | Transition | Condition | Actions |
 |------------|-----------|---------|
| idle → running | `start()` called | Reset counters, increment sessionId, emit `training-ready`, enter `ready` phase, start tick |
| running → paused | `pause()` called | Record `pauseStartedAt`, set status to paused, emit `paused` |
| paused → running | `resume()` called | Adjust `phaseStartedAt` by pause duration, add to `totalPausedMs`, emit `resumed` |
| running → feedback | All repetitions complete in `advance()` | Emit `completed`, enter `feedback` phase, stop tick, preserve session summary |
| feedback → idle | `finish()` called | Reset internals and return to the start screen |
| running → idle | `stop()` called | Stop tick, emit `stopped`, reset internals |
| paused → idle | `stop()` called | Same as above |
 | finished → running | `restart()` called | Same logic as start but without updating config |
 | idle → idle (same) | `stop()` called when already idle | No-op |

 ## Phase Progression within a Repetition

 ```
 ┌─────────────────────────────────────┐
 │       Repetition N                  │
 │  contract ──▶ hold ──▶ relax       │
 │     │           │         │         │
 │     │           │         │         │
 │     ▼           ▼         ▼         │
 │  emit        emit       emit        │
 │  stage-enter stage-enter stage-enter│
 │  (contract)  (hold)     (relax)     │
 │                                     │
 │  After relax: if round < totalRounds│
 │    → round++ → emit round-start     │
 │    → enter contract (next round)    │
 │  If round >= totalRounds → feedback │
 └─────────────────────────────────────┘
 ```

 ## Authoritative Time Source

 - **Clock**: `performance.now()` (monotonic, microsecond precision).
 - **Tick**: `setInterval` at 100ms, created/destroyed by `startTick()`/`stopTick()`.
 - **Phase timing**: `phaseStartedAt` recorded on phase entry. Elapsed is `now - phaseStartedAt`.
 - **Pause compensation**: On resume, `phaseStartedAt += pauseDuration`. This ensures that the computed elapsed time (`now - phaseStartedAt`) excludes the paused period.
 - **Render state**: Derived in `buildState()` on every tick, using the current `EngineInternals` ref snapshot.

 ## Repetition Progression

- `e.round`, `config.rounds`, and `currentRound` are legacy internal names. They represent repetitions, not sets.
- `e.round` is 0-indexed internally; `currentRound` in `EngineState` is the 1-indexed current repetition.
- One full contract→hold→relax cycle is one repetition. Completing all configured repetitions counts as one set.
 - `advance()` is called when elapsed time >= phase duration.
 - In relax phase, if `nextRound >= config.rounds`, engine enters `feedback` status and stops the tick.
 - `feedback` is a user-confirmed completion view, not a timed training phase.
 - Otherwise, round increments, `round-start` event emitted, and contract phase of next round begins.

 ## Pause and Resume Semantics

 - Pause records `performance.now()` as `pauseStartedAt`.
 - On resume, elapsed pause is calculated: `performance.now() - pauseStartedAt`.
 - `phaseStartedAt` is advanced by the pause duration so that tick calculations continue correctly.
 - `totalPausedMs` tracks cumulative paused time across multiple pause/resume cycles.
 - Voice: current playback stopped on pause; "继续训练" played on resume.

 ## Stop and Reset Behavior

- `stop()` clears the tick, emits `stopped`, and calls `createInitialEngine()` to reset all internals.
- `finish()` clears the completion view without emitting a stop event, then returns the UI to `idle`.
- Session ID is preserved (incremented only on `start()` and `restart()`).
 - No cooldown or fade-out animation — the state immediately becomes idle.
 - `restart()` reinitializes internals and immediately enters running state (bypassing idle).

 ## Background Tab Timing

 - **Current**: `setInterval` at 100ms is subject to browser throttling (typically 1s minimum interval in hidden tabs).
 - **Impact**: In a background tab, the tick fires less frequently. Phase `advance()` is called when elapsed >= duration, checked on each tick. The duration check is a comparison, not a count of ticks, so the phase transition still happens — but it may be up to 1s late.
 - **Mitigation**: Not yet implemented. See ADR-001 follow-up.

 ## Countdown Derivation

 - `getCountdownEvent()` is called on each tick inside `pushState()`.
 - It calculates `Math.ceil(phaseRemainingMs / 1000)` and checks if that value is ≤ `countdownFrom` and not already announced.
 - `announcedCountdowns` set tracks announced second-markers per phase (cleared on `enterPhase`).
 - This means countdowns are re-evaluated on every tick, but only emitted when the integer second changes.
- If countdownFrom is 0, no countdown events are generated.
- Countdown defaults to the final 3 seconds for new users.
- Countdown events are never emitted during `feedback`.

 ## Interaction with Voice and Animation

 - Voice events are emitted via `options.onVoiceEvent` callback.
 - Events carry `VoiceEventContext` including `sessionId`, `round`, `now`, `stageEndsAt`, `sequence`.
 - Voice and animation do not affect engine timing. If voice or animation is slow, engine continues regardless.

 ## Failure and Edge Cases

 | Scenario | Behavior |
 |----------|----------|
 | `pause()` called when not running | No-op |
 | `resume()` called when not paused | No-op |
 | `stop()` called when idle | Safe no-op (internals already at initial state) |
 | Phase duration = 0 | `advance()` called on next tick; effectively skips the phase |
 | Very large repetition count (e.g. 50 with 20s phases) | Works, total duration up to ~50 minutes |
 | Multiple rapid start/stop | Each session gets a unique `sessionId`; no state leakage |
 | Component unmount mid-workout | Cleanup effect stops the tick; settings are persisted; engine ref is lost |
 | `voice.emit` throws | Caught inside the engine's `emitVoice`, logged with `// Voice assistance must never interrupt the training engine.` |
 | Wake Lock API unavailable | Silent catch, training continues without screen lock |
 | `performance.now()` not available | Falls back to `Date.now()` per spec (though not explicitly polyfilled — runs in modern browser only) |
 | React Strict Mode double-mount | `useEffect` cleanup stops tick; startTick is idempotent via stopTick call; event ID dedup in VoiceController prevents duplicate voice |
 | Tick fires after stop (async race) | `eng.current.status` check at top of tick: if not 'running', skips processing |
 | Multiple pause/resume cycles | `totalPausedMs` accumulates correctly; phase timing adjusted each resume |
 | Session ID overflow | JS number can handle up to 2⁵³; increment per start/restart is safe |
 | Event sequence overflow | Starts at 0, increments per event; reset per session |
 | Hardware sleep during workout | Wake Lock attempts to prevent this. If sleep occurs, tick resumes on wake but elapsed time includes sleep period — actual elapsed may exceed phase duration significantly, causing skipped phases. Not addressed for MVP. |
 | Finished state after stop | stop() resets to idle, never enters finished if stopped mid-workout |
 | One configured repetition | Works correctly: one full contract→hold→relax, then feedback |
