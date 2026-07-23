import { describe, expect, it } from 'vitest';
import { HapticAdapter } from './HapticAdapter';
import type {
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
  isSupported() { return true; }
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

function setup() {
  const speech = new FakeAdapter();
  const audio = new FakeAdapter();
  const controller = new VoiceController(
    speech,
    audio,
    new HapticAdapter({}),
    settings,
  );
  return { speech, controller };
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
    const { controller, speech } = setup();
    controller.enqueue({ type: 'stage-enter', stage: 'hold' }, context);
    controller.enqueue({ type: 'countdown', stage: 'hold', seconds: 3 }, context);
    controller.enqueue({ type: 'paused' }, context);

    expect(speech.stopCalls).toBe(2);
    expect(controller.inspectQueue().map(item => item.event.type)).toEqual(['paused']);
  });

  it('stop stops playback and clears the queue', () => {
    const { controller, speech } = setup();
    controller.enqueue({ type: 'stage-enter', stage: 'hold' }, context);
    speech.stopCalls = 0;
    controller.enqueue({ type: 'stopped' }, context);

    expect(speech.stopCalls).toBe(1);
    expect(controller.inspectQueue().every(item => item.event.type === 'stopped')).toBe(true);
  });

  it('replaces a pending stage prompt when the stage changes', () => {
    const { controller } = setup();
    controller.enqueue({ type: 'stage-enter', stage: 'hold' }, context);
    controller.enqueue(
      { type: 'stage-enter', stage: 'relax' },
      { ...context, now: 200, sequence: 2 },
    );

    expect(controller.inspectQueue().filter(item => item.event.type === 'stage-enter').map(item => item.event)).toEqual([
      { type: 'stage-enter', stage: 'relax' },
    ]);
  });

  it('rechecks expiry after a longer prompt finishes', async () => {
    const { controller, speech } = setup();
    const originalNow = Date.now;
    let now = 100;
    Date.now = () => now;
    speech.onSpeak = () => { now = 200; };
    controller.enqueue({ type: 'stage-enter', stage: 'hold' }, context);
    controller.enqueue(
      { type: 'countdown', stage: 'hold', seconds: 3 },
      { ...context, stageEndsAt: 150 },
    );

    try {
      await controller.flush();
      expect(speech.spoken).toEqual(['保持张力，继续自然呼吸']);
    } finally {
      Date.now = originalNow;
    }
  });
});
