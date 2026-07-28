import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTrainingHistory, buildTrainingRecord, HISTORY_STORAGE_ERROR_MESSAGE } from './useTrainingHistory';
import { DEFAULT_CONFIG, TRAINING_HISTORY_MAX_RECORDS, type TrainingRecord } from '../types/training';

beforeEach(() => {
  localStorage.clear();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  localStorage.setItem('kegel.training-history.v1', JSON.stringify([
    {
      id: '1', startedAt: yesterday.toISOString(), endedAt: yesterday.toISOString(),
      contractSec: 3, holdSec: 3, relaxSec: 3, targetReps: 10, completedReps: 10,
      status: 'completed', actualDurationMs: 90000,
    },
  ]));
});

afterEach(() => {
  vi.restoreAllMocks();
});

function record(id: string, endedAt: string): TrainingRecord {
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
    actualDurationMs: 90_000,
  };
}

describe('buildTrainingRecord', () => {
  it('creates a record with all expected fields', () => {
    const startedAt = '2026-01-01T00:00:00.000Z';
    const record = buildTrainingRecord(DEFAULT_CONFIG, 10, 90000, 'completed', startedAt);
    expect(record.id).toBeDefined();
    expect(record.startedAt).toBe(startedAt);
    expect(record.endedAt).toBeDefined();
    expect(record.contractSec).toBe(3);
    expect(record.holdSec).toBe(3);
    expect(record.targetReps).toBe(10);
    expect(record.completedReps).toBe(10);
    expect(record.status).toBe('completed');
    expect(record.actualDurationMs).toBe(90000);
  });
  it('creates unique IDs', () => {
    const r1 = buildTrainingRecord(DEFAULT_CONFIG, 5, 1000, 'stopped', '2026-01-01T00:00:00.000Z');
    const r2 = buildTrainingRecord(DEFAULT_CONFIG, 5, 1000, 'stopped', '2026-01-01T00:00:00.000Z');
    expect(r1.id).not.toBe(r2.id);
  });
});

describe('useTrainingHistory', () => {
  it('loads existing records from storage', () => {
    const { result } = renderHook(() => useTrainingHistory());
    expect(result.current.records).toHaveLength(1);
    expect(result.current.records[0].id).toBe('1');
  });
  it('addRecord inserts at front', () => {
    const { result } = renderHook(() => useTrainingHistory());
    const record = buildTrainingRecord(DEFAULT_CONFIG, 10, 90000, 'completed', new Date().toISOString());
    let nextRecords: TrainingRecord[] = [];
    act(() => { nextRecords = result.current.addRecord(record); });
    expect(nextRecords[0].id).toBe(record.id);
    expect(nextRecords).toHaveLength(2);
    expect(result.current.records[0].id).toBe(record.id);
    expect(result.current.records).toHaveLength(2);
  });
  it('removeRecord deletes by id', () => {
    const { result } = renderHook(() => useTrainingHistory());
    act(() => { result.current.removeRecord('1'); });
    expect(result.current.records).toHaveLength(0);
  });
  it('clearAll empties records', () => {
    const { result } = renderHook(() => useTrainingHistory());
    act(() => { result.current.clearAll(); });
    expect(result.current.records).toHaveLength(0);
    expect(localStorage.getItem('kegel.training-history.v1')).toBe(JSON.stringify([]));
  });
  it('computes stats from records', () => {
    const { result } = renderHook(() => useTrainingHistory());
    expect(result.current.stats.totalCompletions).toBe(1);
    // Add another completed record
    const record = buildTrainingRecord(DEFAULT_CONFIG, 10, 60000, 'completed', new Date().toISOString());
    act(() => { result.current.addRecord(record); });
    expect(result.current.stats.totalCompletions).toBe(2);
    expect(result.current.stats.totalDurationMs).toBeGreaterThan(0);
  });
  it('does not count stopped sessions in stats', () => {
    localStorage.clear();
    localStorage.setItem('kegel.training-history.v1', JSON.stringify([
      { id: '1', startedAt: new Date().toISOString(), endedAt: new Date().toISOString(),
        contractSec: 3, holdSec: 3, relaxSec: 3, targetReps: 10, completedReps: 5,
        status: 'stopped', actualDurationMs: 30000 },
    ]));
    const { result } = renderHook(() => useTrainingHistory());
    expect(result.current.stats.totalCompletions).toBe(0);
  });
  it('keeps the newest 500 records and drops the oldest deterministically', () => {
    const records = Array.from(
      { length: TRAINING_HISTORY_MAX_RECORDS },
      (_, index) => record(
        `existing-${index}`,
        new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString(),
      ),
    );
    localStorage.setItem('kegel.training-history.v1', JSON.stringify(records));
    const { result } = renderHook(() => useTrainingHistory());
    const newest = record('newest', '2026-07-28T00:00:00.000Z');

    act(() => result.current.addRecord(newest));

    expect(result.current.records).toHaveLength(TRAINING_HISTORY_MAX_RECORDS);
    expect(result.current.records[0].id).toBe('newest');
    expect(result.current.records.some((item) => item.id === 'existing-0')).toBe(false);
    expect(result.current.stats.totalCompletions).toBe(TRAINING_HISTORY_MAX_RECORDS);
    expect(JSON.parse(localStorage.getItem('kegel.training-history.v1') ?? '[]')).toHaveLength(
      TRAINING_HISTORY_MAX_RECORDS,
    );
  });
  it('retains the current UI record and exposes a warning when persistence fails', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    const { result } = renderHook(() => useTrainingHistory());
    const current = record('current-ui-record', '2026-07-28T00:00:00.000Z');

    act(() => result.current.addRecord(current));

    expect(result.current.records[0].id).toBe('current-ui-record');
    expect(result.current.storageError).toBe(HISTORY_STORAGE_ERROR_MESSAGE);
    act(() => result.current.dismissStorageError());
    expect(result.current.storageError).toBeNull();
  });
});
