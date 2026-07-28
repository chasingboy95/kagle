import type { TrainingRecord } from '../types/training';

export interface CalendarMonth {
  year: number;
  month: number;
}

export interface CalendarDay {
  dateKey: string;
  records: TrainingRecord[];
  completedCount: number;
  stoppedCount: number;
  completedDurationMs: number;
}

export interface CalendarMonthSummary {
  days: Map<string, CalendarDay>;
  completedCount: number;
  completedDays: number;
  completedDurationMs: number;
  longestStreakDays: number;
}

function partsFor(iso: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(iso));
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

export function dateKeyInTimeZone(iso: string, timeZone: string): string {
  const parts = partsFor(iso, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function monthForDate(iso: string, timeZone: string): CalendarMonth {
  const parts = partsFor(iso, timeZone);
  return { year: Number(parts.year), month: Number(parts.month) };
}

export function shiftMonth(value: CalendarMonth, delta: number): CalendarMonth {
  const date = new Date(Date.UTC(value.year, value.month - 1 + delta, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

export function daysInMonth(value: CalendarMonth): number {
  return new Date(Date.UTC(value.year, value.month, 0)).getUTCDate();
}

export function mondayFirstOffset(value: CalendarMonth): number {
  const day = new Date(Date.UTC(value.year, value.month - 1, 1)).getUTCDay();
  return (day + 6) % 7;
}

export function summarizeCalendarMonth(
  records: TrainingRecord[],
  value: CalendarMonth,
  timeZone: string,
): CalendarMonthSummary {
  const monthPrefix = `${value.year}-${String(value.month).padStart(2, '0')}-`;
  const days = new Map<string, CalendarDay>();

  for (const record of records) {
    const dateKey = dateKeyInTimeZone(record.endedAt, timeZone);
    if (!dateKey.startsWith(monthPrefix)) continue;
    const day = days.get(dateKey) ?? {
      dateKey,
      records: [],
      completedCount: 0,
      stoppedCount: 0,
      completedDurationMs: 0,
    };
    day.records.push(record);
    if (record.status === 'completed') {
      day.completedCount += 1;
      day.completedDurationMs += record.actualDurationMs;
    } else {
      day.stoppedCount += 1;
    }
    days.set(dateKey, day);
  }

  for (const day of days.values()) {
    day.records.sort((a, b) => Date.parse(b.endedAt) - Date.parse(a.endedAt));
  }

  const completedDateKeys = [...days.values()]
    .filter((day) => day.completedCount > 0)
    .map((day) => day.dateKey)
    .sort();
  let longestStreakDays = 0;
  let currentStreak = 0;
  let previousDay: number | null = null;
  for (const dateKey of completedDateKeys) {
    const currentDay = Number(dateKey.slice(-2));
    currentStreak = previousDay !== null && currentDay === previousDay + 1
      ? currentStreak + 1
      : 1;
    longestStreakDays = Math.max(longestStreakDays, currentStreak);
    previousDay = currentDay;
  }

  return {
    days,
    completedCount: [...days.values()].reduce((sum, day) => sum + day.completedCount, 0),
    completedDays: completedDateKeys.length,
    completedDurationMs: [...days.values()].reduce(
      (sum, day) => sum + day.completedDurationMs,
      0,
    ),
    longestStreakDays,
  };
}
