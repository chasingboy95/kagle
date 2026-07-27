import { useState, useCallback, useMemo } from 'react';
import {
  type TrainingRecord,
  type TrainingConfig,
  TRAINING_HISTORY_SCHEMA,
} from '../types/training';
import { defaultStorage } from '../utils/storage';

export interface HistoryStats {
  /** Number of completions this calendar week (Mon–Sun). */
  weeklyCompletions: number;
  /** Total completed session count. */
  totalCompletions: number;
  /** Consecutive days with at least one completed session, counting back from today. */
  streakDays: number;
  /** Cumulative training time in ms (completed sessions only). */
  totalDurationMs: number;
}

export interface UseTrainingHistoryReturn {
  records: TrainingRecord[];
  stats: HistoryStats;
  addRecord: (record: TrainingRecord) => void;
  removeRecord: (id: string) => void;
  clearAll: () => void;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function computeStats(records: TrainingRecord[]): HistoryStats {
  const completed = records.filter((r) => r.status === 'completed');
  const now = new Date();
  const weekStart = startOfWeek(now);

  const weeklyCompletions = completed.filter(
    (r) => new Date(r.endedAt) >= weekStart,
  ).length;

  const totalDurationMs = completed.reduce(
    (sum, r) => sum + r.actualDurationMs,
    0,
  );

  // Streak: consecutive past days (including today) with >= 1 completed session
  let streakDays = 0;
  const todayStart = startOfDay(now);
  for (let i = 0; i < 365; i++) {
    const dayStart = new Date(todayStart);
    dayStart.setDate(dayStart.getDate() - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const hasCompletion = completed.some((r) => {
      const d = new Date(r.endedAt);
      return d >= dayStart && d < dayEnd;
    });
    if (hasCompletion) {
      streakDays++;
    } else if (i === 0) {
      // Today has no completion yet — don't break, check yesterday
      continue;
    } else {
      break;
    }
  }

  return {
    weeklyCompletions,
    totalCompletions: completed.length,
    streakDays,
    totalDurationMs,
  };
}

export function buildTrainingRecord(
  config: TrainingConfig,
  completedReps: number,
  actualDurationMs: number,
  status: 'completed' | 'stopped',
  startedAt: string,
): TrainingRecord {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    startedAt,
    endedAt: new Date().toISOString(),
    contractSec: config.contractTime,
    holdSec: config.holdTime,
    relaxSec: config.relaxTime,
    targetReps: config.rounds,
    completedReps,
    status,
    actualDurationMs,
  };
}

export function useTrainingHistory(): UseTrainingHistoryReturn {
  const [records, setRecords] = useState<TrainingRecord[]>(() =>
    defaultStorage.read(TRAINING_HISTORY_SCHEMA),
  );

  const stats = useMemo(() => computeStats(records), [records]);

  const persist = useCallback((next: TrainingRecord[]) => {
    setRecords(next);
    defaultStorage.write(TRAINING_HISTORY_SCHEMA, next);
  }, []);

  const addRecord = useCallback(
    (record: TrainingRecord) => {
      setRecords((prev) => {
        const next = [record, ...prev];
        defaultStorage.write(TRAINING_HISTORY_SCHEMA, next);
        return next;
      });
    },
    [],
  );

  const removeRecord = useCallback(
    (id: string) => {
      setRecords((prev) => {
        const next = prev.filter((r) => r.id !== id);
        defaultStorage.write(TRAINING_HISTORY_SCHEMA, next);
        return next;
      });
    },
    [],
  );

  const clearAll = useCallback(() => {
    persist([]);
  }, [persist]);

  return { records, stats, addRecord, removeRecord, clearAll };
}
