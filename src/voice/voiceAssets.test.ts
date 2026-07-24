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
  it.each([
    [{ type: 'training-ready' } as VoiceEvent, '/kagle/audio/zh-CN/ready.mp3'],
    [{ type: 'stage-enter', stage: 'contract' } as VoiceEvent, '/kagle/audio/zh-CN/contraction-start.mp3'],
    [{ type: 'stage-enter', stage: 'hold' } as VoiceEvent, '/kagle/audio/zh-CN/contraction-sustain.mp3'],
    [{ type: 'stage-enter', stage: 'relax' } as VoiceEvent, '/kagle/audio/zh-CN/release-start.mp3'],
    [{ type: 'paused' } as VoiceEvent, '/kagle/audio/zh-CN/paused.mp3'],
    [{ type: 'resumed' } as VoiceEvent, '/kagle/audio/zh-CN/resumed.mp3'],
    [{ type: 'completed' } as VoiceEvent, '/kagle/audio/zh-CN/complete.mp3'],
    [{ type: 'stopped' } as VoiceEvent, '/kagle/audio/voice/common/stopped.mp3'],
  ] as const)('resolves coach asset %#', (event, expected) => {
    expect(resolve(event)).toBe(expected);
  });

  it.each(['coach', 'sound-only'] as const)('resolves countdown independently in %s mode', (mode) => {
    expect(resolve({ type: 'countdown', stage: 'contract', seconds: 3 }, { mode }))
      .toBe('/kagle/audio/voice/countdown/3.mp3');
  });

  it('does not resolve countdown when disabled', () => {
    expect(resolve({ type: 'countdown', stage: 'contract', seconds: 3 }, { countdownFrom: 0 }))
      .toBeNull();
  });

  it.each([0, 6, 2.5])('rejects invalid countdown second %s', (seconds) => {
    expect(resolve({ type: 'countdown', stage: 'contract', seconds })).toBeNull();
  });

  it.each([
    [{ type: 'round-start', round: 1, totalRounds: 3 } as VoiceEvent, {}],
    [{ type: 'stage-enter', stage: 'idle' } as VoiceEvent, {}],
    [{ type: 'training-ready' } as VoiceEvent, { mode: 'sound-only' }],
    [{ type: 'training-ready' } as VoiceEvent, { enabled: false }],
    [{ type: 'training-ready' } as VoiceEvent, { mode: 'off' }],
    [{ type: 'training-ready' } as VoiceEvent, { language: 'en-US' }],
  ] as const)('returns null for unsupported event or mode %#', (event, overrides) => {
    expect(resolve(event, overrides)).toBeNull();
  });
});

describe('allVoiceAssetUrls', () => {
  it('returns the 13 current recorded assets', () => {
    const urls = allVoiceAssetUrls('/kagle');

    expect(urls).toEqual([
      '/kagle/audio/zh-CN/ready.mp3',
      '/kagle/audio/zh-CN/contraction-start.mp3',
      '/kagle/audio/zh-CN/contraction-sustain.mp3',
      '/kagle/audio/zh-CN/release-start.mp3',
      '/kagle/audio/zh-CN/complete.mp3',
      '/kagle/audio/zh-CN/paused.mp3',
      '/kagle/audio/zh-CN/resumed.mp3',
      '/kagle/audio/voice/common/stopped.mp3',
      '/kagle/audio/voice/countdown/1.mp3',
      '/kagle/audio/voice/countdown/2.mp3',
      '/kagle/audio/voice/countdown/3.mp3',
      '/kagle/audio/voice/countdown/4.mp3',
      '/kagle/audio/voice/countdown/5.mp3',
    ]);
    expect(new Set(urls).size).toBe(13);
  });
});
