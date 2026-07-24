# ADR-005: Training Ready and Feedback Lifecycle

## Status
Accepted (updated 2026-07-24)

## Context

The training flow originally transitioned directly from start to the first contraction phase. Although voice resources contained a preparation step (`training-ready`, `ready.mp3`), the training state machine did not expose a corresponding UI state.

The completion state also ended immediately after the last relaxation phase, leaving no dedicated user feedback experience. The `finished` status appeared instantly after the final `relax`, clearing all state.

## Decision

Extend the training lifecycle with two explicit phases, producing the full flow:

```
IDLE
  ↓ (start)
READY        (5s breathing preparation)
  ↓
CONTRACT
  ↓
HOLD
  ↓
RELAX
  ↓ (repeat rounds)
  ...
  ↓ (last relax)
FEEDBACK     (6s completion celebration)
  ↓
FINISHED
  ↓ (restart)
IDLE
```

Key design choices:

1. **READY phase (5000ms)**: Emitted after `training-ready` voice. Shows breathing animation, allows posture adjustment, runs countdown (if enabled). After 5s, emits `round-start` voice and transitions to `contract`.

2. **FEEDBACK phase (6000ms)**: Entered after the last relaxation round. Emits `completed` voice event. Keeps session data (round count, elapsed time) available. After 6s, transitions to `finished` and clears state.

3. **Timer remains the single time source**: Both phases use the existing `performance.now()` tick mechanism. No additional `setTimeout` or `setInterval` calls were introduced.

4. **Voice events preserved**: `stage-enter` events fire for both new phases, so the VoiceController can provide stage-appropriate speech via the existing priority queue.

## Consequences

Positive:
- Training UI can represent the complete user journey with preparation and celebration.
- MuscleSphere animations provide phase-specific visual feedback (slow breathing → release celebration).
- The progress bar accounts for the full session duration including ready and feedback.
- Voice guidance maps directly to lifecycle phases.
- Countdown works during the ready phase, giving an audible cue before exercise starts.

Neutral:
- Two new voice script keys (`ready`, `feedback`) were added for coach-mode speech.
- Total session duration increased by 11 seconds (5s ready + 6s feedback).

Negative:
- No integration-level test for the full lifecycle due to the timing-dependent nature of the engine. Unit tests cover phase timing, countdown, and display functions.
- The ControlButtons component still shows pause/stop during the 6s feedback phase since status remains `running` until feedback completes.
