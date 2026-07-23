import { describe, expect, it } from 'vitest';
import { SpeechSynthesisAdapter } from './SpeechSynthesisAdapter';

describe('SpeechSynthesisAdapter', () => {
  it('fails safely when speech synthesis is unavailable', async () => {
    const adapter = new SpeechSynthesisAdapter({});

    expect(adapter.isSupported()).toBe(false);
    await expect(adapter.speak({
      text: '收紧',
      language: 'zh-CN',
      volume: 0.7,
      rate: 0.95,
      pitch: 1,
    })).resolves.toBeUndefined();
    expect(() => adapter.stop()).not.toThrow();
  });
});
