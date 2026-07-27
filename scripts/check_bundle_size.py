#!/usr/bin/env python3
"""Compare current build sizes against the baseline and report regressions."""
import json, os, sys, glob as gmod
from datetime import datetime, timezone

BUILD_DIR = "dist"
THRESHOLD_PCT = 15  # Allow up to 15% growth before flagging

def get_current_bytes(pattern: str) -> int:
    files = gmod.glob(f"{BUILD_DIR}/{pattern}", recursive=True)
    return sum(os.path.getsize(f) for f in files)

def main():
    baseline_path = sys.argv[1] if len(sys.argv) > 1 else ".github/bundle-baseline.json"

    if not os.path.isfile(baseline_path):
        print(f"WARNING: No baseline at {baseline_path}. Run 'python3 scripts/record_bundle_baseline.py' to create one.")
        print("Skipping bundle size check.")
        sys.exit(0)

    if not os.path.isdir(BUILD_DIR):
        print(f"ERROR: {BUILD_DIR} not found. Run 'bun run build' first.", file=sys.stderr)
        sys.exit(1)

    with open(baseline_path) as f:
        baseline = json.load(f)

    checks = [
        ("Main JS  ", "assets/index-*.js", baseline["bundles"]["mainJS"]["bytes"]),
        ("Main CSS ", "assets/index-*.css", baseline["bundles"]["mainCSS"]["bytes"]),
        ("Worker JS", "assets/timingWorker-*.js", baseline["bundles"]["workerJS"]["bytes"]),
    ]

    print()
    print("=== Bundle Size Check ===")
    recorded = baseline.get("recordedAt", "unknown")
    print(f"Baseline: {baseline_path} ({recorded})")
    print()

    regression = False
    for label, pattern, baseline_bytes in checks:
        current = get_current_bytes(pattern)
        if baseline_bytes == 0:
            print(f"  {label}: {current}B (no baseline)")
            continue

        diff = current - baseline_bytes
        pct = round((diff / baseline_bytes) * 100, 1)
        threshold_bytes = baseline_bytes * THRESHOLD_PCT // 100

        if diff <= 0:
            print(f"  {label}: {current}B vs {baseline_bytes}B ({pct}% smaller) ✓")
        elif diff <= threshold_bytes:
            print(f"  {label}: {current}B vs {baseline_bytes}B (+{pct}% within {THRESHOLD_PCT}% threshold) ✓")
        else:
            print(f"  {label}: {current}B vs {baseline_bytes}B (+{pct}% REGRESSION exceeding {THRESHOLD_PCT}% threshold) ✗")
            regression = True

    print()
    if regression:
        print(f"FAIL: One or more bundles exceed the {THRESHOLD_PCT}% growth threshold.")
        print("If the growth is intentional, update the baseline with:")
        print("  python3 scripts/record_bundle_baseline.py")
        sys.exit(1)
    else:
        print("PASS: All bundles within acceptable size limits.")
        sys.exit(0)

if __name__ == "__main__":
    main()
