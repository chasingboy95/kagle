# Modular Voice Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a production-ready, local-only voice, sound cue, and haptic assistant driven directly by the existing Kegel training engine.

**Architecture:** `useKegelEngine` emits deterministic typed events from its authoritative clock. A stable `VoiceController` queues, deduplicates, expires, and routes those events through replaceable speech/sound adapters and optional haptics; React only connects the engine, settings, and UI.

**Tech Stack:** React 19, TypeScript, Web Speech API, Web Audio API, Vibration API, localStorage, Vitest, Vite

---

## File map

- Create `src/voice/types.ts`: public voice types and adapter contracts.
- Create `src/voice/voiceScripts.ts`: localized event-to-text/cue resolution.
- Create `src/voice/voiceSettings.ts`: defaults, validation, persistence.
- Create `src/voice/SpeechSynthesisAdapter.ts`: safe browser speech playback.
- Create `src/voice/AudioFileAdapter.ts`: local synthesized sound cues.
- Create `src/voice/HapticAdapter.ts`: optional vibration patterns.
- Create `src/voice/VoiceController.ts`: priority queue, expiry, interruption, deduplication.
- Create `src/hooks/useVoiceAssistant.ts`: stable React lifecycle integration.
- Create `src/components/VoiceSettingsPanel.tsx`: accessible mobile-first settings UI.
- Modify `src/hooks/useKegelEngine.ts`: emit events from authoritative state/timing.
- Modify `src/App.tsx`: connect engine, assistant, and panel without touching `MuscleSphere`.
- Create `src/voice/*.test.ts`: required unit tests.
- Modify `package.json` and `bun.lock`: add Vitest and test script.

### Task 1: Test runner and voice contracts

**Files:**
- Modify: `package.json`
- Modify: `bun.lock`
- Create: `src/voice/types.ts`
- Create: `src/voice/voiceSettings.test.ts`

- [ ] **Step 1: Install the test runner and add the test script**

Run: `bun add -D vitest`

Add to `package.json` scripts:

```json
"test": "vitest run"
```

Expected: `vitest` appears in `devDependencies`; `bun.lock` changes.

- [ ] **Step 2: Create the public contracts**

Create `src/voice/types.ts` with these exact exported shapes:

```ts
import type { TrainingPhase } from '../types/training';

export type MuscleStage = TrainingPhase;
export type VoiceMode = 'off' | 'sound-only' | 'concise' | 'guided' | 'countdown';
export type VoiceLanguage = 'zh-CN' | 'en-US';
export type SoundCue = 'ready' | 'contract' | 'hold' | 'relax' | 'pause' | 'resume' | 'complete' | 'stop';

export interface VoiceSettings {
  enabled: boolean;
  mode: VoiceMode;
  language: VoiceLanguage;
  volume: number;
  rate: number;
  pitch: number;
  voiceName?: string;
  countdownFrom: 0 | 3 | 5;
  announceRound: boolean;
  announceNextStage: boolean;
  hapticsEnabled: boolean;
}

export type VoiceEvent =
  | { type: 'training-ready' }
  | { type: 'stage-enter'; stage: MuscleStage }
  | { type: 'countdown'; stage: MuscleStage; seconds: number }
  | { type: 'round-start'; round: number; totalRounds: number }
  | { type: 'paused' }
  | { type: 'resumed' }
  | { type: 'completed' }
  | { type: 'stopped' };

export interface SpeakOptions {
  text: string;
  language: VoiceLanguage;
  volume: number;
  rate: number;
  pitch: number;
  voiceName?: string;
}

export interface VoicePlaybackAdapter {
  preload(): Promise<void>;
  speak(options: SpeakOptions): Promise<void>;
  playCue(cue: SoundCue): Promise<void>;
  stop(): void;
  pause(): void;
  resume(): void;
  isSupported(): boolean;
}

export interface VoiceQueueItem {
  id: string;
  event: VoiceEvent;
  priority: number;
  createdAt: number;
  expiresAt: number;
}
```

- [ ] **Step 3: Write failing settings tests**

Create `src/voice/voiceSettings.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { DEFAULT_VOICE_SETTINGS, parseVoiceSettings } from './voiceSettings';

describe('parseVoiceSettings', () => {
  it('returns the required defaults for invalid storage', () => {
    expect(parseVoiceSettings('{broken')).toEqual(DEFAULT_VOICE_SETTINGS);
  });

  it('keeps valid fields and falls back invalid fields independently', () => {
    const result = parseVoiceSettings(JSON.stringify({
      enabled: false,
      mode: 'guided',
      language: 'fr-FR',
      volume: 9,
      countdownFrom: 5,
    }));
    expect(result.enabled).toBe(false);
    expect(result.mode).toBe('guided');
    expect(result.language).toBe('zh-CN');
    expect(result.volume).toBe(0.7);
    expect(result.countdownFrom).toBe(5);
  });
});
```

