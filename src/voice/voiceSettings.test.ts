import { describe, expect, it } from 'vitest';
import {
  DEFAULT_VOICE_SETTINGS,
  loadVoiceSettings,
  parseVoiceSettings,
} from './voiceSettings';

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

  it('falls back when access to global localStorage throws', () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() { throw new Error('blocked'); },
    });

    try {
      expect(loadVoiceSettings()).toEqual(DEFAULT_VOICE_SETTINGS);
    } finally {
      if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
      else delete (globalThis as { localStorage?: Storage }).localStorage;
    }
  });
});
