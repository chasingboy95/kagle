import { describe, expect, it } from 'vitest';
import { HapticAdapter } from './HapticAdapter';
import type {
  RecordedVoicePlaybackAdapter,
  SoundCue,
  SpeakOptions,
  VoicePlaybackAdapter,
  VoiceSettings,
} from './types';
import { VoiceController, type VoiceEventContext } from './VoiceController';

class FakeAdapter implements VoicePlaybackAdapter {
  spoken: string[] = [];
  cues: SoundCue[] = [];
  stopCalls = 0;
  supported = true;
  onSpeak?: () => void;

  async preload() {}
  async speak(options: SpeakOptions) {
    this.spoken.push(options.text);
    this.onSpeak?.();
  }
  async playCue(cue: SoundCue) { this.cues.push(cue); }
  stop() { this.stopCalls += 1; }
  pause() {}
  resume() {}
  isSupported() { return this.supported; }
}

class FakeRecordedAdapter implements RecordedVoicePlaybackAdapter {
  played: Array<{ url: string; volume: number }> = [];
  preloaded: readonly string[] = [];
  stopCalls = 0;
  playResult = true;
  deferPlayback = false;
  private pending?: (result: boolean) => void;
  onPlay?: () => void;
  supported = true;

  async preload(urls: readonly string[]) { this.preloaded = urls; }
  async play(url: string, volume: number) {
    this.played.push({ url, volume });
    this.onPlay?.();
    if (this.deferPlayback) {
      return new Promise<boolean>((resolve) => { this.pending = resolve; });
    }
    return this.playResult;
  }
  stop() {
    this.stopCalls += 1;
    this.resolvePending(false);
  }
  resolvePending(result: boolean) {
    const resolve = this.pending;
    this.pending = undefined;
    resolve?.(result);
  }
  hasPendingPlayback() { return this.pending !== undefined; }
  isSupported() { return this.supported; }
}

const settings: VoiceSettings = {
  enabled: true,
  mode: 'countdown',
  language: 'zh-CN',
  volume: 0.7,
  rate: 0.95,
  pitch: 1,
  countdownFrom: 3,
  announceRound: true,
  announceNextStage: false,
  hapticsEnabled: false,
};

const context: VoiceEventContext = {
  sessionId: 1,
  round: 1,
  now: 100,
  stageEndsAt: 10_000,
};

function setup(overrides: Partial<VoiceSettings> = {}) {
  const speech = new FakeAdapter();
  const audio = new FakeAdapter();
  const recorded = new FakeRecordedAdapter();
  const controller = new VoiceController(
    speech,
    audio,
    recorded,
    new HapticAdapter({}),
    { ...settings, ...overrides },
    '/kagle/',
  );
  return { speech, audio, recorded, controller };
}

