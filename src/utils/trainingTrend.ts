import type { TrainingRecord } from '../types/training';

export interface WeeklyTrend {
  /** ISO week key like "2026-W30" */
  weekKey: string;
  /** Label for display: "第30周" */
  weekLabel: string;
  completedCount: number;
  totalDurationMs: number;
  completedDays: number;
}

export interface TrainingTrendData {
  /** Last 4 complete weeks + current partial week = 5 bars max */
  weeks: WeeklyTrend[];
  maxCompletedCount: number;
  maxDurationMs: number;
}

/**
 * Compute 4-week training trend from records.
 * Returns the last 4 complete weeks + current partial week (up to 5 bars).
 */
export function computeTrainingTrend(
  records: TrainingRecord[],
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
): TrainingTrendData {
  const now = new Date();
  // Current week start (Monday)
  const currentWeekStart = startOfWeek(now, timeZone);
  const weeks: WeeklyTrend[] = [];

  // Go back up to 4 weeks before current week
  for (let i = 4; i >= 0; i--) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekRecords = records.filter((r) => {
      const endedAt = new Date(r.endedAt).getTime();
      return endedAt >= weekStart.getTime() && endedAt < weekEnd.getTime();
    });

    const completed = weekRecords.filter((r) => r.status === 'completed');
    const completedDays = new Set(
      completed.map((r) => dateInTimeZone(r.endedAt, timeZone)),
    ).size;

    const year = weekStart.getFullYear();
    const weekNum = getWeekNumber(weekStart);
    const weekKey = `${year}-W${String(weekNum).padStart(2, '0')}`;
    const weekLabel = `第${weekNum}周`;

    weeks.push({
      weekKey,
      weekLabel,
      completedCount: completed.length,
      totalDurationMs: completed.reduce((sum, r) => sum + r.actualDurationMs, 0),
      completedDays,
    });
  }

  const maxCompletedCount = Math.max(1, ...weeks.map((w) => w.completedCount));
  const maxDurationMs = Math.max(1, ...weeks.map((w) => w.totalDurationMs));

  return { weeks, maxCompletedCount, maxDurationMs };
}

function startOfWeek(date: Date, timeZone: string): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long',
  }).formatToParts(date);

  const year = Number(parts.find((p) => p.type === 'year')!.value);
  const month = Number(parts.find((p) => p.type === 'month')!.value) - 1;
  const day = Number(parts.find((p) => p.type === 'day')!.value);
  const weekday = parts.find((p) => p.type === 'weekday')!.value;

  const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(weekday);
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const weekStart = new Date(year, month, day + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

function dateInTimeZone(iso: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(iso));
  const year = parts.find((p) => p.type === 'year')!.value;
  const month = parts.find((p) => p.type === 'month')!.value;
  const day = parts.find((p) => p.type === 'day')!.value;
  return `${year}-${month}-${day}`;
}

function getWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}
