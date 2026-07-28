import { useState, useCallback, useMemo, useRef } from 'react';
import { createDataExport, serializeDataExport, CLEAR_ALL_BACKUP_KEY } from '../utils/dataTransfer';
import { useDateRefresh } from './useDateRefresh';
import {
  type TrainingRecord,
  type TrainingConfig,
  TRAINING_HISTORY_SCHEMA,
  normalizeTrainingHistory,
} from '../types/training';
import { defaultStorage } from '../utils/storage';

export const HISTORY_STORAGE_ERROR_MESSAGE = '训练记录未能保存到设备。当前页面仍保留记录，请释放存储空间后重试。';

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
  addRecord: (record: TrainingRecord) => TrainingRecord[];
  removeRecord: (id: string) => void;
  clearAll: () => void;
  storageError: string | null;
  dismissStorageError: () => void;
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
  const dateKey = useDateRefresh('daily');
  const recordsRef = useRef(records);
  const [storageError, setStorageError] = useState<string | null>(null);

  const stats = useMemo(() => computeStats(records), [records, dateKey]);

  const persist = useCallback((next: TrainingRecord[]): TrainingRecord[] => {
    const normalized = normalizeTrainingHistory(next);
    recordsRef.current = normalized;
    setRecords(normalized);
    const saved = defaultStorage.write(TRAINING_HISTORY_SCHEMA, normalized);
    setStorageError(saved ? null : HISTORY_STORAGE_ERROR_MESSAGE);
    return normalized;
  }, []);

  const addRecord = useCallback(
    (record: TrainingRecord) => persist([record, ...recordsRef.current]),
    [persist],
  );

  const removeRecord = useCallback(
    (id: string) => {
      persist(recordsRef.current.filter((record) => record.id !== id));
    },
    [persist],
  );

  const clearAll = useCallback(() => {
    try {
      const backup = createDataExport();
      localStorage.setItem(CLEAR_ALL_BACKUP_KEY, serializeDataExport(backup));
    } catch {
      // Backup failed, proceed with clear anyway
    }
    persist([]);
  }, [persist]);

  const dismissStorageError = useCallback(() => {
    setStorageError(null);
  }, []);

  return {
    records,
    stats,
    addRecord,
    removeRecord,
    clearAll,
    storageError,
    dismissStorageError,
  };
}
