import { describe, expect, it } from 'vitest';
import { VoiceQueue } from '../voiceQueue';

describe('VoiceQueue', () => {
  it('returns higher priority messages first', () => {
    const queue = new VoiceQueue();

    queue.enqueue({
      id: 'ambient',
      event: 'contraction-sustain',
      priority: 'ambient',
      interrupt: false,
      createdAt: Date.now(),
      expiresAt: Date.now() + 1000,
    });

    queue.enqueue({
      id: 'pause',
      event: 'paused',
      priority: 'critical',
      interrupt: true,
      createdAt: Date.now(),
      expiresAt: Date.now() + 1000,
    });

    expect(queue.dequeue()?.id).toBe('pause');
  });

  it('drops expired messages', () => {
    const queue = new VoiceQueue();

    queue.enqueue({
      id: 'expired',
      event: 'training-ready',
      priority: 'normal',
      interrupt: false,
      createdAt: Date.now(),
      expiresAt: Date.now() - 1,
    });

    expect(queue.dequeue()).toBeUndefined();
  });
});
