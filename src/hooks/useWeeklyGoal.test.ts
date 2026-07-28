import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TrainingRecord } from '../types/training';
import { useWeeklyGoal } from './useWeeklyGoal';

const record: TrainingRecord = {
  id: 'completed',
  startedAt: '2026-07-27T08:00:00.000Z',
  endedAt: '2026-07-27T08:01:00.000Z',
  contractSec: 3,
  holdSec: 3,
  relaxSec: 3,
  targetReps: 10,
  completedReps: 10,
  status: 'completed',
  actualDurationMs: 60_000,
};

describe('useWeeklyGoal', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-29T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('enables, persists, updates, and disables the goal', () => {
    const { result } = renderHook(() => useWeeklyGoal([record], 'UTC'));
    expect(result.current.settings.enabled).toBe(false);

    act(() => result.current.setTargetDays(4));
    expect(result.current.settings).toEqual({ enabled: true, targetDays: 4 });
    expect(result.current.progress).toMatchObject({ completedDays: 1, remainingDays: 3 });
    expect(localStorage.getItem('kegel.weekly-goal.v2')).toBe(
      JSON.stringify({ enabled: true, targetDays: 4 }),
    );

    act(() => result.current.disable());
    expect(result.current.settings.enabled).toBe(false);
  });
});
