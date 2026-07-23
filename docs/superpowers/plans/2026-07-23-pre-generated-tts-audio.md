# Pre-generated TTS Audio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace core browser-synthesized training prompts with the 18 checked-in Mandarin MP3 files while preserving engine timing, adding deterministic failure recovery, and retaining tones and browser TTS as limited fallbacks.

**Architecture:** Keep `useKegelEngine` and its `VoiceEvent` stream unchanged. Add a pure event-to-asset resolver and a focused `PreRecordedAudioAdapter`; `VoiceController` uses recorded audio for fixed prompts, Web Audio tones after recorded-audio failure, and Web Speech only for dynamic round announcements. Both recorded audio and Web Speech must settle on end, error, cancellation, or timeout so one browser failure cannot block the queue.

**Tech Stack:** React 19, TypeScript, Vite `import.meta.env.BASE_URL`, browser `HTMLAudioElement`, Web Speech API, Vitest 4, Bun.

---

## File map

- Create `src/voice/voiceAssets.ts`: pure mapping from voice events and modes to public MP3 URLs, plus the preload URL list.
- Create `src/voice/voiceAssets.test.ts`: mapping and base-path tests.
- Create `src/voice/PreRecordedAudioAdapter.ts`: cached HTML audio playback, preload, cancellation, timeout, and support detection.
- Create `src/voice/PreRecordedAudioAdapter.test.ts`: adapter lifecycle and failure recovery tests.
- Modify `src/voice/types.ts`: add the narrow recorded-audio adapter contract.
- Modify `src/voice/VoiceController.ts`: prefer recorded files for fixed prompts and fall back safely.
- Modify `src/voice/VoiceController.test.ts`: cover recorded playback, tone fallback, dynamic round TTS, and cancellation.
- Modify `src/voice/SpeechSynthesisAdapter.ts`: retain the active utterance and add cancellation/timeout settlement.
- Modify `src/voice/SpeechSynthesisAdapter.test.ts`: reproduce and prevent permanent pending playback.
- Modify `src/hooks/useVoiceAssistant.ts`: construct and inject `PreRecordedAudioAdapter`.
- Modify `docs/VOICE_ASSISTANT_SPEC.md`, `docs/TASKS.md`, `docs/IMPLEMENTATION_STATUS.md`, `CHANGELOG.md`, and `KNOWN_ISSUES.md`: record truthful behavior, status, changes, and remaining platform limits.
- Create `docs/decisions/ADR-005-pre-generated-tts-audio.md`: record the switch from runtime TTS to local fixed prompts.

The existing files under `public/audio/voice/` are inputs and must not be renamed or transcoded.

### Task 1: Resolve voice events to local assets

**Files:**
- Create: `src/voice/voiceAssets.ts`
- Create: `src/voice/voiceAssets.test.ts`
- Modify: `src/voice/types.ts`

- [ ] **Step 1: Write failing resolver tests**

Create `src/voice/voiceAssets.test.ts` with table-driven assertions:

```ts
import { describe, expect, it } from 'vitest';
import { allVoiceAssetUrls, resolveVoiceAsset } from './voiceAssets';
import type { VoiceSettings } from './types';

const settings: VoiceSettings = {
  enabled: true,
  mode: 'concise',
  language: 'zh-CN',
  volume: 0.7,
  rate: 0.95,
  pitch: 1,
  countdownFrom: 3,
  announceRound: true,
  announceNextStage: false,
  hapticsEnabled: true,
};

describe('voiceAssets', () => {
  it('maps concise, guided, common, and countdown prompts under the Vite base path', () => {
    expect(resolveVoiceAsset({ type: 'training-ready' }, settings, '/kagle/'))
      .toBe('/kagle/audio/voice/concise/ready.mp3');
    expect(resolveVoiceAsset(
      { type: 'stage-enter', stage: 'contract' },
      { ...settings, mode: 'guided' },
      '/kagle/',
    )).toBe('/kagle/audio/voice/guided/contract.mp3');
    expect(resolveVoiceAsset({ type: 'paused' }, settings, '/kagle/'))
      .toBe('/kagle/audio/voice/common/paused.mp3');
    expect(resolveVoiceAsset(
      { type: 'countdown', stage: 'hold', seconds: 3 },
      { ...settings, mode: 'countdown' },
      '/kagle/',
    )).toBe('/kagle/audio/voice/countdown/3.mp3');
  });

  it('leaves dynamic and non-speech events unresolved', () => {
    expect(resolveVoiceAsset(
      { type: 'round-start', round: 2, totalRounds: 10 }, settings, '/kagle/',
    )).toBeNull();
    expect(resolveVoiceAsset(
      { type: 'stage-enter', stage: 'idle' }, settings, '/kagle/',
    )).toBeNull();
    expect(resolveVoiceAsset(
      { type: 'training-ready' }, { ...settings, mode: 'sound-only' }, '/kagle/',
    )).toBeNull();
  });

  it('returns the 18 unique preload URLs', () => {
    const urls = allVoiceAssetUrls('/kagle/');
    expect(urls).toHaveLength(18);
    expect(new Set(urls)).toHaveLength(18);
  });
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `bun run test -- src/voice/voiceAssets.test.ts`

Expected: FAIL because `./voiceAssets` does not exist.

- [ ] **Step 3: Add the recorded-audio interface and minimal resolver**

Append this focused contract to `src/voice/types.ts`:

```ts
export interface RecordedVoicePlaybackAdapter {
  preload(urls: readonly string[]): Promise<void>;
  play(url: string, volume: number): Promise<boolean>;
  stop(): void;
  isSupported(): boolean;
}
```

Implement `voiceAssets.ts` with:

```ts
import type { VoiceEvent, VoiceSettings } from './types';

