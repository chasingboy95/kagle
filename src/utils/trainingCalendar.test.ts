import { describe, expect, it } from 'vitest';
import type { TrainingRecord } from '../types/training';
import {
  dateKeyInTimeZone,
  summarizeCalendarMonth,
  type CalendarMonth,
} from './trainingCalendar';

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

describe('training calendar aggregation', () => {
  it('assigns the same instant to the correct local date and month', () => {
    const instant = '2026-03-01T00:30:00.000Z';
    expect(dateKeyInTimeZone(instant, 'UTC')).toBe('2026-03-01');
    expect(dateKeyInTimeZone(instant, 'America/Los_Angeles')).toBe('2026-02-28');
    expect(dateKeyInTimeZone(instant, 'Asia/Dubai')).toBe('2026-03-01');
  });

  it('keeps cross-month records in their local calendar month', () => {
    const february: CalendarMonth = { year: 2026, month: 2 };
    const records = [
      record('boundary', '2026-03-01T00:30:00.000Z'),
      record('march', '2026-03-01T12:00:00.000Z'),
    ];

    const summary = summarizeCalendarMonth(records, february, 'America/Los_Angeles');
    expect([...summary.days.keys()]).toEqual(['2026-02-28']);
    expect(summary.completedCount).toBe(1);
  });

  it('shows stopped records but excludes them from completion stats and streaks', () => {
    const month: CalendarMonth = { year: 2026, month: 7 };
    const summary = summarizeCalendarMonth([
      record('day-1', '2026-07-01T12:00:00.000Z'),
      record('stopped', '2026-07-02T12:00:00.000Z', 'stopped'),
      record('day-3', '2026-07-03T12:00:00.000Z'),
      record('day-4', '2026-07-04T12:00:00.000Z'),
    ], month, 'UTC');

    expect(summary.days.get('2026-07-02')).toMatchObject({
      completedCount: 0,
      stoppedCount: 1,
    });
    expect(summary.completedCount).toBe(3);
    expect(summary.completedDays).toBe(3);
    expect(summary.completedDurationMs).toBe(180_000);
    expect(summary.longestStreakDays).toBe(2);
  });
});
