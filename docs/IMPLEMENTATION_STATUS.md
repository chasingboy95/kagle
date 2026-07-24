# Implementation Status

**Last verified against repository:** 2026-07-24

## Status Legend

- **Complete**: Implemented and covered by automated tests.
- **Partial**: Implemented but still needs broader integration or device verification.
- **Untested**: Implemented without automated or documented manual verification.

## Subsystem Status

| Subsystem | Status | Reason |
|-----------|--------|--------|
| Training Engine | Partial | Core state transitions and timing exist; full integration tests (including the new ready→feedback lifecycle) remain outstanding. |
| Training Lifecycle | Complete | READY (5s) and FEEDBACK (6s) phases added. State machine updated: idle → ready → contract → hold → relax → (repeat) → feedback → finished → idle. |
| Timer / Rounds | Partial | Display timing updated for ready and feedback phases. Unit tests cover phase timing and action hints. Still no component or E2E tests. |
| MuscleSphere | Partial | Ready (slow breathing) and feedback (release/calm) animation variants added. No automated rendering tests. |
| Voice Controller | Partial | Three-mode scheduling, queueing, interruption, independent countdown, recorded-first playback, speech fallback, and delayed sustain logic are implemented and unit tests were updated. |
| Voice Scripts | Complete | Added `ready` and `feedback` script keys for stage-enter speech in both zh-CN and en-US. |
| Voice Coach Recordings | Partial | Seven Mandarin coach recordings are routed through `BASE_URL`; real-device playback remains unverified. |
| Voice Rhythm Mode | Partial | Uses non-verbal cues and independent countdown, but its audible differentiation still needs device QA. |
| Voice Settings | Complete | Three modes are validated and legacy five-mode values migrate to `coach`. |
| Voice Settings Panel | Untested | UI now exposes only 静音 / 节奏提示 / 语音教练 plus independent countdown, progress announcement, haptics, volume, and fallback speech rate. No component test yet. |
| PWA / GitHub Pages | Partial | Manifest, service worker, subpath, and safe-area support exist; real-device QA remains incomplete. |
| CI/CD | Complete | GitHub Pages deployment workflow exists. |

## Voice Behavior

### 静音

- No speech or non-verbal cue is queued.
- Haptics may remain enabled independently.

### 节奏提示

- Stage changes use non-verbal cues only.
- Countdown recordings may be enabled independently for the final 3 or 5 seconds.

### 语音教练

- Mandarin fixed events use the seven new recordings.
- Missing or failed recordings fall back to system speech.
- If system speech also fails, the controller uses a non-verbal cue when one exists.
- "很好，继续保持" is scheduled around 35% into the hold phase and is cancelled by a newer phase, pause, or stop.
- "准备开始" (TTS) plays on stage-enter ready, after the "准备开始训练" (recording) from training-ready event.
- "训练完成" (TTS) plays on stage-enter feedback, before the "训练完成，做得很好" (recording) from completed event.

## Updated Automated Coverage

- Legacy mode migration.
- Coach recording routing.
- Rhythm-only cue behavior.
- Independent countdown in coach and rhythm modes.
- Recorded-audio failure to system-speech fallback.
- Delayed sustain scheduling and cancellation.
- Ready phase display timing and action hint.
- Feedback phase display timing and action hint.
- Countdown events during ready and feedback phases.

## Verification Gap

The refactor has been committed, but `bun run test`, `bun run build`, and `bun run lint` have not been executed through the available connector. iOS and Android real-device QA also remains outstanding.
