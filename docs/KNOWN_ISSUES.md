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

During the previous timed feedback phase, the training status remained `running` (to allow the tick to complete). The ControlButtons component therefore showed pause/stop buttons instead of completion-focused controls. After feedback ended, the `finished` status showed the correct completion UI.

**Impact:**

Resolved by moving completion to a dedicated `feedback` status and persistent result view. The engine no longer ticks through feedback automatically.

**Planned Fix:**

No further fix planned.

---

## Resolved Issues

- Feedback phase UI no longer exposes pause/stop controls during the completion celebration.
