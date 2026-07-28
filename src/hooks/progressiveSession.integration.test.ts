import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, type TrainingRecord } from '../types/training';
import {
  DEFAULT_PROGRESSIVE_STATE,
  evaluateSuggestion,
  type ProgressiveSuggestion,
} from '../utils/progressiveTraining';
import { useTrainingHistory } from './useTrainingHistory';

function record(id: string, status: TrainingRecord['status']): TrainingRecord {
  const timestamp = new Date(Date.UTC(2026, 6, 28, 0, 0, Number(id))).toISOString();
  return {
    id,
    startedAt: timestamp,
    endedAt: timestamp,
    contractSec: DEFAULT_CONFIG.contractTime,
    holdSec: DEFAULT_CONFIG.holdTime,
    relaxSec: DEFAULT_CONFIG.relaxTime,
    targetReps: DEFAULT_CONFIG.rounds,
    completedReps: status === 'completed' ? DEFAULT_CONFIG.rounds : 0,
    status,
    actualDurationMs: status === 'completed' ? 90_000 : 1_000,
  };
}

function useProgressiveSessionHarness() {
  const history = useTrainingHistory();

  const finishSession = (
    nextRecord: TrainingRecord,
  ): ProgressiveSuggestion | null => {
    const nextRecords = history.addRecord(nextRecord);
    if (nextRecord.status !== 'completed') return null;
    return evaluateSuggestion(nextRecords, DEFAULT_PROGRESSIVE_STATE);
  };

  return { history, finishSession };
}

describe('completed-session progressive suggestion integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('does not suggest after the second completion but suggests immediately after the third', () => {
    const { result } = renderHook(() => useProgressiveSessionHarness());
    let suggestion: ProgressiveSuggestion | null = null;

    act(() => {
      expect(result.current.finishSession(record('1', 'completed'))).toBeNull();
      suggestion = result.current.finishSession(record('2', 'completed'));
    });
    expect(suggestion).toBeNull();

    act(() => {
      suggestion = result.current.finishSession(record('3', 'completed'));
    });

    expect(suggestion).not.toBeNull();
    expect(suggestion).toMatchObject({ before: DEFAULT_CONFIG });
    expect(result.current.history.records).toHaveLength(3);
  });

  it('does not let a stopped session satisfy the three-completion threshold', () => {
    const { result } = renderHook(() => useProgressiveSessionHarness());
    let suggestion: ProgressiveSuggestion | null = null;

    act(() => {
      expect(result.current.finishSession(record('1', 'completed'))).toBeNull();
      expect(result.current.finishSession(record('2', 'completed'))).toBeNull();
      expect(result.current.finishSession(record('3', 'stopped'))).toBeNull();
      suggestion = result.current.finishSession(record('4', 'completed'));
    });

    expect(suggestion).not.toBeNull();
    expect(result.current.history.records).toHaveLength(4);
    expect(result.current.history.records[1].status).toBe('stopped');
  });
});