- [ ] **Step 4: Verify RED**

Run: `bun test src/voice/voiceSettings.test.ts`
Expected: FAIL because `./voiceSettings` does not exist.

- [ ] **Step 5: Commit the contracts and failing test**

```bash
git add package.json bun.lock src/voice/types.ts src/voice/voiceSettings.test.ts
git commit -m "test: 添加语音模块契约与设置用例"
```

### Task 2: Validated settings persistence

**Files:**
- Create: `src/voice/voiceSettings.ts`
- Test: `src/voice/voiceSettings.test.ts`

- [ ] **Step 1: Implement defaults and field-level validation**

Create `src/voice/voiceSettings.ts` exporting:

```ts
import type { VoiceLanguage, VoiceMode, VoiceSettings } from './types';

export const VOICE_SETTINGS_KEY = 'kegel.voice-settings.v1';
export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
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

const modes: VoiceMode[] = ['off', 'sound-only', 'concise', 'guided', 'countdown'];
const languages: VoiceLanguage[] = ['zh-CN', 'en-US'];
const numberIn = (value: unknown, min: number, max: number, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? value : fallback;
const bool = (value: unknown, fallback: boolean) => typeof value === 'boolean' ? value : fallback;

export function validateVoiceSettings(value: unknown): VoiceSettings {
  const input = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    enabled: bool(input.enabled, DEFAULT_VOICE_SETTINGS.enabled),
    mode: modes.includes(input.mode as VoiceMode) ? input.mode as VoiceMode : DEFAULT_VOICE_SETTINGS.mode,
    language: languages.includes(input.language as VoiceLanguage) ? input.language as VoiceLanguage : DEFAULT_VOICE_SETTINGS.language,
    volume: numberIn(input.volume, 0, 1, DEFAULT_VOICE_SETTINGS.volume),
    rate: numberIn(input.rate, 0.5, 2, DEFAULT_VOICE_SETTINGS.rate),
    pitch: numberIn(input.pitch, 0, 2, DEFAULT_VOICE_SETTINGS.pitch),
    ...(typeof input.voiceName === 'string' && input.voiceName.trim() ? { voiceName: input.voiceName } : {}),
    countdownFrom: input.countdownFrom === 0 || input.countdownFrom === 3 || input.countdownFrom === 5
      ? input.countdownFrom : DEFAULT_VOICE_SETTINGS.countdownFrom,
    announceRound: bool(input.announceRound, DEFAULT_VOICE_SETTINGS.announceRound),
    announceNextStage: bool(input.announceNextStage, DEFAULT_VOICE_SETTINGS.announceNextStage),
    hapticsEnabled: bool(input.hapticsEnabled, DEFAULT_VOICE_SETTINGS.hapticsEnabled),
  };
}

export function parseVoiceSettings(raw: string | null): VoiceSettings {
  if (!raw) return { ...DEFAULT_VOICE_SETTINGS };
  try { return validateVoiceSettings(JSON.parse(raw)); }
  catch { return { ...DEFAULT_VOICE_SETTINGS }; }
}

export function loadVoiceSettings(storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage): VoiceSettings {
  try { return parseVoiceSettings(storage?.getItem(VOICE_SETTINGS_KEY) ?? null); }
  catch { return { ...DEFAULT_VOICE_SETTINGS }; }
}

export function saveVoiceSettings(settings: VoiceSettings, storage: Pick<Storage, 'setItem'> | undefined = globalThis.localStorage): void {
  try { storage?.setItem(VOICE_SETTINGS_KEY, JSON.stringify(validateVoiceSettings(settings))); }
  catch { /* private mode or quota errors */ }
}
```

- [ ] **Step 2: Verify GREEN**

Run: `bun test src/voice/voiceSettings.test.ts`
Expected: 2 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/voice/voiceSettings.ts src/voice/voiceSettings.test.ts
git commit -m "feat: 添加语音设置校验与持久化"
```

### Task 3: Scripts, speech fallback, sound, and haptics

**Files:**
- Create: `src/voice/voiceScripts.ts`
- Create: `src/voice/SpeechSynthesisAdapter.ts`
- Create: `src/voice/AudioFileAdapter.ts`
- Create: `src/voice/HapticAdapter.ts`
- Create: `src/voice/SpeechSynthesisAdapter.test.ts`

- [ ] **Step 1: Write the unsupported-browser test**

Create `src/voice/SpeechSynthesisAdapter.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { SpeechSynthesisAdapter } from './SpeechSynthesisAdapter';

