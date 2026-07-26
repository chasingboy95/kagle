import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getCountdownEvent, useKegelEngine } from './useKegelEngine';

describe('useKegelEngine lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function advance(ms: number) {
    act(() => {
      vi.advanceTimersByTime(ms);
    });
  }

  it('runs the complete ready → contract → hold → relax → feedback lifecycle', () => {
    const { result } = renderHook(() => useKegelEngine());

    act(() => {
      result.current.updateConfig({
        contractTime: 1,
        holdTime: 1,
        relaxTime: 1,
        rounds: 2,
      });
    });
    act(() => {
      result.current.start();
    });
    expect(result.current.state).toMatchObject({ status: 'running', phase: 'ready' });

    advance(5_000);
    expect(result.current.state).toMatchObject({ phase: 'contract', currentRound: 1 });
    advance(1_100);
    expect(result.current.state.phase).toBe('hold');
    advance(1_100);
    expect(result.current.state.phase).toBe('relax');
    advance(1_100);
    expect(result.current.state).toMatchObject({ phase: 'contract', currentRound: 2 });
    advance(3_300);
    expect(result.current.state).toMatchObject({
      status: 'feedback',
      phase: 'feedback',
      currentRound: 2,
    });

    act(() => result.current.finish());
    expect(result.current.state).toMatchObject({
      status: 'idle',
      phase: 'idle',
      currentRound: 0,
    });
  });

  it('preserves the phase while paused and resumes from the remaining time', () => {
    const { result } = renderHook(() => useKegelEngine());

    act(() => {
      result.current.updateConfig({ contractTime: 1, holdTime: 1, relaxTime: 1, rounds: 1 });
    });
    act(() => {
      result.current.start();
    });
    advance(5_500);
    expect(result.current.state.phase).toBe('contract');

    act(() => result.current.pause());
    const remaining = result.current.state.phaseRemainingMs;
    advance(2_000);
    expect(result.current.state).toMatchObject({
      status: 'paused',
      phase: 'contract',
      phaseRemainingMs: remaining,
    });

    act(() => result.current.resume());
    advance(remaining + 100);
    expect(result.current.state).toMatchObject({ status: 'running', phase: 'hold' });
  });

  it('stops an active session early and resets to idle', () => {
    const { result } = renderHook(() => useKegelEngine());

    act(() => result.current.start());
    advance(5_000);
    act(() => result.current.stop());

    expect(result.current.state).toMatchObject({
      status: 'idle',
      phase: 'idle',
      currentRound: 0,
      totalElapsedMs: 0,
    });
  });
});

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

  it('does not count down during feedback', () => {
    expect(getCountdownEvent(4000, 'feedback', 5, new Set())).toBeNull();
    expect(getCountdownEvent(6000, 'feedback', 0, new Set())).toBeNull();
  });
});
