# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
until the first stable release (pre-1.0.0).

## [Unreleased]

### Added

- Training engine: configurable contract/hold/relax times and rounds
- Training state machine: idle → running → paused → finished
- Phase progression: contract → hold → relax per round
- 100ms interval tick with `performance.now()` drift resistance
- Pause/resume with exact timing compensation
- Stop/restart functionality
- Screen Wake Lock API integration (prevents sleep during workout)
- Voice assistance with 5 modes: off, sound-only, concise, guided, countdown
- Voice scripts in zh-CN (concise and guided); en-US scripts defined
- Web Speech API output for dynamic round announcements and en-US speech
- 18 packaged Mandarin neural-TTS prompts for more natural local Chinese guidance without runtime cloud requests
- Web Audio API tone synthesis (sound-only mode)
- Haptic feedback via `navigator.vibrate`
- Voice settings persistence in localStorage
- Voice settings validation with per-field fallback
- Voice queue with priority, deduplication, and expiry
- VoiceSettingsPanel: mode selector, volume, rate, countdown-from, round announcement, haptics toggle, preview
- MuscleSphere: 9-layer SVG composited animation
- MuscleSphere stages: idle, contract, hold, relax
- MuscleSphere reduced-motion support
- MuscleSphere pause freeze
- MuscleSphere progress ring (conic gradient, optional)
- TimerDisplay: phase name, countdown seconds, round info
- TrainingStatus: title, streak, round indicator
- ProgressBar: linear workout progress with spring animation
- ConfigPanel: stepper controls for contract/hold/relax/rounds
- ControlButtons: start/pause/resume/stop/restart
- Dark theme, mobile-first responsive layout (Tailwind CSS)
- GH Pages deployment via GitHub Actions
- Automated unit test suite for training countdown and voice behavior
- Documentation baseline (docs/ directory)
- ADR-001 through ADR-005

### Changed

- Migrated from single-file vanilla HTML to React/TypeScript/Vite project structure
- MuscleSphere redesign: removed hue-rotate, container rotation, borderRadius animation
- Relax animation: replaced spring with cubic-bezier duration scaled to stage length
- Hold tremor: limited to fibers, core, fascia only
- Progress ring: muted gray tones instead of bright accent colors
- Voice architecture: adapter pattern replacing direct SpeechSynthesis usage
- Fixed Chinese prompts now prefer packaged audio; dynamic round announcements and en-US continue to use platform speech synthesis

### Fixed

- Voice playback queues recover when browser audio or speech completion events are missing, using 8-second watchdogs and safe fallback
- Interrupted local voice playback no longer triggers a stale fallback cue after a newer stage, pause, or stop event

### Removed

- (None yet tracked — initial changelog)
