# Kagle — 盆底肌训练计时器

A browser-based pelvic floor (Kegel) training timer with real-time visual animation and voice guidance. Built with React, TypeScript, Vite, Tailwind CSS, and Framer Motion.

## Current Status

**MVP complete.** All core features implemented and tested. Voice assistance with 3 modes (静音/节奏提示/语音教练), 9-layer SVG muscle animation, ready → contract → hold → relax → feedback training lifecycle, configurable workout parameters, pause/resume/stop, and settings persistence.

[Live Demo](https://chasingboy95.github.io/kagle/) (GitHub Pages)

## Tech Stack

- **Framework**: React 19, TypeScript
- **Build**: Vite 8
- **Styling**: Tailwind CSS 4
- **Animation**: Framer Motion 12
- **Voice**: Web Speech API, Web Audio API
- **Haptics**: Navigator Vibration API
- **Persistence**: localStorage
- **Testing**: Vitest, React Testing Library, Playwright
- **Linting**: Oxlint
- **CI/CD**: GitHub Actions to GitHub Pages and manually triggered Cloudflare Pages deployment

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

# Run the browser smoke test (after `bunx playwright install chromium`)
bun run build
bun run test:e2e (requires `bunx playwright install chromium`)

# Lint
bun run lint

# TypeScript checks
bun run typecheck

# Preview production build
bun run preview
```

CI (.github/workflows/ci.yml) runs on every PR and push to main. Deployment (.github/workflows/deploy.yml) proceeds only after CI passes on main, using the verified build artifact. Quality gates include tests, lint, TypeScript
checks, a production build, and the Playwright browser smoke test first.
Deployment is skipped if any quality check fails.

Cloudflare Pages can be deployed manually from **Actions → Deploy to Cloudflare
Pages → Run workflow** on the `main` branch. Add the repository secrets
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` first, then enter the
Cloudflare Pages project name (default: `kagle`). The manual workflow reruns
lint, typecheck, coverage tests, and a root-path production build before
deployment. GitHub Pages continues to build at `/kagle/`; Cloudflare Pages
builds at `/`.

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
