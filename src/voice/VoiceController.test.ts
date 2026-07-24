import { describe, expect, it, vi } from 'vitest';
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

  async preload() {}
  async speak(options: SpeakOptions) { this.spoken.push(options.text); }
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
  supported = true;

  async preload(urls: readonly string[]) { this.preloaded = urls; }
  async play(url: string, volume: number) {
    this.played.push({ url, volume });
    return this.playResult;
  }
  stop() { this.stopCalls += 1; }
  isSupported() { return this.supported; }
}

const settings: VoiceSettings = {
  enabled: true,
  mode: 'coach',
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
  stageEndsAt: 10_100,
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
  it('plays recorded coach prompts for fixed Chinese events', async () => {
    const { controller, recorded, speech } = setup();
    controller.enqueue({ type: 'stage-enter', stage: 'contract' }, context);
    await controller.flush(context.now);

    expect(recorded.played).toEqual([{
      url: '/kagle/audio/zh-CN/contraction-start.mp3',
      volume: settings.volume,
    }]);
    expect(speech.spoken).toEqual([]);
  });

  it('falls back to system speech when a coach recording fails', async () => {
    const { controller, recorded, speech, audio } = setup();
    recorded.playResult = false;
    controller.enqueue({ type: 'stage-enter', stage: 'contract' }, context);
    await controller.flush(context.now);

    expect(speech.spoken).toEqual(['开始收缩并保持']);
    expect(audio.cues).toEqual([]);
  });

  it('uses only rhythm cues in sound-only mode', async () => {
    const { controller, recorded, speech, audio } = setup({ mode: 'sound-only' });
    controller.enqueue({ type: 'stage-enter', stage: 'contract' }, context);
    await controller.flush(context.now);

    expect(audio.cues).toEqual(['contraction-start']);
    expect(recorded.played).toEqual([]);
    expect(speech.spoken).toEqual([]);
  });

  it('plays countdown recordings independently in coach mode', async () => {
    const { controller, recorded } = setup({ countdownFrom: 3 });
    controller.enqueue({ type: 'countdown', stage: 'relax', seconds: 3 }, context);
    await controller.flush(context.now);

    expect(recorded.played[0]?.url).toBe('/kagle/audio/voice/countdown/3.mp3');
  });

  it('plays countdown recordings independently in rhythm mode', async () => {
    const { controller, recorded } = setup({ mode: 'sound-only', countdownFrom: 3 });
    controller.enqueue({ type: 'countdown', stage: 'relax', seconds: 3 }, context);
    await controller.flush(context.now);

    expect(recorded.played[0]?.url).toBe('/kagle/audio/voice/countdown/3.mp3');
  });

  it('does not queue countdown when countdown is disabled', () => {
    const { controller } = setup({ countdownFrom: 0 });
    controller.enqueue({ type: 'countdown', stage: 'relax', seconds: 3 }, context);
    expect(controller.inspectQueue()).toEqual([]);
  });

  it('delays the sustain prompt into the hold phase', async () => {
    vi.useFakeTimers();
    try {
      const { controller, recorded } = setup();
      controller.enqueue({ type: 'stage-enter', stage: 'hold' }, context);
      expect(controller.inspectQueue()).toEqual([]);

      await vi.advanceTimersByTimeAsync(3_000);
      expect(recorded.played[0]?.url).toBe('/kagle/audio/zh-CN/contraction-sustain.mp3');
    } finally {
      vi.useRealTimers();
    }
  });

  it('cancels a delayed sustain prompt when relaxation begins', async () => {
    vi.useFakeTimers();
    try {
      const { controller, recorded } = setup();
      controller.enqueue({ type: 'stage-enter', stage: 'hold' }, context);
      controller.enqueue({ type: 'stage-enter', stage: 'relax' }, { ...context, now: 200 });
      await controller.flush(200);
      await vi.advanceTimersByTimeAsync(3_000);

      expect(recorded.played.map(item => item.url)).toEqual([
        '/kagle/audio/zh-CN/release-start.mp3',
      ]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('uses speech for dynamic round announcements in coach mode', async () => {
    const { controller, speech } = setup({ announceRound: true });
    controller.enqueue({ type: 'round-start', round: 2, totalRounds: 5 }, context);
    await controller.flush(context.now);
    expect(speech.spoken).toEqual(['第 2 组，共 5 组']);
  });

  it('does not queue audible events in silent mode', () => {
    const { controller } = setup({ mode: 'off' });
    controller.enqueue({ type: 'stage-enter', stage: 'contract' }, context);
    expect(controller.inspectQueue()).toEqual([]);
  });
});
