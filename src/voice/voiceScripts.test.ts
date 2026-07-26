import { describe, expect, it } from 'vitest';
import type { VoiceSettings } from './types';
import { resolveSpeech } from './voiceScripts';

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

describe('resolveSpeech training progress', () => {
  it('announces repetitions rather than sets in Chinese', () => {
    expect(
      resolveSpeech(
        { type: 'round-start', round: 3, totalRounds: 10 },
        settings,
      ),
    ).toBe('第 3 次，共 10 次');
  });

  it('announces repetitions rather than rounds in English', () => {
    expect(
      resolveSpeech(
        { type: 'round-start', round: 3, totalRounds: 10 },
        { ...settings, language: 'en-US' },
      ),
    ).toBe('Repetition 3 of 10');
  });
});
