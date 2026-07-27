#!/usr/bin/env python3
"""Record production build resource sizes as a JSON baseline."""
import json, os, subprocess, sys, glob as gmod, gzip
from datetime import datetime, timezone

BUILD_DIR = "dist"

def size_of(pattern: str) -> dict:
    files = sorted(gmod.glob(f"{BUILD_DIR}/{pattern}", recursive=True))
    if not files:
        return {"bytes": 0, "human": "0B", "files": []}
    total = sum(os.path.getsize(f) for f in files)
    rels = [f.removeprefix(f"{BUILD_DIR}/") for f in files]
    return {"bytes": total, "human": f"{total}B", "files": rels}

def gzip_of(pattern: str) -> int:
    files = gmod.glob(f"{BUILD_DIR}/{pattern}", recursive=True)
    total = 0
    for f in files:
        with open(f, 'rb') as fh:
            total += len(gzip.compress(fh.read()))
    return total

def main():
    output = sys.argv[1] if len(sys.argv) > 1 else ".github/bundle-baseline.json"

    if not os.path.isdir(BUILD_DIR):
        print(f"ERROR: {BUILD_DIR} not found. Run 'bun run build' first.", file=sys.stderr)
        sys.exit(1)

    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    commit = subprocess.check_output(["git", "rev-parse", "--short", "HEAD"]).decode().strip()

    audio_keys = ["audio/zh-CN/*.mp3", "audio/voice/en-US/*.mp3", "audio/voice/guided/*.mp3",
                  "audio/voice/concise/*.mp3", "audio/voice/countdown/*.mp3", "audio/voice/common/*.mp3"]
    audio_total = sum(size_of(k)["bytes"] for k in audio_keys)

    total_bytes = sum(
        os.path.getsize(os.path.join(dp, f))
        for dp, _, fns in os.walk(BUILD_DIR) for f in fns
    )

    result = {
        "recordedAt": now,
        "commit": commit,
        "bundles": {
            "mainJS": size_of("assets/index-*.js"),
            "mainCSS": size_of("assets/index-*.css"),
            "workerJS": size_of("assets/timingWorker-*.js"),
            "svgs": size_of("assets/*.svg")
        },
        "audio": {
            "zhCN": size_of("audio/zh-CN/*.mp3"),
            "enUS": size_of("audio/voice/en-US/*.mp3"),
            "guided": size_of("audio/voice/guided/*.mp3"),
            "concise": size_of("audio/voice/concise/*.mp3"),
            "countdown": size_of("audio/voice/countdown/*.mp3"),
            "common": size_of("audio/voice/common/*.mp3"),
            "total": {"bytes": audio_total, "human": f"{audio_total}B"}
        },
        "totalDist": {"bytes": total_bytes, "human": f"{total_bytes}B"},
        "gzipEstimates": {
            "mainJS": {"bytes": gzip_of("assets/index-*.js"), "human": f"{gzip_of('assets/index-*.js')}B"},
            "mainCSS": {"bytes": gzip_of("assets/index-*.css"), "human": f"{gzip_of('assets/index-*.css')}B"}
        }
    }

    os.makedirs(os.path.dirname(output) or ".", exist_ok=True)
    with open(output, 'w') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"Baseline written to {output}")

if __name__ == "__main__":
    main()
