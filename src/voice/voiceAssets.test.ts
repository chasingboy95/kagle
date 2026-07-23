import { describe, expect, it } from 'vitest';
import type { VoiceEvent, VoiceSettings } from './types';
import { allVoiceAssetUrls, resolveVoiceAsset } from './voiceAssets';

const settings: VoiceSettings = {
  enabled: true,
  mode: 'concise',
  language: 'zh-CN',
  volume: 1,
  rate: 1,
  pitch: 1,
  countdownFrom: 3,
  announceRound: true,
  announceNextStage: true,
  hapticsEnabled: true,
};

function resolve(event: VoiceEvent, overrides: Partial<VoiceSettings> = {}) {
  return resolveVoiceAsset(event, { ...settings, ...overrides }, '/kagle/');
}

describe('resolveVoiceAsset', () => {
  it('resolves concise training-ready audio', () => {
    expect(resolve({ type: 'training-ready' })).toBe('/kagle/audio/voice/concise/ready.mp3');
  });

  it('resolves guided stage audio', () => {
    expect(resolve({ type: 'stage-enter', stage: 'contract' }, { mode: 'guided' }))
      .toBe('/kagle/audio/voice/guided/contract.mp3');
  });

  it('resolves common paused audio', () => {
    expect(resolve({ type: 'paused' }, { mode: 'guided' }))
      .toBe('/kagle/audio/voice/common/paused.mp3');
  });

  it('resolves countdown audio only in countdown mode', () => {
    expect(resolve({ type: 'countdown', stage: 'contract', seconds: 3 }, { mode: 'countdown' }))
      .toBe('/kagle/audio/voice/countdown/3.mp3');
  });

  it.each([
    [{ type: 'round-start', round: 1, totalRounds: 3 } as VoiceEvent, {}],
    [{ type: 'stage-enter', stage: 'idle' } as VoiceEvent, {}],
    [{ type: 'training-ready' } as VoiceEvent, { mode: 'sound-only' }],
  ] as const)('returns null for unsupported event or mode %#', (event, overrides) => {
    expect(resolve(event, overrides)).toBeNull();
  });
});

describe('allVoiceAssetUrls', () => {
  it('returns exactly 18 unique asset URLs', () => {
    const urls = allVoiceAssetUrls('/kagle');

    expect(urls).toHaveLength(18);
    expect(new Set(urls).size).toBe(18);
    expect(urls.every((url) => url.startsWith('/kagle/audio/voice/'))).toBe(true);
  });
});
