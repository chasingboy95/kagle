import { afterEach, describe, expect, it, vi } from 'vitest';
import { PreRecordedAudioAdapter } from './PreRecordedAudioAdapter';

type AudioListener = () => void;

class FakeAudio {
  static instances: FakeAudio[] = [];
  static loadThrowSources = new Set<string>();

  readonly listeners = new Map<string, Set<AudioListener>>();
  preload = '';
  volume = 1;
  private time = 7;
  loadCalls = 0;
  pauseCalls = 0;
  playResult: Promise<void> = Promise.resolve();
  throwOnPlay = false;
  throwOnAddEventListener = false;
  throwOnPause = false;
  throwOnCurrentTimeReset = false;

  constructor(readonly src = '') {
    FakeAudio.instances.push(this);
  }

  addEventListener(type: string, listener: AudioListener): void {
    if (this.throwOnAddEventListener) throw new Error('listener unavailable');
    const listeners = this.listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: AudioListener): void {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type: string): void {
    for (const listener of this.listeners.get(type) ?? []) listener();
  }

  get currentTime(): number { return this.time; }
  set currentTime(value: number) {
    if (value === 0 && this.throwOnCurrentTimeReset) throw new Error('seek unavailable');
    this.time = value;
  }

  load(): void {
    this.loadCalls += 1;
    if (FakeAudio.loadThrowSources.has(this.src)) throw new Error('load unavailable');
  }

  pause(): void {
    this.pauseCalls += 1;
    if (this.throwOnPause) throw new Error('pause unavailable');
  }

  play(): Promise<void> {
    if (this.throwOnPlay) throw new Error('play unavailable');
    return this.playResult;
  }
}

const scope = () => ({ Audio: FakeAudio as unknown as new (src?: string) => HTMLAudioElement });

afterEach(() => {
  vi.useRealTimers();
  FakeAudio.instances = [];
  FakeAudio.loadThrowSources.clear();
});

