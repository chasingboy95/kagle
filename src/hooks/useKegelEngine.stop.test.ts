import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useKegelEngine } from './useKegelEngine';

describe('useKegelEngine stopped-session repetition count', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  function advance(ms: number) {
    act(() => {
      vi.advanceTimersByTime(ms);
    });
  }

  function setup(rounds = 3) {
    const onSessionEnd = vi.fn();
    const hook = renderHook(() => useKegelEngine({ onSessionEnd }));

    act(() => {
      hook.result.current.updateConfig({
        contractTime: 1,
        holdTime: 1,
        relaxTime: 1,
        rounds,
      });
    });
    act(() => {
      hook.result.current.start();
    });

    return { ...hook, onSessionEnd };
  }

  it('records zero completed repetitions when stopped during ready', () => {
    const { result, onSessionEnd } = setup();

    advance(2_000);
    act(() => result.current.stop());

    expect(onSessionEnd).toHaveBeenCalledOnce();
    expect(onSessionEnd).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'stopped', completedReps: 0 }),
    );
  });

  it.each([
    ['contract', 5_500],
    ['hold', 6_500],
    ['relax', 7_500],
  ])('records zero completed repetitions when stopped during the first %s phase', (_phase, elapsedMs) => {
    const { result, onSessionEnd } = setup();

    advance(elapsedMs);
    act(() => result.current.stop());

    expect(onSessionEnd).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'stopped', completedReps: 0 }),
    );
  });

  it('records one completed repetition after entering the second repetition', () => {
    const { result, onSessionEnd } = setup();

    advance(8_300);
    expect(result.current.state).toMatchObject({ phase: 'contract', currentRound: 2 });

    act(() => result.current.stop());

    expect(onSessionEnd).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'stopped', completedReps: 1 }),
    );
  });

  it('keeps the normal completed-session count unchanged', () => {
    const { result, onSessionEnd } = setup(1);

    advance(8_300);

    expect(result.current.state.status).toBe('feedback');
    expect(onSessionEnd).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'completed', completedReps: 1 }),
    );
  });

  it('excludes an open pause when stopped without resuming', () => {
    const { result, onSessionEnd } = setup();

    advance(6_000);
    act(() => result.current.pause());
    const activeDurationAtPause = result.current.state.totalElapsedMs;
    advance(30_000);
    act(() => result.current.stop());

    expect(onSessionEnd).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'stopped',
        actualDurationMs: activeDurationAtPause,
      }),
    );
  });

  it('counts active time across repeated pauses and a final open pause', () => {
    const { result, onSessionEnd } = setup();

    advance(2_000);
    act(() => result.current.pause());
    advance(4_000);
    act(() => result.current.resume());
    advance(1_500);
    act(() => result.current.pause());
    advance(8_000);
    act(() => result.current.resume());
    advance(500);
    act(() => result.current.pause());
    advance(20_000);
    act(() => result.current.stop());

    expect(onSessionEnd).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'stopped',
        actualDurationMs: 4_000,
      }),
    );
  });
});
