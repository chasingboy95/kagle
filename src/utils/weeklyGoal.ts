import type { TrainingRecord } from '../types/training';
import { dateKeyInTimeZone } from './trainingCalendar';

export interface WeeklyGoalProgress {
  completedDays: number;
  remainingDays: number;
  weekStartKey: string;
  weekEndKey: string;
}

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDateKey(date: Date): string {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('-');
}

export function weeklyGoalProgress(
  records: TrainingRecord[],
  targetDays: number,
  now: Date,
  timeZone: string,
): WeeklyGoalProgress {
  const today = parseDateKey(dateKeyInTimeZone(now.toISOString(), timeZone));
  const mondayOffset = (today.getUTCDay() + 6) % 7;
  const weekStart = new Date(today);
  weekStart.setUTCDate(weekStart.getUTCDate() - mondayOffset);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
  const weekStartKey = formatDateKey(weekStart);
  const weekEndKey = formatDateKey(weekEnd);

  const completedDateKeys = new Set(
    records
      .filter((record) => record.status === 'completed')
      .map((record) => dateKeyInTimeZone(record.endedAt, timeZone))
      .filter((dateKey) => dateKey >= weekStartKey && dateKey <= weekEndKey),
  );
  const completedDays = completedDateKeys.size;

  return {
    completedDays,
    remainingDays: Math.max(0, targetDays - completedDays),
    weekStartKey,
    weekEndKey,
  };
}
