 # Product Requirements Document (PRD)

 **Last verified against repository:** 2026-07-27

 ## Product Vision

A browser-based pelvic floor (Kegel) training timer that provides real-time visual and voice guidance during workouts. The application is a training companion, not a diagnostic or medical device. It helps users perform correct timing for each phase of a Kegel exercise: ready, contract, hold, relax, and feedback, across configurable repetitions.

 ## Target Users

 - People prescribed Kegel exercises by a healthcare provider.
 - People who want a simple, private, app-free training timer that works on any device.
 - Users who prefer visual muscle animation over abstract countdown timers.
 - Users who need voice guidance to stay on rhythm without watching the screen.

 ## Primary User Scenarios

1. **Quick session**: User opens the page, adjusts contract/hold/relax times and repetitions per set, presses "开始训练", follows voice and visual cues through the workout.
 2. **Pause and resume**: User needs to interrupt mid-workout; presses "暂停", then "继续" when ready.
 3. **Different voice modes**: User switches between "静音" (off), "节奏提示" (sound-only), or "语音教练" (coach) to match their preference.
4. **Progressive overload**: User gradually increases hold time or repetitions per set over weeks using the stepper controls.
 5. **Nighttime use**: User reduces screen brightness; the dark theme is already the default.

 ## MVP Scope

 The following are implemented and verified in the current codebase (v0.0.0):

- Training timer with configurable contract, hold, relax times (seconds) and repetitions per set.
 - Training state machine: idle → ready → contract → hold → relax → feedback → idle.
 - Phase progression (after ready): contract → hold → relax.
 - 100ms-interval tick engine using `performance.now()` for drift-resistant timing.
 - Pause accounts for elapsed pause duration when resuming (phase timing adjusted).
 - Stop resets to idle; restart replays full session.
 - Screen Wake Lock API to prevent sleep during training.
 - MuscleSphere 9-layer SVG composited animation (idle, contract, hold, relax stages).
 - Progress ring (SVG circle stroke-dasharray, optional, shown during running state).
 - Progress bar (linear gradient bar at bottom).
 - TimerDisplay with phase name and countdown seconds.
- ConfigPanel with stepper controls for contract/hold/relax/repetitions per set (disabled during training).
 - Voice assistance with 3 modes (off, sound-only, coach).
 - Voice scripts in zh-CN for all modes; en-US scripts defined.
 - SpeechSynthesis (Web Speech API) and AudioFileAdapter (Web Audio API tones).
 - Haptic feedback via `navigator.vibrate` (contract 40ms, relax 25ms, complete [35,80,35]).
 - VoiceSettingsPanel with enable, final countdown selector, advanced settings (mode, volume, rate, progress announcements, haptics).
 - Voice setting persistence in localStorage (`kegel.voice-settings.v1`).
 - All validations and safety checks for localStorage unavailability, API unsupported, etc.
 - Dark, mobile-first responsive layout using Tailwind CSS.
 - CI/CD pipeline (GitHub Actions → GitHub Pages).
 - 16 test suites (92 tests): engine countdown events, VoiceController queue rules, SpeechSynthesisAdapter fallback, voiceSettings validation, all passing.

 ## Non-goals (explicitly out of scope for MVP)

 - Not a diagnostic or medical device.
 - No user accounts or authentication.
 - No training history or analytics logging.
 - No microphone or voice recognition.
 - No audio file downloads or streaming TTS.
 - No real-time coaching or form correction.
 - No social features or sharing.
 - No push notifications.
 - No native mobile app.

 ## Success Criteria

 1. Timer accuracy: phase transitions occur within 100ms of scheduled time.
 2. Pause/resume preserves remaining phase time (no time lost or gained).
 3. All 4 test suites pass.
 4. Voice plays on Chrome, Safari, and Firefox desktop and mobile.
 5. MuscleSphere renders all 9 layers without visual artifacts.
 6. Build completes without errors.
 7. Deployed via CI to GitHub Pages.

 ## Accessibility Principles

 - Voice guidance provides an alternative channel to visual information.
 - MuscleSphere has `role="img"` with `aria-label` describing current stage.
 - AnimatePresence transitions are short (≤250ms) and not purely decorative.
 - Framer Motion's `useReducedMotion` hook is respected: hold simplifies to contract (removes tremor), all layers snap to first keyframe only.
 - Config inputs have `aria-label` attributes.
 - VoiceSettingsPanel uses semantic form elements (`<select>`, `<input type="range">`, `<input type="checkbox">`, `<fieldset>`, `<legend>`).
 - Color alone is not used as the only means of conveying information (stage text is shown).

 ## Privacy Principles

 - No microphone access required or requested.
 - No audio data recorded or transmitted.
 - No user analytics or tracking.
 - All settings stored in `localStorage` only.
 - No network requests except for initial page load and asset loading.
 - Application works fully offline after first load. PWA service worker caches app shell, audio assets, and provides version update notification.

 ## Known Product Assumptions

 - Users perform Kegel exercises in a private, quiet environment.
 - Users have basic familiarity with Kegel technique (the app does not teach form).
- The default configuration is 3 seconds contract, 3 seconds hold, and 3 seconds relax, repeated 10 times; those 10 repetitions together form one set (90 seconds of active exercise).
 - Default voice mode is "coach" with a final 3-second countdown for new users.
 - Users access the app primarily on mobile devices in portrait orientation.