describe('SpeechSynthesisAdapter', () => {
  it('fails safely when speech synthesis is unavailable', async () => {
    const adapter = new SpeechSynthesisAdapter({});
    expect(adapter.isSupported()).toBe(false);
    await expect(adapter.speak({ text: '收紧', language: 'zh-CN', volume: 0.7, rate: 0.95, pitch: 1 })).resolves.toBeUndefined();
    expect(() => adapter.stop()).not.toThrow();
  });
});
```

- [ ] **Step 2: Verify RED**

Run: `bun test src/voice/SpeechSynthesisAdapter.test.ts`
Expected: FAIL because the adapter module does not exist.

- [ ] **Step 3: Implement localized resolution**

Create `voiceScripts.ts` with `resolveSpeech(event, settings): string | null` and `resolveCue(event): SoundCue | null`. Use the exact requested Chinese concise/guided strings, restrained English equivalents, numeric countdown text, `第 ${round} 组，共 ${totalRounds} 组`, and optional next-stage suffix only when `announceNextStage` is true. Return `null` for `off`, `sound-only`, disabled settings, non-countdown modes receiving countdown, and round events when `announceRound` is false.

- [ ] **Step 4: Implement the speech adapter**

Create `SpeechSynthesisAdapter.ts`. Its constructor accepts `scope: Partial<Window> = window`, detects both `speechSynthesis` and `SpeechSynthesisUtterance`, caches voices, listens to `voiceschanged`, selects exact `voiceName` then matching `lang`, and resolves `speak()` on `end` or `error`. `stop()` calls `cancel()` in a try/catch; `pause()` and `resume()` safely call the browser methods. `playCue()` is a no-op because sound cues use the separate audio adapter.

- [ ] **Step 5: Implement local sound and haptics**

Create `AudioFileAdapter.ts` implementing `VoicePlaybackAdapter`. Lazily create/resume `AudioContext` in `preload()`. In `playCue()`, map cues to restrained frequencies/durations, connect `OscillatorNode -> GainNode -> destination`, ramp gain from `0.0001` to at most `0.08` and back, then stop. Speech methods are no-ops; `stop()` stops active oscillators.

Create `HapticAdapter.ts` with `trigger(event, enabled)`. Return immediately unless enabled and `navigator.vibrate` exists. Map contract to `40`, relax to `25`, completed to `[35, 80, 35]`; catch failures.

- [ ] **Step 6: Verify GREEN**

Run: `bun test src/voice/SpeechSynthesisAdapter.test.ts`
Expected: 1 test passes.

- [ ] **Step 7: Commit**

```bash
git add src/voice/voiceScripts.ts src/voice/SpeechSynthesisAdapter.ts src/voice/AudioFileAdapter.ts src/voice/HapticAdapter.ts src/voice/SpeechSynthesisAdapter.test.ts
git commit -m "feat: 添加本地语音声音与振动适配器"
```

### Task 4: Priority queue, expiry, interruption, and deduplication

**Files:**
- Create: `src/voice/VoiceController.ts`
- Create: `src/voice/VoiceController.test.ts`

- [ ] **Step 1: Write required failing controller tests**

Create a fake `VoicePlaybackAdapter` recording `spoken`, `cues`, and `stopCalls`, then add four tests in `VoiceController.test.ts`:

```ts
it('deduplicates the same countdown second', () => {
  controller.enqueue({ type: 'countdown', stage: 'hold', seconds: 3 }, context);
  controller.enqueue({ type: 'countdown', stage: 'hold', seconds: 3 }, context);
  expect(controller.inspectQueue().filter(item => item.event.type === 'countdown')).toHaveLength(1);
});

it('drops expired items before playback', async () => {
  controller.enqueue({ type: 'countdown', stage: 'hold', seconds: 2 }, { ...context, now: 100, stageEndsAt: 101 });
  await controller.flush(102);
  expect(adapter.spoken).toEqual([]);
});

it('pause stops playback and clears pending countdowns', () => {
  controller.enqueue({ type: 'countdown', stage: 'hold', seconds: 3 }, context);
  controller.enqueue({ type: 'paused' }, context);
  expect(adapter.stopCalls).toBe(1);
  expect(controller.inspectQueue().some(item => item.event.type === 'countdown')).toBe(false);
});

