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
});
