# ADR-006: Simplify Voice Assistance Modes

- **Status:** Accepted
- **Date:** 2026-07-24

## Context

The previous UI exposed five peer modes: off, sound-only, concise, guided, and countdown. In practice, concise and guided often used the same packaged recordings, while countdown was an enhancement layered onto guided behavior rather than a true playback mode. The visible choices therefore did not reliably predict the training experience.

## Decision

Expose three mutually exclusive assistance modes:

1. `off` — no audible output.
2. `sound-only` — non-verbal rhythm cues only.
3. `coach` — recorded coach prompts with system-speech fallback.

Countdown becomes an independent `0 | 3 | 5` setting available in both audible modes. Legacy `concise`, `guided`, and `countdown` values migrate to `coach`.

The contraction sustain prompt is delayed to approximately 35% of the hold phase, rather than playing immediately at the internal contract-to-hold boundary.

## Consequences

- The UI now describes behavior that is actually implemented.
- One Mandarin recording set is sufficient for the current coach mode.
- Detailed and concise coach variants will not return until separate content sets exist.
- Countdown and round announcements are optional enhancements rather than modes.
- Real-device testing remains required for timing, interruption, and browser audio restrictions.