describe('VoiceController', () => {
  it('deduplicates the same countdown second', () => {
    const { controller } = setup();
    controller.enqueue({ type: 'countdown', stage: 'hold', seconds: 3 }, context);
    controller.enqueue({ type: 'countdown', stage: 'hold', seconds: 3 }, context);

    expect(controller.inspectQueue().filter(item => item.event.type === 'countdown')).toHaveLength(1);
  });

  it('drops expired items before playback', async () => {
    const { controller, speech } = setup();
    controller.enqueue(
      { type: 'countdown', stage: 'hold', seconds: 2 },
      { ...context, now: 100, stageEndsAt: 101 },
    );

    await controller.flush(102);

    expect(speech.spoken).toEqual([]);
  });

  it('pause stops playback and clears pending countdowns', () => {
    const { controller, speech, recorded } = setup();
    controller.enqueue({ type: 'stage-enter', stage: 'hold' }, context);
    controller.enqueue({ type: 'countdown', stage: 'hold', seconds: 3 }, context);
    controller.enqueue({ type: 'paused' }, context);

    expect(speech.stopCalls).toBe(2);
    expect(recorded.stopCalls).toBe(2);
    expect(controller.inspectQueue().map(item => item.event.type)).toEqual(['paused']);
  });

  it('stop stops playback and clears the queue', () => {
    const { controller, speech, recorded } = setup();
    controller.enqueue({ type: 'stage-enter', stage: 'hold' }, context);
    speech.stopCalls = 0;
    recorded.stopCalls = 0;
    controller.enqueue({ type: 'stopped' }, context);

    expect(speech.stopCalls).toBe(1);
    expect(recorded.stopCalls).toBe(1);
    expect(controller.inspectQueue().every(item => item.event.type === 'stopped')).toBe(true);
  });

  it('replaces a pending stage prompt when the stage changes', () => {
    const { controller, recorded } = setup();
    controller.enqueue({ type: 'stage-enter', stage: 'hold' }, context);
    controller.enqueue(
      { type: 'stage-enter', stage: 'relax' },
      { ...context, now: 200, sequence: 2 },
    );

    expect(controller.inspectQueue().filter(item => item.event.type === 'stage-enter').map(item => item.event)).toEqual([
      { type: 'stage-enter', stage: 'relax' },
    ]);
    expect(recorded.stopCalls).toBe(2);
  });

  it('rechecks expiry after a longer prompt finishes', async () => {
    const { controller, recorded } = setup();
    const originalNow = Date.now;
    let now = 100;
    Date.now = () => now;
    recorded.onPlay = () => { now = 200; };
    controller.enqueue({ type: 'stage-enter', stage: 'hold' }, context);
    controller.enqueue(
      { type: 'countdown', stage: 'hold', seconds: 3 },
      { ...context, stageEndsAt: 150 },
    );

    try {
      await controller.flush();
      expect(recorded.played.map(item => item.url)).toEqual(['/kagle/audio/voice/guided/hold.mp3']);
    } finally {
      Date.now = originalNow;
    }
  });

  it('plays a fixed guided prompt from the recorded asset without speech or tone', async () => {
    const { controller, recorded, speech, audio } = setup({ mode: 'guided' });
    controller.enqueue({ type: 'stage-enter', stage: 'contract' }, context);

    await controller.flush(context.now);

    expect(recorded.played).toEqual([{
      url: '/kagle/audio/voice/guided/contract.mp3',
      volume: settings.volume,
    }]);
    expect(speech.spoken).toEqual([]);
    expect(audio.cues).toEqual([]);
  });

  it('plays a fixed countdown-mode stage prompt from the guided asset', async () => {
    const { controller, recorded, speech } = setup();
    controller.enqueue({ type: 'stage-enter', stage: 'contract' }, context);

    await controller.flush(context.now);

    expect(recorded.played[0]?.url).toBe('/kagle/audio/voice/guided/contract.mp3');
    expect(speech.spoken).toEqual([]);
  });

  it('falls back to the matching cue when recorded playback fails', async () => {
    const { controller, recorded, speech, audio } = setup({ mode: 'guided' });
    recorded.playResult = false;
    controller.enqueue({ type: 'stage-enter', stage: 'contract' }, context);

    await controller.flush(context.now);

    expect(audio.cues).toEqual(['contract']);
    expect(speech.spoken).toEqual([]);
  });

  it('uses speech for dynamic round announcements', async () => {
    const { controller, recorded, speech } = setup({ mode: 'guided' });
    controller.enqueue({ type: 'round-start', round: 2, totalRounds: 5 }, context);

    await controller.flush(context.now);

    expect(recorded.played).toEqual([]);
    expect(speech.spoken).toEqual(['第 2 组，共 5 组']);
  });

  it('uses speech for English fixed prompts when no local asset exists', async () => {
    const { controller, recorded, speech } = setup({ mode: 'guided', language: 'en-US' });
    controller.enqueue({ type: 'stage-enter', stage: 'contract' }, context);

    await controller.flush(context.now);

    expect(recorded.played).toEqual([]);
    expect(speech.spoken).toEqual(['Gently contract the pelvic floor and lift']);
  });

  it('stops recorded playback when controller.stop is called', () => {
    const { controller, recorded } = setup();

    controller.stop();

    expect(recorded.stopCalls).toBe(1);
  });

  it('preloads all 18 recorded assets for the configured base URL', async () => {
    const { controller, recorded } = setup();

    await controller.preload();

    expect(recorded.preloaded).toHaveLength(18);
    expect(recorded.preloaded).toContain('/kagle/audio/voice/guided/contract.mp3');
    expect(recorded.preloaded.every(url => url.startsWith('/kagle/audio/voice/'))).toBe(true);
  });

  it('does not incorrectly use speech when a countdown recording fails without a cue', async () => {
    const { controller, recorded, speech, audio } = setup();
    recorded.playResult = false;
    controller.enqueue({ type: 'countdown', stage: 'hold', seconds: 3 }, context);

    await controller.flush(context.now);

    expect(recorded.played[0]?.url).toBe('/kagle/audio/voice/countdown/3.mp3');
    expect(audio.cues).toEqual([]);
    expect(speech.spoken).toEqual([]);
  });

  it('does not play the old cue when a new stage cancels pending recorded playback', async () => {
    const { controller, recorded, speech, audio } = setup({ mode: 'guided' });
    recorded.deferPlayback = true;
    controller.enqueue({ type: 'stage-enter', stage: 'contract' }, context);
    const flushing = controller.flush(context.now);
    expect(recorded.hasPendingPlayback()).toBe(true);

    recorded.deferPlayback = false;
    controller.enqueue(
      { type: 'stage-enter', stage: 'relax' },
      { ...context, now: 200, sequence: 2 },
    );
    await flushing;

    expect(recorded.played.map(item => item.url)).toEqual([
      '/kagle/audio/voice/guided/contract.mp3',
      '/kagle/audio/voice/guided/relax.mp3',
    ]);
    expect(audio.cues).toEqual([]);

    controller.enqueue({ type: 'round-start', round: 2, totalRounds: 5 }, context);
    await controller.flush(context.now);
    expect(speech.spoken).toEqual(['第 2 组，共 5 组']);
  });

  it('does not play the old cue when pause cancels pending recorded playback', async () => {
    const { controller, recorded, audio } = setup({ mode: 'guided' });
    recorded.deferPlayback = true;
    controller.enqueue({ type: 'stage-enter', stage: 'contract' }, context);
    const flushing = controller.flush(context.now);
    expect(recorded.hasPendingPlayback()).toBe(true);

    recorded.deferPlayback = false;
    controller.enqueue({ type: 'paused' }, { ...context, sequence: 2 });
    await flushing;

    expect(audio.cues).toEqual([]);
    expect(recorded.played.map(item => item.url)).toEqual([
      '/kagle/audio/voice/guided/contract.mp3',
      '/kagle/audio/voice/common/paused.mp3',
    ]);
    expect(controller.inspectQueue()).toEqual([]);
  });

  it('reports support when recorded playback is available without speech synthesis', () => {
    const { controller, recorded, speech } = setup();
    speech.supported = false;
    recorded.supported = true;

    expect(controller.isSupported()).toBe(true);
  });
});
