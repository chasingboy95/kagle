# Performance Baseline

**Last updated:** 2026-07-27

## Resource Size Baseline

Recorded 2026-07-27, commit 4bed0ec.

| Resource | Size | Gzip (transfer) |
|----------|------|-----------------|
| Main JS (index-*.js) | 395 KB | 119 KB |
| Main CSS (index-*.css) | 40 KB | 6.9 KB |
| Worker JS (timingWorker-*.js) | 0.2 KB | -- |
| SVG assets (fascia.svg + fibers.svg) | 12 KB | -- |
| **Total JS+CSS+SVG** | **447 KB** | **126 KB** |
| zh-CN recordings (7 files) | 68 KB | -- |
| en-US recordings (7 files) | 90 KB | -- |
| Guided recordings (5 files) | 87 KB | -- |
| Concise recordings (5 files) | 39 KB | -- |
| Countdown recordings (5 files) | 34 KB | -- |
| Common recordings (3 files) | 27 KB | -- |
| **Total audio (41 files)** | **344 KB** | -- |
| **Total dist (all files)** | **819 KB** | -- |

## Budget Thresholds

CI enforces a 15% growth threshold on key bundles against the recorded baseline.
Run `python3 scripts/record_bundle_baseline.py` to update the baseline after
intentional size increases (e.g., new features).

## Real-Device Performance Testing

Real-device testing (iOS Safari, Android Chrome) remains unverified.
See [KNOWN_ISSUES.md](KNOWN_ISSUES.md) section "Mobile Browser Validation".

### Test Plan

1. Animation frame rate during all 6 stages (idle/ready/contract/hold/relax/feedback).
2. Long tasks (>50ms) identified via Chrome DevTools remote debugging.
3. Memory trend: heap snapshots at start and after 10 min of continuous training.
4. Background/foreground: timer compensation after 30s background.
5. Reduced motion: verify `prefers-reduced-motion` mode behavior.

### Methodology

- Target: iPhone SE (2022) or newer, mid-range Android (Pixel 6a or equivalent)
- Remote debugging (Safari Web Inspector / Chrome DevTools)
- 3 runs per scenario, use median values
- Document browser version, OS version, device model

## CI Bundle Size Check

The `ci.yml` workflow runs `python3 scripts/check_bundle_size.py` after the build
step. It compares current bundle sizes against `.github/bundle-baseline.json`
and fails if any key bundle exceeds the 15% growth threshold.
