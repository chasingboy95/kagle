import { describe, expect, it } from 'vitest';
import type { TrainingRecord } from '../types/training';
import { computeCompletionProgress } from './completionProgress';

function record(id: string, endedAt: string, durationMs: number): TrainingRecord {
  return {
    id,
    startedAt: endedAt,
    endedAt,
    contractSec: 3,
    holdSec: 3,
    relaxSec: 3,
    targetReps: 10,
    completedReps: 10,
    status: 'completed',
    actualDurationMs: durationMs,
  };
}

describe('completion progress', () => {
  it('includes the just-completed record in weekly totals, streak, and goal progress', () => {
    const current = record('current', '2026-07-29T10:00:00.000Z', 90_000);
    const progress = computeCompletionProgress([
      current,
      record('tuesday', '2026-07-28T10:00:00.000Z', 60_000),
      record('monday-1', '2026-07-27T08:00:00.000Z', 30_000),
      record('monday-2', '2026-07-27T12:00:00.000Z', 30_000),
      record('previous-week', '2026-07-26T10:00:00.000Z', 120_000),
    ], current, { enabled: true, targetDays: 4 }, new Date('2026-07-29T12:00:00.000Z'), 'UTC');

    expect(progress).toEqual({
      weeklyCompletions: 4,
      weeklyDurationMs: 210_000,
      addedDurationMs: 90_000,
      streakDays: 4,
      goal: {
        targetDays: 4,
        completedDays: 3,
        remainingDays: 1,
      },
    });
  });

  it('omits goal copy safely when the optional target is disabled', () => {
    const current = record('current', '2026-07-29T10:00:00.000Z', 60_000);
    expect(
      computeCompletionProgress(
        [current],
        current,
        { enabled: false, targetDays: 3 },
        new Date('2026-07-29T12:00:00.000Z'),
        'UTC',
      ).goal,
    ).toBeNull();
  });
});
