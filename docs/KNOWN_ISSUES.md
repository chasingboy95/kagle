# Known Issues

## Current Status

Last updated: 2026-07-24

This document tracks known technical debt, limitations, and follow-up work. Issues listed here are not considered completed until they are verified and removed or marked resolved.

---

## 1. MuscleSphere Rendering and Testing

**Status:** Open

**Description:**

The MuscleSphere component implements the core visual training experience with 9 SVG layers and six animation states:

- idle
- ready (new)
- contract
- hold
- relax
- feedback (new)

However, it currently lacks automated component tests and documented rendering validation.

**Impact:**

Animation regressions may not be detected automatically.

**Planned Fix:**

- Add MuscleSphere component tests.
- Verify stage transitions including ready and feedback.
- Verify pause freeze behavior.
- Verify reduced-motion behavior.

---

## 2. SVG Asset Duplication

**Status:** Open

**Description:**

Multiple SVG asset copies exist in the repository, and some files differ between locations.

**Impact:**

Future animation updates may modify the wrong asset version.

**Planned Fix:**

- Keep a single source of truth under `src/assets/muscle-sphere/`.
- Remove duplicated assets.
- Add meaningful SVG group IDs for animation targeting.

---

## 3. Training Engine Integration Coverage

**Status:** Open

**Description:**

The training engine state machine is implemented, but integration-level testing is incomplete. The new ready→feedback lifecycle adds additional transitions that are not covered by automated integration tests.

**Impact:**

Complex flows may regress without detection.

**Planned Fix:**

Add integration tests covering:

- start → ready phase
- ready → contract transition (timing-dependent)
- full round progression with ready/contract/hold/relax
- last relax → feedback → finished lifecycle
- pause/resume during ready phase
- stop during feedback phase

---

## 4. Mobile Browser Validation

**Status:** Open

**Description:**

The application uses mobile-oriented APIs including speech, vibration, and audio playback, but complete device testing has not been performed.

**Impact:**

Browser-specific behavior may differ on iOS Safari and Android Chrome.

**Planned Fix:**

Perform manual QA for:

- iOS Safari audio behavior
- Android Chrome speech behavior
- vibration support
- animation performance (particularly ready breathing and feedback release)
- screen-lock behavior

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

During the 6-second feedback phase, the training status previously remained `running` (to allow the tick to complete). The ControlButtons component therefore showed pause/stop buttons instead of completion-focused controls. After feedback ended, the `finished` status showed the correct completion UI.

**Impact:**

Resolved by moving the completion celebration to a dedicated `feedback` status while still allowing the engine tick to advance to `finished`.

**Planned Fix:**

No further fix planned.

---

## Resolved Issues

- Feedback phase UI no longer exposes pause/stop controls during the completion celebration.