const assetPaths = [
  'concise/ready.mp3',
  'concise/contract.mp3',
  'concise/hold.mp3',
  'concise/relax.mp3',
  'concise/completed.mp3',
  'guided/ready.mp3',
  'guided/contract.mp3',
  'guided/hold.mp3',
  'guided/relax.mp3',
  'guided/completed.mp3',
  'common/paused.mp3',
  'common/resumed.mp3',
  'common/stopped.mp3',
  'countdown/1.mp3',
  'countdown/2.mp3',
  'countdown/3.mp3',
  'countdown/4.mp3',
  'countdown/5.mp3',
] as const;

function assetUrl(path: string, baseUrl: string): string {
  return `${baseUrl.replace(/\/?$/, '/')}audio/voice/${path}`;
}

export function allVoiceAssetUrls(baseUrl = import.meta.env.BASE_URL): string[] {
  return assetPaths.map(path => assetUrl(path, baseUrl));
}

export function resolveVoiceAsset(
  event: VoiceEvent,
  settings: VoiceSettings,
  baseUrl = import.meta.env.BASE_URL,
): string | null {
  if (!settings.enabled || settings.mode === 'off' || settings.mode === 'sound-only') return null;
  if (event.type === 'round-start') return null;
  if (event.type === 'countdown') {
    return settings.mode === 'countdown'
      ? assetUrl(`countdown/${event.seconds}.mp3`, baseUrl)
      : null;
  }
  if (event.type === 'stage-enter') {
    if (event.stage === 'idle') return null;
    const folder = settings.mode === 'concise' ? 'concise' : 'guided';
    return assetUrl(`${folder}/${event.stage}.mp3`, baseUrl);
  }
  if (event.type === 'paused' || event.type === 'resumed' || event.type === 'stopped') {
    return assetUrl(`common/${event.type}.mp3`, baseUrl);
  }
  if (event.type === 'training-ready') {
    const folder = settings.mode === 'concise' ? 'concise' : 'guided';
    return assetUrl(`${folder}/ready.mp3`, baseUrl);
  }
  if (event.type === 'completed') {
    const folder = settings.mode === 'concise' ? 'concise' : 'guided';
    return assetUrl(`${folder}/completed.mp3`, baseUrl);
  }
  return null;
}
```

- [ ] **Step 4: Run resolver tests**

Run: `bun run test -- src/voice/voiceAssets.test.ts`

Expected: PASS, 3 tests.

- [ ] **Step 5: Commit only resolver files**

```bash
git add src/voice/types.ts src/voice/voiceAssets.ts src/voice/voiceAssets.test.ts
git commit -m "feat: 添加本地语音资源映射"
```

### Task 2: Implement deterministic prerecorded playback

**Files:**
- Create: `src/voice/PreRecordedAudioAdapter.ts`
- Create: `src/voice/PreRecordedAudioAdapter.test.ts`

- [ ] **Step 1: Write failing adapter lifecycle tests**

Build a small `FakeAudio` in the test that records listeners, `play`, `pause`, `load`, `currentTime`, and `volume`. Cover these exact cases:

```ts
it('resolves true on ended and applies volume', async () => {
  const { adapter, latestAudio } = setup();
  const result = adapter.play('/voice.mp3', 0.6);
  latestAudio().emit('ended');
  await expect(result).resolves.toBe(true);
  expect(latestAudio().volume).toBe(0.6);
});

