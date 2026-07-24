import { describe, expect, it } from 'vitest';
import type { VoiceEvent, VoiceSettings } from './types';
import { allVoiceAssetUrls, resolveVoiceAsset } from './voiceAssets';

const settings: VoiceSettings = {
  enabled: true,
  mode: 'coach',
  language: 'zh-CN',
  volume: 1,
  rate: 1,
  pitch: 1,
  countdownFrom: 3,
  announceRound: false,
  announceNextStage: false,
  hapticsEnabled: true,
};

function resolve(event: VoiceEvent, overrides: Partial<VoiceSettings> = {}) {
  return resolveVoiceAsset(event, { ...settings, ...overrides }, '/kagle/');
}

describe('resolveVoiceAsset', () => {
  it('resolves the current coach recordings', () => {
    expect(resolve({ type: 'training-ready' })).toBe('/kagle/audio/zh-CN/ready.mp3');
    expect(resolve({ type: 'stage-enter', stage: 'contract' }))
      .toBe('/kagle/audio/zh-CN/contraction-start.mp3');
    expect(resolve({ type: 'stage-enter', stage: 'hold' }))
      .toBe('/kagle/audio/zh-CN/contraction-sustain.mp3');
    expect(resolve({ type: 'stage-enter', stage: 'relax' }))
      .toBe('/kagle/audio/zh-CN/release-start.mp3');
    expect(resolve({ type: 'completed' })).toBe('/kagle/audio/zh-CN/complete.mp3');
  });

  it('does not route countdowns to legacy recordings', () => {
    expect(resolve({ type: 'countdown', stage: 'relax', seconds: 3 })).toBeNull();
  });

  it('returns null outside Chinese coach mode', () => {
    expect(resolve({ type: 'training-ready' }, { mode: 'sound-only' })).toBeNull();
    expect(resolve({ type: 'training-ready' }, { mode: 'off' })).toBeNull();
    expect(resolve({ type: 'training-ready' }, { language: 'en-US' })).toBeNull();
  });
});

describe('allVoiceAssetUrls', () => {
  it('preloads only the active fixed recordings', () => {
    const urls = allVoiceAssetUrls('/kagle');
    expect(urls).toHaveLength(8);
    expect(urls).toContain('/kagle/audio/zh-CN/ready.mp3');
    expect(urls).not.toContain('/kagle/audio/voice/countdown/3.mp3');
    expect(new Set(urls).size).toBe(urls.length);
  });
});
