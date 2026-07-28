import { describe, expect, it } from 'vitest';
import type { TrainingRecord } from '../types/training';
import { weeklyGoalProgress } from './weeklyGoal';

function record(id: string, endedAt: string, status: TrainingRecord['status'] = 'completed'): TrainingRecord {
  return {
    id,
    startedAt: endedAt,
    endedAt,
    contractSec: 3,
    holdSec: 3,
    relaxSec: 3,
    targetReps: 10,
    completedReps: status === 'completed' ? 10 : 2,
    status,
    actualDurationMs: 60_000,
  };
}

describe('weekly goal progress', () => {
  it('uses Monday through Sunday and counts each completed local date once', () => {
    const progress = weeklyGoalProgress([
      record('monday-1', '2026-07-27T08:00:00.000Z'),
      record('monday-2', '2026-07-27T10:00:00.000Z'),
      record('tuesday-stopped', '2026-07-28T08:00:00.000Z', 'stopped'),
      record('sunday', '2026-08-02T08:00:00.000Z'),
      record('next-monday', '2026-08-03T08:00:00.000Z'),
    ], 3, new Date('2026-07-29T12:00:00.000Z'), 'UTC');

    expect(progress).toEqual({
      completedDays: 2,
      remainingDays: 1,
      weekStartKey: '2026-07-27',
      weekEndKey: '2026-08-02',
    });
  });

  it('assigns near-midnight records using the requested timezone', () => {
    const boundary = record('boundary', '2026-07-27T00:30:00.000Z');
    const now = new Date('2026-07-27T12:00:00.000Z');

    expect(weeklyGoalProgress([boundary], 2, now, 'UTC').completedDays).toBe(1);
    expect(
      weeklyGoalProgress([boundary], 2, now, 'America/Los_Angeles').completedDays,
    ).toBe(0);
  });
});
