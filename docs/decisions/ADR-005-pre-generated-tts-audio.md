# ADR-005: Package Pre-generated Mandarin TTS Audio

**Status:** Accepted

**Date:** 2026-07-23

## Context

Web Speech output can sound mechanical and differs by browser and operating system. Some implementations also fail to emit `end` or `error`, which can leave an awaited utterance unresolved and block the voice queue. Fixed Chinese training prompts do not require runtime synthesis.

## Decision

Ship 18 pre-generated Mandarin neural-TTS MP3 files with the application under `public/audio/voice/{concise,guided,common,countdown}`. The files are 24 kHz, 48 kbps, mono and total 191,088 bytes (186.6 KiB by `stat`, below 200 KiB).

For `zh-CN`, fixed prompts prefer local playback through `PreRecordedAudioAdapter`, with URLs resolved from `import.meta.env.BASE_URL`. This has no runtime cloud dependency. Local playback uses an 8-second timeout; load/play/error/timeout failure falls back to the corresponding Web Audio cue. Interruption increments a controller generation so an obsolete playback result cannot emit a stale fallback cue.

Dynamic round announcements and en-US remain on browser TTS because their content is not covered by the fixed Mandarin asset set. `SpeechSynthesisAdapter` retains an 8-second watchdog for browsers that omit completion events.

Changing fixed Mandarin wording requires manually regenerating and reviewing the affected files; asset generation is not part of the application build.

## Consequences

- Fixed Chinese guidance is more natural and consistent across supported browsers.
- Static deployment grows by 191,088 bytes and requires maintaining 18 binary files.
- The app remains usable offline after its assets are cached and makes no runtime cloud TTS request for fixed Chinese prompts.
- Dynamic round and en-US quality still varies with platform voices.
- Browser autoplay policy can still reject HTML audio; the application preloads on user actions and degrades failed local playback to cues, while real-device QA remains required.
