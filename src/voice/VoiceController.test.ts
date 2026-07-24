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
  playResult = true;

  async preload(urls: readonly string[]) { this.preloaded = urls; }
  async play(url: string, volume: number) {
    this.played.push({ url, volume });
    return this.playResult;
  }
  stop() {}
  isSupported() { return true; }
}

const baseSettings: VoiceSettings = {
  enabled: true,
  mode: 'coach',
  language: 'zh-CN',
  volume: 0.7,
  rate: 0.95,
  pitch: 1,
  countdownFrom: 3,
  announceRound: false,
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
    { ...baseSettings, ...overrides },
    '/kagle/',
  );
  return { speech, audio, recorded, controller };
}

describe('VoiceController', () => {
  it('plays non-verbal stage cues in rhythm mode', async () => {
    const { controller, audio, recorded, speech } = setup({ mode: 'sound-only' });
    controller.enqueue({ type: 'stage-enter', stage: 'contract' }, context);
    await controller.flush(context.now);

    expect(audio.cues).toEqual(['contraction-start']);
    expect(recorded.played).toEqual([]);
    expect(speech.spoken).toEqual([]);
  });

  it('uses synthesized soft countdown cues in every audible mode', async () => {
    const { controller, audio, recorded, speech } = setup({ countdownFrom: 3 });
    controller.enqueue({ type: 'countdown', stage: 'relax', seconds: 3 }, context);
    controller.enqueue({ type: 'countdown', stage: 'relax', seconds: 2 }, { ...context, sequence: 2 });
    controller.enqueue({ type: 'countdown', stage: 'relax', seconds: 1 }, { ...context, sequence: 3 });
    await controller.flush(context.now);

    expect(audio.cues).toEqual(['countdown-3', 'countdown-2', 'countdown-1']);
    expect(recorded.played).toEqual([]);
    expect(speech.spoken).toEqual([]);
  });

  it('keeps edge countdown cues playable just after the stage boundary', async () => {
    const { controller, audio } = setup({ countdownFrom: 3 });
    controller.enqueue(
      { type: 'countdown', stage: 'relax', seconds: 1 },
      { ...context, now: 9_100, stageEndsAt: 10_000 },
    );

    await controller.flush(10_300);

    expect(audio.cues).toEqual(['countdown-1']);
  });

  it('does not enqueue countdowns when disabled', () => {
    const { controller } = setup({ countdownFrom: 0 });
    controller.enqueue({ type: 'countdown', stage: 'hold', seconds: 3 }, context);
    expect(controller.inspectQueue()).toEqual([]);
  });

  it('queues hold coaching immediately on stage entry', () => {
    const { controller } = setup();
    controller.enqueue({ type: 'stage-enter', stage: 'hold' }, context);

    expect(controller.inspectQueue().map(item => item.event)).toEqual([
      { type: 'stage-enter', stage: 'hold' },
    ]);
  });

  it('prefers recorded coach prompts', async () => {
    const { controller, recorded, speech, audio } = setup();
    controller.enqueue({ type: 'training-ready' }, context);
    await controller.flush(context.now);

    expect(recorded.played[0]?.url).toBe('/kagle/audio/zh-CN/ready.mp3');
    expect(speech.spoken).toEqual([]);
    expect(audio.cues).toEqual([]);
  });

  it('falls back to speech when recorded playback fails', async () => {
    const { controller, recorded, speech } = setup();
    recorded.playResult = false;
    controller.enqueue({ type: 'training-ready' }, context);
    await controller.flush(context.now);

    expect(speech.spoken).toEqual(['准备开始训练']);
  });

  it('keeps silent mode out of the queue', () => {
    const { controller } = setup({ mode: 'off' });
    controller.enqueue({ type: 'training-ready' }, context);
    expect(controller.inspectQueue()).toEqual([]);
  });
});
