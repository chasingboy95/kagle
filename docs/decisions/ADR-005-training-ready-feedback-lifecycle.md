# ADR-005: Training Ready and Feedback Lifecycle

## Status
Accepted

## Context

The training flow originally transitioned directly from start to the first contraction phase. Although voice resources contained a preparation step, the training state machine did not expose a corresponding UI state.

The completion state also ended immediately after the last relaxation phase, leaving no dedicated user feedback experience.

## Decision

Extend the training lifecycle with two explicit phases:

```
IDLE
  ↓
READY
  ↓
CONTRACT
  ↓
HOLD
  ↓
RELAX
  ↓
FEEDBACK
  ↓
IDLE
```

READY provides posture adjustment, breathing preparation, and countdown guidance before the first exercise.

FEEDBACK provides completion confirmation, training summary, and next actions after a session.

## Consequences

- Training UI can represent the complete user journey.
- Voice guidance can map directly to lifecycle phases.
- MuscleSphere animations can provide phase-specific experiences.
- The engine requires additional phase transitions while preserving the single timer source design.
