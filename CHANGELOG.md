# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- Three explicit voice-assistance choices: 静音, 节奏提示, and 语音教练.
- Independent final 3-second or 5-second countdown for both audible modes.
- Automatic migration from legacy `concise`, `guided`, and `countdown` mode values to `coach`.
- Delayed sustain coaching cue around 35% into the hold phase.
- Unit coverage for mode migration, coach/rhythm routing, countdown independence, recording fallback, and sustain cancellation.
- Seven packaged Mandarin coach recordings for ready, contraction start, contraction sustain, release, pause, resume, and completion.

### Changed

- Replaced the previous five-mode voice selector with three behaviorally distinct modes.
- Countdown is now an enhancement rather than a voice mode.
- The settings panel no longer exposes unsupported concise/guided variants, next-stage announcements, pitch, or language switching.
- Fixed Mandarin prompts now use the new `public/audio/zh-CN/` recording set.
- Recorded playback failure now falls back to system speech before a non-verbal cue.
- The sustain prompt no longer plays immediately on entering the internal hold phase.
- Default voice settings now use coach mode with countdown and round announcements disabled.
- Countdown feedback now uses soft ascending synthesized tones instead of the legacy spoken-number MP3 files.
- Rhythm cues now use distinct two-note contraction and release patterns, with quieter single-note sustain feedback.

### Fixed

- Coach and guided selections no longer produce identical behavior under different labels.
- Countdown no longer implicitly selects guided scripts.
- Rhythm mode no longer plays full coach sentences.
- Rhythm mode cue keys now match the coach-oriented cue model, restoring audible feedback.
- GitHub Pages audio paths remain `BASE_URL` aware.

### Verification Pending

- Full test, build, and lint commands have not yet been rerun after this refactor.
- iOS and Android real-device audio QA remains outstanding.
