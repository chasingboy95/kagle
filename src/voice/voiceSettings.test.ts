import { describe, expect, it } from 'vitest';
import { DEFAULT_VOICE_SETTINGS, parseVoiceSettings } from './voiceSettings';

describe('parseVoiceSettings', () => {
  it('returns the required defaults for invalid storage', () => {
    expect(parseVoiceSettings('{broken')).toEqual(DEFAULT_VOICE_SETTINGS);
  });

  it('keeps valid fields and falls back invalid fields independently', () => {
    const result = parseVoiceSettings(JSON.stringify({
      enabled: false,
      mode: 'guided',
      language: 'fr-FR',
      volume: 9,
      countdownFrom: 5,
    }));

    expect(result.enabled).toBe(false);
    expect(result.mode).toBe('guided');
    expect(result.language).toBe('zh-CN');
    expect(result.volume).toBe(0.7);
    expect(result.countdownFrom).toBe(5);
  });
});
