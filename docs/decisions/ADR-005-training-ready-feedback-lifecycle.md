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
FEEDBACK     (completion result view)
  ↓ (finish)
IDLE
  ↘ (restart from feedback starts a new session)
```

Key design choices:

1. **READY phase (5000ms)**: Emitted after `training-ready` voice. Shows breathing animation, allows posture adjustment, runs countdown (if enabled). After 5s, emits `round-start` voice and transitions to `contract`.

2. **FEEDBACK phase (persistent completion view)**: Entered after the last relaxation round. Emits `completed` voice event. Keeps session data (round count, elapsed time) available. The engine stops ticking and remains in feedback until the user chooses "再次训练" or "完成". "完成" returns to the idle start screen.

3. **Timer remains the single time source during active training**: READY and exercise phases use the existing `performance.now()` tick mechanism. FEEDBACK is not counted as active training time.

4. **Voice events remain lifecycle-specific**: READY uses `training-ready`, and FEEDBACK uses `completed`, avoiding duplicate `stage-enter` prompts that could interrupt the more important lifecycle audio.

5. **Contract and hold are distinct in the UI**: The engine already models `contract` and `hold` separately, and the display now mirrors that model with "开始收缩" followed by "保持住" so the visible flow matches 3-3-3 style configuration.

## Consequences

Positive:
- Training UI can represent the complete user journey with preparation and celebration.
- MuscleSphere animations provide phase-specific visual feedback (slow breathing → release celebration).
- The progress bar accounts for preparation and active exercise time, then the app moves into a clean completion view.
- Voice guidance maps directly to lifecycle phases.
- Countdown works during the ready phase, giving an audible cue before exercise starts.

Neutral:
- Two new voice script keys (`ready`, `feedback`) were added for coach-mode speech.
- Total timed session duration increases by 5 seconds for READY; FEEDBACK is user-confirmed and not part of timed exercise.

Negative:
- No integration-level test for the full lifecycle due to the timing-dependent nature of the engine. Unit tests cover phase timing, countdown, and display functions.
- Completion feedback now needs explicit user action to dismiss; this is intentional but should be covered by component/E2E tests.
