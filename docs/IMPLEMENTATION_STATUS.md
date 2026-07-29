# Implementation Status

**Last verified against repository:** 2026-07-29

## Status Legend

- **Complete**: Implemented and covered by automated tests.
- **Partial**: Implemented but still needs broader integration or device verification.
- **Untested**: Implemented without automated or documented manual verification.

## Subsystem Status

| Subsystem | Status | Reason |
|-----------|--------|--------|
| Training Engine | Complete | Pure session-result functions are the single source for completed repetitions, active duration, and completion/stop payloads. UI state, recovery snapshots, completion, and stopped-session history reuse these calculations; fake-clock tests cover lifecycle and pause boundaries. |
| Training Lifecycle | Complete | READY (5s) and persistent FEEDBACK completion view with three explicit actions (完成/再次训练/查看训练记录). Feedback phase no longer auto-advances — tick stops on entry and onSessionEnd fires once. State machine: idle → ready → contract → hold → relax → (repeat) → feedback → user confirmation → idle or restart. |
| Timer / Repetitions | Complete | Each contract→hold→relax cycle is presented as one repetition; all configured repetitions form one set. Unit, component, integration, and browser-flow coverage protect timing and terminology. |
| MuscleSphere | Complete | Ready (slow breathing) and feedback (release/calm) animation variants added. No automated rendering tests. |
| Voice Controller | Partial | Three-mode scheduling, queueing, interruption, independent countdown, recorded-first playback, speech fallback, and prompt timing logic are implemented. Haptic events remain independent of audible mode and are deduplicated before routing. |
| Voice Scripts | Complete | Added `ready` and `feedback` script keys for stage-enter speech in both zh-CN and en-US. |
| Voice Coach Recordings | Partial | Seven Mandarin coach recordings are routed through `BASE_URL`; real-device playback remains unverified. |
| Voice Rhythm Mode | Partial | Uses non-verbal cues and independent countdown, but its audible differentiation still needs device QA. |
| Voice Settings | Complete | Three modes are validated, final 3-second countdown is the default for new users, and legacy five-mode values migrate to `coach`. |
| Voice Settings Panel | Complete | UI exposes common controls first and includes an optional pre-training self-check with the current mode/countdown/volume, a short preview, “我能听到” confirmation, explicit silent choice, and non-technical failure guidance. It never claims to detect system mute and does not block training. |
| Haptics / iOS Fallback | Partial | Native vibration is capability-detected. Where unavailable, the short audio fallback is unlocked during start/resume/restart user gestures and covered by adapter/controller tests; iPhone installed-PWA revalidation remains required. |
| Accessibility | Partial | Recovery takes priority over onboarding; both dialogs have labels/descriptions, initial focus, focus traps, focus restoration, and explicit Escape behavior. Playwright axe blocks serious/critical violations and covers reduced motion plus key `aria-live` regions. Real-device screen-reader verification remains outstanding. |
| Mobile UX / Navigation | Partial | The target information architecture, staged dependencies, mobile viewport matrix, interaction constraints, and rollback boundaries are documented in `docs/UX_MOBILE_ROADMAP.md` (#88). Implementation remains tracked by #89–#93 and is not yet complete. |
| Background-Tab Timing | Complete | Engineering evaluation done. Worker-based timer (`createTimer` + `timingWorker`) provides reliable ticks even when browser tab is backgrounded, with transparent fallback to setInterval. |
| PWA / GitHub Pages | Partial | Manifest, service worker, subpath, standard PNG icons, apple-touch-icon, version update notification, offline caching, and voice asset cache are covered by Playwright E2E tests. The root document is now fixed to the standalone viewport, while `.app-shell` exclusively owns page scrolling and bottom safe-area handling remains with the action dock (#82). Automated coverage verifies no root overflow at 320×568; iPhone standalone-mode safe-area revalidation remains outstanding. Service worker activation is user-triggered and blocked during a live training session. |
| PWA / GitHub Pages | Complete | Precache list is now generated at build time: `precache-manifest.json` lists the hashed JS/CSS/SVG assets and the service worker uses a content-hashed, versioned cache name (injected after the public-dir copy), so a fresh browser context precaches the full build on first install and old caches are cleared on upgrade (#62). |
| Storage Layer | Complete | `StorageAdapter` provides schema validation, versioned keys, upgrade chains, and corruption recovery. Training configuration, history, progressive suggestions, and onboarding use importable module-level schemas instead of render-time definitions. |
|  |  | Shared `useStorageWrite` hook exposes write success/failure for all hooks: saved configs, weekly goals, and voice assistant now report storage errors via `StorageErrorNotice`. |
| Training History | Complete | List and timezone-aware monthly calendar views expose real records. The calendar distinguishes completed and stopped sessions, opens daily records in the shared detail flow, and reports completed sessions, completed days, duration, and longest streak. Detail supports objective fields and confirmed deletion. |
|  |  | Cross-day and cross-week auto-refresh via `useDateRefresh`: stats re-compute at midnight, on week boundary, and when the tab returns from background. |
|  |  | "清除全部" now shows a confirmation dialog with record count, auto-backup, and accessibility support before deletion. Cancel and Escape preserve data intact. |
| Weekly Goal | Complete | Optional 1–7 day target counts distinct local completed dates from Monday through Sunday. Users can set, adjust, or close it; progress and remaining days use calm factual copy. Versioned storage migrates legacy numeric targets. |
| Progressive Training | Complete | History writes synchronously return the normalized record set used for suggestion evaluation, so the third same-config completion triggers immediately without React state timing dependencies. The side-effect-free rule engine preserves input order and applies a 3-day cooldown after dismiss. |
| Onboarding | Complete | Three-page first-time guided modal with ARIA labeling, page status, keyboard focus trap, Escape-to-skip, reduced-motion transitions, localStorage persistence, and re-entry in idle. It never overlaps session recovery. |
| Session Recovery | Complete | Engine saves snapshots locally; strict schema validation accepts only recoverable status/phase combinations, bounded config and repetition values, finite non-negative timing, legal countdown markers, and valid timestamps. Corrupt or unknown snapshots are removed before the app remains safely idle. The higher-priority recovery dialog requires an explicit continue/discard choice, traps focus, and defers first-use onboarding until the app is idle. |
| Session Statistics | Complete | The completion view shows objective current-session duration/repetitions plus post-write weekly completions, weekly active duration, current-session increase, and current streak. Enabled weekly goals add real remaining-day progress; calculation failure safely falls back to session-only results. |
| Error Boundary | Complete | Global React ErrorBoundary wraps root <App />, ErrorRecoveryUI renders privacy-safe recovery page with reload/reset; onError only clears session snapshot, not all local data; full reset requires explicit confirmation; 10 component tests. |
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
- Fake-clock stopped-session flow across the engine, recovery snapshot, history, completion statistics, and progressive suggestions.
- Playwright stopped-session flow through history display and completion-stat exclusion.
- Pure session-result calculations for phase-boundary repetition counts, paused/resumed active duration, and frozen feedback results.
- Importable progressive-suggestion and onboarding schemas with compatibility tests for existing keys, defaults, and validation behavior.
- Date-independent history write-failure coverage keeps the newly added UI record newer than its relative baseline; progressive-suggestion fixtures use strictly decreasing timestamps so “most recent feedback” never relies on equal-key sort behavior (#94).
- Training-history capacity, deterministic retention, large-history statistics, and quota-failure UI-state preservation.
- Progressive-suggestion input-order preservation while retaining existing rule behavior.
- Progressive-suggestion integration at the second and third matching completion, including stopped-session isolation and synchronous post-write history evaluation.
- Voice self-check preview success/failure, audible confirmation, silent choice, unsupported playback, and current-setting summary.
- Training-record detail rendering, preset/custom and completed/stopped states, confirmed deletion, and list-detail-back navigation.
- Calendar timezone/cross-month boundaries, completed/stopped aggregation, monthly statistics, date selection, month navigation, and calendar-to-detail flow.
- Weekly-goal Monday/Sunday and timezone boundaries, same-day deduplication, stopped-record exclusion, persistence/migration, controls, and pressure-free copy.
- Completion progress including the current record, weekly count/duration and increment, streak, optional goal remainder, disabled-goal behavior, and safe component fallback.
- Saved training configurations: name and save the current rhythm, apply, rename, delete, enforce the five-item limit, preserve built-in presets, migrate legacy flat entries, and discard invalid entries independently.
- Versioned local-data export/import covering training, voice, history, progressive state, weekly goals, and saved configurations; strict validation, preview, import strategies, ID deduplication, backup, and rollback.
- Modal priority, focus trapping, Tab/Escape rules, ARIA labeling, reduced motion, live regions, and serious/critical axe violations.
- Training-history ISO/calendar validity, time ordering, numeric bounds, integer repetition counts, count relationships, and mixed valid/corrupt input.

## Verification Gap

Automated unit, lint, typecheck, build, Chromium E2E, and axe checks are required
by CI. iOS and Android real-device screen-reader QA remains outstanding.