it('resolves false on error and allows the next play', async () => {
  const { adapter, latestAudio } = setup();
  const first = adapter.play('/broken.mp3', 0.7);
  latestAudio().emit('error');
  await expect(first).resolves.toBe(false);
  const second = adapter.play('/working.mp3', 0.7);
  latestAudio().emit('ended');
  await expect(second).resolves.toBe(true);
});

it('settles the active play as false when stopped', async () => {
  const { adapter } = setup();
  const result = adapter.play('/voice.mp3', 0.7);
  adapter.stop();
  await expect(result).resolves.toBe(false);
});

it('settles false after the playback timeout', async () => {
  vi.useFakeTimers();
  const { adapter } = setup();
  const result = adapter.play('/voice.mp3', 0.7);
  await vi.advanceTimersByTimeAsync(8_000);
  await expect(result).resolves.toBe(false);
  vi.useRealTimers();
});
```

- [ ] **Step 2: Run tests and verify the missing module failure**

Run: `bun run test -- src/voice/PreRecordedAudioAdapter.test.ts`

Expected: FAIL because the adapter does not exist.

- [ ] **Step 3: Implement the adapter with one settlement path**

Create a private `finish(result: boolean)` callback for the active playback. It must clear the 8-second timer, remove `ended` and `error` listeners, clear the active reference, and resolve exactly once. `stop()` must pause the active element, reset `currentTime` inside `try/catch`, and call `finish(false)`. Cache elements by URL; `preload()` creates missing elements, sets `preload = 'auto'`, and calls `load()` without waiting indefinitely. `play()` clamps volume to `0..1`, starts from time zero, and converts a rejected `audio.play()` promise to `false`.

Use an injectable scope so tests do not depend on jsdom:

```ts
interface AudioScope {
  Audio?: new (src?: string) => HTMLAudioElement;
}

const PLAYBACK_TIMEOUT_MS = 8_000;

export class PreRecordedAudioAdapter implements RecordedVoicePlaybackAdapter {
  constructor(private readonly scope: AudioScope = globalThis as AudioScope) {}
  // cache, active audio, active finish callback
}
```

- [ ] **Step 4: Run adapter and resolver tests**

Run: `bun run test -- src/voice/PreRecordedAudioAdapter.test.ts src/voice/voiceAssets.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the adapter**

```bash
git add src/voice/PreRecordedAudioAdapter.ts src/voice/PreRecordedAudioAdapter.test.ts
git commit -m "feat: 添加预生成语音播放适配器"
```

### Task 3: Integrate recorded prompts into the controller

**Files:**
- Modify: `src/voice/VoiceController.ts`
- Modify: `src/voice/VoiceController.test.ts`

- [ ] **Step 1: Add failing controller tests**

Add a `FakeRecordedAdapter` implementing `RecordedVoicePlaybackAdapter`, then cover:

```ts
it('prefers a recorded file for fixed speech', async () => {
  const { controller, recorded, speech } = setup();
  controller.enqueue({ type: 'stage-enter', stage: 'contract' }, context);
  await controller.flush(context.now);
  expect(recorded.played).toEqual(['/kagle/audio/voice/guided/contract.mp3']);
  expect(speech.spoken).toEqual([]);
});

it('falls back to a cue when recorded playback fails', async () => {
  const { controller, recorded, audio } = setup();
  recorded.nextResult = false;
  controller.enqueue({ type: 'stage-enter', stage: 'contract' }, context);
  await controller.flush(context.now);
  expect(audio.cues).toEqual(['contract']);
});

it('uses browser speech only for a dynamic round announcement', async () => {
  const { controller, recorded, speech } = setup();
  controller.enqueue({ type: 'round-start', round: 2, totalRounds: 10 }, context);
  await controller.flush(context.now);
  expect(recorded.played).toEqual([]);
  expect(speech.spoken).toEqual(['第 2 组，共 10 组']);
});

it('stops recorded playback when a new stage interrupts it', () => {
  const { controller, recorded } = setup();
  controller.enqueue({ type: 'stage-enter', stage: 'contract' }, context);
  expect(recorded.stopCalls).toBe(1);
});
```

