# Changelog
## [Unreleased]

### Added
- A staged mobile UX roadmap covering the target training/records/settings information architecture, implementation dependencies, viewport/accessibility acceptance matrix, and per-issue rollback boundaries (#88).
- Up to five named training-configuration favorites with one-click apply, rename/delete controls, strict versioned persistence, and legacy migration (#37).
- Completion-page weekly progress computed from the same post-write history as the just-finished session: weekly completions/duration, current-session increase, streak, and optional goal remainder, with safe fallback (#40).
- Optional 1–7 day weekly training goal with Monday–Sunday, timezone-aware distinct completed-day progress, adjustable/disable controls, calm remaining-day copy, and versioned storage migration (#36).
- Timezone-aware monthly training calendar with completed/stopped day markers, per-day records, record-detail navigation, and objective monthly completion/day/duration/streak statistics (#33).
- Single-record training detail view with start/end time, rhythm, repetitions, active duration, completion state, preset/custom identification, back navigation, and confirmed deletion (#35).
- Optional pre-training audio self-check showing the active mode, countdown, and volume, with a short preview, audible confirmation, explicit silent choice, and non-technical fallback guidance (#39).

### Fixed
- iOS installed PWAs now pin the primary navigation to the visual viewport bottom instead of relying on sticky scroll geometry, reserve matching in-flow space, check for updates whenever the app returns to the foreground, and automatically activate waiting service workers while no training is active; live sessions still defer updates (#105).
- Bottom navigation now uses a compact 56px translucent tab bar with consistent linear SVG icons, a restrained active indicator, and a single safe-area owner; the idle action dock and records page no longer stack an extra Home Indicator inset (#103).
- iOS installed-PWA haptic fallback audio is now unlocked from start/resume/restart user gestures, and haptic events remain active and deduplicated when audible guidance is set to silent (#81).
- iOS installed-PWA layout now fixes the root document to the standalone viewport, removes duplicated body safe-area padding, and delegates page scrolling to the app shell so vertical dragging cannot reveal a status-bar-height blank strip (#82).
- Progressive suggestions now evaluate the exact history returned by the same write that saves a completed session, so the third matching completion triggers immediately without React state timing lag (#24).
- Session recovery now rejects invalid status/phase combinations, repetition and configuration bounds, non-finite timing, illegal countdown markers, and malformed timestamps; corrupt snapshots are deleted before the app remains safely idle (#25).
- Active training duration now excludes an open pause when the user stops without resuming; UI state, recovery snapshots, completion, and stopped-session history use the same duration calculation (#23).
- Global error boundary: React ErrorBoundary wraps root <App />, ErrorRecoveryUI provides privacy-safe production recovery with reload/reset, dev-mode technical details behind <details>, and onError callback clears corrupted kegel.* localStorage keys to prevent bad session recovery (#16).
- Performance baseline: recorded build resource sizes, added CI bundle size regression check (15% threshold on JS/CSS), created performance baseline documentation with real-device test plan (#18).
- Training completion page no longer auto-disappears after 6 seconds (#20). The feedback phase is now persistent — the tick stops on entering feedback, `onSessionEnd` fires once, and the completion page remains until the user explicitly clicks 完成, 再次训练, or 查看训练记录.
- Error boundary no longer clears all `kegel.*` local data on rendering exceptions; only the session snapshot is cleaned up automatically. Full data reset now requires explicit user confirmation with a description of what will be lost (#59).
- PWA update no longer force-reloads during training: the service worker stays in the "waiting" state after install, and activation (`SKIP_WAITING`) is blocked while a live session snapshot exists; the feedback view is treated as safe to update (#60).
- Recovery now uses the session snapshot config as the single source of truth: on recovery the UI and engine config switch to the snapshot config, the session result carries the immutable actual config, and the history record is built from it, so target repetitions, phase durations, and the saved record stay consistent even when the snapshot config differs from the saved config (#61).
- PWA now precaches the full hashed build (JS/CSS/SVG) plus app shell on first install: the build emits `precache-manifest.json` and injects a content-hashed, versioned cache name and asset list into `sw.js` after the public-dir copy, so a fresh browser context can open the app offline and old caches are cleared on upgrade (#62).
- Session snapshot writes are now throttled to ~1.5s during steady training, with critical state changes (start, pause, resume, phase transitions, page-hide) persisting immediately. Wake Lock recovery is improved: system-released locks are re-acquired while visible, and returning to a visible foreground re-requests a fresh lock (#63).

- Unified storage layer (`StorageAdapter`) with schema validation, versioned keys, upgrade chain, and corruption recovery (#17).
- Training history: records persisted via storage layer, stats (weekly, streak, total), scrollable history UI with delete/clear (#8).
- Progressive training suggestions: rule engine suggests parameter increases after 3 same-config completions, 3-day cooldown after dismiss (#12).
- CI split into ci.yml (PR + main push) and deploy.yml (auto-deploy after CI success) (#13).
- Training presets: three built-in presets (轻松入门/日常训练/耐力提升) with one-click apply, preset selector in ConfigPanel (#9).
- First-time onboarding: three-page guided modal (什么是凯格尔训练/呼吸与安全/关于本应用) with skip, page indicators, ARIA attributes, and re-entry button (#10).
- Session recovery: engine saves snapshot to localStorage on state changes; on reload, detects in-progress sessions and offers continue/discard with time compensation; 8 integration tests; recovery UI component (#11).


### Changed
- Training records now open as a dedicated page with a consistent back action, natural page scrolling, focus restoration, and working completed/stopped filters instead of rendering beneath the training home (#89).
- Training-plan and voice drawers now edit local drafts, apply changes explicitly, protect dirty closes with discard confirmation, and expose single-select presets and the three voice modes without an extra outer accordion (#90).
- Idle navigation now uses stable Training, Records, and Settings pages; the plan summary opens editing directly, settings are grouped by purpose, browser back follows page history, and navigation is hidden during training (#91).
- Settings now exposes dedicated reminder and data-management pages, uses the system time picker, provides 44px weekday targets on narrow phones, and keeps onboarding/progressive recovery as clear general entries (#92).
- Mobile presentation now uses a 12px minimum for ordinary supporting text, 44px core controls, two-column narrow-screen statistics, shared bottom-sheet structure, consistent focus rings, and reduced-motion-safe transitions (#93).
- CI 拆分为 ci.yml（PR + main push）和 deploy.yml（main CI 成功后部署），固定 Bun 1.3.14，增加缓存与并发控制


## 2026-07-27 (second)

### Added

- Web Worker background-tab timing: `createTimer` utility uses a dedicated Worker so
  the training engine keeps ticking at full rate when the browser tab is backgrounded.
  Falls back to main-thread `setInterval` automatically in test environments.
- `aria-live="polite"` regions on TimerDisplay and TrainingStatus for screen-reader
  timer and status announcements.
- Auto-focus management in ControlButtons so keyboard users keep focus after state
  transitions (idle → running → paused → finished).

### Added
- Unified storage layer (`StorageAdapter`) with schema validation, versioned keys, upgrade chain, and corruption recovery (#17).
- Training history: records persisted via storage layer, stats (weekly, streak, total), scrollable history UI with delete/clear (#8).
- Progressive training suggestions: rule engine suggests parameter increases after 3 same-config completions, 3-day cooldown after dismiss (#12).
- CI split into ci.yml (PR + main push) and deploy.yml (auto-deploy after CI success) (#13).


### Changed

- Progress ring in MuscleSphere: replaced CSS `conic-gradient` with an SVG `<circle>`
  using `stroke-dasharray`/`stroke-dashoffset` for smoother rendering.

### Other

- Confirmed `Ripple.tsx` is unused; noted for future cleanup.
- 16 test files, 92 tests all passing.

## 2026-07-27
 
 ### Fixed
 
 - CI 中 `typecheck` 因缺少 `@types/node` 和 `VoiceSettingsPanel` 残留的 `onPreview` 参数失败。
 - CI 中 `test:e2e` 脚本缺失导致 workflow 崩溃。
 - 本地 `jsdom` 未安装导致测试全部无法运行（lockfile 未包含依赖）。

## 2026-07-26

### Added
- Unified storage layer (`StorageAdapter`) with schema validation, versioned keys, upgrade chain, and corruption recovery (#17).
- Training history: records persisted via storage layer, stats (weekly, streak, total), scrollable history UI with delete/clear (#8).
- Progressive training suggestions: rule engine suggests parameter increases after 3 same-config completions, 3-day cooldown after dismiss (#12).
- CI split into ci.yml (PR + main push) and deploy.yml (auto-deploy after CI success) (#13).


### Changed

- Removed hard-coded streak and completion-quality claims until real training history is implemented.
- Completion feedback now shows only measured duration and completed repetitions.
- GitHub Pages deployment now requires tests, lint, TypeScript checks, and a successful production build.

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- Boundary and corruption-isolation coverage for training-history timestamps, numeric fields, and repetition relationships (#32).
- Playwright axe audits for serious/critical accessibility violations, plus component and browser coverage for modal focus, keyboard rules, reduced motion, and live regions (#31).
- Regression coverage proving progressive-suggestion evaluation preserves input record order (#30).
- A 500-record training-history limit, deterministic oldest-record eviction, and a dismissible warning when local persistence fails (#29).
- Importable module-level storage schemas and compatibility tests for progressive suggestions and onboarding (#28).
- Pure session-result calculations shared by UI state, snapshots, completion, and stopped-session persistence, with phase-boundary and pause-state coverage (#27).
- Cross-module fake-clock coverage for stopping during every active phase, stopping while paused or after resume, recovery-snapshot cleanup, history/statistics isolation, and progressive-suggestion isolation (#26).
- Playwright coverage for stopping a browser session and verifying its single interrupted-history record without increasing completion statistics (#26).
- Training-engine integration tests for lifecycle progression, pause/resume compensation, early stop, and completion.
- React Testing Library component tests for training configuration and completion feedback.
- A Playwright Chromium smoke test covering configuration, pause/resume, completion, and return to idle.
- End-to-end testing as a required GitHub Pages deployment quality gate.
- Training Ready Phase: 5-second preparation phase with breathing animation and countdown before the first contraction.
- Training Feedback Lifecycle: persistent completion result view after the last relaxation.
- READY_DURATION_MS (5000) and FEEDBACK_DURATION_MS (0) constants for lifecycle timing.
- `ready` and `feedback` voice script keys for stage-enter speech in coach mode (zh-CN and en-US).
- `ready` and `feedback` MuscleSphere animation variants with slow breathing and release-to-calm transitions.
- `ready` and `feedback` display phase timing in `calcDisplayPhaseTiming` for TimerDisplay rendering.
- Unit tests for ready/feedback phase timing, action hints, and countdown events.
- Updated ADR-005 with the extended training lifecycle design.
- Three explicit voice-assistance choices: 静音, 节奏提示, and 语音教练.
- Independent final 3-second or 5-second countdown for both audible modes.
- Automatic migration from legacy `concise`, `guided`, and `countdown` mode values to `coach`.
- Unit coverage for mode migration, coach/rhythm routing, countdown independence, recording fallback, prompt timing, and boundary countdown playback.
- Seven packaged Mandarin coach recordings for ready, contraction start, contraction sustain, release, pause, resume, and completion.
- Collapsible training-plan panel with a compact `contract-hold-relax × rounds` summary.
- Persistent completion result view with explicit "再次训练" and "完成" actions.
- Voice settings now include a simplified first-level panel with advanced options tucked away.

### Added
- Unified storage layer (`StorageAdapter`) with schema validation, versioned keys, upgrade chain, and corruption recovery (#17).
- Training history: records persisted via storage layer, stats (weekly, streak, total), scrollable history UI with delete/clear (#8).
- Progressive training suggestions: rule engine suggests parameter increases after 3 same-config completions, 3-day cooldown after dismiss (#12).
- CI split into ci.yml (PR + main push) and deploy.yml (auto-deploy after CI success) (#13).


### Changed

- Training-history validation now rejects invalid ISO/calendar timestamps, reversed time ranges, non-finite or negative values, fractional repetition counts, and completions above target on a per-record basis (#32).
- Session recovery now takes priority over onboarding; both dialogs expose complete ARIA relationships and focus traps, while recovery requires an explicit choice and onboarding supports Escape-to-skip (#31).
- Ambient and onboarding transitions respect reduced-motion preferences (#31).
- Progressive-suggestion evaluation now explicitly copies records before sorting and documents its side-effect-free contract (#30).
- Storage writes now report success so training history can preserve current UI state and surface quota/private-mode failures without crashing (#29).
- `App` now reuses stable progressive-suggestion and onboarding schemas instead of recreating them during every render (#28).
- Completion and stop callbacks now build their payloads through the same authoritative session-result function instead of duplicating repetition and duration calculations (#27).
- Corrected the user-facing training unit: one contract→hold→relax cycle is one repetition, while all configured repetitions together form one set.
- Training plans now read `3-3-3 × 10 次 = 1 组`; live progress and voice guidance announce repetitions, and completion shows `1 组（10/10 次）`.
- Training state machine: `start()` now enters `ready` phase instead of `contract`.
- Training state machine: last `relax` transitions to a persistent `feedback` result view instead of going directly to `finished`.
- Ready and feedback phases now rely on their lifecycle prompts instead of duplicate stage-enter voice prompts.
- Feedback phase now uses a dedicated `feedback` status and waits for user confirmation instead of advancing automatically.
- Total session duration now includes READY_DURATION_MS and active training time; feedback is no longer counted as timed exercise.
- `actionHint` and `phaseHint` accept and return values for `ready` and `feedback` phases.
- `actionHint` now accepts `idle` and returns an empty hint for the idle state.
- App.tsx hint text now uses `actionHint(state.phase)` for all running phases.
- Replaced the previous five-mode voice selector with three behaviorally distinct modes.
- Countdown is now an enhancement rather than a voice mode.
- The settings panel no longer exposes unsupported concise/guided variants, next-stage announcements, pitch, or language switching.
- Fixed Mandarin prompts now use the new `public/audio/zh-CN/` recording set.
- Recorded playback failure now falls back to system speech before a non-verbal cue.
- Contract, hold, and relax coaching prompts now play immediately on phase entry.
- Contract and hold display copy now appears as separate "开始收缩" and "保持住" phases.
- Default voice settings now use coach mode with the final 3-second countdown enabled and round announcements disabled.
- Countdown feedback now uses soft ascending synthesized tones instead of the legacy spoken-number MP3 files.
- Rhythm cues now use distinct two-note contraction and release patterns, with quieter single-note sustain feedback.
- The training-plan panel now matches the voice-assistance accordion style and is collapsed by default.
- Service-worker navigation requests now use network-first loading so deployments do not retain stale hashed asset references.

### Fixed

- Added versioned local JSON backup and safe import with preview, replace/merge/settings-only strategies, history ID deduplication, automatic pre-import backup, and rollback on write failure (#34).
- Repeated `stop()` calls after a session has already returned to idle no longer write duplicate interrupted-session records (#26).
- Coach and guided selections no longer produce identical behavior under different labels.
- Countdown no longer implicitly selects guided scripts.
- Rhythm mode no longer plays full coach sentences.
- Rhythm mode cue keys now match the coach-oriented cue model, restoring audible feedback.
- GitHub Pages audio paths remain `BASE_URL` aware.
- Ready and feedback lifecycle prompts are no longer interrupted by duplicate stage-enter prompts.
- Countdown announcements no longer run during the feedback completion phase.
- Final countdown cues are no longer dropped when playback starts near the phase boundary.
- Hold-stage coaching no longer lags behind the phase transition.
- Pause/stop controls no longer appear during the feedback completion celebration.
- Completion feedback no longer overlays stale stage text, timer, progress, or settings controls.
- Removed the unimplemented "查看训练历史" action from the completion feedback card.
- Service-worker cache writes no longer reuse an already-consumed `Response` body.
- New service-worker versions clear obsolete caches, activate immediately, and refresh the page once after taking control.
- Added the modern `mobile-web-app-capable` metadata while retaining iOS-specific metadata.

### Verification Pending

- iOS and Android real-device audio QA remains outstanding.
- The collapsible training-plan panel has not yet received component or real-device interaction testing.
- The new service-worker update and stale-cache recovery path still needs deployment verification on GitHub Pages.

### Verified

- `npm test`
- `npm run build`
- `npm run lint`

## 2026-07-28

- **feat: 增加可选训练计划与提醒 (fix #78)** — 新增训练计划与提醒功能，支持选择训练日（周一至周日）和设定提醒时间，到达训练日时通过浏览器通知提醒用户。新增 `TrainingScheduleSettings` schema、`useTrainingSchedule` hook、`ScheduleSettings` 组件，集成至更多菜单与主界面提醒弹窗。

- **feat: 四周训练趋势与历史筛选 (fix #79)** — 新增近四周训练趋势图（完成次数/累计时长/训练天数），历史列表支持按完成/中止状态筛选。新增 `computeTrainingTrend` 工具函数、`TrainingTrend` 柱状图组件。

- **perf: 懒加载次要模块并验证移动端性能 (fix #80)** — 使用 React.lazy + Suspense 将非关键组件（Onboarding、SessionRecovery、ConfigDrawer、VoiceDrawer、MoreMenu、TrainingHistory、ProgressiveSuggestion、TrainingFeedback）拆分为独立 chunk。主 JS 包从 ~468KB 降至 ~404KB（约 14% 减少），CSS 与 SVG 大小保持不变。
