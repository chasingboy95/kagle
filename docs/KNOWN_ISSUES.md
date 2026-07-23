# Known Issues

## Current Status

Last updated: 2026-07-23

This document tracks known technical debt, limitations, and follow-up work. Issues listed here are not considered completed until they are verified and removed or marked resolved.

---

## 1. MuscleSphere Rendering and Testing

**Status:** Open

**Description:**

The MuscleSphere component implements the core visual training experience with 9 SVG layers and four animation states:

- idle
- contract
- hold
- relax

However, it currently lacks automated component tests and documented rendering validation.

**Impact:**

Animation regressions may not be detected automatically.

**Planned Fix:**

- Add MuscleSphere component tests.
- Verify stage transitions.
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

The training engine state machine is implemented, but integration-level testing is incomplete.

**Impact:**

Complex flows may regress without detection.

**Planned Fix:**

Add integration tests covering:

- start
- pause
- resume
- phase transitions
- round progression
- finish state

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
- animation performance
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

## Resolved Issues

None currently tracked.
