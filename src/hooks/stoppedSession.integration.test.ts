import { act, renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONFIG, type TrainingConfig, type TrainingPhase, type TrainingRecord } from '../types/training';
import { DEFAULT_PROGRESSIVE_STATE, evaluateSuggestion } from '../utils/progressiveTraining';
import { buildTrainingRecord, useTrainingHistory } from './useTrainingHistory';
import { useKegelEngine } from './useKegelEngine';

const SNAPSHOT_KEY = 'kegel.session-snapshot.v1';
const HISTORY_KEY = 'kegel.training-history.v1';

function completedRecord(id: string): TrainingRecord {
  const timestamp = new Date().toISOString();
  return {
    id,
    startedAt: timestamp,
    endedAt: timestamp,
    contractSec: 1,
    holdSec: 1,
    relaxSec: 1,
    targetReps: 3,
    completedReps: 3,
    status: 'completed',
    actualDurationMs: 8_000,
  };
}

function useStoppedSessionHarness() {
  const history = useTrainingHistory();
  const configRef = useRef(DEFAULT_CONFIG);
  const engine = useKegelEngine({
    onSessionEnd: (data) => {
      history.addRecord(buildTrainingRecord(
        configRef.current,
        data.completedReps,
        data.actualDurationMs,
        data.status,
        data.startedAt,
      ));
    },
  });

  const updateConfig = (updates: Partial<TrainingConfig>) => {
    configRef.current = { ...configRef.current, ...updates };
    engine.updateConfig(updates);
  };

  return { engine, history, updateConfig };
}

describe('stopped session integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  function advance(ms: number) {
    act(() => {
      vi.advanceTimersByTime(ms);
    });
  }

  function setup() {
    const hook = renderHook(() => useStoppedSessionHarness());
    act(() => {
      hook.result.current.updateConfig({
        contractTime: 1,
        holdTime: 1,
        relaxTime: 1,
        rounds: 3,
      });
    });
    act(() => hook.result.current.engine.start());
    return hook;
  }

  it.each<[TrainingPhase, number]>([
    ['ready', 2_000],
    ['contract', 5_500],
    ['hold', 6_500],
    ['relax', 7_500],
  ])('persists one non-completion and clears the snapshot when stopped during %s', (phase, elapsedMs) => {
    const { result } = setup();
    advance(elapsedMs);

    expect(result.current.engine.state.phase).toBe(phase);
    expect(localStorage.getItem(SNAPSHOT_KEY)).not.toBeNull();

    act(() => result.current.engine.stop());

    expect(result.current.engine.state.status).toBe('idle');
    expect(result.current.history.records).toHaveLength(1);
    expect(result.current.history.records[0]).toMatchObject({
      status: 'stopped',
      completedReps: 0,
    });
    expect(result.current.history.stats).toMatchObject({
      weeklyCompletions: 0,
      totalCompletions: 0,
      streakDays: 0,
      totalDurationMs: 0,
    });
    expect(localStorage.getItem(SNAPSHOT_KEY)).toBeNull();
  });

  it.each([
    ['while paused', false],
    ['after resuming', true],
  ])('records a single stopped session %s', (_scenario, resumeBeforeStop) => {
    const { result } = setup();
    advance(5_500);
    act(() => result.current.engine.pause());
    advance(10_000);

    if (resumeBeforeStop) {
      act(() => result.current.engine.resume());
      advance(500);
    }

    act(() => result.current.engine.stop());

    expect(result.current.history.records).toHaveLength(1);
    expect(result.current.history.records[0].status).toBe('stopped');
    expect(result.current.history.stats.totalCompletions).toBe(0);
  });

  it('ignores repeated stop calls after the first record is written', () => {
    const { result } = setup();
    advance(2_000);

    act(() => {
      result.current.engine.stop();
      result.current.engine.stop();
    });

    expect(result.current.history.records).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')).toHaveLength(1);
  });

  it('does not let a stopped record satisfy completion stats or progressive suggestions', () => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify([
      completedRecord('completed-1'),
      completedRecord('completed-2'),
    ]));
    const { result } = setup();
    advance(2_000);
    act(() => result.current.engine.stop());

    expect(result.current.history.records).toHaveLength(3);
    expect(result.current.history.stats.totalCompletions).toBe(2);
    expect(evaluateSuggestion(
      result.current.history.records,
      DEFAULT_PROGRESSIVE_STATE,
    )).toBeNull();
  });
});
