import { afterEach, describe, expect, it, vi } from 'vitest';
import { SpeechSynthesisAdapter } from './SpeechSynthesisAdapter';

const options = {
  text: '收紧',
  language: 'zh-CN' as const,
  volume: 0.7,
  rate: 0.95,
  pitch: 1.1,
  voiceName: '首选音色',
};

class FakeUtterance {
  static throwOnConstruct = false;
  static throwOnEvent?: string;
  readonly listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();
  lang = '';
  volume = 1;
  rate = 1;
  pitch = 1;
  voice: SpeechSynthesisVoice | null = null;

  constructor(readonly text: string) {
    if (FakeUtterance.throwOnConstruct) throw new Error('construction failed');
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    if (FakeUtterance.throwOnEvent === type) throw new Error('listener failed');
    const listeners = this.listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    this.listeners.get(type)?.delete(listener);
  }

  dispatch(type: string): void {
    for (const listener of this.listeners.get(type) ?? []) {
      if (typeof listener === 'function') listener(new Event(type));
      else listener.handleEvent(new Event(type));
    }
  }

  listenerCount(): number {
    return [...this.listeners.values()].reduce((count, listeners) => count + listeners.size, 0);
  }
}

class FakeSynthesis {
  readonly voices = [
    { name: '其他音色', lang: 'zh-CN' },
    { name: '首选音色', lang: 'en-US' },
  ] as SpeechSynthesisVoice[];
  spoken: FakeUtterance[] = [];
  cancelCalls = 0;
  cancelError = false;
  speakError = false;

  getVoices = () => this.voices;
  addEventListener = vi.fn();
  speak = (utterance: SpeechSynthesisUtterance): void => {
    this.spoken.push(utterance as unknown as FakeUtterance);
    if (this.speakError) throw new Error('speak failed');
  };
  cancel = (): void => {
    this.cancelCalls += 1;
    if (this.cancelError) throw new Error('cancel failed');
  };
  pause = vi.fn();
  resume = vi.fn();
}

function createAdapter(synthesis = new FakeSynthesis()) {
  const adapter = new SpeechSynthesisAdapter({
    speechSynthesis: synthesis as unknown as SpeechSynthesis,
    SpeechSynthesisUtterance: FakeUtterance as unknown as typeof SpeechSynthesisUtterance,
  });
  return { adapter, synthesis };
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  FakeUtterance.throwOnConstruct = false;
  FakeUtterance.throwOnEvent = undefined;
});

