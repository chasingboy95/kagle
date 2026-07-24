# Task List

**Last verified against repository:** 2026-07-24

## In Progress

- None

## Next (Priority Order)

1. **Consolidate SVG asset copies**
  - Remove duplicate SVGs in `assets/muscle-sphere/` and `public/muscle-sphere/`.
  - Reconcile differences: fascia, fibers, fluid, highlight between root and src copies.
  - Keep `src/assets/muscle-sphere/` as single source of truth.
  - Add proper group IDs to all SVG files.
  - Remove stray `script_content.txt` file (investigate purpose first).

2. **Add training engine integration tests**
  - Test `start()`, `pause()`, `resume()`, `stop()`, `restart()` transitions.
  - Test phase progression timing.
  - Test pause compensation accuracy.
  - Test that multiple pause/resume cycles don't drift.
  - Test countdown event emission.
  - Mock time if needed.

3. **Fix PAUSED_CONTAINER_TARGET relax entry**
  - Current relax entry in `PAUSED_CONTAINER_TARGET` appears to be copy-pasted from auraVariants.
  - Should set container to relaxed pose (scale 1, y 0, etc.).

4. **Verify and fix relax filter transitions**
  - fibers variant relax does not animate filter back to default.
  - Check all 9 layers for animation completeness.

5. **Update AGENTS.md to reflect React/TypeScript/Vite project structure**
  - Current AGENTS.md describes a single-file vanilla HTML project.
  - Update to match the actual React app structure.

## Backlog

6. **Component tests for all UI components**
  - TimerDisplay, ProgressBar, TrainingStatus, ControlButtons, ConfigPanel, VoiceSettingsPanel.
  - Use Vitest + React Testing Library.

7. **E2E smoke test with Playwright**
  - Verify full workout flow.
  - Verify voice output (capture SpeechSynthesis calls).
  - Verify MuscleSphere renders.

8. **Cross-browser manual testing**
  - Chrome, Safari, Firefox on desktop.
  - Safari on iOS, Chrome on Android.
  - Record results in TEST_PLAN.md.
  - Verify local MP3 autoplay/unlock and fallback on desktop and mobile devices.

9. **Accessibility audit**
  - Keyboard navigation.
  - Screen reader compatibility.
  - Focus indicators.
  - Color contrast.

10. **Performance profiling**
  - MuscleSphere framerate during hold tremor.
  - Memory usage over long sessions.
  - Background tab timing drift measurement.

11. **Replace conic progress ring with SVG circle**
  - The ring now progresses continuously across contract and hold.
  - Replace the conic-gradient implementation with an SVG `<circle>` `stroke-dasharray` if smoother interpolation is still needed.

12. **Add language selector to VoiceSettingsPanel**
  - en-US scripts are defined but cannot be selected from UI.
  - Add a language picker to the settings panel.

13. **Investigate Ripple component**
  - `src/components/Ripple.tsx` is not imported anywhere.
  - Determine if it should be integrated into MuscleSphere or removed.

14. **Remove or repurpose `hero.png`**
  - `src/assets/hero.png` exists but is not referenced.
  - Either remove or document its intended use.

15. **Evaluate Web Worker for background-tab timer**
  - Move 100ms tick to Web Worker to avoid browser throttling.
  - Use `postMessage` to synchronize state.

## Blocked

- None currently.

## Completed

- Sprint 1 continuous training UX:
  - UI presents contract and hold as one “收缩并保持” phase.
  - Progress ring continues across the internal contract → hold boundary.
  - Countdown continues across the internal contract → hold boundary.
  - Timer wording uses “慢慢放松” and localized “第 X / Y 次”.
  - Unit tests cover the display timing calculation and unified labels.
- Basic PWA support with GitHub Pages subpath handling and iOS standalone metadata.
- Training engine with all state transitions.
- Timer display with countdown and round info.
- Progress bar (linear, overall workout progress).
- MuscleSphere 9-layer SVG animation (idle/contract/hold/relax).
- Voice assistance module (5 modes, zh-CN/en-US, queue, dedup, expiry).
- 18 packaged Mandarin neural-TTS prompts with local-first routing, timeout recovery, interruption protection, and tone fallback only for events with a `resolveCue()` mapping; failed countdown audio has no cue and is skipped silently.
- Voice settings persistence (localStorage with validation).
- Haptic feedback (contract, relax, complete).
- Config panel with stepper controls.
- Settings panel (mode, volume, rate, countdown, round announcement, haptics, preview).
- Screen Wake Lock integration.
- GitHub Actions CI/CD (build + deploy to GitHub Pages).
- Dark theme, mobile-first responsive layout (Tailwind).
- Automated tests cover local voice asset resolution/playback and Web Speech watchdog behavior.
- Documentation baseline.
- 5 ADRs recorded, including the packaged Mandarin voice decision.