Set the test settings mode to `guided` and inject base URL `/kagle/` into `VoiceController` so expected URLs do not depend on the Vitest environment.

- [ ] **Step 2: Run the controller test and confirm failure**

Run: `bun run test -- src/voice/VoiceController.test.ts`

Expected: FAIL because the constructor has no recorded adapter and fixed events still call `speech.speak()`.

- [ ] **Step 3: Add recorded playback without changing engine timing**

Extend the constructor with:

```ts
constructor(
  private readonly speech: VoicePlaybackAdapter,
  private readonly audio: VoicePlaybackAdapter,
  private readonly recorded: RecordedVoicePlaybackAdapter,
  private readonly haptics: HapticAdapter,
  private settings: VoiceSettings,
  private readonly baseUrl = import.meta.env.BASE_URL,
) {}
```

In `drain()` preserve the existing sound-only branch. For speech modes, call `resolveVoiceAsset(item.event, this.settings, this.baseUrl)`. If it returns a URL, await `recorded.play(url, volume)`; when it returns `false`, resolve the existing cue and call `audio.playCue(cue)` if one exists. Only call `resolveSpeech()` and `speech.speak()` when no recorded URL exists, which limits Web Speech to round announcements.

Update `stopPlayback()` to call `recorded.stop()`. Update `preload()` to include `recorded.preload(allVoiceAssetUrls(baseUrl))`. Update all existing test constructors with the fake recorded adapter.

- [ ] **Step 4: Run all voice controller tests**

Run: `bun run test -- src/voice/VoiceController.test.ts`

Expected: PASS, including all existing queue and expiry tests.

- [ ] **Step 5: Commit controller integration**

```bash
git add src/voice/VoiceController.ts src/voice/VoiceController.test.ts
git commit -m "feat: 优先播放本地训练语音"
```

### Task 4: Prevent Web Speech from permanently blocking the queue

**Files:**
- Modify: `src/voice/SpeechSynthesisAdapter.ts`
- Modify: `src/voice/SpeechSynthesisAdapter.test.ts`

- [ ] **Step 1: Write failing timeout and cancellation tests**

Use fake synthesis and utterance classes that can omit events. Add:

```ts
it('settles when the browser emits neither end nor error', async () => {
  vi.useFakeTimers();
  const adapter = createSupportedAdapter();
  const result = adapter.speak(speakOptions);
  await vi.advanceTimersByTimeAsync(8_000);
  await expect(result).resolves.toBeUndefined();
  vi.useRealTimers();
});

it('settles the current speak when stop cancels playback', async () => {
  const adapter = createSupportedAdapter();
  const result = adapter.speak(speakOptions);
  adapter.stop();
  await expect(result).resolves.toBeUndefined();
});
```

- [ ] **Step 2: Run the focused test and confirm it hangs or fails before the fix**

Run: `bun run test -- src/voice/SpeechSynthesisAdapter.test.ts`

Expected: FAIL because a missing browser event leaves the promise pending.

- [ ] **Step 3: Add a retained utterance and unified settlement**

Store the current utterance and finish callback on the adapter. Use an 8-second timeout. The unified finish callback must clear the timer, remove both listeners, clear references, and resolve once. Call the previous finish callback before starting a new utterance and from `stop()` after `cancel()`. Preserve the existing safe behavior when the API is unavailable or throws.

- [ ] **Step 4: Run speech and controller tests**

Run: `bun run test -- src/voice/SpeechSynthesisAdapter.test.ts src/voice/VoiceController.test.ts`

Expected: PASS with no pending Vitest handles.

- [ ] **Step 5: Commit the reliability fix**

```bash
git add src/voice/SpeechSynthesisAdapter.ts src/voice/SpeechSynthesisAdapter.test.ts
git commit -m "fix: 防止浏览器语音永久阻塞队列"
```

### Task 5: Wire the adapter and verify production asset paths

**Files:**
- Modify: `src/hooks/useVoiceAssistant.ts`

- [ ] **Step 1: Add the adapter to the existing controller construction**

Import `PreRecordedAudioAdapter` and instantiate it between the existing speech and haptics dependencies:

```ts
controllerRef.current = new VoiceController(
  new SpeechSynthesisAdapter(),
  new AudioFileAdapter(),
  new PreRecordedAudioAdapter(),
  new HapticAdapter(),
  settings,
);
```

Do not alter the hook API or add a second timer.

