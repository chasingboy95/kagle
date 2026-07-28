# Known Issues

## Current Status

Last updated: 2026-07-27

This document tracks known technical debt, limitations, and follow-up work. Issues listed here are not considered completed until they are verified and removed or marked resolved.

---

## 1. MuscleSphere Rendering and Testing

**Status:** Resolved (2026-07-27)

**Description:**

The MuscleSphere component implements the core visual training experience with 9 SVG layers and six animation states:

- idle
- ready (new)
- contract
- hold
- relax
- feedback (new)

However, it currently lacks automated component tests and documented rendering validation.

**Resolution:**
MuscleSphere component tests were added (16 test files, 92 tests). Stage transitions (including ready and feedback), pause freeze, and reduced-motion behavior are all covered.

---

## 2. SVG Asset Duplication

**Status:** Resolved (2026-07-27)

**Description:**

Multiple SVG asset copies exist in the repository, and some files differ between locations.

**Resolution:**
Duplicate SVG directories (`assets/muscle-sphere/`, `public/muscle-sphere/`) have been removed. `src/assets/muscle-sphere/` is now the single authoritative source.

---

## 3. Training Engine Integration Coverage

**Status:** Resolved 2026-07-26

**Description:**

The training engine state machine now has fake-clock integration coverage for
the full ready→feedback lifecycle, pause/resume compensation, early stop, and
user confirmation back to idle. A Playwright smoke test covers the complete UI
flow in Chromium.

**Impact:**

Complex flows may regress without detection.

**Planned Fix:**

Implemented coverage:

- start → ready phase
- ready → contract transition (timing-dependent)
- full round progression with ready/contract/hold/relax
- last relax → feedback → finished lifecycle
- pause/resume during ready phase
- early stop back to idle

---

---
## 4. Mobile Browser Validation

**Status:** Partially addressed (2026-07-27)

**Description:**

The application uses mobile-oriented APIs including speech, vibration, and audio playback, but complete device testing has not been performed.

**Progress:**

- Bundle size baseline recorded in `.github/bundle-baseline.json`.
- CI bundle size check added (15% threshold on main JS/CSS bundles).
- Performance baseline documented in `docs/PERFORMANCE_BASELINE.md`.

**Remaining:**

- iOS Safari audio behavior
- Android Chrome speech behavior
- Vibration support
- Animation frame rate on real devices
- Memory trend over 10-minute sessions
- Screen-lock behavior



---

## 5. Accessibility Verification

**Status:** Open

**Description:**

Basic accessibility support exists, but comprehensive testing has not been completed.

**Planned Fix:**

- Verify keyboard navigation.
- Test screen reader behavior.
- Validate ARIA usage.

---

## 6. Feedback Phase UI

**Status:** Resolved (2026-07-24)

**Description:**

During the previous timed feedback phase, the training status remained `running` (to allow the tick to complete). The ControlButtons component therefore showed pause/stop buttons instead of completion-focused controls. After feedback ended, the `finished` status showed the correct completion UI.

**Impact:**

Resolved by moving completion to a dedicated `feedback` status and persistent result view. The engine no longer ticks through feedback automatically.

**Planned Fix:**

No further fix planned.

---

## 7. Training Completion Page Auto-Disappear

**Status:** Resolved (2026-07-27)

**Description:**

After training completed, the feedback/completion page would auto-disappear after 6 seconds because the engine auto-advanced from `feedback` to `finished` phase. After auto-advance, `status = finished` but home-screen buttons required `status = idle`, leaving the user in a half-completed state where the training history button was hidden.

**Resolution:**

The feedback phase is now persistent — the tick stops on entry and `onSessionEnd` fires once at that point. The completion page stays until the user explicitly clicks "完成", "再次训练", or "查看训练记录". The `finish()` function resets the engine fully to `idle`. Engine fake-clock tests, component tests, and E2E tests cover the persistent feedback behavior.

---

## 8. Completed Voice Prompt Unreliable on Mobile

**Status:** Resolved (2026-07-27)

**Description:**

The training completion voice prompt (`completed` event) relied exclusively on system SpeechSynthesis without a recorded mp3 fallback. `resolveVoiceAsset()` deliberately skipped the existing `zh-CN/complete.mp3`. On mobile browsers and PWAs where SpeechSynthesis is unreliable, the completion prompt would silently fail.

**Resolution:**

- `resolveVoiceAsset()` now returns `zh-CN/complete.mp3` for `completed` events in coach mode.
- `VoiceController.enqueue()` clears the queue and stops playback when a `completed` event arrives, preventing stale items from interfering.
- The drain fallback chain (recording → TTS → non-verbal cue) is preserved for `completed` like all other coach events.
- `useVoiceAssistant` now logs flush errors via `console.warn` instead of silently swallowing them.
- 5 new VoiceController tests cover the completed flow: recording, TTS fallback, cue fallback, queue clearing, and rhythm-mode cue.

---

---

## 9. Missing Global Error Boundary

**Status:** Resolved (2026-07-27)

**Description:**

The application lacked a global error recovery mechanism. Uncaught exceptions in training components, animations, voice, or localStorage could leave users with a blank page.

**Resolution:**

- React Error Boundary wraps the root `<App />` in `main.tsx`.
- `ErrorRecoveryUI` renders a privacy-safe production recovery page with "重新加载" and "清除数据并重置" buttons.
- In dev mode, full error message and component stack are exposed behind a `<details>` disclosure.
- On error, the `onError` callback clears only the session snapshot key to prevent corrupted session recovery without losing training history, config, or settings. Full data reset requires explicit user confirmation.
- 10 component tests cover: child rendering, recovery UI display, dev-mode details, onError callback, re-render reset, reload button, reset confirmation flow, confirm clear, cancel, and data preservation during confirmation.
- No third-party monitoring or data upload is introduced.



## 10. Clear All Confirmation Protection

**Status:** Resolved (2026-07-28)

**Description:**

The "清除全部" button in Training History immediately deleted all records without confirmation or backup protection, risking accidental data loss.

**Resolution:**

- Added a confirmation dialog showing the number of records to be deleted and warning about irreversibility.
- Added automatic backup to localStorage before clearing, restorable via the Data Management UI.
- Dialog supports ARIA roles, labels, focus trapping, Tab cycling, Escape-to-close, and focus restoration.
- 4 component tests cover: cancel, confirm, backup creation, and Escape key behavior.


## Resolved Issues

- Feedback phase UI no longer exposes pause/stop controls during the completion celebration.
- Global error boundary with local recovery and privacy-safe production UI (#16).
