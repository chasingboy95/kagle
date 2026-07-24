import { describe, expect, it } from 'vitest';
import { getCountdownEvent } from './useKegelEngine';

describe('getCountdownEvent', () => {
  it('emits only unannounced positive seconds inside the threshold', () => {
    expect(getCountdownEvent(3000, 'hold', 3, new Set())).toEqual({
      type: 'countdown',
      stage: 'hold',
      seconds: 3,
    });
    expect(getCountdownEvent(2990, 'hold', 3, new Set([3]))).toBeNull();
    expect(getCountdownEvent(0, 'hold', 3, new Set())).toBeNull();
    expect(getCountdownEvent(3000, 'hold', 0, new Set())).toBeNull();
  });

  it('counts down during ready phase', () => {
    expect(getCountdownEvent(5000, 'ready', 5, new Set())).toEqual({
      type: 'countdown',
      stage: 'ready',
      seconds: 5,
    });
    expect(getCountdownEvent(4000, 'ready', 5, new Set([5]))).toEqual({
      type: 'countdown',
      stage: 'ready',
      seconds: 4,
    });
    expect(getCountdownEvent(500, 'ready', 5, new Set([5, 4, 3, 2]))).toEqual({
      type: 'countdown',
      stage: 'ready',
      seconds: 1,
    });
  });

  it('does not count down during idle', () => {
    expect(getCountdownEvent(3000, 'idle', 3, new Set())).toBeNull();
  });

  it('handles feedback phase countdown', () => {
    expect(getCountdownEvent(4000, 'feedback', 5, new Set())).toEqual({
      type: 'countdown',
      stage: 'feedback',
      seconds: 4,
    });
    expect(getCountdownEvent(6000, 'feedback', 0, new Set())).toBeNull();
  });
});