it('stop stops playback and clears the queue', () => {
  controller.enqueue({ type: 'stage-enter', stage: 'hold' }, context);
  controller.enqueue({ type: 'stopped' }, context);
  expect(adapter.stopCalls).toBe(1);
  expect(controller.inspectQueue().every(item => item.event.type === 'stopped')).toBe(true);
});
```

The shared context is `{ sessionId: 1, round: 1, now: 100, stageEndsAt: 10_000 }` with `countdown` settings.

- [ ] **Step 2: Verify RED**

Run: `bun test src/voice/VoiceController.test.ts`
Expected: FAIL because `VoiceController` does not exist.

- [ ] **Step 3: Implement deterministic IDs and queue rules**

Create `VoiceController.ts` with:

```ts
export interface VoiceEventContext {
  sessionId: number;
  round: number;
  now: number;
  stageEndsAt: number;
}

export class VoiceController {
  constructor(
    speech: VoicePlaybackAdapter,
    audio: VoicePlaybackAdapter,
    haptics: HapticAdapter,
    settings: VoiceSettings,
  );
  enqueue(event: VoiceEvent, context: VoiceEventContext): void;
  flush(now?: number): Promise<void>;
  updateSettings(settings: VoiceSettings): void;
  inspectQueue(): readonly VoiceQueueItem[];
  preload(): Promise<void>;
  stop(): void;
  isSupported(): boolean;
}
```

Build IDs from `sessionId`, `round`, stage/type, and countdown seconds. Use priorities `paused/stopped=500`, `stage-enter=400`, `training-ready/completed/round-start/resumed=300`, `countdown=200`. On stage entry, stop playback and remove countdowns. On pause, stop and remove countdowns. On stop, stop and clear everything before optionally adding only the stopped item. Sort descending priority then ascending creation time. Before playback, remove expired items. Route `sound-only` to the audio adapter, spoken modes through `resolveSpeech`, and invoke haptics independently when enabled.

- [ ] **Step 4: Verify GREEN**

Run: `bun test src/voice/VoiceController.test.ts`
Expected: all 4 controller tests pass.

- [ ] **Step 5: Run all voice tests**

Run: `bun test src/voice`
Expected: all tests pass with no unhandled rejection.

- [ ] **Step 6: Commit**

```bash
git add src/voice/VoiceController.ts src/voice/VoiceController.test.ts
git commit -m "feat: 添加语音优先级队列与去重"
```

### Task 5: Emit authoritative events from the training engine

**Files:**
- Modify: `src/hooks/useKegelEngine.ts`
- Create: `src/hooks/useKegelEngine.test.ts`

- [ ] **Step 1: Extract and test countdown emission state**

Add a failing unit test for an exported pure helper `getCountdownEvent(remainingMs, stage, countdownFrom, announced)` asserting `3000` emits 3, repeated `2990` returns null after adding 3 to the set, `0` returns null, and a threshold of 0 always returns null.

- [ ] **Step 2: Verify RED**

Run: `bun test src/hooks/useKegelEngine.test.ts`
Expected: FAIL because `getCountdownEvent` is not exported.

- [ ] **Step 3: Add the engine options and pure helper**

Add:

```ts
export interface KegelEngineVoiceOptions {
  onVoiceEvent?: (event: VoiceEvent, context: VoiceEventContext) => void;
  countdownFrom?: 0 | 3 | 5;
}

export function getCountdownEvent(
  remainingMs: number,
  stage: TrainingPhase,
  countdownFrom: 0 | 3 | 5,
  announced: ReadonlySet<number>,
): Extract<VoiceEvent, { type: 'countdown' }> | null {
  const seconds = Math.ceil(remainingMs / 1000);
  return stage !== 'idle' && seconds > 0 && seconds <= countdownFrom && !announced.has(seconds)
    ? { type: 'countdown', stage, seconds }
    : null;
}
```

Make `useKegelEngine(options = {})` keep the callback and threshold in refs. Track session ID, announced seconds, and current stage end timestamp in engine refs. Emit ready, round-start, stage-enter, countdown, paused, resumed, completed, and stopped only from the corresponding engine transitions. Clear announced seconds on stage change, not on resume. Do not add another interval or timeout.

- [ ] **Step 4: Verify GREEN**

Run: `bun test src/hooks/useKegelEngine.test.ts`
Expected: countdown helper tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useKegelEngine.ts src/hooks/useKegelEngine.test.ts
git commit -m "feat: 由训练引擎发出权威语音事件"
```

### Task 6: React assistant hook

**Files:**
- Create: `src/hooks/useVoiceAssistant.ts`

