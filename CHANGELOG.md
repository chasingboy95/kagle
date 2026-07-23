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
 - Web Speech API speech output
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
 - Test suite: 4 files, 11 tests
 - Documentation baseline (docs/ directory)
 - ADR-001 through ADR-004
 
 ### Changed
 
 - Migrated from single-file vanilla HTML to React/TypeScript/Vite project structure
 - MuscleSphere redesign: removed hue-rotate, container rotation, borderRadius animation
 - Relax animation: replaced spring with cubic-bezier duration scaled to stage length
 - Hold tremor: limited to fibers, core, fascia only
 - Progress ring: muted gray tones instead of bright accent colors
 - Voice architecture: adapter pattern replacing direct SpeechSynthesis usage
 
 ### Fixed
 
 - (None yet tracked — initial changelog)
 
 ### Removed
 
 - (None yet tracked — initial changelog)