describe('PreRecordedAudioAdapter', () => {
  it('resolves true on ended and applies a clamped volume', async () => {
    const adapter = new PreRecordedAudioAdapter(scope());
    const result = adapter.play('/contract.mp3', 1.4);
    const audio = FakeAudio.instances[0];

    expect(audio.volume).toBe(1);
    expect(audio.currentTime).toBe(0);
    audio.emit('ended');

    await expect(result).resolves.toBe(true);
    expect(audio.listeners.get('ended')?.size).toBe(0);
    expect(audio.listeners.get('error')?.size).toBe(0);
  });

  it('recovers after an error and can play the cached audio again', async () => {
    const adapter = new PreRecordedAudioAdapter(scope());
    const failed = adapter.play('/hold.mp3', 0.5);
    const audio = FakeAudio.instances[0];
    audio.emit('error');
    await expect(failed).resolves.toBe(false);

    const succeeded = adapter.play('/hold.mp3', 0.5);
    expect(FakeAudio.instances).toHaveLength(1);
    audio.emit('ended');
    await expect(succeeded).resolves.toBe(true);
  });

  it('stop immediately resolves pending playback false', async () => {
    const adapter = new PreRecordedAudioAdapter(scope());
    const result = adapter.play('/relax.mp3', 0.4);
    const audio = FakeAudio.instances[0];

    adapter.stop();

    await expect(result).resolves.toBe(false);
    expect(audio.pauseCalls).toBe(1);
    expect(audio.currentTime).toBe(0);
  });

  it('a new play cancels the previous pending play', async () => {
    const adapter = new PreRecordedAudioAdapter(scope());
    const first = adapter.play('/first.mp3', 0.5);
    const firstAudio = FakeAudio.instances[0];
    const second = adapter.play('/second.mp3', 0.5);

    await expect(first).resolves.toBe(false);
    expect(firstAudio.pauseCalls).toBe(1);
    FakeAudio.instances[1].emit('ended');
    await expect(second).resolves.toBe(true);
  });

  it('stops timed-out audio, cleans up, and allows the next play', async () => {
    vi.useFakeTimers();
    const adapter = new PreRecordedAudioAdapter(scope());
    const result = adapter.play('/silent.mp3', 0.5);
    const audio = FakeAudio.instances[0];

    await vi.advanceTimersByTimeAsync(8_000);

    await expect(result).resolves.toBe(false);
    expect(audio.pauseCalls).toBe(1);
    expect(audio.currentTime).toBe(0);
    expect(audio.listeners.get('ended')?.size).toBe(0);
    expect(audio.listeners.get('error')?.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);

    const recovered = adapter.play('/next.mp3', 0.5);
    FakeAudio.instances[1].emit('ended');
    await expect(recovered).resolves.toBe(true);
  });

  it('returns false when play rejects', async () => {
    const adapter = new PreRecordedAudioAdapter(scope());
    await adapter.preload(['/blocked.mp3']);
    FakeAudio.instances[0].playResult = Promise.reject(new Error('blocked'));

    await expect(adapter.play('/blocked.mp3', -1)).resolves.toBe(false);
    expect(FakeAudio.instances[0].volume).toBe(0);
  });

  it('returns false when play throws synchronously', async () => {
    const adapter = new PreRecordedAudioAdapter(scope());
    await adapter.preload(['/throw.mp3']);
    FakeAudio.instances[0].throwOnPlay = true;

    await expect(adapter.play('/throw.mp3', 0.5)).resolves.toBe(false);
  });

  it('recovers when adding an event listener throws without leaving a timer active', async () => {
    vi.useFakeTimers();
    const adapter = new PreRecordedAudioAdapter(scope());
    await adapter.preload(['/listener.mp3']);
    const audio = FakeAudio.instances[0];
    audio.throwOnAddEventListener = true;

    await expect(adapter.play('/listener.mp3', 0.5)).resolves.toBe(false);
    expect(vi.getTimerCount()).toBe(0);

    audio.throwOnAddEventListener = false;
    const recovered = adapter.play('/listener.mp3', 0.5);
    audio.emit('ended');
    await expect(recovered).resolves.toBe(true);
  });

  it('stop settles exactly once and recovers when pause and seek throw', async () => {
    const adapter = new PreRecordedAudioAdapter(scope());
    const pending = adapter.play('/fragile.mp3', 0.5);
    const audio = FakeAudio.instances[0];
    const results: boolean[] = [];
    void pending.then((result) => results.push(result));
    audio.throwOnPause = true;
    audio.throwOnCurrentTimeReset = true;

    adapter.stop();
    audio.emit('ended');
    await expect(pending).resolves.toBe(false);
    await Promise.resolve();
    expect(results).toEqual([false]);

    audio.throwOnPause = false;
    audio.throwOnCurrentTimeReset = false;
    const recovered = adapter.play('/fragile.mp3', 0.5);
    audio.emit('ended');
    await expect(recovered).resolves.toBe(true);
  });

  it('fails safely when Audio is unsupported or construction throws', async () => {
    const unsupported = new PreRecordedAudioAdapter({});
    const throwing = new PreRecordedAudioAdapter({ Audio: class { constructor() { throw new Error('no audio'); } } as unknown as new () => HTMLAudioElement });

    expect(unsupported.isSupported()).toBe(false);
    await expect(unsupported.play('/voice.mp3', 0.5)).resolves.toBe(false);
    await expect(unsupported.preload(['/voice.mp3'])).resolves.toBeUndefined();
    expect(throwing.isSupported()).toBe(true);
    await expect(throwing.play('/voice.mp3', 0.5)).resolves.toBe(false);
    expect(() => throwing.stop()).not.toThrow();
  });

  it('preloads each missing URL once and calls load safely', async () => {
    const adapter = new PreRecordedAudioAdapter(scope());

    await adapter.preload(['/one.mp3', '/two.mp3', '/one.mp3']);
    await adapter.preload(['/one.mp3']);

    expect(FakeAudio.instances.map((audio) => audio.src)).toEqual(['/one.mp3', '/two.mp3']);
    expect(FakeAudio.instances.map((audio) => audio.preload)).toEqual(['auto', 'auto']);
    expect(FakeAudio.instances.map((audio) => audio.loadCalls)).toEqual([1, 1]);
  });

  it('continues preloading after load throws', async () => {
    FakeAudio.loadThrowSources.add('/broken.mp3');
    const adapter = new PreRecordedAudioAdapter(scope());

    await expect(adapter.preload(['/broken.mp3', '/healthy.mp3'])).resolves.toBeUndefined();

    expect(FakeAudio.instances.map((audio) => audio.preload)).toEqual(['auto', 'auto']);
    expect(FakeAudio.instances.map((audio) => audio.loadCalls)).toEqual([1, 1]);
    expect(FakeAudio.instances.map((audio) => audio.src)).toEqual(['/broken.mp3', '/healthy.mp3']);
  });
});
