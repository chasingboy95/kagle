import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTimer } from './createTimer';

describe('createTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls onTick repeatedly when time advances', () => {
    const onTick = vi.fn();
    const timer = createTimer(onTick);

    timer.start();
    vi.advanceTimersByTime(500);
    expect(onTick.mock.calls.length).toBeGreaterThanOrEqual(4);
    expect(onTick.mock.calls.length).toBeLessThanOrEqual(6);

    timer.stop();
  });

  it('stops firing after stop()', () => {
    const onTick = vi.fn();
    const timer = createTimer(onTick);

    timer.start();
    vi.advanceTimersByTime(300);
    const count = onTick.mock.calls.length;
    expect(count).toBeGreaterThanOrEqual(2);

    timer.stop();
    vi.advanceTimersByTime(1000);
    expect(onTick.mock.calls.length).toBe(count);
  });
});
