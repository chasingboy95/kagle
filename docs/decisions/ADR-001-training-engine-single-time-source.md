 # ADR-001: Training Engine as Single Authoritative Time Source

 ## Status

 Accepted

 ## Context

 The training engine (`useKegelEngine`) drives the workout timer. The voice assistant and visual layer (MuscleSphere) both consume timing state from the engine. Earlier design conversations considered whether voice or animation should own independent timers for better responsiveness.

 The application has a single timing loop: a 100ms `setInterval` tick inside the engine. Voice events are emitted on state changes and tick boundaries. MuscleSphere receives stage transitions and a `stageProgress` value derived from engine state, not from its own timer.

 ## Decision

 The training engine is the sole authoritative time source for the entire application.

 - Voice assistance must not own an independent training timer.
 - MuscleSphere must remain a purely visual component that receives stage, progress, and pause signals from the engine.
 - No other module may create independent intervals or timeouts for training-phase tracking.

 ## Alternatives Considered

 1. **Voice owns its own countdown timer** – rejected because it would diverge from engine state during pause/resume.
 2. **MuscleSphere runs its own stage progression** – rejected because it would create two sources of truth for phase timing.

 ## Consequences

 Positive:
 - Single source of truth guarantees consistent pause/resume/stop behavior.
 - Voice events are always grounded in real engine state.
 - New consumers (e.g. analytics, logging) can subscribe without creating time sources.

 Negative:
 - Voice countdown precision depends on the 100ms tick resolution; sub-100ms accuracy is not needed for integer-second countdowns.
 - Animation cannot pre-warm or anticipate transitions beyond what the engine provides.

 ## Follow-up

 The engine currently uses `setInterval` (100ms). If background-tab throttling becomes an issue, switch to `requestAnimationFrame` with delta-time tracking, keeping the same state ownership model.