describe('SpeechSynthesisAdapter', () => {
  it('fails safely when speech synthesis is unavailable', async () => {
    const adapter = new SpeechSynthesisAdapter({});

    expect(adapter.isSupported()).toBe(false);
    await expect(adapter.speak(options)).resolves.toBeUndefined();
    expect(() => adapter.stop()).not.toThrow();
  });

  it.each(['end', 'error'])('settles and removes listeners on %s', async event => {
    const { adapter, synthesis } = createAdapter();
    const promise = adapter.speak(options);
    const utterance = synthesis.spoken[0];

    utterance.dispatch(event);

    await expect(promise).resolves.toBeUndefined();
    expect(utterance.listenerCount()).toBe(0);
  });

  it('cancels, settles, and cleans up after eight seconds without an event', async () => {
    vi.useFakeTimers();
    const { adapter, synthesis } = createAdapter();
    const promise = adapter.speak(options);
    const utterance = synthesis.spoken[0];
    const cancelsAfterStart = synthesis.cancelCalls;

    await vi.advanceTimersByTimeAsync(8_000);

    await expect(promise).resolves.toBeUndefined();
    expect(synthesis.cancelCalls).toBe(cancelsAfterStart + 1);
    expect(utterance.listenerCount()).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('settles and cleans up when timeout cancellation throws', async () => {
    vi.useFakeTimers();
    const { adapter, synthesis } = createAdapter();
    const promise = adapter.speak(options);
    const utterance = synthesis.spoken[0];
    synthesis.cancelError = true;
    const cancelsAfterStart = synthesis.cancelCalls;

    await vi.advanceTimersByTimeAsync(8_000);

    await expect(promise).resolves.toBeUndefined();
    expect(synthesis.cancelCalls).toBe(cancelsAfterStart + 1);
    expect(utterance.listenerCount()).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('stop settles the active speak immediately', async () => {
    const { adapter, synthesis } = createAdapter();
    const promise = adapter.speak(options);
    const utterance = synthesis.spoken[0];

    adapter.stop();

    await expect(promise).resolves.toBeUndefined();
    expect(synthesis.cancelCalls).toBeGreaterThan(0);
    expect(utterance.listenerCount()).toBe(0);
  });

  it('a second speak settles the first and remains independently finishable', async () => {
    const { adapter, synthesis } = createAdapter();
    const first = adapter.speak(options);
    const firstUtterance = synthesis.spoken[0];
    const second = adapter.speak({ ...options, text: '放松' });
    const secondUtterance = synthesis.spoken[1];

    await expect(first).resolves.toBeUndefined();
    expect(firstUtterance.listenerCount()).toBe(0);
    secondUtterance.dispatch('end');
    await expect(second).resolves.toBeUndefined();
  });

  it('a second speak still replaces the first when cancellation throws', async () => {
    const { adapter, synthesis } = createAdapter();
    const first = adapter.speak(options);
    const firstUtterance = synthesis.spoken[0];
    synthesis.cancelError = true;

    const second = adapter.speak({ ...options, text: '放松' });
    const secondUtterance = synthesis.spoken[1];

    await expect(first).resolves.toBeUndefined();
    expect(firstUtterance.listenerCount()).toBe(0);
    secondUtterance.dispatch('end');
    await expect(second).resolves.toBeUndefined();
  });

  it('settles when cancel throws during stop', async () => {
    const { adapter, synthesis } = createAdapter();
    const promise = adapter.speak(options);
    synthesis.cancelError = true;

    expect(() => adapter.stop()).not.toThrow();
    await expect(promise).resolves.toBeUndefined();
  });

  it('settles and cleans up when synthesis speak throws', async () => {
    const { adapter, synthesis } = createAdapter();
    synthesis.speakError = true;

    await expect(adapter.speak(options)).resolves.toBeUndefined();
    expect(synthesis.spoken[0].listenerCount()).toBe(0);
  });

  it('settles when utterance construction throws', async () => {
    const { adapter, synthesis } = createAdapter();
    FakeUtterance.throwOnConstruct = true;

    await expect(adapter.speak(options)).resolves.toBeUndefined();
    expect(synthesis.spoken).toHaveLength(0);
  });

  it('settles and removes a partially registered listener when registration throws', async () => {
    const { adapter } = createAdapter();
    const removeListener = vi.spyOn(FakeUtterance.prototype, 'removeEventListener');
    FakeUtterance.throwOnEvent = 'error';

    await expect(adapter.speak(options)).resolves.toBeUndefined();
    expect(removeListener).toHaveBeenCalledWith('end', expect.any(Function));
  });

  it('applies voice options and retains the active utterance until settlement', async () => {
    const { adapter, synthesis } = createAdapter();
    const promise = adapter.speak(options);
    const utterance = synthesis.spoken[0];

    expect(utterance).toMatchObject({
      text: options.text,
      lang: options.language,
      volume: options.volume,
      rate: options.rate,
      pitch: options.pitch,
      voice: synthesis.voices[1],
    });
    const inspectableAdapter = adapter as unknown as {
      activeSpeak?: { utterance: SpeechSynthesisUtterance };
    };
    expect(inspectableAdapter.activeSpeak?.utterance).toBe(utterance);

    utterance.dispatch('end');
    await promise;
    expect(inspectableAdapter.activeSpeak).toBeUndefined();
  });

  it('a stale timeout cannot cancel a newer utterance', async () => {
    vi.useFakeTimers();
    const timeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    const { adapter, synthesis } = createAdapter();
    const first = adapter.speak(options);
    const staleTimeout = timeoutSpy.mock.calls[0][0] as () => void;
    const second = adapter.speak({ ...options, text: '放松' });
    const cancelCalls = synthesis.cancelCalls;

    staleTimeout();

    expect(synthesis.cancelCalls).toBe(cancelCalls);
    synthesis.spoken[1].dispatch('end');
    await Promise.all([first, second]);
  });
});