- [ ] **Step 1: Implement the stable hook**

Create one `SpeechSynthesisAdapter`, `AudioFileAdapter`, `HapticAdapter`, and `VoiceController` per mounted hook using lazy refs. Initialize settings with `loadVoiceSettings`. On setting updates, validate, persist, update controller, and update React state. Return:

```ts
export interface UseVoiceAssistantReturn {
  settings: VoiceSettings;
  supported: boolean;
  emit: (event: VoiceEvent, context: VoiceEventContext) => void;
  updateSettings: (updates: Partial<VoiceSettings>) => void;
  preview: () => Promise<void>;
  unlock: () => Promise<void>;
}
```

`emit` must remain referentially stable. It enqueues then requests `flush()` without throwing. `unlock` calls `preload()` from user interaction. `preview` preloads and emits a deterministic preview ready event with session `-1`.

- [ ] **Step 2: Type-check the hook**

Run: `bunx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useVoiceAssistant.ts
git commit -m "feat: 添加语音助手 React Hook"
```

### Task 7: Accessible mobile settings panel

**Files:**
- Create: `src/components/VoiceSettingsPanel.tsx`

- [ ] **Step 1: Implement the panel**

Use native `button`, `select`, `input type="range"`, and `input type="checkbox"` controls with explicit `label htmlFor`. Props:

```ts
interface VoiceSettingsPanelProps {
  settings: VoiceSettings;
  supported: boolean;
  onChange: (updates: Partial<VoiceSettings>) => void;
  onPreview: () => void;
}
```

Render the required assistance toggle, mode selector, countdown selector (0/3/5), volume, rate, round announcement, haptics, and preview button. Disable speech-only preview with explanatory text only when speech is unavailable and selected mode requires speech; keep sound-only usable. Match the existing dark translucent slate/indigo visual language and include `focus-visible:ring-2` styles. Do not add animation or touch `MuscleSphere.tsx`.

- [ ] **Step 2: Type-check**

Run: `bunx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/VoiceSettingsPanel.tsx
git commit -m "feat: 添加移动端语音设置面板"
```

### Task 8: Application integration and usage example

**Files:**
- Modify: `src/App.tsx`
- Modify: `README.md`

- [ ] **Step 1: Connect the assistant before the engine**

In `App`, call `useVoiceAssistant()` first, then:

```ts
const voice = useVoiceAssistant();
const engine = useKegelEngine({
  onVoiceEvent: voice.emit,
  countdownFrom: voice.settings.mode === 'countdown' ? voice.settings.countdownFrom : 0,
});
```

Wrap the start action so the user gesture first calls `voice.unlock()` and then `engine.start()`. Keep pause, resume, stop, and restart routed through the engine so events remain authoritative. Render `VoiceSettingsPanel` near `ConfigPanel`. Preserve all current user visual changes and leave `MuscleSphere.tsx` untouched.

- [ ] **Step 2: Document usage and browser behavior**

Add a concise README section showing the hook integration above and state: local browser synthesis only; no microphone or upload; speech pause uses stop/restart semantics because browser frame-level pause is inconsistent.

- [ ] **Step 3: Build and lint**

Run: `bun run build`
Expected: Vite production build exits 0.

Run: `bun run lint`
Expected: exit 0 with no new warnings from voice files.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx README.md
git commit -m "feat: 集成训练语音辅助与设置面板"
```

### Task 9: Final verification

**Files:**
- Verify only; fix only files introduced or directly modified by this plan if checks expose defects.

- [ ] **Step 1: Run the complete automated suite**

Run: `bun test`
Expected: all tests pass, including duplicate countdown, expiry, pause/stop clearing, settings validation, and unsupported speech.

- [ ] **Step 2: Run static verification**

Run: `bunx tsc --noEmit && bun run lint && bun run build`
Expected: all commands exit 0.

- [ ] **Step 3: Inspect scope**

Run: `git status --short && git diff --check`
Expected: no whitespace errors; pre-existing unrelated visual changes remain intact and are not reverted.

- [ ] **Step 4: Manual browser verification**

Run: `bun run dev --host 127.0.0.1`

Check one short two-round session in each relevant path: concise stage prompts; countdown emits each final second once; pause interrupts and resume does not replay stage guidance; stop clears speech; sound-only produces gentle local tones; off is silent; settings survive reload; visible stage text remains present; disabling speech APIs does not break controls.

- [ ] **Step 5: Final implementation commit if verification required fixes**

```bash
git add package.json bun.lock src README.md
git commit -m "fix: 完善语音辅助验证问题"
```
