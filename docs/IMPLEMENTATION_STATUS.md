# Implementation Status

**Last verified against repository:** 2026-07-27

## Status Legend

- **Complete**: Implemented and covered by automated tests.
- **Partial**: Implemented but still needs broader integration or device verification.
- **Untested**: Implemented without automated or documented manual verification.

## Subsystem Status

| Subsystem | Status | Reason |
|-----------|--------|--------|
| Training Engine | Complete | Fake-clock integration tests cover the full ready→contract→hold→relax→feedback lifecycle, pause compensation, resume, early stop, and user-confirmed completion. |
| Training Lifecycle | Complete | READY (5s) and persistent FEEDBACK completion view added. State machine updated: idle → ready → contract → hold → relax → (repeat) → feedback → user confirmation → idle or restart, with feedback using a dedicated status for completion UI. |
| Timer / Repetitions | Complete | Each contract→hold→relax cycle is presented as one repetition; all configured repetitions form one set. Unit, component, integration, and browser-flow coverage protect timing and terminology. |
| MuscleSphere | Complete | Ready (slow breathing) and feedback (release/calm) animation variants added. No automated rendering tests. |
| Voice Controller | Partial | Three-mode scheduling, queueing, interruption, independent countdown, recorded-first playback, speech fallback, and prompt timing logic are implemented and unit tests were updated. |
| Voice Scripts | Complete | Added `ready` and `feedback` script keys for stage-enter speech in both zh-CN and en-US. |
| Voice Coach Recordings | Partial | Seven Mandarin coach recordings are routed through `BASE_URL`; real-device playback remains unverified. |
| Voice Rhythm Mode | Partial | Uses non-verbal cues and independent countdown, but its audible differentiation still needs device QA. |
| Voice Settings | Complete | Three modes are validated, final 3-second countdown is the default for new users, and legacy five-mode values migrate to `coach`. |
| Voice Settings Panel | Complete | UI now exposes common controls first: enable, final countdown, and preview. Mode, volume, fallback speech rate, progress announcement, and haptics live under "高级设置". No component test yet. |
| Accessibility | Partial | `aria-live="polite"` regions added to TimerDisplay and TrainingStatus; auto-focus management in ControlButtons. Screen-reader and keyboard-navigation audit remains outstanding. |
| Background-Tab Timing | Complete | Engineering evaluation done. Worker-based timer (`createTimer` + `timingWorker`) provides reliable ticks even when browser tab is backgrounded, with transparent fallback to setInterval. |
| PWA / GitHub Pages | Partial | Manifest, service worker, subpath, safe-area, standard PNG icons, apple-touch-icon, and version update notification support exist; real-device QA remains incomplete. |
| Storage Layer | Complete | `StorageAdapter` with schema validation, versioned keys, upgrade chain, and corruption recovery. Wired to engine config + training history. 16 tests. |
| Training History | Complete | `TrainingRecord` persisted via storage layer, stats (weekly, streak, total), scrollable history UI with delete/clear. 7 tests. |
| Progressive Training | Complete | Rule engine suggests parameter increases after 3 consecutive same-config completions, with 3-day cooldown after dismiss. 9 tests. |
| Onboarding | Complete | Three-page first-time guided modal (什么是凯格尔训练/呼吸与安全/关于本应用) with skip, page indicators, ARIA dialog attributes, localStorage persistence, and re-entry button in idle section. |
| Session Statistics | Complete | The completion view shows only objective current-session duration and repetition counts. Streaks and quality scores are hidden until real training history exists. |
| CI/CD | Complete | All quality gates pass: tests, lint, TypeScript, build, and Playwright E2E. Deployment is automatic via GitHub Actions to GitHub Pages. |

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
- Contract, hold, and relax stage prompts play immediately on phase entry.
- Contract and hold have separate user-facing copy: "开始收缩" then "保持住".
- Dynamic progress announcements use "第 N 次，共 M 次"; internal `round` field names remain an engine implementation detail.
- Countdown cues keep a short playback grace window so the final cue can still play at the phase boundary.
- The ready phase uses the `training-ready` lifecycle prompt only, avoiding duplicate stage-enter speech.
- The feedback phase uses the `completed` lifecycle prompt only, avoiding duplicate stage-enter speech.

## Updated Automated Coverage

- Legacy mode migration.
- Coach recording routing.
- Rhythm-only cue behavior.
- Independent countdown in coach and rhythm modes.
- Recorded-audio failure to system-speech fallback.
- Immediate hold-stage prompt queueing.
- Countdown playback at the phase boundary.
- Ready phase display timing and action hint.
- Contract and hold display timing and action hints remain separate.
- Feedback phase action hint.
- Countdown events during ready phase.
- Countdown events are suppressed during feedback.
- Chinese and English progress announcements use repetition terminology.
- Full ready → contract → hold → relax → feedback engine progression.
- Pause/resume timing compensation and early-stop reset.
- ConfigPanel repetition/set copy and disabled controls.
- TrainingFeedback objective results and completion actions.
- Playwright smoke flow from configuration through completion and back to idle.

## Verification Gap

`bun run test`, `bun run lint`, `bun run typecheck`, and `bun run build` passed
on 2026-07-27 with 19 test files and 133 tests. The Playwright smoke test
has passed in GitHub Actions CI (chromium). iOS and Android real-device
QA remains outstanding.
