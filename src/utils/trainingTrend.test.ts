import { describe, expect, it } from 'vitest';
import type { TrainingRecord } from '../types/training';
import { computeTrainingTrend } from './trainingTrend';

function record(
  id: string,
  endedAt: string,
  status: TrainingRecord['status'] = 'completed',
): TrainingRecord {
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
    actualDurationMs: status === 'completed' ? 60_000 : 10_000,
  };
}

describe('computeTrainingTrend', () => {
  it('returns 5 weeks (4 past + current) with zero data', () => {
    const trend = computeTrainingTrend([], 'UTC');
    expect(trend.weeks).toHaveLength(5);
    for (const week of trend.weeks) {
      expect(week.completedCount).toBe(0);
      expect(week.totalDurationMs).toBe(0);
      expect(week.completedDays).toBe(0);
    }
  });

  it('counts completed records in correct weeks', () => {
    // Current week in UTC: 2026-07-29 (Wednesday) is in week 31 (roughly)
    const records = [
      record('r1', '2026-07-29T12:00:00.000Z'), // this week
    ];
    const trend = computeTrainingTrend(records, 'UTC');
    // The current week should have 1 completion
    const currentWeek = trend.weeks[trend.weeks.length - 1];
    expect(currentWeek.completedCount).toBe(1);
    expect(currentWeek.totalDurationMs).toBe(60_000);
    expect(currentWeek.completedDays).toBe(1);
  });

  it('excludes stopped records from counts', () => {
    const records = [
      record('completed', '2026-07-29T12:00:00.000Z', 'completed'),
      record('stopped', '2026-07-29T14:00:00.000Z', 'stopped'),
    ];
    const trend = computeTrainingTrend(records, 'UTC');
    const currentWeek = trend.weeks[trend.weeks.length - 1];
    expect(currentWeek.completedCount).toBe(1);
    expect(currentWeek.totalDurationMs).toBe(60_000);
  });
});