- [ ] **Step 2: Run type checking through the production build**

Run: `bun run build`

Expected: exit 0; Vite emits the application with base `/kagle/`.

- [ ] **Step 3: Verify all source MP3s exist and the production output contains them**

Run:

```bash
find public/audio/voice -type f -name '*.mp3' | wc -l
find dist/audio/voice -type f -name '*.mp3' | wc -l
```

Expected: both commands print `18`.

- [ ] **Step 4: Commit the React wiring and audio assets**

```bash
git add src/hooks/useVoiceAssistant.ts public/audio/voice
git commit -m "feat: 接入本地普通话训练语音"
```

### Task 6: Update architecture and delivery documentation

**Files:**
- Create: `docs/decisions/ADR-005-pre-generated-tts-audio.md`
- Modify: `docs/VOICE_ASSISTANT_SPEC.md`
- Modify: `docs/TASKS.md`
- Modify: `docs/IMPLEMENTATION_STATUS.md`
- Modify: `CHANGELOG.md`
- Modify: `KNOWN_ISSUES.md`

- [ ] **Step 1: Record the architectural decision**

Create ADR-005 with status `Accepted`, context describing unreliable and mechanical runtime Web Speech, the decision to ship 18 build-time-generated Mandarin files, and consequences: deterministic voice quality, about 200 KB of assets, no runtime cloud dependency, browser TTS retained only for dynamic round announcements, and manual regeneration when copy changes.

- [ ] **Step 2: Update factual status documents**

Update the voice specification with the actual directories, 24 kHz / 48 kbps format, recorded-first flow, timeout behavior, and fallback order. Mark the related task complete only after automated verification passes. Describe the feature as implemented in `IMPLEMENTATION_STATUS.md` only after tests and build succeed.

- [ ] **Step 3: Record user-visible and unresolved behavior**

Add a changelog entry for natural local Mandarin prompts and queue recovery. In `KNOWN_ISSUES.md`, retain or add only genuine remaining limits: round announcements still depend on platform TTS, HTML audio initiation remains subject to browser autoplay policy, and audio quality has been manually generated rather than programmatically reproducible. Do not claim cross-device manual QA unless it was actually performed.

- [ ] **Step 4: Run documentation checks**

Run:

```bash
rg -n "Web Speech API|预生成|本地语音|24 kHz|48 kbps" docs/VOICE_ASSISTANT_SPEC.md docs/IMPLEMENTATION_STATUS.md KNOWN_ISSUES.md CHANGELOG.md docs/decisions/ADR-005-pre-generated-tts-audio.md
git diff --check
```

Expected: the new architecture is consistently described and `git diff --check` prints nothing.

- [ ] **Step 5: Commit documentation**

```bash
git add docs/decisions/ADR-005-pre-generated-tts-audio.md docs/VOICE_ASSISTANT_SPEC.md docs/TASKS.md docs/IMPLEMENTATION_STATUS.md CHANGELOG.md KNOWN_ISSUES.md
git commit -m "docs: 更新本地语音实现状态"
```

### Task 7: Full verification and manual QA handoff

**Files:**
- Modify only if verification reveals a defect directly caused by this feature.

- [ ] **Step 1: Run all automated tests**

Run: `bun run test`

Expected: exit 0; all existing and new tests pass.

- [ ] **Step 2: Run lint**

Run: `bun run lint`

Expected: exit 0 with no new warnings or errors.

- [ ] **Step 3: Run production build**

Run: `bun run build`

Expected: exit 0 and exactly 18 MP3 files under `dist/audio/voice/`.

- [ ] **Step 4: Perform browser scenarios**

Run `bun run dev`, then verify in a real browser: preview; concise contract/hold/relax; guided prompts; countdown 5 through 1; pause/resume; stop; completion; sound-only; rapid stage interruption; and one deliberately missing asset to confirm cue fallback. Restore the asset immediately after the failure scenario. Repeat core playback on Safari or a mobile device when available.

Expected: no queue remains silent after a playback error; no stale prompt continues into the next stage; visual timing remains authoritative. Record any platform not actually tested as unresolved rather than claiming completion.

- [ ] **Step 5: Review the final diff against scope**

Run:

```bash
git status --short
git diff --stat HEAD~6
```

Expected: only voice implementation, supplied audio assets, their tests, and required documentation changed by this feature. Existing unrelated staged work must remain identifiable and must not be folded into feature commits.
