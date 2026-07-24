import { describe, expect, it } from 'vitest';
import { VoiceQueue } from '../voiceQueue';

describe('Voice orchestration contracts', () => {
  it('can interrupt normal coaching messages with critical events', () => {
    const queue = new VoiceQueue();

    queue.enqueue({
      id: 'coach',
      event: 'contraction-sustain',
      priority: 'normal',
      interrupt: false,
      expiresAt: Date.now() + 1000,
    });

    queue.enqueue({
      id: 'pause',
      event: 'paused',
      priority: 'critical',
      interrupt: true,
      expiresAt: Date.now() + 1000,
    });

    const next = queue.dequeue();

    expect(next?.event).toBe('paused');
    expect(next?.interrupt).toBe(true);
  });
});
