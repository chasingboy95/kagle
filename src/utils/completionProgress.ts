import type { TrainingRecord } from '../types/training';
import type { WeeklyGoalSettings } from './appStorageSchemas';
import { dateKeyInTimeZone } from './trainingCalendar';
import { weeklyGoalProgress } from './weeklyGoal';

export interface CompletionProgress {
  weeklyCompletions: number;
  weeklyDurationMs: number;
  addedDurationMs: number;
  streakDays: number;
  goal: {
    targetDays: number;
    completedDays: number;
    remainingDays: number;
  } | null;
}

function previousDateKey(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - 1);
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('-');
}

function currentStreak(
  completedDateKeys: Set<string>,
  todayKey: string,
): number {
  let cursor = completedDateKeys.has(todayKey) ? todayKey : previousDateKey(todayKey);
  let streakDays = 0;
  while (completedDateKeys.has(cursor)) {
    streakDays += 1;
    cursor = previousDateKey(cursor);
  }
  return streakDays;
}

export function computeCompletionProgress(
  records: TrainingRecord[],
  currentRecord: TrainingRecord,
  weeklyGoal: WeeklyGoalSettings,
  now: Date,
  timeZone: string,
): CompletionProgress {
  const goalProgress = weeklyGoalProgress(
    records,
    weeklyGoal.targetDays,
    now,
    timeZone,
  );
  const completed = records.filter((record) => record.status === 'completed');
  const weeklyRecords = completed.filter((record) => {
    const dateKey = dateKeyInTimeZone(record.endedAt, timeZone);
    return dateKey >= goalProgress.weekStartKey && dateKey <= goalProgress.weekEndKey;
  });
  const completedDateKeys = new Set(
    completed.map((record) => dateKeyInTimeZone(record.endedAt, timeZone)),
  );

  return {
    weeklyCompletions: weeklyRecords.length,
    weeklyDurationMs: weeklyRecords.reduce(
      (sum, record) => sum + record.actualDurationMs,
      0,
    ),
    addedDurationMs: currentRecord.actualDurationMs,
    streakDays: currentStreak(
      completedDateKeys,
      dateKeyInTimeZone(now.toISOString(), timeZone),
    ),
    goal: weeklyGoal.enabled
      ? {
          targetDays: weeklyGoal.targetDays,
          completedDays: goalProgress.completedDays,
          remainingDays: goalProgress.remainingDays,
        }
      : null,
  };
}
