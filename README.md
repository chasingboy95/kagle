# Kagle — Kegel Training Timer

A browser-based pelvic floor (Kegel) training timer with real-time visual animation and voice guidance. Built with React, TypeScript, Vite, Tailwind CSS, and Framer Motion.

## Current Status

**MVP complete.** All core features implemented and tested. Voice assistance with 5 modes, 9-layer SVG muscle animation, configurable workout parameters, pause/resume/stop, and settings persistence.

[Live Demo](https://huangyingting.github.io/kagle/) (GitHub Pages)

## Tech Stack

- **Framework**: React 19, TypeScript
- **Build**: Vite 8
- **Styling**: Tailwind CSS 4
- **Animation**: Framer Motion 12
- **Voice**: Web Speech API, Web Audio API
- **Haptics**: Navigator Vibration API
- **Persistence**: localStorage
- **Testing**: Vitest
- **Linting**: Oxlint
- **CI/CD**: GitHub Actions to GitHub Pages

## Setup

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Run tests
bun run test

# Lint
bun run lint

# Preview production build
bun run preview
```

## Key Documentation

- [PRD](docs/PRD.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Training Engine Spec](docs/TRAINING_ENGINE_SPEC.md)
- [MuscleSphere Spec](docs/MUSCLE_SPHERE_MOTION_SPEC.md)
- [Voice Assistant Spec](docs/VOICE_ASSISTANT_SPEC.md)
- [Voice Scripts](docs/VOICE_SCRIPTS.md)
- [Implementation Status](docs/IMPLEMENTATION_STATUS.md)
- [Known Issues](docs/KNOWN_ISSUES.md)
- [Test Plan](docs/TEST_PLAN.md)
- [Changelog](CHANGELOG.md)

## Supported Platforms

Modern browsers: Chrome, Safari, Firefox (desktop and mobile).

## Privacy

No microphone. No data upload. All settings in localStorage only.
